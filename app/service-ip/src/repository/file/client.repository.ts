/**
 * File-based client repository
 */

import fs from 'fs-extra';
import path from 'path';
import { CLIENTS_DIR } from '../../config/environment.js';
import { ClientCredentials } from '../../models/index.js';

/**
 * Get client secret from file
 * @param clientId Client ID
 * @returns Client secret or undefined if client not found
 */
export const getClientSecret = async (clientId: string): Promise<string | undefined> => {
  try {
    // Sanitize client ID to prevent path traversal
    const sanitizedClientId = clientId.replace(/[^a-zA-Z0-9_-]/g, '');
    
    // Check if client ID is valid
    if (sanitizedClientId !== clientId) {
      console.warn(`Invalid client ID format: ${clientId}`);
      return undefined;
    }
    
    // Get client secret file path
    const clientSecretPath = path.join(CLIENTS_DIR, sanitizedClientId);
    
    // Check if client secret file exists
    if (!await fs.pathExists(clientSecretPath)) {
      console.warn(`Client not found: ${clientId}`);
      return undefined;
    }
    
    // Read client secret from file
    const clientSecret = await fs.readFile(clientSecretPath, 'utf-8');
    
    // Trim whitespace and newlines
    return clientSecret.trim();
  } catch (error) {
    console.error('Error getting client secret:', error);
    return undefined;
  }
};

/**
 * Validate client credentials
 * @param clientId Client ID
 * @param clientSecret Client secret
 * @returns Whether the client credentials are valid
 */
export const validateClientCredentials = async (
  clientId: string,
  clientSecret: string
): Promise<boolean> => {
  try {
    // Get client secret from file
    const storedClientSecret = await getClientSecret(clientId);
    
    // Check if client exists and secret matches
    return !!storedClientSecret && storedClientSecret === clientSecret;
  } catch (error) {
    console.error('Error validating client credentials:', error);
    return false;
  }
};

/**
 * Get all client IDs
 * @returns Array of client IDs
 */
export const getAllClientIds = async (): Promise<string[]> => {
  try {
    // Check if clients directory exists
    if (!await fs.pathExists(CLIENTS_DIR)) {
      console.warn(`Clients directory not found: ${CLIENTS_DIR}`);
      return [];
    }
    
    // Get all files in clients directory
    const files = await fs.readdir(CLIENTS_DIR);
    
    // Filter out directories and hidden files
    return files.filter(file => 
      !file.startsWith('.') && 
      fs.statSync(path.join(CLIENTS_DIR, file)).isFile()
    );
  } catch (error) {
    console.error('Error getting client IDs:', error);
    return [];
  }
};
