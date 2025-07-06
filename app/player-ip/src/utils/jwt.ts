/**
 * JWT utilities for the attendee identity provider
 */

import jwt from 'jsonwebtoken';
import {
  JWT_AUDIENCE,
  JWT_EXPIRES_IN,
  JWT_ISSUER,
  JWT_KEY_ID,
  JWT_SECRET,
  REFRESH_TOKEN_EXPIRES_IN
} from '../config/environment.js';
import {
  AccessTokenPayload,
  JwtPayload
} from '../models/index.js';

/**
 * Verify a JWT token and return the payload
 * @param token JWT token to verify
 * @returns Decoded JWT payload
 */
export const verifyJwt = (token: string): JwtPayload => {
  try {
    // Use process.env.JWT_SECRET directly to allow dynamic changes in tests
    const secret = process.env.JWT_SECRET || 'development-secret-key';
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid JWT token');
  }
};

/**
 * Parse duration string to seconds
 * @param duration Duration string (e.g., '14d', '1h', '30m')
 * @returns Duration in seconds
 */
export const parseDuration = (duration: string): number => {
  const match = duration.match(/^(\d+)([a-zA-Z])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd': return value * 24 * 60 * 60;
    case 'h': return value * 60 * 60;
    case 'm': return value * 60;
    case 's': return value;
    default: throw new Error(`Invalid duration unit: ${unit}`);
  }
};

/**
 * Get access token expiration in seconds
 * @returns Access token expiration in seconds
 */
export const getAccessTokenExpiration = (): number => {
  return parseDuration(JWT_EXPIRES_IN);
};

/**
 * Get refresh token expiration in seconds
 * @returns Refresh token expiration in seconds
 */
export const getRefreshTokenExpiration = (): number => {
  return parseDuration(REFRESH_TOKEN_EXPIRES_IN);
};

/**
 * Generate an access token for a user
 * @param userId User ID to include in the token
 * @param eventId Event ID to include in the token
 * @returns JWT access token
 */
export const generateAccessToken = (userId: string, eventId: string): string => {
  const payload: AccessTokenPayload = {
    sub: userId,
    event_id: eventId,
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + getAccessTokenExpiration()
  };

  // Use process.env.JWT_SECRET directly to allow dynamic changes in tests
  const secret = process.env.JWT_SECRET || 'development-secret-key';
  return jwt.sign(payload, secret, {
    keyid: JWT_KEY_ID,
    algorithm: 'HS256'
  });
};
