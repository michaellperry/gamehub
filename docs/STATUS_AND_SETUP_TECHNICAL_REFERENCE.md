# GameHub Status and Setup Pages - Technical Reference

## Overview

This technical reference provides comprehensive documentation for developers and system administrators working with the GameHub Status and Setup Pages system. It covers API specifications, configuration options, technical implementation details, and extension guidelines.

## Table of Contents

- [API Documentation](#api-documentation)
- [Configuration Reference](#configuration-reference)
- [HTTP Polling Specifications](#http-polling-specifications)
- [HTTP Polling Specifications](#http-polling-specifications)
- [Error Codes and Response Formats](#error-codes-and-response-formats)
- [Extension and Customization](#extension-and-customization)
- [Development Guidelines](#development-guidelines)

## API Documentation

### Relay Service API

The Relay Service provides a RESTful API for accessing aggregated service status information.

**Base URL**: `http://localhost/relay`

#### GET /relay

Returns the current status of all configured services and bundles.

**Request**:
```http
GET /relay HTTP/1.1
Host: localhost
Accept: application/json
```

**Response**:
```json
{
  "timestamp": "2025-01-09T15:30:15.123Z",
  "services": {
    "service-ip": {
      "health": true,
      "configured": true,
      "configuredGroups": {
        "jwt": true,
        "clients": ["player-ip"]
      },
      "ready": true,
      "lastChecked": "2025-01-09T15:30:14.890Z",
      "responseTime": 45,
      "error": null
    },
    "player-ip": {
      "health": true,
      "configured": false,
      "configuredGroups": {
        "jwt": true,
        "service-ip": false
      },
      "ready": false,
      "lastChecked": "2025-01-09T15:30:14.920Z",
      "responseTime": 67,
      "error": "Service IP connection failed"
    },
    "content-store": {
      "health": true,
      "configured": true,
      "configuredGroups": {
        "secrets": true
      },
      "ready": true,
      "lastChecked": "2025-01-09T15:30:14.950Z",
      "responseTime": 23,
      "error": null
    }
  },
  "bundles": {
    "admin-portal": {
      "configured": false,
      "configuredGroups": {
        "client": true,
        "tenant": false
      },
      "lastChecked": "2025-01-09T15:30:14.960Z",
      "error": null
    }
  },
  "summary": {
    "totalServices": 3,
    "healthyServices": 3,
    "configuredServices": 2,
    "readyServices": 2,
    "overallStatus": "degraded"
  }
}
```

**Response Fields**:
- `timestamp`: ISO 8601 timestamp of the response
- `services`: Object containing service status information
- `bundles`: Object containing bundle status information
- `summary`: Aggregated system status summary

**Status Codes**:
- `200 OK`: Successful response
- `500 Internal Server Error`: Server error occurred

#### GET /relay/health

Health check endpoint for the Relay Service itself.

**Request**:
```http
GET /relay/health HTTP/1.1
Host: localhost
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T15:30:15.123Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

**Status Codes**:
- `200 OK`: Service is healthy
- `503 Service Unavailable`: Service is unhealthy

#### POST /relay/refresh

Forces a cache refresh and provides updated status for polling clients.

**Request**:
```http
POST /relay/refresh HTTP/1.1
Host: localhost
Content-Type: application/json
```

**Response**:
```json
{
  "message": "Cache refreshed successfully",
  "timestamp": "2025-01-09T15:30:15.123Z",
  "clientsNotified": 5
}
```

**Status Codes**:
- `200 OK`: Cache refreshed successfully
- `500 Internal Server Error`: Refresh failed

#### GET /relay/cache/stats

Returns cache statistics for debugging and monitoring.

**Request**:
```http
GET /relay/cache/stats HTTP/1.1
Host: localhost
```

**Response**:
```json
{
  "cacheHits": 150,
  "cacheMisses": 25,
  "cacheSize": 1,
  "lastRefresh": "2025-01-09T15:30:00.000Z",
  "nextRefresh": "2025-01-09T15:30:30.000Z",
  "cacheTimeout": 30000
}
```

### Service Integration Endpoints

Each GameHub service must implement these standardized endpoints for integration with the Relay Service.

#### GET /health

Basic health check endpoint that indicates if the service is running.

**Request**:
```http
GET /health HTTP/1.1
Host: service-ip:8083
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T15:30:15.123Z"
}
```

**Status Codes**:
- `200 OK`: Service is healthy
- `503 Service Unavailable`: Service is unhealthy

#### GET /configured

Configuration status endpoint that returns detailed configuration information.

**Request**:
```http
GET /configured HTTP/1.1
Host: service-ip:8083
```

**Response**:
```json
{
  "service": "service-ip",
  "status": "healthy",
  "timestamp": "2025-01-09T15:30:15.123Z",
  "configured": true,
  "configuredGroups": {
    "jwt": true,
    "clients": ["player-ip", "admin-portal"]
  },
  "ready": true
}
```

**Configuration Groups by Service**:

**Service IP Provider**:
- `jwt`: JWT token configuration (JWT_SECRET, JWT_EXPIRES_IN, etc.)
- `clients`: Configured client applications in CLIENTS_DIR

**Player IP Service**:
- `jwt`: JWT token configuration
- `service-ip`: Service IP provider connection configuration

**Content Store**:
- `secrets`: Authentication provider configuration in AUTH_DIR

**Status Codes**:
- `200 OK`: Configuration status retrieved successfully
- `500 Internal Server Error`: Error retrieving configuration status

#### GET /ready

Readiness check endpoint that indicates if the service is ready to handle requests.

**Request**:
```http
GET /ready HTTP/1.1
Host: service-ip:8083
```

**Response**:
```json
{
  "ready": true,
  "timestamp": "2025-01-09T15:30:15.123Z"
}
```

**Status Codes**:
- `200 OK`: Service is ready
- `503 Service Unavailable`: Service is not ready

## Configuration Reference

### Environment Variables

#### Relay Service Configuration

**Core Configuration**:
```bash
# Server Configuration
SERVER_PORT=8084                    # Port for Relay Service
NODE_ENV=production                 # Environment mode (development|production)

# CORS Configuration
RELAY_CORS_ORIGIN=*                 # Allowed CORS origins (* for all)

# Cache Configuration
RELAY_CACHE_TIMEOUT=30000           # Cache timeout in milliseconds (30 seconds)

# Logging Configuration
LOG_LEVEL=info                      # Log level (error|warn|info|debug)
```

**Service Discovery Configuration**:
```bash
RELAY_CONFIG='{
  "services": {
    "service-ip": {
      "name": "Service IP",
      "healthEndpoint": "http://service-ip:8083/health",
      "configuredEndpoint": "http://service-ip:8083/configured",
      "readyEndpoint": "http://service-ip:8083/ready",
      "timeout": 5000,
      "retries": 3
    },
    "player-ip": {
      "name": "Player IP",
      "healthEndpoint": "http://player-ip:8082/health",
      "configuredEndpoint": "http://player-ip:8082/configured",
      "readyEndpoint": "http://player-ip:8082/ready",
      "timeout": 5000,
      "retries": 3
    },
    "content-store": {
      "name": "Content Store",
      "healthEndpoint": "http://content-store:8081/health",
      "configuredEndpoint": "http://content-store:8081/configured",
      "readyEndpoint": "http://content-store:8081/ready",
      "timeout": 5000,
      "retries": 3
    }
  },
  "bundles": {
    "admin-portal": {
      "name": "Admin Portal",
      "type": "bundle",
      "configFunction": "getConfiguredGroups"
    }
  },
  "polling": {
    "interval": 10000,
    "timeout": 30000
  }
}'
```

#### Service Configuration

**JWT Configuration** (required for all services):
```bash
JWT_SECRET=your-secret-key          # JWT signing secret
JWT_EXPIRES_IN=1h                   # Token expiration time
JWT_ISSUER=gamehub                  # Token issuer
JWT_AUDIENCE=gamehub-services       # Token audience
JWT_KEY_ID=gamehub-key             # Key identifier
```

**Service IP Provider Configuration**:
```bash
CLIENTS_DIR=/app/secrets/clients    # Directory containing client configurations
```

**Player IP Service Configuration**:
```bash
SERVICE_IP_URL=http://service-ip:8083           # Service IP provider URL
SERVICE_IP_CLIENT_ID=player-ip                  # Client identifier
SERVICE_IP_CLIENT_SECRET_FILE=/app/secrets/service-ip-secret  # Client secret file
```

**Content Store Configuration**:
```bash
AUTH_DIR=/app/auth                  # Authentication provider directory
```

### Configuration Schema

#### Relay Service Configuration Schema

```typescript
interface RelayConfig {
  services: {
    [serviceName: string]: {
      name: string;                 // Human-readable service name
      healthEndpoint: string;       // Health check URL
      configuredEndpoint: string;   // Configuration status URL
      readyEndpoint: string;        // Readiness check URL
      timeout?: number;             // Request timeout (default: 5000ms)
      retries?: number;             // Retry attempts (default: 3)
    };
  };
  bundles?: {
    [bundleName: string]: {
      name: string;                 // Human-readable bundle name
      type: 'bundle';               // Bundle type identifier
      configFunction: string;       // Configuration function name
    };
  };
  polling: {
    interval: number;               // Polling interval in milliseconds
    timeout: number;                // Overall timeout in milliseconds
  };
}
```

#### Service Response Schema

```typescript
interface ServiceResponse {
  service: string;                  // Service identifier
  status: 'healthy' | 'error';     // Service status
  timestamp: string;                // ISO 8601 timestamp
  configured: boolean;              // Overall configuration status
  configuredGroups: {               // Detailed configuration groups
    [groupName: string]: boolean | string[];
  };
  ready: boolean;                   // Service readiness status
  error?: string;                   // Error message if applicable
}
```

## HTTP Polling Specifications

### Connection Endpoint

**URL**: `http://localhost/relay`

### Connection Lifecycle

1. **Connection Establishment**:
   ```javascript
   const response = await fetch('http://localhost/relay');
   ```

2. **Initial Status Response**: Server responds with current status
3. **Periodic Polling**: Client requests updates at configurable intervals
4. **Error Handling**: Graceful handling of failed requests

### Message Formats

#### Status Update Message

```json
{
  "type": "status_update",
  "timestamp": "2025-01-09T15:30:15.123Z",
  "data": {
    "services": {
      "player-ip": {
        "health": true,
        "configured": true,
        "ready": true,
        "configuredGroups": {
          "jwt": true,
          "service-ip": true
        },
        "responseTime": 45,
        "lastChecked": "2025-01-09T15:30:14.920Z"
      }
    },
    "summary": {
      "totalServices": 3,
      "healthyServices": 3,
      "configuredServices": 3,
      "readyServices": 3,
      "overallStatus": "healthy"
    }
  }
}
```

#### Service-Specific Update Message

```json
{
  "type": "service_update",
  "service": "player-ip",
  "timestamp": "2025-01-09T15:30:15.123Z",
  "data": {
    "health": true,
    "configured": true,
    "ready": true,
    "configuredGroups": {
      "jwt": true,
      "service-ip": true
    },
    "responseTime": 45,
    "lastChecked": "2025-01-09T15:30:14.920Z"
  }
}
```

#### Error Message

```json
{
  "type": "error",
  "timestamp": "2025-01-09T15:30:15.123Z",
  "error": "Connection to service failed",
  "service": "player-ip"
}
```

#### Heartbeat Messages

```json
// Ping (server to client)
{
  "type": "ping",
  "timestamp": "2025-01-09T15:30:15.123Z"
}

// Pong (client to server)
{
  "type": "pong",
  "timestamp": "2025-01-09T15:30:15.123Z"
}
```

### Client Implementation Example

```javascript
class StatusPolling {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  startPolling() {
    this.poll();
    this.intervalId = setInterval(() => this.poll(), this.interval);
  }

  async poll() {
    try {
      const response = await fetch(this.url);
      const data = await response.json();
      console.log('HTTP polling response:', data);
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    } catch (error) {
      console.error('HTTP polling error:', error);
      this.handleError();
    };
    
  }

  handleError() {
    this.reconnectAttempts++;
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => this.poll(), this.reconnectDelay);
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'status_update':
        this.updateStatus(message.data);
        break;
      case 'service_update':
        this.updateService(message.service, message.data);
        break;
      case 'ping':
        this.sendPong();
        break;
      case 'error':
        this.handleError(message);
        break;
    }
  }

  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
        type: 'pong',
        timestamp: new Date().toISOString()
      }));
    }
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
        this.connect();
      }, delay);
    }
  }
}
```

## HTTP Polling Specifications

### Polling Strategy

The Status Page uses HTTP polling as the primary communication method.

**Polling Configuration**:
- **Interval**: 10 seconds (configurable)
- **Timeout**: 5 seconds per request
- **Retry Logic**: 3 attempts with exponential backoff

### Polling Implementation

```javascript
class StatusPoller {
  constructor(apiUrl, interval = 10000) {
    this.apiUrl = apiUrl;
    this.interval = interval;
    this.polling = false;
    this.pollTimer = null;
  }

  start() {
    if (this.polling) return;
    
    this.polling = true;
    this.poll();
  }

  stop() {
    this.polling = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async poll() {
    if (!this.polling) return;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        this.handleStatusUpdate(data);
      } else {
        this.handleError(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.handleError(error.message);
    }

    // Schedule next poll
    if (this.polling) {
      this.pollTimer = setTimeout(() => this.poll(), this.interval);
    }
  }

  handleStatusUpdate(data) {
    // Update UI with new status data
    console.log('Status updated:', data);
  }

  handleError(error) {
    console.error('Polling error:', error);
    // Continue polling despite errors
  }
}
```

## Error Codes and Response Formats

### HTTP Status Codes

#### Success Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully

#### Client Error Codes
- `400 Bad Request`: Invalid request format
- `404 Not Found`: Endpoint not found
- `405 Method Not Allowed`: HTTP method not supported

#### Server Error Codes
- `500 Internal Server Error`: Server error occurred
- `502 Bad Gateway`: Upstream service error
- `503 Service Unavailable`: Service temporarily unavailable
- `504 Gateway Timeout`: Upstream service timeout

### Error Response Format

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service is temporarily unavailable",
    "details": "Connection to player-ip service failed after 3 attempts",
    "timestamp": "2025-01-09T15:30:15.123Z",
    "service": "player-ip"
  }
}
```

### Error Codes Reference

#### Relay Service Error Codes

| Code | Description | HTTP Status | Resolution |
|------|-------------|-------------|------------|
| `INVALID_CONFIG` | Invalid service configuration | 500 | Check RELAY_CONFIG format |
| `SERVICE_TIMEOUT` | Service request timeout | 502 | Check service availability |
| `SERVICE_UNAVAILABLE` | Service not responding | 503 | Restart affected service |
| `POLLING_ERROR` | HTTP polling connection error | 500 | Check HTTP configuration |
| `CACHE_ERROR` | Cache operation failed | 500 | Restart Relay Service |

#### Service Integration Error Codes

| Code | Description | HTTP Status | Resolution |
|------|-------------|-------------|------------|
| `CONFIG_MISSING` | Required configuration missing | 503 | Complete service configuration |
| `AUTH_FAILED` | Authentication failure | 401 | Check authentication setup |
| `DB_CONNECTION_FAILED` | Database connection error | 503 | Check database connectivity |
| `DEPENDENCY_UNAVAILABLE` | Required dependency unavailable | 503 | Check service dependencies |

### Error Handling Best Practices

#### Client-Side Error Handling

```javascript
async function fetchStatus() {
  try {
    const response = await fetch('/relay');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      handleApiError(data.error);
      return;
    }
    
    updateStatus(data);
  } catch (error) {
    handleNetworkError(error);
  }
}

function handleApiError(error) {
  switch (error.code) {
    case 'SERVICE_UNAVAILABLE':
      showServiceUnavailableMessage(error.service);
      break;
    case 'SERVICE_TIMEOUT':
      showTimeoutMessage(error.service);
      break;
    default:
      showGenericError(error.message);
  }
}

function handleNetworkError(error) {
  console.error('Network error:', error);
  showNetworkErrorMessage();
  // Implement retry logic
  setTimeout(fetchStatus, 5000);
}
```

#### Server-Side Error Handling

```typescript
// Relay Service error handling
export class RelayService {
  async checkService(service: ServiceConfig): Promise<ServiceStatus> {
    try {
      const response = await this.httpClient.get(service.healthEndpoint, {
        timeout: service.timeout || 5000
      });
      
      return this.parseServiceResponse(response.data);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return {
          health: false,
          error: 'SERVICE_UNAVAILABLE',
          message: `Service ${service.name} is not responding`
        };
      }
      
      if (error.code === 'ETIMEDOUT') {
        return {
          health: false,
          error: 'SERVICE_TIMEOUT',
          message: `Service ${service.name} request timed out`
        };
      }
      
      throw error;
    }
  }
}
```

## Extension and Customization

### Adding New Services

To add a new service to the monitoring system:

1. **Implement Required Endpoints** in your service:
   ```typescript
   // Add to your service routes
   app.get('/health', (req, res) => {
     res.json({
       status: 'healthy',
       timestamp: new Date().toISOString()
     });
   });

   app.get('/configured', (req, res) => {
     const configured = checkConfiguration();
     res.json({
       service: 'my-service',
       status: 'healthy',
       timestamp: new Date().toISOString(),
       configured: configured.overall,
       configuredGroups: configured.groups,
       ready: configured.overall
     });
   });

   app.get('/ready', (req, res) => {
     const ready = checkReadiness();
     res.status(ready ? 200 : 503).json({
       ready,
       timestamp: new Date().toISOString()
     });
   });
   ```

2. **Update Relay Service Configuration**:
   ```json
   {
     "services": {
       "my-service": {
         "name": "My Service",
         "healthEndpoint": "http://my-service:8085/health",
         "configuredEndpoint": "http://my-service:8085/configured",
         "readyEndpoint": "http://my-service:8085/ready",
         "timeout": 5000,
         "retries": 3
       }
     }
   }
   ```

3. **Restart Relay Service**:
   ```bash
   docker-compose restart relay-service
   ```

### Custom Configuration Groups

Define custom configuration groups for your service:

```typescript
interface MyServiceConfig {
  database: boolean;      // Database connection configured
  redis: boolean;         // Redis connection configured
  external_api: boolean;  // External API keys configured
  ssl: boolean;          // SSL certificates configured
}

function checkConfiguration(): { overall: boolean; groups: MyServiceConfig } {
  const groups: MyServiceConfig = {
    database: checkDatabaseConfig(),
    redis: checkRedisConfig(),
    external_api: checkExternalApiConfig(),
    ssl: checkSslConfig()
  };

  const overall = Object.values(groups).every(Boolean);

  return { overall, groups };
}
```

### Custom Status Page Themes

Customize the Status Page appearance:

```css
/* Add to mesh/nginx/html/status/custom.css */
:root {
  --primary-color: #your-brand-color;
  --success-color: #your-success-color;
  --warning-color: #your-warning-color;
  --error-color: #your-error-color;
}

.service-card {
  border: 2px solid var(--primary-color);
  border-radius: 12px;
}

.service-card.healthy {
  background: linear-gradient(135deg, var(--success-color), #ffffff);
}
```

### HTTP Polling Extensions

Add custom HTTP polling response types:

```typescript
// Server-side extension
interface CustomMessage {
  type: 'custom_alert';
  severity: 'info' | 'warning' | 'error';
  message: string;
  service?: string;
  timestamp: string;
}

// Client-side handling
function handleMessage(message) {
  switch (message.type) {
    case 'custom_alert':
      showAlert(message.severity, message.message);
      break;
    // ... existing cases
  }
}
```

### Bundle Integration

Add support for frontend bundles:

```typescript
// In your frontend bundle
export function getConfiguredGroups() {
  return {
    api_endpoint: !!process.env.VITE_API_ENDPOINT,
    auth_config: !!process.env.VITE_AUTH_CONFIG,
    feature_flags: checkFeatureFlags()
  };
}

// Register with Relay Service
const bundleConfig = {
  "admin-portal": {
    "name": "Admin Portal",
    "type": "bundle",
    "configFunction": "getConfiguredGroups"
  }
};
```

## Development Guidelines

### Code Style and Standards

**TypeScript Configuration**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

**ESLint Configuration**:
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Testing Guidelines

**Unit Testing Example**:
```typescript
// relay.service.test.ts
import { RelayService } from '../src/services/relay.service';

describe('RelayService', () => {
  let service: RelayService;

  beforeEach(() => {
    service = new RelayService();
  });

  it('should aggregate service status correctly', async () => {
    const mockServices = {
      'test-service': {
        name: 'Test Service',
        healthEndpoint: 'http://test:8080/health',
        configuredEndpoint: 'http://test:8080/configured',
        readyEndpoint: 'http://test:8080/ready'
      }
    };

    const result = await service.checkAllServices(mockServices);
    
    expect(result).toHaveProperty('services');
    expect(result).toHaveProperty('summary');
    expect(result.summary.totalServices).toBe(1);
  });
});
```

**Integration Testing**:
```typescript
// integration.test.ts
describe('Status Page Integration', () => {
  it('should display service status correctly', async () => {
    // Start test services
    await startTestServices();
    
    // Load status page
    const page = await browser.newPage();
    await page.goto('http://localhost/status');
    
    // Verify service cards are displayed
    const serviceCards = await page.$$('.service-card');
    expect(serviceCards).toHaveLength(3);
    
    // Verify HTTP polling connection
    const connectionStatus = await page.$('.connection-status');
    expect(await connectionStatus.textContent()).toContain('Connected');
  });
});
```

### Performance Considerations

**Caching Strategy**:
```typescript
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 30000; // 30 seconds

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}
```

**Connection Pooling**:
```typescript
import { Agent } from 'http';

const httpAgent = new Agent({
  keepAlive: true,
  maxSockets: 10,
  timeout: 5000
});

// Use with HTTP client
const client = axios.create({
  httpAgent,
  timeout: 5000
});
```

### Security Guidelines

**Input Validation**:
```typescript
import Joi from 'joi';

const configSchema = Joi.object({
  services: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      name: Joi.string().required(),
      healthEndpoint: Joi.string().uri().required(),
      configuredEndpoint: Joi.string().uri().required(),
      readyEndpoint: Joi.string().uri().required(),
      timeout: Joi.number().min(1000).max(30000).optional(),
      retries: Joi.number().min(1).max(10).optional()
    })
  ).required()
});

function validateConfig(config: any): boolean {
  const { error } = configSchema.validate(config);
  if (error) {
    throw new Error(`Invalid configuration: ${error.message}`);
  }
  return true;
}
```

**CORS Configuration**:
```typescript
import cors from 'cors';

const corsOptions = {
  origin: process.env.RELAY_CORS_ORIGIN?.split(',') || ['http://localhost'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
};

app.use(cors(corsOptions));
```

This technical reference provides comprehensive documentation for developers working with the GameHub Status and Setup Pages system. Use this reference for implementation details, API integration, and system extension.