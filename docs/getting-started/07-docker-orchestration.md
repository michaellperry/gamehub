# Docker Orchestration

This guide covers the Docker Compose setup and container orchestration for the GameHub platform, including service networking, volume management, and environment configuration.

## Table of Contents

- [Docker Compose Architecture](#docker-compose-architecture)
- [Core Services Configuration](#core-services-configuration)
- [Identity Provider Services](#identity-provider-services)
- [Content Store Service](#content-store-service)
- [Networking and Communication](#networking-and-communication)
- [Environment Configuration](#environment-configuration)
- [Deployment Workflow](#deployment-workflow)

## Docker Compose Architecture

### Complete Docker Compose Stack Overview

The GameHub platform uses a sophisticated Docker Compose orchestration with multiple interconnected services:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Networks                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ jinaga_net  │  │fusionauth_net│  │   db_net    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                 │                 │                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    NGINX (Port 80)                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │/portal/     │  │/player/     │  │/auth/       │     │   │
│  │  │(Admin UI)   │  │(Player UI)  │  │(FusionAuth) │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                 │                 │                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │Game Service │  │ Player IP   │  │Content Store│             │
│  │ (Port 8083) │  │ (Port 8082) │  │ (Port 8081) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                 │                 │                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ PostgreSQL  │  │   Jinaga    │  │ FusionAuth  │             │
│  │ (Port 5432) │  │ Replicator  │  │ (Port 9011) │             │
│  │             │  │ (Port 8080) │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### Service Definitions and Relationships

The platform consists of the following core services:

1. **NGINX Reverse Proxy** - Routes traffic and serves static React applications
2. **Game Service** - Core identity provider for service-to-service authentication
3. **Player IP** - Application-specific identity provider for player authentication
4. **Front-end Replicator** - Jinaga replicator for real-time data synchronization
5. **Content Store** - File storage and content management service
6. **PostgreSQL Database** - Primary data persistence layer
7. **FusionAuth** - Enterprise authentication and user management

## Core Services Configuration

### Complete Docker Compose Configuration

The main [`docker-compose.yml`](../../mesh/docker-compose.yml) file defines the entire orchestration:

```yaml
name: gamehub

services:
  game-service:
    build:
      context: ../app/game-service/
      dockerfile: ./Dockerfile
    environment:
      NODE_ENV: production
      SERVER_PORT: 8083
      CORS_ORIGIN: http://localhost:3000,http://localhost:3001,http://localhost:8082
      JWT_SECRET: ${JWT_SECRET}
      JWT_ISSUER: game-service
      JWT_AUDIENCE: service-clients
      JWT_KEY_ID: game-service-key
      JWT_EXPIRES_IN: 1h
      CLIENTS_DIR: /app/secrets/clients
    volumes:
      - ./secrets/game-service/clients:/app/secrets/clients:ro
      - game_service_data:/data
    restart: unless-stopped
    networks:
      - jinaga_net

  player-ip:
    build:
      context: ../app
      dockerfile: player-ip/Dockerfile
    env_file:
      - path: ./.env
        required: true
      - path: ./.env.local
        required: false
    depends_on:
      - game-service
      - front-end-replicator
    environment:
      NODE_ENV: production
      SERVER_PORT: 8082
      CORS_ORIGIN: "*"
      JWT_SECRET: ${JWT_SECRET}
      JWT_ISSUER: player-ip
      JWT_AUDIENCE: gamehub-player
      JWT_KEY_ID: player-ip-key
      JWT_EXPIRES_IN: 1h
      REFRESH_TOKEN_EXPIRES_IN: 14d
      ROTATE_REFRESH_TOKENS: true
      REPLICATOR_URL: http://front-end-replicator:8080/jinaga
      SQLITE_DB_PATH: /data/player-ip.db
      SERVICE_IP_URL: http://game-service:8083
      SERVICE_IP_CLIENT_ID: player-ip
      SERVICE_IP_CLIENT_SECRET_FILE: /app/secrets/service-ip-client
    volumes:
      - ./secrets/player-ip/service-ip-client:/app/secrets/service-ip-client:ro
      - player_ip_data:/data
    restart: unless-stopped
    networks:
      - jinaga_net

  front-end-replicator:
    image: jinaga/jinaga-replicator:3.5.2
    volumes:
      - ./front-end/policies:/var/lib/replicator/policies:ro
      - ./front-end/authentication:/var/lib/replicator/authentication:ro
      - ./front-end/subscriptions:/var/lib/replicator/subscriptions:ro
      - front_end_replicator_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - jinaga_net

  db:
    image: postgres:16.0-bookworm
    env_file:
      - path: ./.env
        required: true
      - path: ./.env.local
        required: false
    environment:
      PGDATA: /var/lib/postgresql/data/pgdata
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U postgres" ]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - db_net
    restart: unless-stopped
    volumes:
      - db_data:/var/lib/postgresql/data

  content-store:
    build:
      context: ../app/content-store
      dockerfile: ./Dockerfile
    environment:
      PORT: 8081
      STORAGE_DIR: /app/storage
      AUTH_DIR: /app/authentication
    volumes:
      - content_store_data:/app/storage
      - ./front-end/authentication:/app/authentication:ro
    restart: unless-stopped
    networks:
      - jinaga_net

  fusionauth:
    image: fusionauth/fusionauth-app:latest
    depends_on:
      db:
        condition: service_healthy
    env_file:
      - path: ./.env
        required: true
      - path: ./.env.local
        required: false
    environment:
      DATABASE_URL: jdbc:postgresql://db:5432/fusionauth
      DATABASE_ROOT_USERNAME: ${POSTGRES_USER}
      DATABASE_ROOT_PASSWORD: ${POSTGRES_PASSWORD}
      DATABASE_USERNAME: ${DATABASE_USERNAME}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      FUSIONAUTH_APP_MEMORY: ${FUSIONAUTH_APP_MEMORY}
      FUSIONAUTH_APP_RUNTIME_MODE: ${FUSIONAUTH_APP_RUNTIME_MODE}
      SEARCH_TYPE: ${FUSIONAUTH_SEARCH_ENGINE_TYPE}
    healthcheck:
      test: curl --silent --fail http://localhost:9011/api/status -o /dev/null -w "%{http_code}"
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - fusionauth_net
      - db_net
    restart: unless-stopped
    volumes:
      - fusionauth_config:/usr/local/fusionauth/config

  nginx:
    image: nginx:stable-alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./nginx/app/gamehub-admin:/usr/share/nginx/html/admin:ro
      - ./nginx/app/gamehub-player:/usr/share/nginx/html/player:ro
    depends_on:
      - player-ip
      - front-end-replicator
      - content-store
      - fusionauth
    restart: unless-stopped
    networks:
      - jinaga_net
      - fusionauth_net

networks:
  db_net:
    driver: bridge
  search_net:
    driver: bridge
  fusionauth_net:
    driver: bridge
  jinaga_net:
    driver: bridge

volumes:
  db_data:
    name: gamehub_db_data
  fusionauth_config:
    name: gamehub_fusionauth_config
  search_data:
    name: gamehub_search_data
  content_store_data:
    name: gamehub_content_store_data
  player_ip_data:
    name: gamehub_player_ip_data
  game_service_data:
    name: gamehub_game_service_data
  front_end_replicator_data:
    name: gamehub_front_end_replicator_data
```

### React Applications Container Setup

React applications are built and served as static files through NGINX. The build process happens outside of Docker Compose, and the resulting static files are mounted into the NGINX container:

```bash
# Build admin application
cd app/gamehub-admin
npm run build
cp -r dist/* ../mesh/nginx/app/gamehub-admin/

# Build player application
cd app/gamehub-player
npm run build
cp -r dist/* ../mesh/nginx/app/gamehub-player/
```

### Jinaga Replicator Service Configuration

The Jinaga replicator uses the official Docker image with custom configuration:

```yaml
front-end-replicator:
  image: jinaga/jinaga-replicator:3.5.2
  volumes:
    - ./front-end/policies:/var/lib/replicator/policies:ro
    - ./front-end/authentication:/var/lib/replicator/authentication:ro
    - ./front-end/subscriptions:/var/lib/replicator/subscriptions:ro
    - front_end_replicator_data:/var/lib/postgresql/data
  restart: unless-stopped
  networks:
    - jinaga_net
```

The replicator configuration includes:
- **Policies**: Define data access and distribution rules
- **Authentication**: JWT token validation configuration
- **Subscriptions**: Real-time data subscription patterns

### PostgreSQL Database Setup

PostgreSQL serves as the primary database for both FusionAuth and application data:

```yaml
db:
  image: postgres:16.0-bookworm
  environment:
    PGDATA: /var/lib/postgresql/data/pgdata
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  healthcheck:
    test: [ "CMD-SHELL", "pg_isready -U postgres" ]
    interval: 5s
    timeout: 5s
    retries: 5
  networks:
    - db_net
  restart: unless-stopped
  volumes:
    - db_data:/var/lib/postgresql/data
```

### NGINX Reverse Proxy Configuration

NGINX serves as the single entry point, routing traffic to appropriate services:

```nginx
# NGINX configuration for GameHub

# Map directive to conditionally set X-Forwarded-Proto based on hostname
map $host $forwarded_proto {
    default "https";
    "localhost" "http";
    "127.0.0.1" "http";
}

server {
    listen 80;
    server_name localhost;
    index index.html;

    # Default path redirects to admin interface
    location = / {
        return 301 /portal/;
    }

    # Player IP service
    location /player-ip/ {
        proxy_pass http://player-ip:8082/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Replicator service
    location /replicator/ {
        proxy_pass http://front-end-replicator:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable buffering for real-time updates
        proxy_buffering off;
        
        # Extended timeouts for long polling
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Content store service
    location /content/ {
        proxy_pass http://content-store:8081/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # FusionAuth authentication service
    location /auth/ {
        proxy_pass       http://fusionauth:9011/;
        proxy_set_header X-Forwarded-Proto $forwarded_proto;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Server $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Accept-Encoding "";
        proxy_http_version 1.1;
        sub_filter       'action="/'  'action="/auth/';
        sub_filter       'href="/'  'href="/auth/';
        sub_filter       'src="/images'  'src="/auth/images';
        sub_filter       'src="/admin'  'src="/auth/admin';
        sub_filter       'src="/js'  'src="/auth/js';
        sub_filter_once  off;
        proxy_redirect / /auth/;
    }

    # Admin interface - serve static files
    location /portal/ {
        alias /usr/share/nginx/html/admin/;
        try_files $uri $uri/ /portal/index.html;
        
        # Cache control for static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }
    }

    # Player interface - serve static files
    location /player/ {
        alias /usr/share/nginx/html/player/;
        try_files $uri $uri/ /player/index.html;
        
        # Cache control for static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }
    }
}
```

### FusionAuth Authentication Service Setup

FusionAuth provides enterprise-grade authentication and user management:

```yaml
fusionauth:
  image: fusionauth/fusionauth-app:latest
  depends_on:
    db:
      condition: service_healthy
  environment:
    DATABASE_URL: jdbc:postgresql://db:5432/fusionauth
    DATABASE_ROOT_USERNAME: ${POSTGRES_USER}
    DATABASE_ROOT_PASSWORD: ${POSTGRES_PASSWORD}
    DATABASE_USERNAME: ${DATABASE_USERNAME}
    DATABASE_PASSWORD: ${DATABASE_PASSWORD}
    FUSIONAUTH_APP_MEMORY: ${FUSIONAUTH_APP_MEMORY}
    FUSIONAUTH_APP_RUNTIME_MODE: ${FUSIONAUTH_APP_RUNTIME_MODE}
    SEARCH_TYPE: ${FUSIONAUTH_SEARCH_ENGINE_TYPE}
  healthcheck:
    test: curl --silent --fail http://localhost:9011/api/status -o /dev/null -w "%{http_code}"
    interval: 5s
    timeout: 5s
    retries: 5
  networks:
    - fusionauth_net
    - db_net
  restart: unless-stopped
  volumes:
    - fusionauth_config:/usr/local/fusionauth/config
```

## Identity Provider Services

### Dedicated Game Service Identity Provider (game-service) Configuration

The game-service provides authentication for service-to-service communication:

**Dockerfile** ([`app/game-service/Dockerfile`](../../app/game-service/Dockerfile)):
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 8083

# Start the server
CMD ["npm", "start"]
```

**Environment Configuration**:
```yaml
environment:
  NODE_ENV: production
  SERVER_PORT: 8083
  CORS_ORIGIN: http://localhost:3000,http://localhost:3001,http://localhost:8082
  JWT_SECRET: ${JWT_SECRET}
  JWT_ISSUER: game-service
  JWT_AUDIENCE: service-clients
  JWT_KEY_ID: game-service-key
  JWT_EXPIRES_IN: 1h
  CLIENTS_DIR: /app/secrets/clients
```

### Application-specific Identity Provider (player-ip) Setup

The player-ip handles authentication for the player application:

**Multi-stage Dockerfile** ([`app/player-ip/Dockerfile`](../../app/player-ip/Dockerfile)):
```dockerfile
# Stage 1: Build the player-ip app
FROM node:22-alpine AS app-builder
WORKDIR /app

# Copy and install dependencies
COPY player-ip/package*.json ./
RUN npm ci

# Copy player-ip app source
COPY player-ip/tsconfig.json ./
COPY player-ip/src ./src

# Build the player-ip app
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production image
FROM node:22-alpine
WORKDIR /app

# Copy package files and install production dependencies
COPY player-ip/package*.json ./
RUN npm ci --production

# Copy built assets from the app builder
COPY --from=app-builder /app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p /data

# Set environment variables
ENV NODE_ENV=production
ENV SQLITE_DB_PATH=/data/player-ip.db

# Expose port 8082
EXPOSE 8082

# Start the application
CMD ["node", "dist/server.js"]
```

**Environment Configuration**:
```yaml
environment:
  NODE_ENV: production
  SERVER_PORT: 8082
  CORS_ORIGIN: "*"
  JWT_SECRET: ${JWT_SECRET}
  JWT_ISSUER: player-ip
  JWT_AUDIENCE: gamehub-player
  JWT_KEY_ID: player-ip-key
  JWT_EXPIRES_IN: 1h
  REFRESH_TOKEN_EXPIRES_IN: 14d
  ROTATE_REFRESH_TOKENS: true
  REPLICATOR_URL: http://front-end-replicator:8080/jinaga
  SQLITE_DB_PATH: /data/player-ip.db
  SERVICE_IP_URL: http://game-service:8083
  SERVICE_IP_CLIENT_ID: player-ip
  SERVICE_IP_CLIENT_SECRET_FILE: /app/secrets/service-ip-client
```

### Client Credentials and JWT Token Management

**Service-to-Service Authentication**:
- Game Service issues JWT tokens for service clients
- Client credentials stored in mounted secret files
- Token validation using shared JWT secrets

**User Authentication Flow**:
- Player IP handles user login/logout
- Refresh token rotation for enhanced security
- Integration with FusionAuth for user management

### Inter-service Authentication Patterns

**Service Discovery**:
```yaml
# Services communicate using container names
SERVICE_IP_URL: http://game-service:8083
REPLICATOR_URL: http://front-end-replicator:8080/jinaga
```

**Secret Management**:
```yaml
volumes:
  - ./secrets/game-service/clients:/app/secrets/clients:ro
  - ./secrets/player-ip/service-ip-client:/app/secrets/service-ip-client:ro
```

## Content Store Service

### File Storage and Content Management Service

The content store handles file uploads and content management:

**Dockerfile** ([`app/content-store/Dockerfile`](../../app/content-store/Dockerfile)):
```dockerfile
FROM node:22-alpine
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --include=dev

# Copy application code
COPY src ./src

# Create storage directory
RUN mkdir -p storage

# Expose port
EXPOSE 8081

# Start the application
CMD ["node", "src/server.js"]
```

### Volume Mounting and File Persistence

```yaml
content-store:
  environment:
    PORT: 8081
    STORAGE_DIR: /app/storage
    AUTH_DIR: /app/authentication
  volumes:
    - content_store_data:/app/storage
    - ./front-end/authentication:/app/authentication:ro
```

### Authentication Integration with Identity Providers

The content store integrates with the authentication system:
- Reads authentication configuration from mounted volume
- Validates JWT tokens from identity providers
- Enforces access control for file operations

### API Endpoint Configuration

Content store endpoints are proxied through NGINX:
```nginx
location /content/ {
    proxy_pass http://content-store:8081/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Networking and Communication

### Docker Network Configuration

The platform uses multiple isolated networks for security:

```yaml
networks:
  db_net:
    driver: bridge
  search_net:
    driver: bridge
  fusionauth_net:
    driver: bridge
  jinaga_net:
    driver: bridge
```

**Network Segmentation**:
- **jinaga_net**: Core application services (game-service, player-ip, content-store, replicator)
- **fusionauth_net**: Authentication services (FusionAuth, NGINX)
- **db_net**: Database access (PostgreSQL, FusionAuth)
- **search_net**: Search services (reserved for future use)

### Service Discovery and Internal Communication

Services communicate using Docker's built-in DNS resolution:

```yaml
# Internal service URLs
http://game-service:8083        # Game service identity provider
http://player-ip:8082           # Player identity provider
http://front-end-replicator:8080 # Jinaga replicator
http://content-store:8081       # Content management
http://fusionauth:9011          # Authentication service
postgres:5432                   # Database connection
```

### Port Mapping and External Access

Only NGINX exposes ports externally:

```yaml
nginx:
  ports:
    - "80:80"  # Single entry point for all traffic
```

**Internal Port Allocation**:
- 8081: Content Store
- 8082: Player IP
- 8083: Game Service
- 8080: Jinaga Replicator
- 9011: FusionAuth
- 5432: PostgreSQL

### CORS Configuration for Cross-Origin Requests

CORS is configured at the service level:

```yaml
# Game Service CORS
CORS_ORIGIN: http://localhost:3000,http://localhost:3001,http://localhost:8082

# Player IP CORS
CORS_ORIGIN: "*"
```

## Environment Configuration

### Development vs Production Environment Differences

**Environment File Structure** ([`mesh/.env`](../../mesh/.env)):
```bash
# Database Configuration
DATABASE_USERNAME=fusionauth
DATABASE_PASSWORD=hkaLBM3RVnyYeYeqE3WI1w2e4Avpy0Wd5O3s3
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# FusionAuth Configuration
FUSIONAUTH_APP_MEMORY=512M
FUSIONAUTH_APP_RUNTIME_MODE=development
FUSIONAUTH_SEARCH_ENGINE_TYPE=database

# JWT Configuration
JWT_SECRET=development-secret-key
JWT_ISSUER=player-ip
JWT_AUDIENCE=gamehub-player
```

### Secret Management and Environment Variables

**Environment File Loading**:
```yaml
env_file:
  - path: ./.env
    required: true
  - path: ./.env.local
    required: false
```

**Secret File Mounting**:
```yaml
volumes:
  - ./secrets/service-ip/clients:/app/secrets/clients:ro
  - ./secrets/player-ip/service-ip-client:/app/secrets/service-ip-client:ro
```

### Configuration File Mounting and Management

**Jinaga Configuration**:
```yaml
volumes:
  - ./front-end/policies:/var/lib/replicator/policies:ro
  - ./front-end/authentication:/var/lib/replicator/authentication:ro
  - ./front-end/subscriptions:/var/lib/replicator/subscriptions:ro
```

**NGINX Configuration**:
```yaml
volumes:
  - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
  - ./nginx/app/gamehub-admin:/usr/share/nginx/html/admin:ro
  - ./nginx/app/gamehub-player:/usr/share/nginx/html/player:ro
```

### Health Checks and Service Monitoring

**Database Health Check**:
```yaml
db:
  healthcheck:
    test: [ "CMD-SHELL", "pg_isready -U postgres" ]
    interval: 5s
    timeout: 5s
    retries: 5
```

**FusionAuth Health Check**:
```yaml
fusionauth:
  healthcheck:
    test: curl --silent --fail http://localhost:9011/api/status -o /dev/null -w "%{http_code}"
    interval: 5s
    timeout: 5s
    retries: 5
```

**Service Dependencies**:
```yaml
player-ip:
  depends_on:
    - game-service
    - front-end-replicator

fusionauth:
  depends_on:
    db:
      condition: service_healthy
```

## Deployment Workflow

### Step-by-Step Deployment Process

1. **Prepare Environment**:
   ```bash
   cd mesh
   cp .env.example .env
   # Edit .env with appropriate values
   ```

2. **Build React Applications**:
   ```bash
   # Build admin application
   cd ../app/gamehub-admin
   npm install
   npm run build
   cp -r dist/* ../mesh/nginx/app/gamehub-admin/

   # Build player application
   cd ../app/gamehub-player
   npm install
   npm run build
   cp -r dist/* ../mesh/nginx/app/gamehub-player/
   ```

3. **Prepare Secrets**:
   ```bash
   cd ../mesh
   mkdir -p secrets/game-service/clients
   mkdir -p secrets/player-ip
   # Add client credentials and secrets
   ```

4. **Start Services**:
   ```bash
   docker-compose up -d
   ```

5. **Verify Deployment**:
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

### Service Startup Order and Dependencies

The Docker Compose dependency chain ensures proper startup order:

```
PostgreSQL (with health check)
    ↓
FusionAuth (waits for healthy DB)
    ↓
Game Service → Front-end Replicator
    ↓
Player IP (depends on Game Service + Replicator)
    ↓
Content Store
    ↓
NGINX (depends on all backend services)
```

### Troubleshooting Common Deployment Issues

**Database Connection Issues**:
```bash
# Check database health
docker-compose exec db pg_isready -U postgres

# View database logs
docker-compose logs db
```

**Service Authentication Issues**:
```bash
# Check service logs
docker-compose logs game-service
docker-compose logs player-ip

# Verify secret files
docker-compose exec game-service ls -la /app/secrets/clients
```

**NGINX Routing Issues**:
```bash
# Test NGINX configuration
docker-compose exec nginx nginx -t

# Check NGINX logs
docker-compose logs nginx
```

**FusionAuth Issues**:
```bash
# Check FusionAuth health
curl http://localhost/auth/api/status

# View FusionAuth logs
docker-compose logs fusionauth
```

### Scaling and Performance Considerations

**Horizontal Scaling**:
```yaml
# Scale specific services
docker-compose up -d --scale player-ip=3
```

**Resource Limits**:
```yaml
services:
  fusionauth:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

**Volume Performance**:
- Use named volumes for better performance
- Consider external volume drivers for production
- Implement backup strategies for persistent data

**Monitoring and Logging**:
```bash
# View all service logs
docker-compose logs -f

# Monitor resource usage
docker stats

# Check service health
docker-compose ps
```

## Next Steps

After setting up the Docker orchestration:

1. **Configure Authentication** - Set up FusionAuth applications and users
2. **Test Service Communication** - Verify inter-service authentication
3. **Deploy to Production** - Adapt configuration for production environment
4. **Set up Monitoring** - Implement logging and monitoring solutions
5. **Configure Backups** - Set up automated backup procedures

For detailed authentication setup, see [Authentication Guide](./08-authentication.md).
For production deployment, see [Deployment Guide](./09-deployment.md).