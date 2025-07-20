/**
 * JWT utilities for the service identity provider
 */

import jwt from 'jsonwebtoken';
import {
    JWT_SECRET,
    JWT_EXPIRES_IN,
    JWT_ISSUER,
    JWT_AUDIENCE,
    JWT_KEY_ID,
} from '../config/environment.js';

/**
 * Token payload interface
 */
export interface TokenPayload {
    sub: string; // Client ID
    iss: string; // Issuer
    aud: string; // Audience
    iat: number; // Issued at
    exp: number; // Expires at
    scope?: string; // Optional scope
}

/**
 * Generate a service access token
 * @param clientId Client ID to include in the token
 * @param scope Optional scope to include in the token
 * @returns JWT access token
 */
export const generateServiceToken = (clientId: string, scope?: string): string => {
    const payload: TokenPayload = {
        sub: clientId,
        iss: JWT_ISSUER,
        aud: JWT_AUDIENCE,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + parseInt(JWT_EXPIRES_IN.replace('h', '')) * 3600,
    };

    if (scope) {
        payload.scope = scope;
    }

    return jwt.sign(payload, JWT_SECRET, {
        keyid: JWT_KEY_ID,
        algorithm: 'HS256',
    });
};

/**
 * Verify a JWT token and return the payload
 * @param token JWT token to verify
 * @returns Decoded JWT payload
 */
export const verifyJwt = (token: string): TokenPayload => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        return decoded;
    } catch (error) {
        throw new Error('Invalid JWT token');
    }
};
