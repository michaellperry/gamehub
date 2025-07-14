# GameHub Mesh Infrastructure

This directory contains the infrastructure setup for GameHub, implementing a comprehensive mesh architecture with PostgreSQL, FusionAuth, Jinaga replicator, and NGINX reverse proxy.

## Architecture Overview

The GameHub mesh consists of the following services:

### Core Services
- **PostgreSQL**: Shared database for FusionAuth and Jinaga replicator
- **FusionAuth**: Identity and access management
- **Jinaga Replicator**: Real-time data synchronization with authorization policies
- **NGINX**: Reverse proxy with SSL termination and routing

### Application Services
- **Service-IP**: JWT token service for service-to-service authentication
- **Player-IP**: Player authentication and session management
- **Content-Store**: File storage service with authentication integration

## Network Architecture

The infrastructure uses three segregated networks:

- **gamehub-network**: Core application services
- **gamehub-db-network**: Database access (PostgreSQL)
- **gamehub-auth-network**: Authentication services (FusionAuth, NGINX)

## Quick Start

1. **Initialize the mesh environment:**
   ```bash
   ../scripts/init-mesh.sh
   ```
   This script automatically creates and configures the `.env` file with all required environment variables including secure secrets.

2. **Start the infrastructure:**
   ```bash
   docker compose up -d
   ```

3. **Verify services:**
   ```bash
   docker compose ps
   ```

## Service Endpoints

When running locally, services are available at:

- **Main Gateway**: http://localhost (NGINX)
- **Admin Panel**: http://localhost/admin/
- **FusionAuth**: http://localhost/auth/
- **Replicator**: http://localhost/replicator/
- **Player API**: http://localhost/player-ip/
- **Service API**: http://localhost/service-ip/
- **Content Store**: http://localhost/content/

## Configuration Files

### NGINX Configuration
- `nginx/nginx.conf`: Main reverse proxy configuration
- `nginx/html/`: Static HTML files
- `nginx/ssl/`: SSL certificates (for production)

### Replicator Configuration
- `replicator/authentication/`: Authentication provider configurations
- `replicator/policies/`: Authorization policies for GameHub domain model
- `replicator/subscriptions/`: Real-time subscription configurations

### Secrets Management
- `secrets/shared/`: Shared secrets across services
- `secrets/service-ip/`: Service-IP specific secrets
- `secrets/player-ip/`: Player-IP specific secrets
- `secrets/content-store/`: Content-Store specific secrets
- `secrets/fusionauth/`: FusionAuth configuration secrets

## Health Checks

All services include comprehensive health checks:

- **PostgreSQL**: Database connectivity check
- **FusionAuth**: API status endpoint
- **Replicator**: Health endpoint check
- **Service-IP**: HTTP health endpoint
- **Player-IP**: HTTP health endpoint
- **Content-Store**: HTTP health endpoint
- **NGINX**: Basic HTTP check

## Development vs Production

### Development Setup
- Uses HTTP (port 80)
- Relaxed CORS policies
- Debug logging enabled
- Volume mounts for rapid development

### Production Setup
- Enable HTTPS configuration in `nginx/nginx.conf`
- Add SSL certificates to `nginx/ssl/`
- Update environment variables for production values
- Implement proper secret management
- Configure monitoring and logging

## Monitoring

Check service status:
```bash
# View all service logs
docker compose logs -f

# View specific service logs
docker compose logs -f postgres
docker compose logs -f fusionauth
docker compose logs -f gamehub-replicator

# Check service health
docker compose ps
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify PostgreSQL is healthy: `docker compose ps postgres`
   - Check database logs: `docker compose logs postgres`
   - Ensure environment variables are correct

2. **FusionAuth Startup Issues**
   - FusionAuth requires PostgreSQL to be fully ready
   - Check dependency order in docker-compose.yml
   - Verify database credentials

3. **Replicator Connection Issues**
   - Ensure authentication providers are correctly configured
   - Check policy syntax in `replicator/policies/`
   - Verify database connection string

4. **NGINX Routing Issues**
   - Check nginx configuration syntax: `docker compose exec nginx nginx -t`
   - Verify upstream service availability
   - Check CORS configuration for browser requests

### Reset Infrastructure

To completely reset the infrastructure:
```bash
# Stop all services
docker compose down

# Remove volumes (WARNING: This deletes all data)
docker compose down -v

# Remove networks
docker network prune

# Start fresh
docker compose up -d
```

## Security Considerations

### Production Checklist
- [ ] Change all default passwords
- [ ] Generate secure JWT secrets
- [ ] Configure SSL certificates
- [ ] Restrict CORS origins
- [ ] Enable proper logging
- [ ] Set up monitoring
- [ ] Configure backup strategies
- [ ] Review network security groups
- [ ] Implement secret rotation

### Network Security
- Services are isolated in separate networks
- Database access is restricted to authorized services
- Authentication services are segregated
- NGINX acts as the only public-facing service

## Migration from Phase 2

This setup builds upon the existing services:
- Service-IP, Player-IP, and Content-Store are integrated
- Database migration from SQLite to PostgreSQL (optional for Player-IP)
- Enhanced authentication with FusionAuth integration
- Real-time capabilities with Jinaga replicator

## Next Steps

1. **Configure FusionAuth Application**
   - Set up GameHub application in FusionAuth
   - Configure OAuth2 flows
   - Update authentication provider configurations

2. **Test Integration**
   - Verify service-to-service communication
   - Test authentication flows
   - Validate real-time synchronization

3. **Deploy Frontend Applications**
   - Build and deploy admin interface
   - Configure static file serving
   - Set up CI/CD pipelines

4. **Production Deployment**
   - Configure SSL certificates
   - Set up monitoring and alerting
   - Implement backup strategies
   - Configure load balancing