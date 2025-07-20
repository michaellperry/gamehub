/**
 * Authentication models for OAuth 2.0 with PKCE
 */

export interface AuthRequest {
    client_id: string;
    redirect_uri: string;
    response_type: string;
    scope: string;
    code_challenge: string;
    code_challenge_method: string;
    state?: string;
}

export interface TokenRequest {
    grant_type: string;
    code?: string;
    redirect_uri?: string;
    client_id: string;
    code_verifier?: string;
    refresh_token?: string; // Added for refresh token grant type
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    refresh_token?: string; // Added for refresh token support
    refresh_token_expires_in?: number; // Added for refresh token support
}

export interface AuthorizationCode {
    code: string;
    client_id: string;
    redirect_uri: string;
    code_challenge: string;
    code_challenge_method: string;
    expires_at: Date;
    user_id: string;
    event_id: string;
    scope: string;
    created_at?: Date;
}

export interface RefreshToken {
    token: string;
    user_id: string;
    client_id: string;
    scope: string;
    event_id: string;
    expires_at: Date;
    revoked: boolean;
    created_at?: Date;
}

export interface JwtPayload {
    user_id?: string;
    iat: number;
    exp: number;
}

export interface AccessTokenPayload {
    sub: string; // user ID
    event_id: string;
    iss: string;
    aud: string;
    iat: number;
    exp: number;
}
