// Environment configuration for the GameHub Player Identity Provider

// Load environment variables from .env file if present
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

// Get current directory in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server configuration
export const SERVER_PORT = process.env.SERVER_PORT || process.env.PORT || 8082;
export const NODE_ENV = process.env.NODE_ENV || 'development';

// JWT configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
export const JWT_ISSUER = process.env.JWT_ISSUER || 'player-ip';
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'gamehub-players';
export const JWT_KEY_ID = process.env.JWT_KEY_ID || 'player-ip-key';

// CORS configuration
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Log configuration
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// SQLite configuration
// Use memory database for tests, temp directory for CI, or default path for development
export const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH ||
  (NODE_ENV === 'test' ? ':memory:' :
    (process.env.CI ? path.join(process.env.RUNNER_TEMP || '/tmp', 'player-ip.db') :
      path.join(__dirname, '../../../data/player-ip.db')));

// Refresh token configuration
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '14d';
export const ROTATE_REFRESH_TOKENS = process.env.ROTATE_REFRESH_TOKENS === 'true';

// Service Discovery configuration
export const SERVICE_IP_URL = process.env.SERVICE_IP_URL || 'http://localhost:8083';
