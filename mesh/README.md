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

3. **Test Deployment**:
   ```bash
   # Test service-ip functionality
   ./scripts/test-service-ip.sh
   ```

## Services

### service-ip
- **Port**: 8083
- **Purpose**: OAuth 2.0 Client Credentials identity provider for service-to-service authentication
- **Health Check**: `http://localhost:8083/health`
- **Token Endpoint**: `http://localhost:8083/token`

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

### Secrets Management

Client credentials are stored in the `secrets/service-ip/clients/` directory:

```
mesh/
├── secrets/
│   ├── service-ip/
│   │   └── clients/
│   │       ├── test-client.json
│   │       └── [other-client].json
│   └── shared/
│       └── [shared-secrets]
```

Each client file should contain:
```json
{
  "client_id": "unique-client-id",
  "client_secret": "secure-client-secret",
  "name": "Client Display Name",
  "description": "Client description"
}
```

## Docker Compose Commands

### Basic Operations
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f service-ip

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
curl http://localhost:8083/health
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

### Automated Testing
```bash
# Run comprehensive tests
./scripts/test-service-ip.sh

# Test with custom endpoint
SERVICE_IP_URL=http://localhost:8083 ./scripts/test-service-ip.sh
```

### Manual Testing

1. **Health Check**:
   ```bash
   curl http://localhost:8083/health
   ```

2. **Get Access Token**:
   ```bash
   curl -X POST http://localhost:8083/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&client_id=test-client&client_secret=test-secret-123"
   ```

3. **Test Invalid Credentials**:
   ```bash
   curl -X POST http://localhost:8083/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&client_id=invalid&client_secret=invalid"
   ```

## Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Check what's using the port
   lsof -i :8083
   
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
4. Review the service-ip source code in `../app/service-ip/`