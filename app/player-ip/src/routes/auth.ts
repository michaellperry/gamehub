/**
 * Authentication routes for the attendee identity provider
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
    verifyJwt,
    generateAccessToken,
    createAuthorizationCode,
    verifyCodeChallenge,
    generateCookieValue,
    setIdentityCookie,
    IDENTITY_COOKIE_NAME,
    getAccessTokenExpiration,
    getRefreshTokenExpiration,
    createRefreshToken,
} from '../utils/index.js';
import {
    createUser,
    storeUserIdentity,
    getUserIdByCookie,
    getAuthorizationCode,
    deleteAuthorizationCode,
    getRefreshToken,
    revokeRefreshToken,
} from '../repository/index.js';
import {
    TokenResponse,
    AuthRequest,
    TokenRequest,
} from '../models/index.js';
import { ROTATE_REFRESH_TOKENS } from '../config/environment.js';

const router = Router();

/**
 * Validate authentication request parameters
 * @param params Request path parameters
 * @param query Request query parameters
 * @returns Validated AuthRequest object
 * @throws Error if validation fails
 */
const validateAuthRequest = (query: any): AuthRequest => {
    const {
        client_id,
        redirect_uri,
        response_type,
        scope,
        code_challenge,
        code_challenge_method,
        state,
    } = query;

    // Validate required parameters
    if (
        !client_id ||
        !redirect_uri ||
        !response_type ||
        !scope ||
        !code_challenge ||
        !code_challenge_method
    ) {
        // Create an informative error message
        const missingParams = [];
        if (!client_id) {
            missingParams.push('client_id');
        }
        if (!redirect_uri) {
            missingParams.push('redirect_uri');
        }
        if (!response_type) {
            missingParams.push('response_type');
        }
        if (!scope) {
            missingParams.push('scope');
        }
        if (!code_challenge) {
            missingParams.push('code_challenge');
        }
        if (!code_challenge_method) {
            missingParams.push('code_challenge_method');
        }
        // Throw an error with the missing parameters
        throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
    }

    // Check if response_type is 'code' (only supported type)
    if (response_type !== 'code') {
        throw new Error('Unsupported response_type');
    }

    // Check if code_challenge_method is supported
    if (code_challenge_method !== 'S256' && code_challenge_method !== 'plain') {
        throw new Error('Unsupported code_challenge_method');
    }

    return {
        client_id: client_id as string,
        redirect_uri: redirect_uri as string,
        response_type: response_type as string,
        scope: scope as string,
        code_challenge: code_challenge as string,
        code_challenge_method: code_challenge_method as string,
        state: state as string | undefined,
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
            console.error('Authentication error:', error);
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Authentication failed',
            });
        }
    };
};

/**
 * Authenticate endpoint
 *
 * This endpoint handles the initial authentication request.
 * If the user doesn't have an identity cookie, it creates one and redirects to authenticate_retry.
 * If the user has an identity cookie, it processes the authentication request.
 */
router.get(
    '/authenticate',
    asyncHandler(async (req: Request, res: Response) => {
        // Extract all required parameters from the query
        const {
            client_id,
            redirect_uri,
            response_type,
            scope,
            code_challenge,
            code_challenge_method,
        } = req.query;

        // Validate the authentication request
        const authRequest = validateAuthRequest(req.query);

        // Check for identity cookie
        const identityCookie = req.cookies[IDENTITY_COOKIE_NAME];

        // Get the user ID associated with the identity cookie
        const userId = identityCookie ? getUserIdByCookie(identityCookie) : undefined;

        if (!userId) {
            // No identity cookie found, create one and redirect to authenticate_retry
            const cookieValue = generateCookieValue();

            // Create a new user
            const user = createUser();

            // Store the user identity
            storeUserIdentity(user.id, cookieValue);

            // Set the identity cookie
            setIdentityCookie(res, cookieValue);

            // Construct the redirect URL with all the original parameters
            const redirectUrl = `authenticate_retry?${new URLSearchParams(req.query as Record<string, string>).toString()}`;

            // Redirect to authenticate_retry
            return res.redirect(redirectUrl);
        }

        // Identity cookie found, process the authentication request
        return processAuthentication(authRequest, res, userId);
    })
);

