# GameHub Mesh Deployment

This directory contains the Docker Compose configuration and deployment scripts for the GameHub mesh services, including the service-ip identity provider.

## Quick Start

1. **Setup Environment**:
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your production values
   nano .env
   ```

2. **Deploy Services**:
   ```bash
   # From project root
   ./scripts/deploy-mesh.sh
   ```

3. **Verify Deployment**:
   ```bash
   # Check service health
   curl http://localhost:8083/health  # service-ip
   curl http://localhost:8082/health  # player-ip
   curl http://localhost:8081/health  # content-store
   ```

## Services

### service-ip
- **Port**: 8083
- **Purpose**: OAuth 2.0 Client Credentials identity provider for service-to-service authentication
- **Health Check**: `http://localhost:8083/health`
- **Token Endpoint**: `http://localhost:8083/token`

### player-ip
- **Port**: 8082
- **Purpose**: Player identity provider with OAuth 2.0 and JWT authentication
- **Health Check**: `http://localhost:8082/health`
- **Database**: SQLite for local storage

### content-store
- **Port**: 8081
- **Purpose**: Content storage service for file uploads and retrieval with JWT authentication
- **Health Check**: `http://localhost:8081/health`
- **Upload Endpoint**: `http://localhost:8081/upload` (requires authentication)
- **Content Retrieval**: `http://localhost:8081/content/{hash}` (public access)
- **Storage**: Persistent volume for file storage
- **Authentication**: Accepts JWT tokens from both service-ip and player-ip

## Configuration

### Environment Variables

The following environment variables can be configured in `.env`:

#### Service IP Configuration
- `JWT_SECRET`: Secret key for JWT signing (change in production!)
- `JWT_EXPIRES_IN`: Token expiration time (default: 1h)
- `JWT_ISSUER`: JWT issuer claim (default: service-ip)
- `JWT_AUDIENCE`: JWT audience claim (default: service-clients)
- `JWT_KEY_ID`: JWT key ID claim (default: service-ip-key)
- `CORS_ORIGIN`: CORS origin configuration (default: *)
- `LOG_LEVEL`: Logging level (default: info)

#### Player IP Configuration
- `PLAYER_JWT_SECRET`: Secret key for player JWT signing (change in production!)
- `PLAYER_JWT_EXPIRES_IN`: Player token expiration time (default: 1h)
- `PLAYER_JWT_ISSUER`: Player JWT issuer claim (default: player-ip)
- `PLAYER_JWT_AUDIENCE`: Player JWT audience claim (default: gamehub-players)
- `PLAYER_JWT_KEY_ID`: Player JWT key ID claim (default: player-ip-key)
- `PLAYER_CORS_ORIGIN`: Player service CORS origin configuration (default: *)
- `REFRESH_TOKEN_EXPIRES_IN`: Refresh token expiration time (default: 14d)
- `ROTATE_REFRESH_TOKENS`: Whether to rotate refresh tokens (default: false)

#### Content Store Configuration
- `CONTENT_STORE_CORS_ORIGIN`: Content store CORS origin configuration (default: *)

### Secrets Management

Service credentials and authentication configurations are stored in the `secrets/` directory:

```
mesh/
├── secrets/
│   ├── service-ip/
│   │   └── clients/
│   │       └── [client-files]
│   ├── player-ip/
│   │   └── [player-secrets]
│   ├── content-store/
│   │   ├── service-ip.provider
│   │   └── player-ip.provider
│   └── shared/
│       └── [shared-secrets]
```

#### Service IP Clients
Each client file has the name of the client ID and contains the client secret in plain text.

#### Content Store Authentication
The content-store service uses JWT provider configuration files:
- `service-ip.provider`: Configuration for accepting service-ip JWT tokens
- `player-ip.provider`: Configuration for accepting player-ip JWT tokens

Each provider file contains JWT validation parameters including issuer, audience, key ID, and signing key.

All secret directories should be mounted as read-only volumes in Docker containers.

## Docker Compose Commands

### Basic Operations
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f service-ip
docker-compose logs -f player-ip
docker-compose logs -f content-store

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build -d
```

### Development
```bash
# Build without cache
docker-compose build --no-cache

# Scale services (if needed)
docker-compose up -d --scale service-ip=2

