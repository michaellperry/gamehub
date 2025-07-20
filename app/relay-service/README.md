# GameHub Relay Service

The Relay Service is a centralized observability aggregation service that monitors the health, configuration, and readiness status of all GameHub services. It provides a unified HTTP API for status information.

## Overview

- **Port**: 8084 (internal), accessible via `/relay` through NGINX
- **Purpose**: Aggregate observability data from all GameHub services
- **Technology**: Node.js with TypeScript, Express.js

## Features

- **Configuration-driven service discovery** using JSON configuration
- **Parallel health checks** to all configured services
- **Unified response format** combining all service statuses
- **Public key aggregation** from services with public key endpoints
- **Error handling** for unreachable services
- **Caching** to prevent overwhelming backend services (30-second default)
- **Admin Portal integration** for frontend bundle status

## API Endpoints

### GET /relay

Returns the current status of all configured services.

**Response Format:**

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
            "responseTime": 45
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

### GET /relay/health

Health check endpoint for the relay service itself.

### POST /relay/refresh

Force refresh of cached status (clears cache).

### GET /relay/cache/stats

Get cache statistics for debugging purposes.

### GET /public-key

Returns aggregated public keys from all configured services that have public key endpoints.

**Response Format:**

```json
{
    "timestamp": "2025-01-15T12:30:15.123Z",
    "services": {
        "backend-service": {
            "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890abcdef...\n-----END PUBLIC KEY-----",
            "lastChecked": "2025-01-15T12:30:14.890Z",
            "responseTime": 45
        }
    }
}
```

### POST /public-key/refresh

Force refresh of cached public keys (clears public key cache).

### GET /public-key/cache/stats

Get public key cache statistics for debugging purposes.

## Configuration

The service is configured via environment variables:

### Environment Variables

- `SERVER_PORT`: Port to run the service on (default: 8084)
- `NODE_ENV`: Environment mode (development/production)
- `LOG_LEVEL`: Logging level (debug/info/warn/error)
- `CORS_ORIGIN`: CORS origin configuration (default: \*)
- `CACHE_TIMEOUT`: Cache timeout in milliseconds (default: 30000)
- `RELAY_CONFIG`: JSON configuration for services to monitor

### RELAY_CONFIG Format

```json
{
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
    }
}
```

#### Service Configuration Fields

- `name`: Display name for the service
- `healthEndpoint`: URL for health check endpoint
- `configuredEndpoint`: URL for configuration status endpoint
- `readyEndpoint`: URL for readiness check endpoint
- `publicKeyEndpoint`: (Optional) URL for public key endpoint - services without this field are ignored for public key aggregation
- `timeout`: Request timeout in milliseconds
- `retries`: Number of retry attempts for failed requests

**Note**: The `publicKeyEndpoint` field is optional and provides backward compatibility. Services without this field will not be included in public key aggregation but will continue to work normally for health, configuration, and readiness checks.

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Docker Deployment

The service is containerized and deployed as part of the GameHub mesh:

```bash
# Build and run with docker-compose
cd mesh
docker-compose up relay-service
```

## Integration

The Relay Service integrates with:

1. **All GameHub Services**: Monitors their `/health`, `/configured`, and `/ready` endpoints
2. **Services with Public Keys**: Aggregates public keys from services that provide `/public-key` endpoints
3. **NGINX**: Accessible via `/relay` and `/public-key` routes
4. **Status Page**: Provides data for the dashboard
5. **Setup Page**: Provides status information during setup process
6. **Authentication Systems**: Provides aggregated public keys for JWT verification and service-to-service authentication

## Error Handling

- **Service Timeouts**: 5-second timeout per service with exponential backoff retry
- **Network Errors**: Graceful handling of unreachable services
- **Cache Failures**: Automatic fallback to direct service calls

## Monitoring

The service provides comprehensive logging and metrics:

- Request/response logging with timing
- Cache hit/miss statistics
- Service health check results
- Error tracking and reporting

## Security

- **CORS Configuration**: Configurable origin restrictions
- **Helmet Security**: Security headers and protections
- **Input Validation**: Proper validation of configuration and requests
- **Error Sanitization**: Safe error messages in production

## Performance

- **Parallel Processing**: All service checks run in parallel
- **Response Caching**: 30-second cache to reduce backend load
- **Connection Pooling**: Efficient HTTP client configuration
- **Memory Management**: Efficient resource utilization
