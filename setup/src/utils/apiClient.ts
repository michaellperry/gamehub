import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiClient } from '../models';
import { logger } from './logger';

/**
 * API client for making HTTP requests to the FusionAuth API
 */
export class FusionAuthApiClient implements ApiClient {
  private client: AxiosInstance;
  
  /**
   * Creates a new FusionAuth API client
   * @param apiKey FusionAuth API key
   * @param baseUrl Base URL for the FusionAuth API
   */
  constructor(apiKey: string, baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    // Add request interceptor for logging
    this.client.interceptors.request.use((config) => {
      logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: this.sanitizeHeaders(config.headers),
        data: config.data
      });
      return config;
    });
    
    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`API Response: ${response.status} ${response.statusText}`, {
          data: response.data
        });
        return response;
      },
      (error) => {
        this.handleError(error, 'API Request failed');
        throw error;
      }
    );
  }
  
  /**
   * Makes a GET request to the specified endpoint
   * @param endpoint API endpoint
   * @returns Promise resolving to the response data
   */
  async get<T>(endpoint: string): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.get(endpoint);
      return response.data;
    } catch (error) {
      this.handleError(error, `GET ${endpoint}`);
      throw error;
    }
  }
  
  /**
   * Makes a POST request to the specified endpoint
   * @param endpoint API endpoint
   * @param data Request payload
   * @returns Promise resolving to the response data
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleError(error, `POST ${endpoint}`);
      throw error;
    }
  }
  
  /**
   * Makes a PUT request to the specified endpoint
   * @param endpoint API endpoint
   * @param data Request payload
   * @returns Promise resolving to the response data
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.put(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleError(error, `PUT ${endpoint}`);
      throw error;
    }
  }
  
  /**
   * Handles API errors
   * @param error Error object
   * @param operation Description of the operation that failed
   */
  private handleError(error: any, operation: string): void {
    if (axios.isAxiosError(error)) {
      logger.error(`Error during ${operation}`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    } else {
      logger.error(`Error during ${operation}: ${error.message}`);
    }
  }
  
  /**
   * Sanitizes request headers for logging
   * @param headers Request headers
   * @returns Sanitized headers
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    if (sanitized.Authorization) {
      sanitized.Authorization = '[REDACTED]';
    }
    return sanitized;
  }
}