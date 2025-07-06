/**
 * Cookie utilities for the attendee identity provider
 */

import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';

// Cookie name for identity
export const IDENTITY_COOKIE_NAME = 'IDENTITY';

// Cookie options
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Secure in production
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/'
};

/**
 * Generate a unique cookie value
 * @returns Unique cookie value
 */
export const generateCookieValue = (): string => {
  return uuidv4();
};

/**
 * Set the identity cookie in the response
 * @param res Express response object
 * @param cookieValue Value to set in the cookie
 */
export const setIdentityCookie = (res: Response | null, cookieValue: string | undefined): void => {
  if (!res || cookieValue === undefined) {
    return; // Handle null response or undefined cookie value gracefully
  }
  res.cookie(IDENTITY_COOKIE_NAME, cookieValue, COOKIE_OPTIONS);
};

/**
 * Clear the identity cookie from the response
 * @param res Express response object
 */
export const clearIdentityCookie = (res: Response): void => {
  res.clearCookie(IDENTITY_COOKIE_NAME, { path: '/' });
};
