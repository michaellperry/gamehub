# Deployment

This guide covers the comprehensive deployment setup, CI/CD pipelines, and production configuration for the GameHub platform using Azure DevOps and automated policy generation.

## Table of Contents

- [Deployment](#deployment)
  - [Table of Contents](#table-of-contents)
  - [Deployment Overview](#deployment-overview)
    - [Architecture Components](#architecture-components)
    - [Deployment Flow](#deployment-flow)
  - [Backend Service Deployment](#backend-service-deployment)
    - [Service IP Deployment](#service-ip-deployment)
      - [Build and Deploy](#build-and-deploy)
      - [Production Environment Variables](#production-environment-variables)
      - [Secrets Management](#secrets-management)
      - [Health Checks and Monitoring](#health-checks-and-monitoring)
    - [Content Store Deployment](#content-store-deployment)
      - [Build and Deploy](#build-and-deploy-1)
      - [Production Environment Variables](#production-environment-variables-1)
      - [Authorization Provider Setup for Production](#authorization-provider-setup-for-production)
      - [Docker Volume Configuration](#docker-volume-configuration)
      - [Health Checks and Monitoring](#health-checks-and-monitoring-1)
  - [Frontend Application Deployment](#frontend-application-deployment)
    - [React Application Build Process](#react-application-build-process)
      - [Environment Configuration Management](#environment-configuration-management)
  - [Next Steps](#next-steps)

## Deployment Overview

### Architecture Components

The GameHub deployment architecture consists of:

- **Azure DevOps Pipelines**: Automated CI/CD with multi-stage deployment
- **Jinaga Model Package**: Dual-target builds (ESM + CommonJS) with policy generation
- **React Applications**: Admin and Player frontends with environment injection
- **Backend Services**: Identity providers (service-ip, player-ip) and content stores
- **Policy System**: Automated security policy generation and deployment

### Deployment Flow

```mermaid
graph TD
    A[Code Commit] --> B[Azure DevOps Pipeline]
    B --> C[Build Model Package]
    C --> D[Generate Policies]
    C --> E[Build Frontend Apps]
    B --> F[Build Backend Services]
    D --> G[Deploy Policies to Replicator]
    E --> H[Deploy Frontend Assets]
    F --> I[Deploy Backend Services]
    G --> J[Health Checks]
    H --> J
    I --> J
    J --> K[Production Ready]
```

## Backend Service Deployment

### Service IP Deployment

Service-ip is deployed as part of the mesh infrastructure using Docker Compose.

#### Build and Deploy

```bash
# Build and deploy service-ip
npm run build:service-ip
./scripts/build-service-ip.sh
./scripts/deploy-mesh.sh
```

#### Production Environment Variables

```env
NODE_ENV=production
PORT=8083
JWT_SECRET=<production-secret>
CLIENTS_DIR=/app/secrets/clients
```

#### Secrets Management

Client credentials are managed in `mesh/secrets/service-ip/clients/`. Each client requires both a JSON configuration file and a plain text secret file.

**Production Client Setup:**
```bash
# Generate production client credentials
CLIENT_SECRET=$(openssl rand -base64 32)
echo "$CLIENT_SECRET" > mesh/secrets/service-ip/clients/prod-client
echo '{"clientId":"prod-client","clientSecret":"'$CLIENT_SECRET'","scopes":["read","write"]}' > mesh/secrets/service-ip/clients/prod-client.json
```

#### Health Checks and Monitoring

- Health endpoint: `GET /health`
- Token endpoint: `POST /oauth/token`

For detailed service configuration and API usage, see [Backend Services - Service IP](./06-backend-services.md#service-identity-provider-service-ip).

### Content Store Deployment

The content-store service is deployed as part of the mesh infrastructure using Docker Compose with persistent volume storage.

#### Build and Deploy

```bash
# Build content store image
npm run build:content-store
./scripts/build-content-store.sh

# Deploy with mesh infrastructure
./scripts/deploy-mesh.sh
```

#### Production Environment Variables

```env
NODE_ENV=production
PORT=8081
STORAGE_DIR=/app/storage
AUTH_DIR=/app/auth
```

#### Authorization Provider Setup for Production

Content store authorization providers must be configured in the mesh secrets directory:

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
  "key": "${JWT_SECRET}"
}
EOF
```

**Security Best Practices:**
- Use the same JWT_SECRET across all services for token compatibility
- Restrict file permissions on provider files (600)
- Never commit provider files with production secrets to version control
- Rotate JWT secrets regularly in production environments
- Monitor authentication logs for suspicious activity

#### Docker Volume Configuration

Content store requires persistent storage for uploaded files:

```yaml
# docker-compose.yml
services:
  content-store:
    volumes:
      - content-store-storage:/app/storage
      - ./mesh/secrets/content-store:/app/auth:ro

volumes:
  content-store-storage:
    driver: local
```

#### Health Checks and Monitoring

- Health endpoint: `GET /health`
- Upload endpoint test: `POST /upload` (requires authentication)
- Storage monitoring: Check disk usage of content-store volume
- Authentication monitoring: Monitor failed authentication attempts

**Monitoring Commands:**
```bash
# Check service health
curl http://localhost:8081/health

# Check storage usage
docker exec content-store du -sh /app/storage

# View authentication logs
docker logs content-store | grep -i auth
```

## Frontend Application Deployment

### React Application Build Process

#### Environment Configuration Management

**Production Environment (`.env.production`):**
```env
VITE_BASE_NAME=/player/
VITE_REPLICATOR_URL=https://gamehub.qedcode.com/replicator/jinaga
VITE_PLAYER_IP_URL=https://gamehub.qedcode.com/player-ip
VITE_AUTHORIZATION_ENDPOINT=https://gamehub.qedcode.com/player-ip/authenticate
VITE_TOKEN_ENDPOINT=https://gamehub.qedcode.com/player-ip/token
VITE_REDIRECT_URI=https://gamehub.qedcode.com/player/callback
VITE_LOGOUT_ENDPOINT=https://gamehub.qedcode.com/player-ip/logout
VITE_CONTENT_STORE_URL=https://gamehub.qedcode.com/content
VITE_CLIENT_ID=gamehub-player
```

## Next Steps

After completing the deployment setup:

1. **Set up monitoring dashboards** in Azure Application Insights
2. **Configure alerting rules** for critical metrics and failures
3. **Implement automated testing** in the deployment pipeline
4. **Set up disaster recovery** procedures and backup strategies
5. **Document runbook procedures** for common operational tasks
6. **Train team members** on deployment processes and troubleshooting

For additional deployment scenarios and advanced configurations, refer to:
- [Docker Orchestration](./07-docker-orchestration.md) for containerized deployments
- [Authentication](./08-authentication.md) for security configuration
- [Troubleshooting](./10-troubleshooting.md) for operational issues

---

This deployment guide provides a comprehensive foundation for implementing robust CI/CD pipelines with automated policy generation, security scanning, and production-ready deployment strategies for the GameHub platform.