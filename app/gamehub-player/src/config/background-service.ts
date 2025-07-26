export interface PlayerSessionConfig {
    enabled: boolean;
    minDelay: number; // Minimum delay before joining (ms)
    maxDelay: number; // Maximum delay before joining (ms)
}

export const playerSessionConfig: PlayerSessionConfig = {
    enabled: import.meta.env.DEV,
    minDelay: 1000, // 1 second
    maxDelay: 5000, // 5 seconds
}; 