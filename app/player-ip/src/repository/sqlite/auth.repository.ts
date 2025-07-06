import db from '../../config/database.js';
import { AuthorizationCode, RefreshToken } from '../../models/index.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Prepare statements
const storeAuthCodeStmt = db.prepare(`
  INSERT INTO auth_codes (
    code, client_id, redirect_uri, code_challenge,
    code_challenge_method, expires_at, user_id, event_id, scope, created_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(code) DO UPDATE SET
    client_id = excluded.client_id,
    redirect_uri = excluded.redirect_uri,
    code_challenge = excluded.code_challenge,
    code_challenge_method = excluded.code_challenge_method,
    expires_at = excluded.expires_at,
    user_id = excluded.user_id,
    event_id = excluded.event_id,
    scope = excluded.scope,
    created_at = excluded.created_at
`);

const getAuthCodeStmt = db.prepare(`
  SELECT * FROM auth_codes WHERE code = ?
`);

const deleteAuthCodeStmt = db.prepare(`
  DELETE FROM auth_codes WHERE code = ?
`);

// Cleanup expired auth codes (can be run periodically)
const cleanupExpiredAuthCodesStmt = db.prepare(`
  DELETE FROM auth_codes WHERE expires_at < ?
`);

/**
 * Store authorization code
 */
export const storeAuthorizationCode = (code: AuthorizationCode): AuthorizationCode => {
  const createdAt = code.created_at || new Date();
  storeAuthCodeStmt.run(
    code.code,
    code.client_id,
    code.redirect_uri,
    code.code_challenge,
    code.code_challenge_method,
    code.expires_at.toISOString(),
    code.user_id,
    code.event_id,
    code.scope,
    createdAt.toISOString()
  );

  return { ...code, created_at: createdAt };
};

/**
 * Create authorization code (expected by tests)
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
  const code = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  const createdAt = new Date();

  const authCode: AuthorizationCode = {
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
    expires_at: expiresAt,
    user_id: userId,
    event_id: eventId,
    scope,
    created_at: createdAt
  };

  storeAuthorizationCode(authCode);
  return code;
};

/**
 * Get authorization code
 */
export const getAuthorizationCode = (code: string): AuthorizationCode | null => {
  if (!code) {
    return null;
  }

  const row = getAuthCodeStmt.get(code) as any;

  if (!row) {
    return null;
  }

  return {
    code: row.code,
    client_id: row.client_id,
    redirect_uri: row.redirect_uri,
    code_challenge: row.code_challenge,
    code_challenge_method: row.code_challenge_method,
    expires_at: new Date(row.expires_at),
    user_id: row.user_id,
    event_id: row.event_id,
    scope: row.scope || 'openid profile',
    created_at: row.created_at ? new Date(row.created_at) : new Date()
  };
};

/**
 * Delete authorization code
 */
export const deleteAuthorizationCode = (code: string): boolean => {
  if (!code) {
    return false;
  }
  const result = deleteAuthCodeStmt.run(code);
  return result.changes > 0;
};

/**
 * Cleanup expired authorization codes
 * This can be called periodically to remove expired codes
 */
export const cleanupExpiredAuthorizationCodes = (): number => {
  const now = new Date().toISOString();
  const result = cleanupExpiredAuthCodesStmt.run(now);
  return result.changes;
};