# Execute commands in container
docker-compose exec service-ip sh
```

## Health Monitoring

### Health Checks
All services include health checks that can be monitored:

```bash
# Check service status
docker-compose ps

# Check health status
curl http://localhost:8083/health  # service-ip
curl http://localhost:8082/health  # player-ip
curl http://localhost:8081/health  # content-store
```

### Logs
```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for specific service
docker-compose logs service-ip

# View last N lines
docker-compose logs --tail=50 service-ip
```

## Testing

### Service Verification
```bash
# Check service health
curl http://localhost:8083/health

# Check service status
docker-compose ps service-ip
```

### Manual Testing

1. **Health Checks**:
   ```bash
   curl http://localhost:8083/health  # service-ip
   curl http://localhost:8082/health  # player-ip
   curl http://localhost:8081/health  # content-store
   ```

2. **Get Access Token (Service-to-Service)**:
   ```bash
   curl -X POST http://localhost:8083/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&client_id=your-client-id&client_secret=your-client-secret"
   ```

3. **Test Content Store Upload** (requires JWT token):
   ```bash
   # First get a token from service-ip or player-ip
   TOKEN="your-jwt-token-here"
   
   # Upload a file
   curl -X POST http://localhost:8081/upload \
     -H "Authorization: Bearer $TOKEN" \
     -F "file=@/path/to/your/file.jpg"
   ```

4. **Test Content Retrieval** (public access):
   ```bash
   # Use the hash returned from upload
   curl http://localhost:8081/content/your-content-hash
   ```

5. **Test Invalid Credentials**:
   ```bash
   curl -X POST http://localhost:8083/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&client_id=invalid&client_secret=invalid"
   ```

## Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Check what's using the ports
   lsof -i :8083  # service-ip
   lsof -i :8082  # player-ip
   lsof -i :8081  # content-store
   
   # Kill the process or change the port in docker-compose.yml
   ```

2. **Permission Denied on Secrets**:
   ```bash
   # Check file permissions
   ls -la secrets/service-ip/clients/
   
   # Fix permissions if needed
   chmod 644 secrets/service-ip/clients/*.json
   ```

3. **Container Won't Start**:
   ```bash
   # Check logs for errors
   docker-compose logs service-ip
   
   # Check container status
   docker-compose ps
   
   # Rebuild container
   docker-compose build --no-cache service-ip
   ```

4. **Health Check Failing**:
   ```bash
   # Check if service is responding
   curl -v http://localhost:8083/health
   
   # Check container logs
   docker-compose logs service-ip
   
   # Check container resource usage
   docker stats
   ```

### Debug Mode

To run services in debug mode:

1. Update `docker-compose.yml` to add debug environment:
   ```yaml
   environment:
     - LOG_LEVEL=debug
     - NODE_ENV=development
   ```

2. Restart services:
   ```bash
   docker-compose up -d
   ```

## Security Considerations

### Production Deployment

1. **Change Default Secrets**:
   - Update `JWT_SECRET` to a strong, unique value
   - Use secure client credentials
   - Rotate secrets regularly

2. **Network Security**:
   - Use internal networks for service communication
   - Expose only necessary ports
   - Configure proper CORS origins

3. **Container Security**:
   - Services run as non-root users
   - Use read-only volume mounts for secrets
   - Regular security updates

### Monitoring

Consider adding monitoring and alerting:
- Health check endpoints
- Log aggregation
- Metrics collection
- Security scanning

## Integration with Other Services

The service-ip is designed to integrate with other GameHub services:

1. **Service Discovery**: Uses Docker network for service communication
2. **Shared Secrets**: Mounts shared secrets directory
3. **Network**: Connects to `gamehub-network` for inter-service communication

To add new services to the mesh:

1. Add service definition to `docker-compose.yml`
2. Connect to `gamehub-network`
3. Mount necessary secrets
4. Update environment configuration
5. Add health checks and monitoring

## Support

For issues and questions:
1. Check the logs: `docker-compose logs`
2. Review this documentation
3. Check the main project README
4. Review the service source code:
   - Service IP: `../app/service-ip/`
   - Player IP: `../app/player-ip/`
   - Content Store: `../app/content-store/`