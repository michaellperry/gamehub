/**
 * Service client for interacting with the service-ip
 */

import fs from 'fs';
import { promisify } from 'util';
import { SERVICE_IP_URL } from '../config/environment';

// Environment variables
const SERVICE_IP_CLIENT_ID = process.env.SERVICE_IP_CLIENT_ID || 'player-ip';
const SERVICE_IP_CLIENT_SECRET_FILE = process.env.SERVICE_IP_CLIENT_SECRET_FILE || '';

// Token cache
let cachedToken: string | null = null;
let tokenExpiration: number = 0;

// Read file as promise
const readFile = promisify(fs.readFile);

/**
 * Get client secret from file
 * @returns Client secret
 */
const getClientSecret = async (): Promise<string> => {
  try {
    if (!SERVICE_IP_CLIENT_SECRET_FILE) {
      throw new Error('SERVICE_IP_CLIENT_SECRET_FILE environment variable is not set');
    }
    
    const secret = await readFile(SERVICE_IP_CLIENT_SECRET_FILE, 'utf-8');
    return secret.trim();
  } catch (error) {
    console.error('Error reading client secret file:', error);
    throw new Error('Failed to read client secret file');
  }
};

/**
 * Get service token from service-ip
 * @returns Service token
 */
export const getServiceToken = async (): Promise<string> => {
  try {
    // Check if we have a cached token that's not expired
    const now = Math.floor(Date.now() / 1000);
    if (cachedToken && tokenExpiration > now + 60) { // 60 seconds buffer
      return cachedToken;
    }
    
    // Get client secret
    const clientSecret = await getClientSecret();
    
    // Request token from service-ip using fetch
    const response = await fetch(`${SERVICE_IP_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: SERVICE_IP_CLIENT_ID,
        client_secret: clientSecret
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    // Parse JSON response
    const data = await response.json() as { access_token: string; expires_in: number };
    
    // Extract token and expiration
    const { access_token, expires_in } = data;
    
    // Cache token
    cachedToken = access_token;
    tokenExpiration = Math.floor(Date.now() / 1000) + expires_in;
    
    return access_token;
  } catch (error) {
    console.error('Error getting service token:', error);
    throw new Error('Failed to get service token');
  }
};

/**
 * Make authenticated request to a service
 * @param url URL to request
 * @param options Fetch request options
 * @returns Fetch response
 */
export const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  try {
    // Get service token
    const token = await getServiceToken();
    
    // Set authorization header
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);
    
    // Make request
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('Error making authenticated request:', error);
    throw error;
  }
};
