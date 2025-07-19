# GameHub Player Identity Provider

A complete OAuth 2.0 identity provider for GameHub players, built with Express.js, TypeScript, and SQLite for data storage.

## Overview

The Player Identity Provider (player-ip) is a web service that provides OAuth 2.0 authentication and authorization for GameHub players. It integrates with the GameHub mesh infrastructure and communicates with service-ip for service-to-service authentication.

## Features

- **OAuth 2.0 Authorization Server**: Complete implementation supporting Authorization Code flow
- **JWT Token Management**: Secure token generation and validation
- **Refresh Token Support**: Long-lived refresh tokens with optional rotation
- **SQLite Database**: Persistent storage for users, sessions, and tokens
- **Docker Support**: Containerized deployment with health checks
- **Service Discovery**: Integration with service-ip for inter-service communication

## Architecture Integration

### Service Mesh

- **Port**: 8082 (configurable via `SERVER_PORT`)
- **Network**: `gamehub-network` Docker network
- **Dependencies**: service-ip for client credentials authentication
- **Health Check**: `/health` endpoint for container orchestration

### Database

- **Type**: SQLite
- **Location**: `/app/data/player-ip.db` (in container)
- **Persistence**: Docker volume `gamehub-player-ip-data`

### Security

- **JWT Signing**: Configurable secret key
- **CORS**: Configurable origins
- **Client Secrets**: File-based secret management
- **Non-root User**: Runs as `player-ip` user in container

## Configuration

### Environment Variables

| Variable                        | Default                  | Description                   |
| ------------------------------- | ------------------------ | ----------------------------- |
| `NODE_ENV`                      | `development`            | Runtime environment           |
| `SERVER_PORT`                   | `8082`                   | HTTP server port              |
| `JWT_SECRET`                    | `development-secret-key` | JWT signing secret            |
| `JWT_EXPIRES_IN`                | `1h`                     | Access token expiration       |
| `JWT_ISSUER`                    | `player-ip`              | JWT issuer claim              |
| `JWT_AUDIENCE`                  | `gamehub-players`        | JWT audience claim            |
| `JWT_KEY_ID`                    | `player-ip-key`          | JWT key identifier            |
| `CORS_ORIGIN`                   | `*`                      | CORS allowed origins          |
| `LOG_LEVEL`                     | `info`                   | Logging level                 |
| `SQLITE_DB_PATH`                | `./data/player-ip.db`    | SQLite database path          |
| `REFRESH_TOKEN_EXPIRES_IN`      | `14d`                    | Refresh token expiration      |
| `ROTATE_REFRESH_TOKENS`         | `false`                  | Enable refresh token rotation |
| `SERVICE_IP_URL`                | `http://localhost:8083`  | Service IP endpoint           |
| `SERVICE_IP_CLIENT_ID`          | `player-ip`              | Client ID for service-ip      |
| `SERVICE_IP_CLIENT_SECRET_FILE` | -                        | Path to client secret file    |

### Configuration Files

- **`.env`**: Environment variables (create from `.env.example`)
- **`secrets/player-ip-client-secret`**: Client secret for service-ip authentication
- **`secrets/service-ip/clients/player-ip.json`**: Client registration in service-ip

## Development

### Prerequisites

- Node.js 18+
- npm 9+
- TypeScript 5+

### Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run dev

# Start production server
npm start
```

### Monorepo Commands

```bash
# From app/ directory
npm run dev:player-ip          # Development mode
npm run build:player-ip        # Build only
npm run start:player-ip        # Production mode
```

## Docker Deployment

### Standalone

```bash
# Build image
docker build -t gamehub-player-ip .

# Run container
docker run -p 8082:8082 \
  -e JWT_SECRET=your-secret \
  -v player-ip-data:/app/data \
  gamehub-player-ip
```

### Mesh Deployment

```bash
# Deploy entire mesh
./scripts/deploy-mesh.sh

