# Deployment

This guide covers the comprehensive deployment setup for the GameHub platform using the current infrastructure with PostgreSQL, FusionAuth, Jinaga replicator, and Docker Compose orchestration.

## Table of Contents

- [Deployment](#deployment)
  - [Table of Contents](#table-of-contents)
  - [Deployment Overview](#deployment-overview)
    - [current Architecture Components](#current-architecture-components)
    - [Deployment Flow](#deployment-flow)
    - [Network Architecture](#network-architecture)
  - [Infrastructure Services Deployment](#infrastructure-services-deployment)
    - [PostgreSQL Database](#postgresql-database)
    - [FusionAuth Authentication](#fusionauth-authentication)
    - [Jinaga Replicator](#jinaga-replicator)
    - [NGINX Reverse Proxy](#nginx-reverse-proxy)
  - [Backend Service Deployment](#backend-service-deployment)
    - [Service IP Deployment](#service-ip-deployment)
    - [Player IP Deployment](#player-ip-deployment)
    - [Content Store Deployment](#content-store-deployment)
  - [Frontend Application Deployment](#frontend-application-deployment)
    - [React Application Build Process](#react-application-build-process)
  - [Environment Configuration](#environment-configuration)
    - [Production Environment Variables](#production-environment-variables)
    - [Secrets Management](#secrets-management)
    - [SSL Configuration](#ssl-configuration)
  - [Health Checks and Monitoring](#health-checks-and-monitoring)
    - [Service Health Endpoints](#service-health-endpoints)
    - [Database Monitoring](#database-monitoring)
    - [Authentication Monitoring](#authentication-monitoring)
  - [Deployment Procedures](#deployment-procedures)
    - [Initial Deployment](#initial-deployment)
    - [Updates and Maintenance](#updates-and-maintenance)
    - [Rollback Procedures](#rollback-procedures)
  - [Next Steps](#next-steps)

## Deployment Overview

### current Architecture Components

The GameHub current deployment architecture consists of:

- **PostgreSQL Database**: Database for FusionAuth
- **FusionAuth**: OAuth2 authentication provider for web applications
- **Jinaga Replicator**: Real-time data synchronization with GameHub-specific policies
- **NGINX Reverse Proxy**: SSL termination and service routing
- **Backend Services**: Identity providers (service-ip, player-ip) and content store
- **React Applications**: Admin and Player frontends with environment injection
- **Network Segmentation**: Three isolated networks for security

### Deployment Flow

```mermaid
graph TD
    A[Environment Setup] --> B[Configure Secrets]
    B --> C[Start PostgreSQL]
    C --> D[Start FusionAuth]
    D --> E[Start Jinaga Replicator]
    E --> F[Start Backend Services]
    F --> G[Start NGINX Proxy]
    G --> H[Health Checks]
    H --> I[Configure FusionAuth]
    I --> J[Production Ready]
```

### Network Architecture

The current infrastructure uses three isolated networks:

- **gamehub-network**: Core application services
- **gamehub-db-network**: Database access layer
- **gamehub-auth-network**: Authentication services

## Infrastructure Services Deployment

### PostgreSQL Database

PostgreSQL serves as the database for FusionAuth.

**Configuration:**
```yaml
postgres:
  image: postgres:16.0-bookworm
  environment:
    POSTGRES_DB: gamehub
    POSTGRES_USER: gamehub_admin
    POSTGRES_PASSWORD: secure_password_change_in_production
```

**Health Check:**
```bash
# Verify PostgreSQL is running
docker-compose exec postgres pg_isready -U gamehub_admin -d gamehub

# Check database connections
docker-compose logs postgres
```

### FusionAuth Authentication

FusionAuth provides OAuth2 authentication for web applications.

**Configuration:**
```yaml
fusionauth:
  image: fusionauth/fusionauth-app:latest
  environment:
    DATABASE_URL: jdbc:postgresql://postgres:5432/gamehub
    FUSIONAUTH_APP_MEMORY: 512M
    FUSIONAUTH_APP_RUNTIME_MODE: production
```

**Post-Deployment Setup:**
1. Access FusionAuth admin: `http://localhost/auth/`
2. Create initial admin user
3. Create GameHub application
4. Configure OAuth2 settings
5. Update authentication provider configurations

### Jinaga Replicator

The Jinaga replicator provides real-time data synchronization with GameHub-specific authorization policies.

**Configuration:**
```yaml
gamehub-replicator:
  image: jinaga/jinaga-replicator:3.5.2
  environment:
    DATABASE_URL: postgresql://gamehub_admin:password@postgres:5432/gamehub
  volumes:
    - ./replicator/policies:/var/lib/replicator/policies:ro
    - ./replicator/authentication:/var/lib/replicator/authentication:ro
    - ./replicator/subscriptions:/var/lib/replicator/subscriptions:ro
```

**Health Check:**
```bash
curl http://localhost/replicator/health
```

### NGINX Reverse Proxy

NGINX provides SSL termination and routes requests to appropriate services.

**Key Routes:**
- `/admin/` → GameHub admin interface
- `/auth/` → FusionAuth
- `/replicator/` → Jinaga replicator
- `/player-ip/` → Player authentication API
- `/service-ip/` → Service authentication API
- `/content/` → Content store

## Backend Service Deployment

### Service IP Deployment

Service-ip provides OAuth 2.0 Client Credentials for service-to-service authentication.

**Environment Variables:**
```env
NODE_ENV=production
SERVER_PORT=8083
JWT_SECRET=production-secret-key-change-me
JWT_ISSUER=service-ip
JWT_AUDIENCE=service-clients
CLIENTS_DIR=/app/secrets/clients
```

**Client Setup:**
```bash
# Generate production client credentials
CLIENT_SECRET=$(openssl rand -base64 32)
echo "$CLIENT_SECRET" > mesh/secrets/service-ip/clients/player-ip
```

### Player IP Deployment

Player-ip provides OAuth 2.0 authentication for players.

**Environment Variables:**
```env
NODE_ENV=production
SERVER_PORT=8082
DATABASE_URL=postgresql://gamehub_admin:password@postgres:5432/gamehub
PLAYER_JWT_SECRET=production-player-secret-key-change-me
SERVICE_IP_URL=http://service-ip:8083
REPLICATOR_URL=http://gamehub-replicator:8080/jinaga
```

**Database Migration:**
```bash
# Run database migrations
docker-compose exec player-ip npm run migrate
```

### Content Store Deployment

The content-store service provides file storage with authentication integration.

**Environment Variables:**
```env
NODE_ENV=production
PORT=8081
STORAGE_DIR=/app/storage
AUTH_DIR=/app/secrets
```

**Authentication Provider Setup:**
```bash
# Create provider configuration for service-ip authentication
cat > mesh/secrets/content-store/service-ip.provider << EOF
{
  "provider": "service-ip",
  "issuer": "service-ip",
  "audience": "service-clients",
  "key_id": "service-ip-key",
  "key": "${JWT_SECRET}"
}
EOF

# Create provider configuration for player-ip authentication
cat > mesh/secrets/content-store/player-ip.provider << EOF
{
  "provider": "player-ip",
  "issuer": "player-ip",
  "audience": "gamehub-players",
  "key_id": "player-ip-key",
  "key": "${PLAYER_JWT_SECRET}"
}
EOF
```

## Frontend Application Deployment

### React Application Build Process

**Environment Configuration Management:**

**Production Environment (`.env.production`):**
```env
VITE_BASE_NAME=/admin/
VITE_REPLICATOR_URL=https://yourdomain.com/replicator/jinaga
VITE_PLAYER_IP_URL=https://yourdomain.com/player-ip
VITE_AUTHORIZATION_ENDPOINT=https://yourdomain.com/auth/oauth2/authorize
VITE_TOKEN_ENDPOINT=https://yourdomain.com/auth/oauth2/token
VITE_REDIRECT_URI=https://yourdomain.com/admin/callback
VITE_LOGOUT_ENDPOINT=https://yourdomain.com/auth/oauth2/logout
VITE_CONTENT_STORE_URL=https://yourdomain.com/content
VITE_CLIENT_ID=gamehub-admin
```

## Environment Configuration

### Production Environment Variables

**Complete `.env` configuration:**
```env
# Database Configuration
POSTGRES_DB=gamehub
POSTGRES_USER=gamehub_admin
POSTGRES_PASSWORD=secure_password_change_in_production

# FusionAuth Configuration
FUSIONAUTH_APP_MEMORY=512M
FUSIONAUTH_APP_RUNTIME_MODE=production
FUSIONAUTH_SEARCH_ENGINE_TYPE=database

# Service IP Configuration
JWT_SECRET=production-secret-key-change-me-in-production
JWT_EXPIRES_IN=1h
JWT_ISSUER=service-ip
JWT_AUDIENCE=service-clients

# Player IP Configuration
PLAYER_JWT_SECRET=production-player-secret-key-change-me-in-production
PLAYER_JWT_EXPIRES_IN=1h
PLAYER_JWT_ISSUER=player-ip
PLAYER_JWT_AUDIENCE=gamehub-players
REFRESH_TOKEN_EXPIRES_IN=14d

# SSL Configuration (for production)
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

### Secrets Management

**Security Best Practices:**
- Use different JWT secrets for each service
- Restrict file permissions on secret files (600)
- Never commit secrets to version control
- Rotate secrets regularly in production
- Use environment-specific secret management

**Generate Production Secrets:**
```bash
# Generate JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
PLAYER_JWT_SECRET=$(openssl rand -base64 32)

# Generate service authentication secrets
SHARED_SECRET=$(openssl rand -base64 32)
echo "$SHARED_SECRET" > mesh/secrets/service-ip/clients/player-ip
echo "$SHARED_SECRET" > mesh/secrets/player-ip/player-ip-client-secret

# Set proper permissions
chmod 600 mesh/secrets/service-ip/clients/*
chmod 600 mesh/secrets/player-ip/*
chmod 600 mesh/secrets/content-store/*
```

### SSL Configuration

**Production SSL Setup:**
```bash
# Place SSL certificates
cp your-cert.pem mesh/nginx/ssl/cert.pem
cp your-key.pem mesh/nginx/ssl/key.pem

# Update NGINX configuration for SSL
# Edit mesh/nginx/nginx.conf to enable SSL
```

## Health Checks and Monitoring

### Service Health Endpoints

All services provide comprehensive health checks:

```bash
# Main gateway health
curl http://localhost/health

# Individual service health
curl http://localhost/player-ip/health
curl http://localhost/service-ip/health
curl http://localhost/content/health
curl http://localhost/replicator/health
curl http://localhost/auth/api/status
```

### Database Monitoring

```bash
# PostgreSQL health
docker-compose exec postgres pg_isready -U gamehub_admin -d gamehub

# Database connections
docker-compose exec postgres psql -U gamehub_admin -d gamehub -c "SELECT count(*) FROM pg_stat_activity;"

# Database size
docker-compose exec postgres psql -U gamehub_admin -d gamehub -c "SELECT pg_size_pretty(pg_database_size('gamehub'));"
```

### Authentication Monitoring

```bash
# FusionAuth status
curl http://localhost/auth/api/status

# Authentication logs
docker-compose logs fusionauth | grep -i auth
docker-compose logs player-ip | grep -i auth
```

## Deployment Procedures

### Initial Deployment

1. **Prepare Environment:**
   ```bash
   cd mesh
   cp .env.example .env
   # Update .env with production values
   ```

2. **Set Up Secrets:**
   ```bash
   # Generate and configure secrets
   ./scripts/setup-secrets.sh
   ```

3. **Deploy Infrastructure:**
   ```bash
   # Start core infrastructure
   docker-compose up -d postgres
   docker-compose up -d fusionauth
   docker-compose up -d gamehub-replicator
   ```

4. **Deploy Application Services:**
   ```bash
   # Start application services
   docker-compose up -d service-ip player-ip content-store
   ```

5. **Deploy Frontend:**
   ```bash
   # Start NGINX proxy
   docker-compose up -d nginx
   ```

6. **Verify Deployment:**
   ```bash
   # Check all services
   docker-compose ps
   curl http://localhost/health
   ```

### Updates and Maintenance

**Rolling Updates:**
```bash
# Update specific service
docker-compose pull service-name
docker-compose up -d --no-deps service-name

# Update all services
docker-compose pull
docker-compose up -d
```

**Database Maintenance:**
```bash
# Backup database
docker-compose exec postgres pg_dump -U gamehub_admin gamehub > backup.sql

# Restore database
docker-compose exec -T postgres psql -U gamehub_admin gamehub < backup.sql
```

### Rollback Procedures

```bash
# Rollback to previous version
docker-compose down
git checkout previous-version
docker-compose up -d

# Rollback specific service
docker-compose stop service-name
docker-compose rm service-name
docker-compose up -d service-name
```

## Next Steps

After completing the current deployment:

1. **Configure FusionAuth Applications**:
   - Create GameHub admin application
   - Create GameHub player application
   - Configure OAuth2 flows and scopes

2. **Set up monitoring dashboards**:
   - Application performance monitoring
   - Database performance monitoring
   - Authentication metrics

3. **Configure alerting rules**:
   - Service health alerts
   - Database connection alerts
   - Authentication failure alerts

4. **Implement backup strategies**:
   - Database backups
   - Configuration backups
   - Secret rotation procedures

5. **Set up CI/CD pipelines**:
   - Automated testing
   - Automated deployment
   - Security scanning

6. **Document operational procedures**:
   - Incident response procedures
   - Maintenance procedures
   - Troubleshooting guides

For additional deployment scenarios and advanced configurations, refer to:
- [Project Setup](./03-project-setup.md) for development environment setup
- [Troubleshooting](./10-troubleshooting.md) for operational issues

---

This deployment guide provides a comprehensive foundation for implementing the current GameHub infrastructure with PostgreSQL for FusionAuth, Jinaga replicator, and production-ready Docker Compose orchestration.