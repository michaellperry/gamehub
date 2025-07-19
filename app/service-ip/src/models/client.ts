/**
 * Client model for the service identity provider
 */

/**
 * Client credentials interface
 */
export interface ClientCredentials {
    clientId: string;
    clientSecret: string;
}

/**
 * Token request interface for Client Credentials flow
 */
export interface TokenRequest {
    grant_type: string;
    client_id: string;
    client_secret: string;
    scope?: string;
}

/**
 * Token response interface
 */
export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope?: string;
}
