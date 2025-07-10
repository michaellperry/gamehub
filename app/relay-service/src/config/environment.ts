export interface ServiceConfig {
  name: string;
  healthEndpoint: string;
  configuredEndpoint: string;
  readyEndpoint: string;
  timeout?: number;
  retries?: number;
}

export interface RelayConfig {
  services: Record<string, ServiceConfig>;
}

export interface EnvironmentConfig {
  port: number;
  nodeEnv: string;
  logLevel: string;
  corsOrigin: string;
  relayConfig: RelayConfig;
  cacheTimeout: number;
}

const DEFAULT_RELAY_CONFIG: RelayConfig = {
  services: {
    'service-ip': {
      name: 'Service IP',
      healthEndpoint: 'http://service-ip:8083/health',
      configuredEndpoint: 'http://service-ip:8083/configured',
      readyEndpoint: 'http://service-ip:8083/ready',
      timeout: 5000,
      retries: 3
    },
    'player-ip': {
      name: 'Player IP',
      healthEndpoint: 'http://player-ip:8082/health',
      configuredEndpoint: 'http://player-ip:8082/configured',
      readyEndpoint: 'http://player-ip:8082/ready',
      timeout: 5000,
      retries: 3
    },
    'content-store': {
      name: 'Content Store',
      healthEndpoint: 'http://content-store:8081/health',
      configuredEndpoint: 'http://content-store:8081/configured',
      readyEndpoint: 'http://content-store:8081/ready',
      timeout: 5000,
      retries: 3
    }
  }
};

function parseRelayConfig(configString?: string): RelayConfig {
  if (!configString) {
    console.log('No RELAY_CONFIG provided, using default configuration');
    return DEFAULT_RELAY_CONFIG;
  }

  try {
    const parsed = JSON.parse(configString) as RelayConfig;
    
    // Validate required fields
    if (!parsed.services || typeof parsed.services !== 'object') {
      throw new Error('Invalid services configuration');
    }

    // Apply defaults for missing optional fields
    const config: RelayConfig = {
      services: {}
    };

    // Process services with defaults
    for (const [key, service] of Object.entries(parsed.services)) {
      config.services[key] = {
        ...service,
        timeout: service.timeout || 5000,
        retries: service.retries || 3
      };
    }

    return config;
  } catch (error) {
    console.error('Failed to parse RELAY_CONFIG:', error);
    console.log('Falling back to default configuration');
    return DEFAULT_RELAY_CONFIG;
  }
}

export const config: EnvironmentConfig = {
  port: parseInt(process.env['SERVER_PORT'] || '8084', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  logLevel: process.env['LOG_LEVEL'] || 'info',
  corsOrigin: process.env['CORS_ORIGIN'] || '*',
  relayConfig: parseRelayConfig(process.env['RELAY_CONFIG']),
  cacheTimeout: parseInt(process.env['CACHE_TIMEOUT'] || '30000', 10) // 30 seconds default
};

export default config;