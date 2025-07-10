/**
 * Input parameters for the FusionAuth setup script
 */
export interface ScriptInputs {
  // Required inputs
  API_KEY: string;
  
  // Optional inputs with defaults
  FUSION_AUTH_URL: string;
  APP_NAME: string;
  ADMIN_REDIRECT_URI: string;
  PLAYER_REDIRECT_URI: string;
  CONTENT_STORE_URL: string;
  REPLICATOR_URL: string;
  PLAYER_IP_URL: string;
  JWT_SECRET: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  PLAYER_APP_URL: string;
}

/**
 * FusionAuth API request to create an application
 */
export interface ApplicationRequest {
  application: {
    name: string;
    oauthConfiguration: {
      authorizedRedirectURLs: string[];
      clientAuthenticationPolicy: string;
      enabledGrants: string[];
      requireRegistration: boolean;
      proofKeyForCodeExchangePolicy: string;
    };
  };
}

/**
 * FusionAuth API response for application operations
 */
export interface ApplicationResponse {
  application: {
    id: string;
    name: string;
    oauthConfiguration: {
      clientId: string;
      clientSecret: string;
      authorizedRedirectURLs: string[];
      clientAuthenticationPolicy: string;
      enabledGrants: string[];
      requireRegistration: boolean;
      proofKeyForCodeExchangePolicy: string;
    };
  };
}

/**
 * Result of application creation and configuration
 */
export interface ApplicationResult {
  applicationId: string;
  clientId: string;
  name: string;
}

/**
 * FusionAuth API response for key operations
 */
export interface KeysResponse {
  keys: {
    [id: string]: {
      algorithm: string;
      certificate: string;
      certificateInformation: {
        issuer: string;
        subject: string;
        validFrom: number;
        validTo: number;
      };
      hasPrivateKey: boolean;
      id: string;
      issuer: string;
      kid: string;
      name: string;
      publicKey: string;
      type: string;
    };
  };
}

/**
 * Result of key retrieval
 */
export interface KeyInfo {
  keyId: string;
  publicKey: string;
}

/**
 * FusionAuth API response for system configuration
 */
export interface SystemConfigurationResponse {
  systemConfiguration: {
    corsConfiguration: {
      allowCredentials: boolean;
      allowedHeaders: string[];
      allowedMethods: string[];
      allowedOrigins: string[];
      debug: boolean;
      enabled: boolean;
      exposedHeaders: string[];
      preflightMaxAgeInSeconds: number;
    };
  };
}

/**
 * Provider file structure
 */
export interface ProviderFile {
  provider: string;
  issuer: string;
  audience: string;
  key_id: string;
  key: string;
}

/**
 * Script execution result
 */
export interface ScriptResult {
  success: boolean;
  message: string;
  clientId?: string;
  nextSteps?: string[];
  error?: string;
}

/**
 * Logger interface
 */
export interface Logger {
  info(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

/**
 * API client interface
 */
export interface ApiClient {
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, data: any): Promise<T>;
  put<T>(endpoint: string, data: any): Promise<T>;
}

/**
 * Tenant response
 */
export interface TenantsResponse {
  tenants: {
    id: string;
    name: string;
    issuer: string;
  }[];
}