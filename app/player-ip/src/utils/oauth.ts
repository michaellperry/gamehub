/**
 * OAuth utilities for the attendee identity provider
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { AuthorizationCode, RefreshToken } from '../models/index.js';
import { storeAuthorizationCode, storeRefreshToken, revokeUserRefreshTokens } from '../repository/index.js';
import { ROTATE_REFRESH_TOKENS } from '../config/environment.js';
import { getRefreshTokenExpiration } from './jwt.js';

/**
 * Generate a random authorization code
 * @returns Random authorization code
 */
export const generateAuthorizationCode = (): string => {
  return uuidv4();
};

/**
 * Create and store an authorization code
 * @param clientId OAuth client ID
 * @param redirectUri OAuth redirect URI
 * @param codeChallenge PKCE code challenge
 * @param codeChallengeMethod PKCE code challenge method
 * @param userId User ID associated with the code
 * @param eventId Event ID associated with the code
 * @param scope OAuth scopes requested
 * @returns Authorization code
 */
export const createAuthorizationCode = (
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  codeChallengeMethod: string,
  userId: string,
  eventId: string,
  scope: string
): string => {
  const code = generateAuthorizationCode();

  // Set expiration to 10 minutes from now
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  const authCode: AuthorizationCode = {
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
    expires_at: expiresAt,
    user_id: userId,
    event_id: eventId,
    scope
  };

  storeAuthorizationCode(authCode);
  return code;
};

/**
 * Verify the PKCE code verifier against the stored code challenge
 * @param codeVerifier PKCE code verifier
 * @param codeChallenge PKCE code challenge
 * @param codeChallengeMethod PKCE code challenge method
 * @returns Whether the code verifier is valid
 */
export const verifyCodeChallenge = (
  codeVerifier: string,
  codeChallenge: string,
  codeChallengeMethod: string
): boolean => {
  if (codeChallengeMethod === 'S256') {
    const hash = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return hash === codeChallenge;
  } else if (codeChallengeMethod === 'plain') {
    return codeVerifier === codeChallenge;
  }

  return false;
};

/**
 * Generate a random refresh token
 * @returns Random refresh token
 */
export const generateRefreshToken = (): string => {
  return uuidv4();
};

/**
 * Create and store a refresh token
 * @param userId User ID associated with the token
 * @param clientId Client ID associated with the token
 * @param scope Token scope
 * @param eventId Event ID associated with the token
 * @returns Refresh token
 */
export const createRefreshToken = (
  userId: string,
  clientId: string,
  scope: string,
  eventId: string
): RefreshToken => {
  // If refresh token rotation is enabled, revoke all existing refresh tokens for this user and client
  if (ROTATE_REFRESH_TOKENS) {
    revokeUserRefreshTokens(userId, clientId);
  }

  const token = generateRefreshToken();

  // Set expiration based on configuration
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + getRefreshTokenExpiration());

  const refreshToken: RefreshToken = {
    token,
    user_id: userId,
    client_id: clientId,
    scope,
    event_id: eventId,
    expires_at: expiresAt,
    revoked: false
  };

  storeRefreshToken(refreshToken);
  return refreshToken;
};
