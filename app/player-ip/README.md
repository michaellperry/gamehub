# GameHub Player Identity Provider

A complete OAuth 2.0 identity provider for GameHub players, built with Express.js, TypeScript, and Jinaga for real-time synchronization.

## Overview

The Player Identity Provider (player-ip) is a web service that provides OAuth 2.0 authentication and authorization for GameHub players. It integrates with the GameHub mesh infrastructure and communicates with service-ip for service-to-service authentication.

## Features

- **OAuth 2.0 Authorization Server**: Complete implementation supporting Authorization Code flow
- **JWT Token Management**: Secure token generation and validation
- **Refresh Token Support**: Long-lived refresh tokens with optional rotation
- **Real-time Synchronization**: Jinaga integration for distributed state management
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

### With GameHub Model

Integrates with the shared GameHub model for data synchronization:

```typescript
import { startSubscription } from './gap';

// Start Jinaga subscription for real-time updates
const stopSubscription = await startSubscription();
```

## Monitoring

### Health Checks

The service provides comprehensive health monitoring through multiple endpoints:

#### Container Health Checks

- **Docker**: Built-in health check using `/health` endpoint
- **Kubernetes**: Readiness and liveness probes supported
- **Load Balancer**: `/health` endpoint always returns 200 OK for HTTP availability

#### Health Monitoring Strategy

```bash
# Basic service availability
curl -f http://localhost:8082/health

# Detailed subscription diagnostics
curl -f http://localhost:8082/health/subscription

# Automated monitoring script
node scripts/health-check.js --url=http://localhost:8082
```

#### Health Check Integration

```javascript
// Example monitoring integration
const healthResponse = await fetch('/health');
const health = await healthResponse.json();

if (health.services.subscription.degraded) {
    // Alert: Service running in degraded mode
    // HTTP functionality available, subscription unavailable
}
```

### Logging

#### Log Levels and Configuration

- **Level**: Configurable via `LOG_LEVEL` (debug, info, warn, error)
- **Format**: Structured JSON in production, readable format in development
- **Destinations**: stdout/stderr for container logging systems

#### Subscription-Specific Logging

The service provides detailed logging for subscription lifecycle events:

```
=== SUBSCRIPTION ATTEMPT ===
=== SUBSCRIPTION ATTEMPT SUCCESSFUL ===
=== SUBSCRIPTION ATTEMPT ERROR ===
=== SCHEDULING RETRY 1/3 ===
=== SUBSCRIPTION PERMANENTLY FAILED ===
=== SUBSCRIPTION STATUS UPDATE ===
```

#### Error Logging Categories

- **Subscription Errors**: Connection, authentication, and retry events
- **HTTP Errors**: Request processing and authentication failures
- **System Errors**: Unhandled exceptions and critical failures

### Metrics and Monitoring

#### Service Metrics

- **HTTP Availability**: Always available (200 OK from `/health`)
- **Subscription Health**: Available via `/health/subscription`
- **Response Times**: Tracked for performance monitoring
- **Error Rates**: Authentication and system error tracking

#### Subscription Metrics

- **Connection State**: Real-time subscription status
- **Retry Count**: Number of connection retry attempts
- **Error Frequency**: Rate of subscription failures
- **Recovery Time**: Time to restore subscription after failure

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
# {"status":"ok","timestamp":"...","services":{"http":"healthy","subscription":{...}}}
```

#### Subscription Health Issues

```bash
# Check detailed subscription status
curl -v http://localhost:8082/health/subscription

# Healthy subscription (HTTP 200):
# {"status":"connected","healthy":true,"retryCount":0,...}

# Unhealthy subscription (HTTP 503):
# {"status":"failed","healthy":false,"retryCount":3,"lastError":"..."}
```

### Subscription Troubleshooting

#### Subscription States and Solutions

**1. `connecting` State**

- **Symptom**: Service shows "connecting" for extended periods
- **Diagnosis**: Initial connection attempt in progress
- **Solution**: Wait for connection or check network connectivity

```bash
# Check if service-ip is accessible
curl http://service-ip:8083/health
# Verify TENANT_PUBLIC_KEY environment variable
echo $TENANT_PUBLIC_KEY
```

**2. `retrying` State**

- **Symptom**: Service shows "retrying" with increasing retry count
- **Diagnosis**: Transient network or service issues
- **Solution**: Monitor for automatic recovery or investigate network issues

```bash
# Check retry details
curl http://localhost:8082/health/subscription | jq '.retryCount, .lastError, .lastRetryAt'
# Monitor service logs for retry attempts
docker compose logs -f player-ip | grep "RETRY"
```

**3. `failed` State**

- **Symptom**: Service shows "failed" after exhausting retries
- **Diagnosis**: Permanent failure (authentication, configuration, or persistent network issues)
- **Solutions**:
    - Verify `TENANT_PUBLIC_KEY` format and validity
    - Check service-ip connectivity and authentication
    - Review service logs for specific error details

```bash
# Check tenant public key format
echo $TENANT_PUBLIC_KEY | head -1
# Should start with: -----BEGIN PUBLIC KEY-----