/**
 * Authenticate retry endpoint
 *
 * This endpoint handles the authentication request after the identity cookie has been set.
 * It does not create a new cookie if one is not present.
 */
router.get(
    '/authenticate_retry',
    asyncHandler(async (req: Request, res: Response) => {
        // Validate the authentication request
        const authRequest = validateAuthRequest(req.query);

        // Check for identity cookie
        const identityCookie = req.cookies[IDENTITY_COOKIE_NAME];

        if (!identityCookie) {
            // No identity cookie found, return error
            throw new Error('No identity cookie found');
        }

        // Get the user ID associated with the identity cookie
        const userId = getUserIdByCookie(identityCookie);

        if (!userId) {
            throw new Error('Invalid identity cookie');
        }

        // Identity cookie found, process the authentication request
        return processAuthentication(authRequest, res, userId);
    })
);

/**
 * Validate token request parameters
 * @param body Request body parameters
 * @returns Validated TokenRequest object
 * @throws Error if validation fails
 */
const validateTokenRequest = (body: any): TokenRequest => {
    const { grant_type, code, redirect_uri, client_id, code_verifier, refresh_token } = body;

    // Validate required parameters
    if (!grant_type || !client_id) {
        const missingParams = [];
        if (!grant_type) {
            missingParams.push('grant_type');
        }
        if (!client_id) {
            missingParams.push('client_id');
        }
        throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
    }

    // Check grant type and validate specific parameters
    if (grant_type === 'authorization_code') {
        if (!code || !redirect_uri || !code_verifier) {
            const missingParams = [];
            if (!code) {
                missingParams.push('code');
            }
            if (!redirect_uri) {
                missingParams.push('redirect_uri');
            }
            if (!code_verifier) {
                missingParams.push('code_verifier');
            }
            throw new Error(
                `Missing required parameters for authorization_code grant: ${missingParams.join(', ')}`
            );
        }
    } else if (grant_type === 'refresh_token') {
        if (!refresh_token) {
            throw new Error('Missing required parameter: refresh_token');
        }
    } else {
        throw new Error('Unsupported grant_type');
    }

    return {
        grant_type: grant_type as string,
        code: code as string | undefined,
        redirect_uri: redirect_uri as string | undefined,
        client_id: client_id as string,
        code_verifier: code_verifier as string | undefined,
        refresh_token: refresh_token as string | undefined,
    };
};

/**
 * Token endpoint
 *
 * This endpoint handles the token request after the authorization code has been issued.
 * It verifies the code and code_verifier, and returns an access token.
 * It also handles refresh token requests.
 */
router.post(
    '/token',
    asyncHandler(async (req: Request, res: Response) => {
        // Validate the token request
        const tokenRequest = validateTokenRequest(req.body);

        // Handle different grant types
        if (tokenRequest.grant_type === 'authorization_code') {
            // Handle authorization code grant
            return handleAuthorizationCodeGrant(tokenRequest, res);
        } else if (tokenRequest.grant_type === 'refresh_token') {
            // Handle refresh token grant
            return handleRefreshTokenGrant(tokenRequest, res);
        }
        throw new Error('Unsupported grant_type');
    })
);

/**
 * Handle authorization code grant
 */
