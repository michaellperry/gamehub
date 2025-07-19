/**
 * Player App Configuration Status Checker
 * Provides configuration status for the GameHub status dashboard
 */

interface ConfiguredGroups {
    client: boolean;
    authentication: boolean;
    jinaga: boolean;
    tenant: boolean;
    environment: boolean;
}

interface ConfigurationStatus {
    configured: boolean;
    configuredGroups: ConfiguredGroups;
}

/**
 * Check if FusionAuth client is properly configured for player app
 */
function checkClientConfiguration(): boolean {
    try {
        // Check if we have the necessary environment variables for FusionAuth client
        const clientId = import.meta.env.VITE_CLIENT_ID;

        // Player app should have a different client ID than the default
        return clientId && clientId !== 'gamehub-player' && clientId !== 'gamehub-admin';
    } catch (error) {
        console.warn('Error checking client configuration:', error);
        return false;
    }
}

/**
 * Check if authentication provider is properly set up
 */
function checkAuthenticationConfiguration(): boolean {
    try {
        // Check if we have authentication-related configuration
        const authUrl = import.meta.env.VITE_AUTH_URL;
        const redirectUri = import.meta.env.VITE_REDIRECT_URI;
        const authorizationEndpoint = import.meta.env.VITE_AUTHORIZATION_ENDPOINT;
        const tokenEndpoint = import.meta.env.VITE_TOKEN_ENDPOINT;

        return !!(authUrl || (authorizationEndpoint && tokenEndpoint && redirectUri));
    } catch (error) {
        console.warn('Error checking authentication configuration:', error);
        return false;
    }
}

/**
 * Check if Jinaga replicator is properly configured
 */
function checkJinagaConfiguration(): boolean {
    try {
        // Check if we have Jinaga replicator configuration
        const replicatorUrl = import.meta.env.VITE_REPLICATOR_URL;

        return !!replicatorUrl;
    } catch (error) {
        console.warn('Error checking Jinaga configuration:', error);
        return false;
    }
}

/**
 * Check if tenant is properly configured
 */
function checkTenantConfiguration(): boolean {
    try {
        // Check if we have tenant configuration
        const tenantPublicKey = import.meta.env.VITE_TENANT_PUBLIC_KEY;

        return !!(tenantPublicKey && tenantPublicKey !== '-----FAKE PUBLIC KEY-----');
    } catch (error) {
        console.warn('Error checking tenant configuration:', error);
        return false;
    }
}

/**
 * Check if required environment variables are set
 */
function checkEnvironmentConfiguration(): boolean {
    try {
        // Check if we have all required environment variables
        const baseName = import.meta.env.VITE_BASE_NAME;
        const contentStoreUrl = import.meta.env.VITE_CONTENT_STORE_URL;
        const playerIpUrl = import.meta.env.VITE_PLAYER_IP_URL;

        return !!(baseName && contentStoreUrl && playerIpUrl);
    } catch (error) {
        console.warn('Error checking environment configuration:', error);
        return false;
    }
}

/**
 * Get overall configuration status
 */
function checkOverallConfiguration(): boolean {
    const client = checkClientConfiguration();
    const authentication = checkAuthenticationConfiguration();
    const jinaga = checkJinagaConfiguration();
    const tenant = checkTenantConfiguration();
    const environment = checkEnvironmentConfiguration();

    return client && authentication && jinaga && tenant && environment;
}

/**
 * Main function to get configuration status for the status dashboard
 * This function will be called by the status page bundle loader
 */
export function getConfigured(): ConfigurationStatus {
    const configuredGroups: ConfiguredGroups = {
        client: checkClientConfiguration(),
        authentication: checkAuthenticationConfiguration(),
        jinaga: checkJinagaConfiguration(),
        tenant: checkTenantConfiguration(),
        environment: checkEnvironmentConfiguration(),
    };

    return {
        configured: checkOverallConfiguration(),
        configuredGroups,
    };
}

// Export function globally for status page access
declare global {
    interface Window {
        getConfigured: () => ConfigurationStatus;
    }
}

// Make function available globally
if (typeof window !== 'undefined') {
    window.getConfigured = getConfigured;
} 