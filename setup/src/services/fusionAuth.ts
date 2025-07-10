import { 
  ApiClient, 
  ApplicationRequest, 
  ApplicationResponse, 
  ApplicationResult, 
  KeyInfo, 
  KeysResponse, 
  ScriptInputs, 
  SystemConfigurationResponse, 
  TenantsResponse 
} from '../models';
import { FusionAuthApiClient } from '../utils/apiClient';
import { jsonEncodeKey } from '../utils/helpers';
import { logger } from '../utils/logger';

/**
 * Service for interacting with the FusionAuth API
 */
export class FusionAuthService {
  private apiClient: ApiClient;
  
  /**
   * Creates a new FusionAuth service
   * @param apiKey FusionAuth API key
   * @param fusionAuthUrl FusionAuth base URL
   */
  constructor(apiKey: string, fusionAuthUrl: string) {
    this.apiClient = new FusionAuthApiClient(apiKey, fusionAuthUrl);
  }
  
  /**
   * Creates and configures a FusionAuth application
   * @param inputs Script inputs
   * @returns Application result
   */
  async createAndConfigureApplication(inputs: ScriptInputs): Promise<ApplicationResult> {
    try {
      logger.info(`Creating application: ${inputs.APP_NAME}`);
      
      // Check if application already exists
      const existingApp = await this.findExistingApplication(inputs.APP_NAME);
      if (existingApp) {
        logger.info(`Application already exists: ${inputs.APP_NAME}`);
        return existingApp;
      }
      
      // Create application
      const appResult = await this.createApplication(
        inputs.APP_NAME,
        inputs.ADMIN_REDIRECT_URI
      );
      
      // Configure OAuth settings
      await this.configureOAuth(appResult.applicationId);
      
      // Configure CORS settings
      await this.configureCORS([
        inputs.ADMIN_REDIRECT_URI,
        inputs.PLAYER_REDIRECT_URI,
        inputs.CONTENT_STORE_URL,
        inputs.REPLICATOR_URL,
        inputs.PLAYER_IP_URL,
        inputs.PLAYER_APP_URL
      ]);
      
      return appResult;
    } catch (error) {
      logger.error('Failed to create and configure application', { error });
      throw new Error(`Failed to create and configure application: ${(error as Error).message}`);
    }
  }
  
  /**
   * Finds an existing application by name
   * @param appName Application name
   * @returns Application result or null if not found
   */
  private async findExistingApplication(appName: string): Promise<ApplicationResult | null> {
    try {
      // Get all applications
      const response = await this.apiClient.get<{ applications: ApplicationResponse['application'][] }>('/api/application');
      
      // Find application by name
      const app = response.applications.find(app => app.name === appName);
      if (!app) {
        return null;
      }
      
      return {
        applicationId: app.id,
        clientId: app.oauthConfiguration.clientId,
        name: app.name
      };
    } catch (error) {
      logger.warn(`Failed to find existing application: ${appName}`, { error });
      return null;
    }
  }
  
  /**
   * Creates a new FusionAuth application
   * @param appName Application name
   * @param redirectUri Redirect URI
   * @returns Application result
   */
  private async createApplication(appName: string, redirectUri: string): Promise<ApplicationResult> {
    try {
      logger.info(`Creating new application: ${appName}`);
      
      const request: ApplicationRequest = {
        application: {
          name: appName,
          oauthConfiguration: {
            authorizedRedirectURLs: [redirectUri],
            clientAuthenticationPolicy: 'NotRequired',
            enabledGrants: ['authorization_code', 'refresh_token'],
            requireRegistration: false,
            proofKeyForCodeExchangePolicy: 'Required'
          }
        }
      };
      
      const response = await this.apiClient.post<ApplicationResponse>('/api/application', request);
      
      logger.info(`Application created: ${appName}`, {
        applicationId: response.application.id,
        clientId: response.application.oauthConfiguration.clientId
      });
      
      return {
        applicationId: response.application.id,
        clientId: response.application.oauthConfiguration.clientId,
        name: response.application.name
      };
    } catch (error) {
      logger.error(`Failed to create application: ${appName}`, { error });
      throw new Error(`Failed to create application: ${(error as Error).message}`);
    }
  }
  
