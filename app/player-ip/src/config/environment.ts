// Environment configuration for the identity provider

// Load environment variables from .env file if present
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

// Server configuration
export const SERVER_PORT = process.env.PORT || 8082;
export const NODE_ENV = process.env.NODE_ENV || 'development';

// JWT configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
export const JWT_ISSUER = process.env.JWT_ISSUER || 'attendee-ip';
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'launchkings-attendee';
export const JWT_KEY_ID = process.env.JWT_KEY_ID || 'attendee-ip-key';

// CORS configuration
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Log configuration
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// SQLite configuration
export const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || path.join(__dirname, '../../../data/attendee-ip.db');

// Refresh token configuration
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '14d';
export const ROTATE_REFRESH_TOKENS = process.env.ROTATE_REFRESH_TOKENS === 'true';