const handleAuthorizationCodeGrant = async (tokenRequest: TokenRequest, res: Response) => {
    if (!tokenRequest.code || !tokenRequest.redirect_uri || !tokenRequest.code_verifier) {
        throw new Error('Missing required parameters for authorization_code grant');
    }

    // Get the authorization code from the repository
    const authCode = getAuthorizationCode(tokenRequest.code);

    if (!authCode) {
        throw new Error('Invalid authorization code');
    }

    // Check if the code has expired
    if (authCode.expires_at < new Date()) {
        deleteAuthorizationCode(tokenRequest.code);
        throw new Error('Authorization code has expired');
    }

    // Verify the client_id and redirect_uri
    if (
        authCode.client_id !== tokenRequest.client_id ||
        authCode.redirect_uri !== tokenRequest.redirect_uri
    ) {
        throw new Error('Invalid client_id or redirect_uri');
    }

    // Verify the code_verifier
    if (
        !verifyCodeChallenge(
            tokenRequest.code_verifier,
            authCode.code_challenge,
            authCode.code_challenge_method
        )
    ) {
        throw new Error('Invalid code_verifier');
    }

    // Generate an access token
    const accessToken = generateAccessToken(authCode.user_id, authCode.event_id);

    // Delete the used authorization code
    deleteAuthorizationCode(tokenRequest.code);

    // Create the token response
    const tokenResponse: TokenResponse = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: getAccessTokenExpiration(),
        scope: authCode.scope || 'openid profile',
    };

    // Check if offline_access scope is requested before issuing refresh token
    if (authCode.scope && authCode.scope.split(' ').includes('offline_access')) {
        // Generate a refresh token
        const refreshToken = createRefreshToken(
            authCode.user_id,
            authCode.client_id,
            authCode.scope,
            authCode.event_id
        );

        // Add refresh token to the response
        tokenResponse.refresh_token = refreshToken.token;
        tokenResponse.refresh_token_expires_in = getRefreshTokenExpiration();
    }

    return res.status(200).json(tokenResponse);
};

/**
 * Handle refresh token grant
 */
const handleRefreshTokenGrant = async (tokenRequest: TokenRequest, res: Response) => {
    if (!tokenRequest.refresh_token) {
        throw new Error('Missing required parameter: refresh_token');
    }

    // Get the refresh token from the repository
    const refreshTokenObj = getRefreshToken(tokenRequest.refresh_token);

    if (!refreshTokenObj) {
        throw new Error('Invalid refresh token');
    }

    // Check if the token has expired
    if (refreshTokenObj.expires_at < new Date()) {
        throw new Error('Refresh token has expired');
    }

    // Check if the token has been revoked
    if (refreshTokenObj.revoked) {
        throw new Error('Refresh token has been revoked');
    }

    // Verify the client_id
    if (refreshTokenObj.client_id !== tokenRequest.client_id) {
        throw new Error('Invalid client_id');
    }

    // Generate a new access token
    const accessToken = generateAccessToken(refreshTokenObj.user_id, refreshTokenObj.event_id);

    // Create a token response
    const tokenResponse: TokenResponse = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: getAccessTokenExpiration(),
        scope: refreshTokenObj.scope,
    };

    // If refresh token rotation is enabled, generate a new refresh token
    if (ROTATE_REFRESH_TOKENS) {
        // Revoke the old refresh token
        revokeRefreshToken(tokenRequest.refresh_token);

        // Generate a new refresh token
        const newRefreshToken = createRefreshToken(
            refreshTokenObj.user_id,
            refreshTokenObj.client_id,
            refreshTokenObj.scope,
            refreshTokenObj.event_id
        );

        // Add the new refresh token to the response
        tokenResponse.refresh_token = newRefreshToken.token;
        tokenResponse.refresh_token_expires_in = getRefreshTokenExpiration();
    }

    return res.status(200).json(tokenResponse);
};

/**
 * Process authentication request
 *
 * This function processes the authentication request after the identity cookie has been verified.
 * It creates an authorization code for the user.
 */
const processAuthentication = async (authRequest: AuthRequest, res: Response, userId: string) => {
    // Use a default event ID for now (this could be made configurable in the future)
    const eventId = 'default-event';

    // Create an authorization code
    const code = createAuthorizationCode(
        authRequest.client_id,
        authRequest.redirect_uri,
        authRequest.code_challenge,
        authRequest.code_challenge_method,
        userId,
        eventId,
        authRequest.scope
    );

    // Construct the redirect URL with the authorization code and state
    const redirectUrl = `${authRequest.redirect_uri}?code=${code}${authRequest.state ? `&state=${authRequest.state}` : ''}`;

    // Redirect to the client with the authorization code
    return res.redirect(redirectUrl);
};

export default router;
