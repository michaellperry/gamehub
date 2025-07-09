import path from 'path';
import { ApplicationResult, KeyInfo, ProviderFile, ScriptInputs } from '../types';
import { ensureDirectoryExists, fileExists, writeFile, writeJsonFile } from '../utils/helpers';
import { logger } from '../utils/logger';
import { extractHostname } from '../utils/validation';

/**
 * Service for generating configuration files
 */
export class FileGenerator {
  /**
   * Creates provider files
   * @param appResult Application result
   * @param keyInfo Key information
   * @param inputs Script inputs
   * @param overwrite Whether to overwrite existing files
   */
  createProviderFiles(
    appResult: ApplicationResult,
    keyInfo: KeyInfo,
    inputs: ScriptInputs,
    overwrite = false
  ): void {
    try {
      logger.info('Creating provider files');
      
      // Extract hostname from FusionAuth URL
      const issuer = extractHostname(inputs.FUSION_AUTH_URL);
      
      // Create fusionauth.provider file
      const providerContent: ProviderFile = {
        provider: "FusionAuth",
        issuer: issuer,
        audience: appResult.clientId,
        key_id: keyInfo.keyId,
        key: keyInfo.publicKey
      };
      
      // Provider file path - Updated for GameHub mesh structure
      const providerFilePath = '../mesh/replicator/authentication/fusionauth.provider';
      
      // Check if file exists
      if (fileExists(providerFilePath) && !overwrite) {
        logger.warn(`Provider file already exists: ${providerFilePath}. Use overwrite=true to replace it.`);
      } else {
        // Write provider file
        writeJsonFile(providerFilePath, providerContent, overwrite);
        logger.info(`Created provider file: ${providerFilePath}`);
      }
    } catch (error) {
      logger.error('Failed to create provider files', { error });
      throw new Error(`Failed to create provider files: ${(error as Error).message}`);
    }
  }
  
  /**
   * Creates environment files
   * @param appResult Application result
   * @param inputs Script inputs
   * @param overwrite Whether to overwrite existing files
   */
  createEnvironmentFiles(
    appResult: ApplicationResult,
    inputs: ScriptInputs,
    overwrite = false
  ): void {
    try {
      logger.info('Creating environment files');
      
      // Create .env.local file content
      const envContent = `CLIENT_ID=${appResult.clientId}
# Add TENANT_PUBLIC_KEY after creating a tenant in the admin app
# TENANT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\\r\\nMIIBIjANB...QIDAQAB\\r\\n-----END PUBLIC KEY-----\\r\\n"
`;
      
      // Environment file path
      const envFilePath = '../mesh/.env.local';
      
      // Check if file exists
      if (fileExists(envFilePath) && !overwrite) {
        logger.warn(`Environment file already exists: ${envFilePath}. Use overwrite=true to replace it.`);
      } else {
        // Write environment file
        writeFile(envFilePath, envContent, overwrite);
        logger.info(`Created environment file: ${envFilePath}`);
      }
    } catch (error) {
      logger.error('Failed to create environment files', { error });
      throw new Error(`Failed to create environment files: ${(error as Error).message}`);
    }
  }
  
  /**
   * Creates Vite environment files for the admin app
   * @param appResult Application result
   * @param inputs Script inputs
   * @param overwrite Whether to overwrite existing files
   */
  createViteEnvironmentFiles(
    appResult: ApplicationResult,
    inputs: ScriptInputs,
    overwrite = false
  ): void {
    try {
      logger.info('Creating Vite environment files');
   
      // Create .env.local file content
      const localEnvContent = `VITE_CLIENT_ID=${appResult.clientId}
# Add VITE_TENANT_PUBLIC_KEY after creating a tenant in the admin app
# VITE_TENANT_PUBLIC_KEY='"-----BEGIN PUBLIC KEY-----\\r\\nMIIBIjANB...QIDAQAB\\r\\n-----END PUBLIC KEY-----\\r\\n"'
`;
      
      // Environment file path - Updated for GameHub structure
      const adminLocalEnvFilePath = '../app/gamehub-admin/.env.local';
      
      // Check if admin environment file exists
      if (fileExists(adminLocalEnvFilePath) && !overwrite) {
        logger.warn(`Admin environment file already exists: ${adminLocalEnvFilePath}. Use overwrite=true to replace it.`);
      } else {
        // Write admin environment file
        writeFile(adminLocalEnvFilePath, localEnvContent, overwrite);
        logger.info(`Created admin environment file: ${adminLocalEnvFilePath}`);
      }
      
      logger.info('Created Vite environment files');
    } catch (error) {
      logger.error('Failed to create Vite environment files', { error });
      throw new Error(`Failed to create Vite environment files: ${(error as Error).message}`);
    }
  }
}