# Build player-ip only
./scripts/build-player-ip.sh
```

## API Endpoints

### Health Check Endpoints

#### General Health Check

- `GET /health` - Comprehensive service health status including subscription monitoring

**Response Format:**

```json
{
  "status": "ok",
  "timestamp": "2025-07-15T02:36:20.625Z",
  "services": {
    "http": "healthy",
    "subscription": {
      "status": "connected|connecting|retrying|failed|disconnected",
      "healthy": true|false,
      "degraded": true|false
    }
  }
}
```

**Response Codes:**

- `200 OK` - Service is operational (HTTP server is healthy)
- Note: Returns 200 even if subscription is degraded, as HTTP functionality remains available

#### Subscription Health Check

- `GET /health/subscription` - Detailed subscription status and diagnostics

**Response Format:**

```json
{
  "status": "connected|connecting|retrying|failed|disconnected",
  "healthy": true|false,
  "retryCount": 0,
  "lastError": "Error message if applicable",
  "lastRetryAt": "2025-07-15T02:36:01.836Z",
  "connectedAt": "2025-07-15T02:35:45.123Z",
  "timestamp": "2025-07-15T02:36:27.823Z"
}
```

**Response Codes:**

- `200 OK` - Subscription is healthy and connected
- `503 Service Unavailable` - Subscription is unhealthy (connecting, retrying, or failed)

**Subscription States:**

- `connected` - Subscription is active and functioning normally
- `connecting` - Initial connection attempt in progress
- `retrying` - Temporary failure, automatic retry in progress
- `failed` - Permanent failure after exhausting retry attempts
- `disconnected` - Subscription is not active

### Service Information

- `GET /` - Service information
- `GET /public-key` - Service public key for service principal creation

### OAuth 2.0 Endpoints

- `GET /authorize` - Authorization endpoint
- `POST /token` - Token endpoint
- `POST /revoke` - Token revocation
- `GET /userinfo` - User information

### Management

- `POST /logout` - User logout
- `GET /profile` - User profile

## Error Handling and Service Resilience

### Robust Error Handling Strategy

The Player-IP service implements a comprehensive error handling strategy designed to maintain service availability even when external dependencies fail. The service operates under the principle of **graceful degradation** - core HTTP functionality remains available even if the Jinaga subscription fails.

#### Service Continuation Behavior

1. **HTTP Server Priority**: The HTTP server starts and remains operational regardless of subscription status
2. **Non-Fatal Subscription Errors**: Subscription failures do not terminate the service
3. **Automatic Retry Logic**: Transient subscription errors trigger automatic retry with exponential backoff
4. **Degraded Mode Operation**: Service continues to serve authentication requests even without real-time synchronization

#### Error Categories and Handling

**Transient Errors (Automatically Retried):**

- Network connectivity issues (`ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND`)
- Temporary service unavailability (`503 Service Unavailable`, `502 Bad Gateway`)
- Socket and connection errors
- Fetch failures and timeouts

**Permanent Errors (No Retry):**

- Authentication failures
- Configuration errors
- Invalid credentials
- Malformed requests

#### Retry Configuration

```typescript
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2, // Exponential backoff
};
```

**Retry Schedule:**

- Attempt 1: Immediate
- Attempt 2: 1 second delay
- Attempt 3: 2 second delay
- Attempt 4: 4 second delay
- After 3 failed retries: Permanent failure state

#### Global Error Handlers

The service implements robust global error handlers that prevent service termination:

```typescript
// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    // Log error details
    // Check if subscription-related
    // Continue service operation
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
    // Log error details
    // Exit only for non-subscription critical errors
    // Continue for subscription-related errors
});
```

#### Service States and Behavior

| State                 | HTTP Endpoints | Subscription       | Behavior                                 |
| --------------------- | -------------- | ------------------ | ---------------------------------------- |
| **Fully Operational** | ✅ Available   | ✅ Connected       | All features functional                  |
| **Degraded Mode**     | ✅ Available   | ❌ Failed/Retrying | Authentication works, no real-time sync  |
| **Startup**           | ✅ Available   | 🔄 Connecting      | Service ready, subscription initializing |

## Service Integration

### With service-ip

Player-ip authenticates with service-ip using client credentials flow:

```typescript
import { getServiceToken } from './utils/service-client';

// Get service token for inter-service communication
const token = await getServiceToken();
```

## Monitoring

### Health Checks

The service provides comprehensive health monitoring through the health endpoint:

#### Container Health Checks

- **Docker**: Built-in health check using `/health` endpoint
- **Kubernetes**: Readiness and liveness probes supported
- **Load Balancer**: `/health` endpoint always returns 200 OK for HTTP availability

#### Health Monitoring Strategy

```bash
# Basic service availability
curl -f http://localhost:8082/health

# Automated monitoring script
node scripts/health-check.js --url=http://localhost:8082
```

#### Health Check Integration

```javascript
// Example monitoring integration
const healthResponse = await fetch('/health');
const health = await healthResponse.json();

if (health.status === 'ok') {
    // Service is healthy
}
```

### Logging

#### Log Levels and Configuration

- **Level**: Configurable via `LOG_LEVEL` (debug, info, warn, error)
- **Format**: Structured JSON in production, readable format in development
- **Destinations**: stdout/stderr for container logging systems

#### Error Logging Categories

- **HTTP Errors**: Request processing and authentication failures
- **System Errors**: Unhandled exceptions and critical failures

### Metrics and Monitoring

#### Service Metrics

- **HTTP Availability**: Always available (200 OK from `/health`)
- **Response Times**: Tracked for performance monitoring
- **Error Rates**: Authentication and system error tracking

#### Performance Metrics

- **Health Check Response**: < 100ms average
- **Token Generation**: < 50ms average
- **Database Operations**: < 20ms average
- **Memory Usage**: Monitored for leak detection

## Security Considerations

### Production Deployment

1. **Change default secrets**: Update `JWT_SECRET` and client secrets
2. **Restrict CORS**: Set specific origins instead of `*`
3. **Use HTTPS**: Configure reverse proxy with TLS
4. **Monitor logs**: Watch for authentication failures
5. **Rotate secrets**: Implement secret rotation strategy

### Client Secret Management

- Store secrets in secure files outside the container
- Use Docker secrets or Kubernetes secrets in orchestrated environments
- Never commit secrets to version control

## Troubleshooting

### Health Check Diagnostics

#### Basic Health Check Issues

```bash
# Test basic service availability
curl -v http://localhost:8082/health

# Expected response (service operational):
# HTTP/1.1 200 OK
# {"status":"ok","timestamp":"...","services":{"http":"healthy"}}
```

### Common Issues

#### Authentication Errors

```bash
# Check JWT configuration
echo $JWT_SECRET
echo $JWT_ISSUER
echo $JWT_AUDIENCE

# Test authentication endpoint
curl -v "http://localhost:8082/authenticate?client_id=test&redirect_uri=http://localhost/callback&response_type=code&scope=openid&code_challenge=test&code_challenge_method=S256"
```

#### Database Issues

```bash
# Check database file permissions
ls -la /app/data/player-ip.db

# Test database connectivity
node -e "const db = require('better-sqlite3')('/app/data/player-ip.db'); console.log('Database connected');"
```

#### Service Communication Issues

```bash
# Check service-ip connectivity
curl http://service-ip:8083/health

# Verify client credentials
ls -la secrets/player-ip-client-secret

# Test service-ip authentication
curl -X POST http://service-ip:8083/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=player-ip"
```
