import db from '../../config/database.js';
import { RefreshToken } from '../../models/index.js';

// Prepare statements
const storeRefreshTokenStmt = db.prepare(`
  INSERT INTO refresh_tokens (
    token, user_id, client_id, scope, event_id, expires_at, revoked
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(token) DO UPDATE SET
    user_id = excluded.user_id,
    client_id = excluded.client_id,
    scope = excluded.scope,
    event_id = excluded.event_id,
    expires_at = excluded.expires_at,
    revoked = excluded.revoked
`);

const getRefreshTokenStmt = db.prepare(`
  SELECT * FROM refresh_tokens WHERE token = ?
`);

const revokeRefreshTokenStmt = db.prepare(`
  UPDATE refresh_tokens SET revoked = 1 WHERE token = ?
`);

const revokeUserRefreshTokensStmt = db.prepare(`
  UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ? AND client_id = ?
`);

const deleteExpiredRefreshTokensStmt = db.prepare(`
  DELETE FROM refresh_tokens WHERE expires_at < ?
`);

/**
 * Store refresh token
 */
export const storeRefreshToken = (token: RefreshToken): RefreshToken => {
  storeRefreshTokenStmt.run(
    token.token,
    token.user_id,
    token.client_id,
    token.scope,
    token.event_id,
    token.expires_at.toISOString(),
    token.revoked ? 1 : 0
  );
  
  return token;
};

/**
 * Get refresh token
 */
export const getRefreshToken = (token: string): RefreshToken | undefined => {
  const row = getRefreshTokenStmt.get(token) as any;
  
  if (!row) {
    return undefined;
  }
  
  return {
    token: row.token,
    user_id: row.user_id,
    client_id: row.client_id,
    scope: row.scope,
    event_id: row.event_id,
    expires_at: new Date(row.expires_at),
    revoked: row.revoked === 1
  };
};

/**
 * Revoke refresh token
 */
export const revokeRefreshToken = (token: string): boolean => {
  const result = revokeRefreshTokenStmt.run(token);
  return result.changes > 0;
};

/**
 * Revoke all refresh tokens for a user and client
 * Used for refresh token rotation
 */
export const revokeUserRefreshTokens = (userId: string, clientId: string): number => {
  const result = revokeUserRefreshTokensStmt.run(userId, clientId);
  return result.changes;
};

/**
 * Delete expired refresh tokens
 * This can be called periodically to clean up the database
 */
export const deleteExpiredRefreshTokens = (): number => {
  const now = new Date().toISOString();
  const result = deleteExpiredRefreshTokensStmt.run(now);
  return result.changes;
};
