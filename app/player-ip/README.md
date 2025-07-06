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

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Runtime environment |
| `SERVER_PORT` | `8082` | HTTP server port |
| `JWT_SECRET` | `development-secret-key` | JWT signing secret |
| `JWT_EXPIRES_IN` | `1h` | Access token expiration |
| `JWT_ISSUER` | `player-ip` | JWT issuer claim |
| `JWT_AUDIENCE` | `gamehub-players` | JWT audience claim |
| `JWT_KEY_ID` | `player-ip-key` | JWT key identifier |
| `CORS_ORIGIN` | `*` | CORS allowed origins |
| `LOG_LEVEL` | `info` | Logging level |
| `SQLITE_DB_PATH` | `./data/player-ip.db` | SQLite database path |
| `REFRESH_TOKEN_EXPIRES_IN` | `14d` | Refresh token expiration |
| `ROTATE_REFRESH_TOKENS` | `false` | Enable refresh token rotation |
| `SERVICE_IP_URL` | `http://localhost:8083` | Service IP endpoint |
| `SERVICE_IP_CLIENT_ID` | `player-ip` | Client ID for service-ip |
| `SERVICE_IP_CLIENT_SECRET_FILE` | - | Path to client secret file |

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

### Health Check
- `GET /health` - Service health status

### OAuth 2.0 Endpoints
- `GET /` - Service information
- `GET /authorize` - Authorization endpoint
- `POST /token` - Token endpoint
- `POST /revoke` - Token revocation
- `GET /userinfo` - User information

### Management
- `POST /logout` - User logout
- `GET /profile` - User profile

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
- **Container**: Built-in Docker health check
- **Kubernetes**: Readiness and liveness probes supported
- **Load Balancer**: `/health` endpoint returns 200 OK

### Logging
- **Level**: Configurable via `LOG_LEVEL`
- **Format**: Structured JSON in production
- **Destinations**: stdout/stderr for container logging

### Metrics
- **Health**: Service availability
- **Performance**: Response times
- **Security**: Authentication events

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

### Common Issues
1. **Port conflicts**: Ensure port 8082 is available
2. **Database permissions**: Check SQLite file permissions
3. **Service discovery**: Verify service-ip connectivity
4. **JWT validation**: Check secret key consistency

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=debug
npm run dev
```

### Container Logs
```bash
# View logs
docker compose logs player-ip

# Follow logs
docker compose logs -f player-ip
```

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Ensure Docker builds succeed
5. Test mesh integration

## License

MIT License - see LICENSE file for details.