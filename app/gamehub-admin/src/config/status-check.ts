/**
 * Admin Portal Configuration Status Checker
 * Provides configuration status for the GameHub status dashboard
 */

interface ConfiguredGroups {
    client: boolean;
    tenant: boolean;
    servicePrincipal: boolean;
}

interface ConfigurationStatus {
    configured: boolean;
    configuredGroups: ConfiguredGroups;
}

/**
 * Check if FusionAuth client is properly configured
 */
function checkClientConfiguration(): boolean {
    try {
        // Check if we have the necessary environment variables for FusionAuth client
        const clientId = import.meta.env.VITE_CLIENT_ID;

        return clientId !== 'gamehub-admin';
    } catch (error) {
        console.warn('Error checking client configuration:', error);
        return false;
    }
}

/**
 * Check if tenant is properly set up
 */
function checkTenantConfiguration(): boolean {
    try {
        // Check if we have tenant-related configuration
        const tenantPublicKey = import.meta.env.VITE_TENANT_PUBLIC_KEY;

        return tenantPublicKey !== '-----FAKE PUBLIC KEY-----';
    } catch (error) {
        console.warn('Error checking tenant configuration:', error);
        return false;
    }
}

/**
 * Check if service principal is authorized
 */
function checkServicePrincipalConfiguration(): boolean {
    try {
        // Check if we have service principal configuration
        const replicatorUrl = import.meta.env.VITE_REPLICATOR_URL;
        const contentStoreUrl = import.meta.env.VITE_CONTENT_STORE_URL;

        return !!(replicatorUrl && contentStoreUrl);
    } catch (error) {
        console.warn('Error checking service principal configuration:', error);
        return false;
    }
}

/**
 * Get overall configuration status
 */
function checkOverallConfiguration(): boolean {
    const client = checkClientConfiguration();
    const tenant = checkTenantConfiguration();
    const servicePrincipal = checkServicePrincipalConfiguration();

    return client && tenant && servicePrincipal;
}

/**
 * Main function to get configuration status for the status dashboard
 * This function will be called by the status page bundle loader
 */
export function getConfigured(): ConfigurationStatus {
    const configuredGroups: ConfiguredGroups = {
        client: checkClientConfiguration(),
        tenant: checkTenantConfiguration(),
        servicePrincipal: checkServicePrincipalConfiguration()
    };

    return {
        configured: checkOverallConfiguration(),
        configuredGroups
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