# Test service-ip authentication
curl -X POST http://service-ip:8083/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=player-ip"
```

**4. `disconnected` State**

- **Symptom**: Service shows "disconnected"
- **Diagnosis**: Subscription not started or stopped
- **Solution**: Check service startup logs and environment configuration

#### Common Subscription Errors

**"Failed to get service token"**

```bash
# Check service-ip connectivity
curl http://service-ip:8083/health
# Verify client credentials
ls -la secrets/player-ip-client-secret
# Check service-ip client configuration
cat secrets/service-ip/clients/player-ip.json
```

**"TENANT_PUBLIC_KEY environment variable"**

```bash
# Verify environment variable is set and properly formatted
echo "$TENANT_PUBLIC_KEY" | openssl rsa -pubin -text -noout
# Should display RSA public key details without errors
```

**Network connectivity errors (ECONNREFUSED, ETIMEDOUT)**

```bash
# Test network connectivity to dependencies
ping service-ip
telnet service-ip 8083
# Check Docker network configuration
docker network ls | grep gamehub
docker network inspect gamehub-network
```

### Service Degradation Handling

#### Understanding Degraded Mode

When subscription fails, the service continues operating in **degraded mode**:

- ✅ HTTP endpoints remain functional
- ✅ Authentication and authorization work normally
- ✅ Health checks return appropriate status
- ❌ Real-time synchronization unavailable
- ❌ New game access paths won't be automatically configured

#### Monitoring Degraded Mode

```bash
# Check if service is in degraded mode
curl http://localhost:8082/health | jq '.services.subscription.degraded'

# Monitor for recovery
watch -n 5 'curl -s http://localhost:8082/health/subscription | jq ".status, .healthy"'
```

### Common Issues and Solutions

#### 1. Port Conflicts

```bash
# Check if port 8082 is in use
lsof -i :8082
netstat -tulpn | grep 8082
# Kill conflicting process or change SERVER_PORT
```

#### 2. Database Issues

```bash
# Check SQLite database permissions
ls -la data/player-ip.db
# Test database connectivity
sqlite3 data/player-ip.db ".tables"
# Reset database if corrupted
rm data/player-ip.db && npm run migrate
```

#### 3. Service Discovery Issues

```bash
# Verify service-ip connectivity
curl http://service-ip:8083/health
# Check Docker network connectivity
docker exec player-ip ping service-ip
# Verify DNS resolution
docker exec player-ip nslookup service-ip
```

#### 4. JWT Validation Issues

```bash
# Check JWT secret consistency
echo $JWT_SECRET
# Verify JWT configuration
curl http://localhost:8082/public-key
# Test token generation
curl -X POST http://localhost:8082/token -d "grant_type=client_credentials"
```

### Debug Mode and Logging

#### Enable Debug Logging

```bash
# Development environment
export LOG_LEVEL=debug
npm run dev

# Docker environment
docker compose up player-ip -e LOG_LEVEL=debug

# Production debugging (temporary)
docker exec -it player-ip sh -c 'LOG_LEVEL=debug npm start'
```

#### Log Analysis

```bash
# View all logs
docker compose logs player-ip

# Follow logs in real-time
docker compose logs -f player-ip

# Filter subscription-related logs
docker compose logs player-ip | grep "SUBSCRIPTION"

# Filter error logs
docker compose logs player-ip | grep "ERROR\|FAILED"

# Monitor health check requests
docker compose logs -f player-ip | grep "GET /health"
```

#### Structured Log Analysis

```bash
# Extract subscription status changes
docker compose logs player-ip | grep "SUBSCRIPTION STATUS UPDATE" -A 5

# Monitor retry attempts
docker compose logs player-ip | grep "SCHEDULING RETRY" -A 3

# Check error patterns
docker compose logs player-ip | grep "lastError" | sort | uniq -c
```

### Performance Troubleshooting

#### Health Check Performance

```bash
# Measure health check response time
time curl http://localhost:8082/health

# Load test health endpoints
for i in {1..100}; do
  curl -w "%{time_total}\n" -o /dev/null -s http://localhost:8082/health
done | sort -n
```

#### Memory and Resource Usage

```bash
# Monitor container resource usage
docker stats player-ip

# Check memory usage patterns
docker exec player-ip ps aux | grep node

# Monitor for memory leaks during subscription retries
watch -n 5 'docker stats player-ip --no-stream | grep player-ip'
```

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Ensure Docker builds succeed
5. Test mesh integration

## License

MIT License - see LICENSE file for details.
