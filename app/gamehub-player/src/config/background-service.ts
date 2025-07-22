export interface SimplifiedPlayerSessionConfig {
    enabled: boolean;
    minDelay: number; // Minimum delay before joining (ms)
    maxDelay: number; // Maximum delay before joining (ms)
}

export const simplifiedPlayerSessionConfig: SimplifiedPlayerSessionConfig = {
    enabled: import.meta.env.DEV,
    minDelay: 1000, // 1 second
    maxDelay: 5000, // 5 seconds
}; 