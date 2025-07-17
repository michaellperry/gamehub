/**
 * Service for interacting with the relay service
 */

import { authProvider } from '../jinaga-config';

// Types for relay service responses
export interface RelayServiceInfo {
    publicKey: string;
    lastChecked: string;
    responseTime: number;
}

export interface PublicKeysResponse {
    timestamp: string;
    services: Record<string, RelayServiceInfo>;
}

/**
 * Fetch public keys from all configured services via the relay service
 * @param relayServiceUrl The URL of the relay service
 * @returns A promise that resolves to the public keys response
 */
export async function fetchPublicKeys(relayServiceUrl: string, signal: AbortSignal): Promise<PublicKeysResponse> {
    try {
        // Get the public keys of known services from the relay service
        const response = await fetch(`${relayServiceUrl}/public-key`, {
            method: 'GET',
            signal,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch public keys: ${response.status} ${errorText}`);
        }

        const result: PublicKeysResponse = await response.json();
        return result;
    } catch (error) {
        console.error('Error fetching public keys:', error);
        throw error;
    }
}

/**
 * Force refresh of cached public keys in the relay service
 * @param relayServiceUrl The URL of the relay service
 * @returns A promise that resolves when the cache is refreshed
 */
export async function refreshPublicKeysCache(relayServiceUrl: string): Promise<void> {
    try {
        // Get authentication headers from the authProvider
        const authHeaders = await authProvider.getHeaders();

        // Create a new Headers object for fetch API
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');

        // Add auth header if present
        if (authHeaders.Authorization) {
            headers.append('Authorization', authHeaders.Authorization);
        }

        const response = await fetch(`${relayServiceUrl}/public-key/refresh`, {
            method: 'POST',
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to refresh public keys cache: ${response.status} ${errorText}`);
        }
    } catch (error) {
        console.error('Error refreshing public keys cache:', error);
        throw error;
    }
}