export interface BackgroundServiceConfig {
    enabled: boolean;
    playerCount: number;
    joinDelay: number;
    retryAttempts: number;
    maxConcurrentJoins: number;
}

export const backgroundServiceConfig: BackgroundServiceConfig = {
    enabled: import.meta.env.VITE_BACKGROUND_SERVICE_ENABLED === 'true',
    playerCount: parseInt(import.meta.env.VITE_BACKGROUND_SERVICE_PLAYER_COUNT || '3'),
    joinDelay: parseInt(import.meta.env.VITE_BACKGROUND_SERVICE_JOIN_DELAY || '2000'),
    retryAttempts: parseInt(import.meta.env.VITE_BACKGROUND_SERVICE_RETRY_ATTEMPTS || '3'),
    maxConcurrentJoins: parseInt(import.meta.env.VITE_BACKGROUND_SERVICE_MAX_CONCURRENT_JOINS || '1'),
}; 