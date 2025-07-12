/**
 * Service for interacting with the content store
 */

import { authProvider } from "../jinaga-config";

// Types for content store responses
export interface ContentStoreUploadResponse {
  contentHash: string;
  contentType: string;
  size: number;
  message: string;
}

/**
 * Upload an image to the content store
 * @param file The file to upload
 * @param contentStoreUrl The URL of the content store service
 * @returns A promise that resolves to the content hash of the uploaded file
 */
export async function uploadImage(file: File, contentStoreUrl: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Get authentication headers from the authProvider
    const authHeaders = await authProvider.getHeaders();
    
    // Create a new Headers object for fetch API
    const headers = new Headers();
    // Add auth header if present
    if (authHeaders.Authorization) {
      headers.append('Authorization', authHeaders.Authorization);
    }
    
    const response = await fetch(`${contentStoreUrl}/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload image: ${errorText}`);
    }
    
    const result: ContentStoreUploadResponse = await response.json();
    return result.contentHash;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Get the URL for an image in the content store
 * @param hash The content hash of the image
 * @param contentStoreUrl The URL of the content store service
 * @returns The URL to access the image
 */
export function getImageUrl(hash: string | undefined, contentStoreUrl: string): string | undefined {
  if (!hash) return undefined;
  return `${contentStoreUrl}/content/${hash}`;
}
