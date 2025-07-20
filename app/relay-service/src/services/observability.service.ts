import axios from 'axios';
import NodeCache from 'node-cache';
import { config, ServiceConfig, RelayConfig } from '../config/environment';

export interface ServiceStatus {
    health: boolean;
    configured: boolean;
    configuredGroups: Record<string, boolean | string[]>;
    ready: boolean;
    lastChecked: string;
    responseTime: number;
    error?: string;
}

export interface BundleStatus {
    configured: boolean;
    configuredGroups: Record<string, boolean | string[]>;
    lastChecked: string;
}

export interface RelayResponse {
    timestamp: string;
    services: Record<string, ServiceStatus>;
    summary: {
        totalServices: number;
        healthyServices: number;
        configuredServices: number;
        readyServices: number;
        overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    };
}

export class ObservabilityService {
    private cache: NodeCache;
    private relayConfig: RelayConfig;

    constructor() {
        this.cache = new NodeCache({ stdTTL: config.cacheTimeout / 1000 });
        this.relayConfig = config.relayConfig;
    }

    async getAggregatedStatus(): Promise<RelayResponse> {
        const cacheKey = 'aggregated_status';
        const cached = this.cache.get<RelayResponse>(cacheKey);

        if (cached) {
            return cached;
        }

        const timestamp = new Date().toISOString();
        const services: Record<string, ServiceStatus> = {};

        // Check all services in parallel
        const servicePromises = Object.entries(this.relayConfig.services).map(
            async ([serviceId, serviceConfig]) => {
                const status = await this.checkService(serviceConfig);
                services[serviceId] = status;
            }
        );

        // Wait for all checks to complete
        await Promise.allSettled([...servicePromises]);

        // Calculate summary
        const summary = this.calculateSummary(services);

        const response: RelayResponse = {
            timestamp,
            services,
            summary,
        };

        // Cache the response
        this.cache.set(cacheKey, response);

        return response;
    }

    private async checkService(serviceConfig: ServiceConfig): Promise<ServiceStatus> {
        const startTime = Date.now();
        const lastChecked = new Date().toISOString();

        try {
            // Check health, configured, and ready endpoints in parallel
            const [healthResult, configuredResult, readyResult] = await Promise.allSettled([
                this.makeRequest(serviceConfig.healthEndpoint, serviceConfig.timeout || 5000),
                this.makeRequest(serviceConfig.configuredEndpoint, serviceConfig.timeout || 5000),
                this.makeRequest(serviceConfig.readyEndpoint, serviceConfig.timeout || 5000),
            ]);

            const responseTime = Date.now() - startTime;

            // Process health check
            const health = healthResult.status === 'fulfilled' && healthResult.value.status === 200;

            // Process configured check
            let configured = false;
            let configuredGroups: Record<string, boolean | string[]> = {};

            if (configuredResult.status === 'fulfilled' && configuredResult.value.status === 200) {
                const configData = configuredResult.value.data;
                configured = configData.configured || false;
                configuredGroups = configData.configuredGroups || {};
            }

            // Process ready check
            const ready = readyResult.status === 'fulfilled' && readyResult.value.status === 200;

            return {
                health,
                configured,
                configuredGroups,
                ready,
                lastChecked,
                responseTime,
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            return {
                health: false,
                configured: false,
                configuredGroups: {},
                ready: false,
                lastChecked,
                responseTime,
                error: errorMessage,
            };
        }
    }

    private async makeRequest(url: string, timeout: number, retries: number = 3): Promise<any> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await axios.get(url, {
                    timeout,
                    validateStatus: (status: number) => status < 500, // Accept 4xx as valid responses
                });
                return response;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');

                if (attempt < retries) {
                    // Exponential backoff: wait 100ms, 200ms, 400ms, etc.
                    const delay = 100 * Math.pow(2, attempt - 1);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    private calculateSummary(services: Record<string, ServiceStatus>) {
        const serviceStatuses = Object.values(services);
        const totalServices = serviceStatuses.length;
        const healthyServices = serviceStatuses.filter((s) => s.health).length;
        const configuredServices = serviceStatuses.filter((s) => s.configured).length;
        const readyServices = serviceStatuses.filter((s) => s.ready).length;

        let overallStatus: 'healthy' | 'degraded' | 'unhealthy';

        if (healthyServices === totalServices && readyServices === totalServices) {
            overallStatus = 'healthy';
        } else if (healthyServices === 0) {
            overallStatus = 'unhealthy';
        } else {
            overallStatus = 'degraded';
        }

        return {
            totalServices,
            healthyServices,
            configuredServices,
            readyServices,
            overallStatus,
        };
    }

    // Method to clear cache (useful for testing or forced refresh)
    clearCache(): void {
        this.cache.flushAll();
    }

    // Method to get cache statistics
    getCacheStats() {
        return this.cache.getStats();
    }
}

export default ObservabilityService;