  /**
   * Configures OAuth settings for an application
   * @param applicationId Application ID
   */
  private async configureOAuth(applicationId: string): Promise<void> {
    try {
      logger.info(`Configuring OAuth for application: ${applicationId}`);
      
      // Get current application
      const response = await this.apiClient.get<ApplicationResponse>(`/api/application/${applicationId}`);
      
      // Update OAuth configuration
      const request: ApplicationRequest = {
        application: {
          ...response.application,
          oauthConfiguration: {
            ...response.application.oauthConfiguration,
            clientAuthenticationPolicy: 'NotRequired',
            proofKeyForCodeExchangePolicy: 'Required'
          }
        }
      };
      
      await this.apiClient.put<ApplicationResponse>(`/api/application/${applicationId}`, request);
      
      logger.info(`OAuth configured for application: ${applicationId}`);
    } catch (error) {
      logger.error(`Failed to configure OAuth for application: ${applicationId}`, { error });
      throw new Error(`Failed to configure OAuth: ${(error as Error).message}`);
    }
  }
  
  /**
   * Configures CORS settings
   * @param origins CORS origins to allow
   */
  private async configureCORS(origins: string[]): Promise<void> {
    try {
      logger.info('Configuring CORS settings');
      
      // Get current system configuration
      const response = await this.apiClient.get<SystemConfigurationResponse>('/api/system-configuration');
      
      // Extract unique origins
      const uniqueOrigins = new Set<string>();
      
      // Add existing origins
      if (response.systemConfiguration.corsConfiguration.allowedOrigins) {
        response.systemConfiguration.corsConfiguration.allowedOrigins.forEach(origin => {
          uniqueOrigins.add(origin);
        });
      }
      
      // Add new origins
      origins.forEach(origin => {
        try {
          const url = new URL(origin);
          const corsOrigin = `${url.protocol}//${url.host}`;
          uniqueOrigins.add(corsOrigin);
        } catch (error) {
          logger.warn(`Invalid URL for CORS origin: ${origin}`);
        }
      });
      
      // Update CORS configuration
      const request = {
        systemConfiguration: {
          ...response.systemConfiguration,
          corsConfiguration: {
            ...response.systemConfiguration.corsConfiguration,
            enabled: true,
            allowedOrigins: Array.from(uniqueOrigins),
            allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            exposedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            allowCredentials: true
          }
        }
      };
      
      await this.apiClient.put<SystemConfigurationResponse>('/api/system-configuration', request);
      
      logger.info('CORS configured successfully', {
        origins: Array.from(uniqueOrigins)
      });
    } catch (error) {
      logger.error('Failed to configure CORS', { error });
      throw new Error(`Failed to configure CORS: ${(error as Error).message}`);
    }
  }
  
  /**
   * Gets the default RSA signing key
   * @returns Key information
   */
  async getSigningKey(): Promise<KeyInfo> {
    try {
      logger.info('Getting signing key');
      
      // Get all keys
      const response = await this.apiClient.get<KeysResponse>('/api/key');
      
      // Find the default RSA signing key
      const keys = Object.values(response.keys);
      const signingKey = keys.find(key => 
        key.algorithm === 'RS256' && 
        key.type === 'EC' || key.type === 'RSA'
      );
      
      if (!signingKey) {
        throw new Error('No RSA signing key found');
      }
      
      logger.info('Found signing key', {
        keyId: signingKey.id,
        algorithm: signingKey.algorithm
      });
      
      return {
        keyId: signingKey.kid,
        publicKey: signingKey.publicKey
      };
    } catch (error) {
      logger.error('Failed to get signing key', { error });
      throw new Error(`Failed to get signing key: ${(error as Error).message}`);
    }
  }
  
  /**
   * Gets the default tenant
   * @returns Tenant ID
   */
  async getDefaultTenant(): Promise<string> {
    try {
      logger.info('Getting default tenant');
      
      // Get all tenants
      const response = await this.apiClient.get<TenantsResponse>('/api/tenant');
      
      if (!response.tenants || response.tenants.length === 0) {
        throw new Error('No tenants found');
      }
      
      // Get the first tenant (default)
      const tenant = response.tenants[0];
      
      logger.info('Found default tenant', {
        tenantId: tenant.id,
        name: tenant.name
      });
      
      return tenant.id;
    } catch (error) {
      logger.error('Failed to get default tenant', { error });
      throw new Error(`Failed to get default tenant: ${(error as Error).message}`);
    }
  }
}