import BetterSqlite3, { Database } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { SQLITE_DB_PATH } from './environment.js';

// Ensure the directory exists
const dbDir = path.dirname(SQLITE_DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db: Database = new BetterSqlite3(SQLITE_DB_PATH, {
  verbose: process.env.NODE_ENV !== 'production' ? console.log : undefined,
  fileMustExist: false
});

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
const initializeDatabase = () => {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      identity_cookie TEXT UNIQUE,
      email TEXT,
      phone_number TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Create user_identities table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_identities (
      cookie_value TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create gaps table
  db.exec(`
    CREATE TABLE IF NOT EXISTS gaps (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      policy TEXT NOT NULL,
      event_id TEXT NOT NULL
    )
  `);

  // Create gap_users table (for user-specific access paths)
  db.exec(`
    CREATE TABLE IF NOT EXISTS gap_users (
      gap_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (gap_id, user_id),
      FOREIGN KEY (gap_id) REFERENCES gaps(id) ON DELETE CASCADE
    )
  `);

  // Create auth_codes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_codes (
      code TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      redirect_uri TEXT NOT NULL,
      code_challenge TEXT NOT NULL,
      code_challenge_method TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      user_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create refresh_tokens table
  db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      scope TEXT NOT NULL,
      event_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked BOOLEAN DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('Database schema initialized');
};

// Initialize the database
initializeDatabase();

// Export the database instance
export default db;
