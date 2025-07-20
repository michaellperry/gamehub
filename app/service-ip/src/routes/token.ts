/**
 * Token endpoint for OAuth 2.0 Client Credentials flow
 */

import { Router, Request, Response, NextFunction } from 'express';
import { validateClientCredentials } from '../repository/index.js';
import { generateServiceToken } from '../utils/index.js';
import { TokenRequest, TokenResponse } from '../models/index.js';
import { JWT_EXPIRES_IN } from '../config/environment.js';

const router = Router();

/**
 * Validate token request parameters
 * @param body Request body parameters
 * @returns Validated TokenRequest object
 * @throws Error if validation fails
 */
const validateTokenRequest = (body: any): TokenRequest => {
    const { grant_type, client_id, client_secret, scope } = body;

    // Validate required parameters
    if (!grant_type || !client_id || !client_secret) {
        // Create an informative error message
        const missingParams = [];
        if (!grant_type) missingParams.push('grant_type');
        if (!client_id) missingParams.push('client_id');
        if (!client_secret) missingParams.push('client_secret');
        throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
    }

    // Check if grant_type is 'client_credentials' (only supported type)
    if (grant_type !== 'client_credentials') {
        throw new Error('Unsupported grant_type');
    }

    return {
        grant_type,
        client_id,
        client_secret,
        scope,
    };
};

/**
 * Error handling wrapper for route handlers
 * @param handler Route handler function
 * @returns Wrapped route handler with error handling
 */
const asyncHandler = (
    handler: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await handler(req, res, next);
        } catch (error) {
            console.error('Token endpoint error:', error);
            res.status(400).json({
                error: 'invalid_request',
                error_description: error instanceof Error ? error.message : 'Token request failed',
            });
        }
    };
};

/**
 * Token endpoint
 *
 * This endpoint handles the OAuth 2.0 Client Credentials flow.
 * It validates the client credentials and returns an access token.
 */
router.post(
    '/token',
    asyncHandler(async (req: Request, res: Response) => {
        // Validate the token request
        const tokenRequest = validateTokenRequest(req.body);

        // Validate client credentials
        const isValid = await validateClientCredentials(
            tokenRequest.client_id,
            tokenRequest.client_secret
        );

        if (!isValid) {
            return res.status(401).json({
                error: 'invalid_client',
                error_description: 'Invalid client credentials',
            });
        }

        // Generate an access token
        const accessToken = generateServiceToken(tokenRequest.client_id, tokenRequest.scope);

        // Return the access token
        const tokenResponse: TokenResponse = {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: parseInt(JWT_EXPIRES_IN.replace('h', '')) * 3600,
        };

        if (tokenRequest.scope) {
            tokenResponse.scope = tokenRequest.scope;
        }

        return res.status(200).json(tokenResponse);
    })
);

export default router;
