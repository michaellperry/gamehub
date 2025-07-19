/**
 * Environment utility for type-safe access to environment variables
 * and validation of required variables based on the current mode.
 */

/**
 * Gets an environment variable with type safety
 * @param name The name of the environment variable
 * @param defaultValue Optional default value if the variable is not defined
 * @returns The environment variable value or the default value
 */
export function getEnv<T extends keyof ImportMetaEnv>(
    name: T,
    defaultValue?: string
): string {
    const value = import.meta.env[name];
    return value !== undefined ? value : (defaultValue || '');
}

/**
 * Type for environment validation result
 */
export interface EnvironmentValidationResult {
    isValid: boolean;
    missing: string[];
    mode: string;
}

/**
 * Validates that all required environment variables are present
 * @returns An object with validation results
 */
export function validateEnvironment(): EnvironmentValidationResult {
    const currentMode = import.meta.env.MODE;

    // Common required variables for all modes
    const commonRequiredVars: Array<keyof ImportMetaEnv> = [
        'VITE_BASE_NAME',
        'VITE_CONTENT_STORE_URL'
    ];

    // Variables required only in non-development modes
    const nonDevRequiredVars: Array<keyof ImportMetaEnv> = [
        'VITE_REPLICATOR_URL',
        'VITE_AUTHORIZATION_ENDPOINT',
        'VITE_TOKEN_ENDPOINT',
        'VITE_REDIRECT_URI',
        'VITE_LOGOUT_ENDPOINT',
        'VITE_PLAYER_IP_URL',
        'VITE_CLIENT_ID'
    ];

    // Determine which variables are required based on the current mode
    const requiredVars = [
        ...commonRequiredVars,
        ...(import.meta.env.PROD || currentMode === 'container' ? nonDevRequiredVars : [])
    ];

    // Check for missing variables
    const missing = requiredVars.filter(
        varName => !import.meta.env[varName]
    ) as string[];

    return {
        isValid: missing.length === 0,
        missing,
        mode: currentMode
    };
}

/**
 * Logs environment validation results to the console
 * @param validation The validation result to log
 */
export function logEnvironmentValidation(validation: EnvironmentValidationResult): void {
    if (validation.isValid) {
        console.info(`Environment validated successfully for ${validation.mode} mode`);
    } else {
        console.error(`Environment validation failed for ${validation.mode} mode`);
        console.error(`Missing environment variables: ${validation.missing.join(', ')}`);

        // Provide helpful guidance based on the mode
        if (validation.mode === 'development') {
            console.info('For development mode, create a .env file in the app/launchkings-PLAYER directory');
        } else if (validation.mode === 'production') {
            console.info('For production mode, ensure all variables are set in the .env.production file');
        } else {
            console.info('For container mode, ensure all variables are set in the .env.container and .env.container.local files');
        }
    }
}

/**
 * Gets all environment variables with their values
 * Useful for debugging, but be careful not to expose sensitive information
 * @param includeSensitive Whether to include sensitive variables (default: false)
 * @returns An object with all environment variables
 */
export function getAllEnvVars(includeSensitive = false): Record<string, string> {
    const result: Record<string, string> = {};

    // List of sensitive variable name patterns
    const sensitivePatterns = [
        /key/i,
        /secret/i,
        /password/i,
        /token/i,
        /auth/i
    ];

    // Get all environment variables
    Object.keys(import.meta.env).forEach(key => {
        // Skip non-VITE_ variables and MODE
        if (!key.startsWith('VITE_') || key === 'MODE') {
            return;
        }

        // Check if the variable is sensitive
        const isSensitive = sensitivePatterns.some(pattern => pattern.test(key));

        // Add the variable to the result
        if (!isSensitive || includeSensitive) {
            result[key] = import.meta.env[key as keyof ImportMetaEnv];
        } else {
            result[key] = '[REDACTED]';
        }
    });

    return result;
}