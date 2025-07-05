// Environment configuration for the service identity provider

// Load environment variables from .env file if present
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config();

// Server configuration
export const SERVER_PORT = process.env.SERVER_PORT || 8083;
export const NODE_ENV = process.env.NODE_ENV || 'development';

// JWT configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
export const JWT_ISSUER = process.env.JWT_ISSUER || 'service-ip';
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'service-clients';
export const JWT_KEY_ID = process.env.JWT_KEY_ID || 'service-ip-key';

// CORS configuration
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Log configuration
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Client credentials directory
// Find the workspace root by looking for the directory containing both 'app' and 'mesh' directories
const findWorkspaceRoot = (): string => {
  let currentDir = process.cwd();
  
  // Keep going up directories until we find the workspace root
  while (currentDir !== path.dirname(currentDir)) { // Stop at filesystem root
    const appDir = path.join(currentDir, 'app');
    const meshDir = path.join(currentDir, 'mesh');
    
    if (fs.existsSync(appDir) && fs.existsSync(meshDir)) {
      return currentDir;
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  // If not found, return the original directory
  return process.cwd();
};

// Default clients directory - different for Docker vs local development
const getDefaultClientsDir = (): string => {
  // In Docker container, secrets are mounted at /app/secrets/clients
  if (process.env.NODE_ENV === 'production' || fs.existsSync('/app/secrets/clients')) {
    return '/app/secrets/clients';
  }
  
  // In development, use the workspace structure
  const workspaceRoot = findWorkspaceRoot();
  return path.join(workspaceRoot, 'mesh/secrets/service-ip/clients');
};

export const CLIENTS_DIR = process.env.CLIENTS_DIR || getDefaultClientsDir();
