import db from '../../config/database';
import { AuthorizationCode } from '../../models';

// Prepare statements
const storeAuthCodeStmt = db.prepare(`
  INSERT INTO auth_codes (
    code, client_id, redirect_uri, code_challenge, 
    code_challenge_method, expires_at, user_id, event_id, scope
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(code) DO UPDATE SET
    client_id = excluded.client_id,
    redirect_uri = excluded.redirect_uri,
    code_challenge = excluded.code_challenge,
    code_challenge_method = excluded.code_challenge_method,
    expires_at = excluded.expires_at,
    user_id = excluded.user_id,
    event_id = excluded.event_id,
    scope = excluded.scope
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
  storeAuthCodeStmt.run(
    code.code,
    code.client_id,
    code.redirect_uri,
    code.code_challenge,
    code.code_challenge_method,
    code.expires_at.toISOString(),
    code.user_id,
    code.event_id,
    code.scope
  );
  
  return code;
};

/**
 * Get authorization code
 */
export const getAuthorizationCode = (code: string): AuthorizationCode | undefined => {
  const row = getAuthCodeStmt.get(code) as any;
  
  if (!row) {
    return undefined;
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
    scope: row.scope || 'openid profile' // Fallback for backward compatibility
  };
};

/**
 * Delete authorization code
 */
export const deleteAuthorizationCode = (code: string): boolean => {
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
