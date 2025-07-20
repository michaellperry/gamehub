import axios from 'axios';
import NodeCache from 'node-cache';
import { config, ServiceConfig, RelayConfig } from '../config/environment';
import { PublicKeyServiceData, PublicKeyResponse } from '../types/public-key.types';

export class PublicKeyService {
    private cache: NodeCache;
    private relayConfig: RelayConfig;

    constructor() {
        this.cache = new NodeCache({ stdTTL: config.cacheTimeout / 1000 });
        this.relayConfig = config.relayConfig;
    }

    async getAggregatedPublicKeys(): Promise<PublicKeyResponse> {
        const cacheKey = 'aggregated_public_keys';
        const cached = this.cache.get<PublicKeyResponse>(cacheKey);

        if (cached) {
            return cached;
        }

        const timestamp = new Date().toISOString();
        const services: Record<string, PublicKeyServiceData> = {};

        // Get services that have public key endpoints
        const servicesWithPublicKeys = Object.entries(this.relayConfig.services).filter(
            ([, serviceConfig]) => serviceConfig.publicKeyEndpoint
        );

        // Check all services with public key endpoints in parallel
        const servicePromises = servicesWithPublicKeys.map(async ([serviceId, serviceConfig]) => {
            const publicKeyData = await this.fetchServicePublicKey(serviceConfig);
            services[serviceId] = publicKeyData;
        });

        // Wait for all checks to complete
        await Promise.allSettled([...servicePromises]);

        const response: PublicKeyResponse = {
            timestamp,
            services,
        };

        // Cache the response
        this.cache.set(cacheKey, response);

        return response;
    }

    private async fetchServicePublicKey(
        serviceConfig: ServiceConfig
    ): Promise<PublicKeyServiceData> {
        const startTime = Date.now();
        const lastChecked = new Date().toISOString();

        // If service doesn't have a public key endpoint, return error
        if (!serviceConfig.publicKeyEndpoint) {
            return {
                lastChecked,
                responseTime: 0,
                error: 'Service does not provide public key endpoint',
            };
        }

        try {
            const response = await this.makeRequest(
                serviceConfig.publicKeyEndpoint,
                serviceConfig.timeout || 5000,
                serviceConfig.retries || 3
            );

            const responseTime = Date.now() - startTime;

            if (response.status === 200 && response.data && response.data.publicKey) {
                return {
                    publicKey: response.data.publicKey,
                    lastChecked,
                    responseTime,
                };
            } else {
                return {
                    lastChecked,
                    responseTime,
                    error: 'Invalid response format or missing public key',
                };
            }
        } catch (error) {
            const responseTime = Date.now() - startTime;
            let errorMessage = 'Unknown error';

            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            return {
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
                // Handle axios errors properly
                if (error && typeof error === 'object' && 'code' in error) {
                    // This is likely an axios error with a code property
                    const axiosError = error as any;
                    if (axiosError.code) {
                        lastError = new Error(
                            `${axiosError.code}${axiosError.address ? ' ' + axiosError.address : ''}${axiosError.port ? ':' + axiosError.port : ''}`
                        );
                    } else {
                        lastError = error instanceof Error ? error : new Error('Unknown error');
                    }
                } else {
                    lastError = error instanceof Error ? error : new Error('Unknown error');
                }

                if (attempt < retries) {
                    // Exponential backoff: wait 100ms, 200ms, 400ms, etc.
                    const delay = 100 * Math.pow(2, attempt - 1);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
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

export default PublicKeyService;
