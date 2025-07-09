# GameHub Relay Service

The Relay Service is a centralized observability aggregation service that monitors the health, configuration, and readiness status of all GameHub services. It provides a unified API for status information and supports real-time updates via WebSocket connections.

## Overview

- **Port**: 8084 (internal), accessible via `/relay` through NGINX
- **Purpose**: Aggregate observability data from all GameHub services
- **Technology**: Node.js with TypeScript, Express.js, WebSocket support

## Features

- **Configuration-driven service discovery** using JSON configuration
- **Parallel health checks** to all configured services
- **Unified response format** combining all service statuses
- **Error handling** for unreachable services
- **Caching** to prevent overwhelming backend services (30-second default)
- **WebSocket support** for real-time status updates
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
Force refresh of cached status (clears cache and broadcasts update to WebSocket clients).

### GET /relay/cache/stats
Get cache statistics for debugging purposes.

### WebSocket /relay/ws
Real-time updates for status changes.

**Message Format:**
```json
{
  "type": "status_update",
  "data": { /* full status object */ },
  "timestamp": "2025-01-09T15:30:15.123Z"
}
```

## Configuration

The service is configured via environment variables:

### Environment Variables

- `SERVER_PORT`: Port to run the service on (default: 8084)
- `NODE_ENV`: Environment mode (development/production)
- `LOG_LEVEL`: Logging level (debug/info/warn/error)
- `CORS_ORIGIN`: CORS origin configuration (default: *)
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
  },
  "polling": {
    "interval": 10000,
    "timeout": 30000
  }
}
```

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
2. **NGINX**: Accessible via `/relay` route with WebSocket support
3. **Status Page**: Provides data for the real-time dashboard
4. **Setup Page**: Provides status information during setup process

## Error Handling

- **Service Timeouts**: 5-second timeout per service with exponential backoff retry
- **Network Errors**: Graceful handling of unreachable services
- **Cache Failures**: Automatic fallback to direct service calls
- **WebSocket Errors**: Automatic cleanup of failed connections

## Monitoring

The service provides comprehensive logging and metrics:

- Request/response logging with timing
- Cache hit/miss statistics
- WebSocket connection tracking
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
- **Memory Management**: Automatic cleanup of stale connections