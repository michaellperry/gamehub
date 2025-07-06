import db from '../../config/database.js';
import { User, UserIdentity } from '../../models/index.js';
import { v4 as uuidv4 } from 'uuid';

// Prepare statements
const createUserStmt = db.prepare(`
  INSERT INTO users (id, created_at, updated_at)
  VALUES (?, ?, ?)
`);

const getUserByIdStmt = db.prepare(`
  SELECT * FROM users WHERE id = ?
`);

const updateUserStmt = db.prepare(`
  UPDATE users
  SET identity_cookie = ?, email = ?, phone_number = ?, updated_at = ?
  WHERE id = ?
`);

const storeUserIdentityStmt = db.prepare(`
  INSERT INTO user_identities (cookie_value, user_id)
  VALUES (?, ?)
  ON CONFLICT(cookie_value) DO UPDATE SET user_id = excluded.user_id
`);

const getUserIdByCookieStmt = db.prepare(`
  SELECT user_id FROM user_identities WHERE cookie_value = ?
`);

/**
 * Create a new user
 */
export const createUser = (): User => {
  const userId = uuidv4();
  const now = new Date().toISOString();
  
  const user: User = {
    id: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  createUserStmt.run(userId, now, now);
  
  return user;
};

/**
 * Get user by ID
 */
export const getUserById = (userId: string): User | undefined => {
  const row = getUserByIdStmt.get(userId) as any;
  
  if (!row) {
    return undefined;
  }
  
  return {
    id: row.id,
    identityCookie: row.identity_cookie,
    email: row.email,
    phoneNumber: row.phone_number,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
};

/**
 * Update user
 */
export const updateUser = (user: User): User => {
  user.updatedAt = new Date();
  
  updateUserStmt.run(
    user.identityCookie || null,
    user.email || null,
    user.phoneNumber || null,
    user.updatedAt.toISOString(),
    user.id
  );
  
  return user;
};

/**
 * Store user identity
 */
export const storeUserIdentity = (userId: string, cookieValue: string): UserIdentity => {
  // Begin transaction
  const transaction = db.transaction(() => {
    // Store mapping from cookie to user ID
    storeUserIdentityStmt.run(cookieValue, userId);
    
    // Update the user with the identity cookie
    const user = getUserById(userId);
    if (user) {
      user.identityCookie = cookieValue;
      updateUser(user);
    }
  });
  
  // Execute transaction
  transaction();
  
  return { userId, cookieValue };
};

/**
 * Get user ID by cookie
 */
export const getUserIdByCookie = (cookieValue: string): string | undefined => {
  const row = getUserIdByCookieStmt.get(cookieValue) as any;
  return row ? row.user_id : undefined;
};
