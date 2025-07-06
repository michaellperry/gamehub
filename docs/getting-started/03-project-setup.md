# Project Setup

This guide walks you through the initial project setup, directory structure understanding, and basic configuration needed to start development with the infrastructure.

## Table of Contents

- [Project Setup](#project-setup)
  - [Table of Contents](#table-of-contents)
  - [Repository Setup](#repository-setup)
    - [Clone the Repository](#clone-the-repository)
    - [Git Configuration](#git-configuration)
  - [Directory Structure](#directory-structure)
    - [Root Level Organization](#root-level-organization)
    - [Application Structure (`/app`)](#application-structure-app)
    - [Infrastructure Structure (`/mesh`)](#infrastructure-structure-mesh)
    - [Scripts Structure (`/scripts`)](#scripts-structure-scripts)
  - [Environment Configuration](#environment-configuration)
    - [Service Authentication Setup](#service-authentication-setup)
    - [Database Configuration](#database-configuration)
    - [FusionAuth Configuration](#fusionauth-configuration)
  - [Initial Setup Scripts](#initial-setup-scripts)
    - [Automated Setup](#automated-setup)
    - [Manual Setup Steps](#manual-setup-steps)
      - [1. Install Application Dependencies](#1-install-application-dependencies)
      - [2. Build Shared Model](#2-build-shared-model)
      - [3. Configure Environment](#3-configure-environment)
      - [4. Set Up Secrets](#4-set-up-secrets)
  - [Development Workflow](#development-workflow)
    - [Local Development Mode (Recommended for Development)](#local-development-mode-recommended-for-development)
    - [Production-like Environment](#production-like-environment)
      - [Development URLs (Production Mode)](#development-urls-production-mode)
      - [Service Health Checks](#service-health-checks)
  - [Next Steps](#next-steps)

## Repository Setup

### Clone the Repository
```bash
git clone <repository-url>
cd gamehub
ls -la
```

**Steps:**
1. Clone the repository to your local machine
2. Navigate to the project directory
3. Verify the repository was cloned correctly

### Git Configuration
```bash
git config user.name "Your Name"
git config user.email "your.email@company.com"
```

**Optional:** Set up Git hooks if available:
```bash
./scripts/setup-git-hooks.sh
```

## Directory Structure

### Root Level Organization
```
gamehub/
├── app/                    # Application services
├── docs/                   # Documentation
├── mesh/                   # Infrastructure and orchestration
├── scripts/                # Automation and setup scripts
├── data/                   # Data files and migrations
├── http/                   # HTTP test files
├── notebooks/              # Development notebooks
└── screenshots/            # Documentation assets
```

### Application Structure (`/app`)

The `/app` directory contains a Node.js monorepo using npm workspaces with the following structure:

```
app/
├── package.json            # Root package.json with workspace configuration
├── tsconfig.json           # Root TypeScript configuration
├── gamehub-model/          # Shared TypeScript library with Jinaga domain model
├── service-ip/             # OAuth 2.0 Client Credentials service (Port 8083)
├── player-ip/              # OAuth 2.0 identity provider for player authentication (Port 8082)
├── content-store/          # File storage service (Port 8081)
├── gamehub-admin/          # Vite-based web application for administration
└── [other legacy services] # Additional services (being migrated)
```

**Key Components:**
- **gamehub-model** - Shared TypeScript library with dual ESM/CJS builds
- **service-ip** - OAuth 2.0 Client Credentials service for service-to-service authentication
- **player-ip** - OAuth 2.0 identity provider for player authentication with PKCE flow
- **content-store** - File storage service with authentication integration
- **gamehub-admin** - Vite-based web application for administration

### Infrastructure Structure (`/mesh`)
```
mesh/
├── docker-compose.yml      # Main orchestration file
├── .env.example           # Environment configuration template
├── nginx/                 # Reverse proxy configuration
│   ├── nginx.conf         # NGINX routing configuration
│   ├── html/              # Static HTML pages
│   └── ssl/               # SSL certificates (production)
├── replicator/            # Jinaga replicator configuration
│   ├── authentication/    # Authentication providers
│   ├── policies/          # Authorization policies
│   └── subscriptions/     # Real-time subscriptions
└── secrets/               # Secret management
    ├── player-ip/         # Player-IP service secrets
    ├── service-ip/        # Service-IP client configurations
    └── content-store/     # Content-Store authentication providers
```

### Scripts Structure (`/scripts`)
```
scripts/
├── setup/                  # Initial setup automation
│   ├── src/                # Setup script source code
│   └── package.json        # Setup dependencies
└── deployment/             # Deployment automation
```

## Environment Configuration

### Service Authentication Setup
Backend services require client credentials for inter-service communication.

Run these commands to generate and configure the shared secrets:

```bash
# Generate shared secret for service authentication
SHARED_SECRET=$(openssl rand -base64 32)

# Set up service-ip client credentials
mkdir -p mesh/secrets/service-ip/clients
echo "$SHARED_SECRET" > mesh/secrets/service-ip/clients/player-ip

# Set up player-ip service credentials
mkdir -p mesh/secrets/player-ip
echo "$SHARED_SECRET" > mesh/secrets/player-ip/player-ip-client-secret
```

**What these commands do:**
1. Generate a random 32-bit shared secret encoded in base-64
2. Create service IP client credentials directory
3. Store the player-ip client credentials with the shared secret
4. Create player IP service credentials directory  
5. Store the service IP client credentials (using the same shared secret)

### Database Configuration

The infrastructure uses PostgreSQL as the database for FusionAuth:

```bash
cd mesh
cp .env.example .env
```

**Key database environment variables:**
```env
POSTGRES_DB=gamehub
POSTGRES_USER=gamehub_admin
POSTGRES_PASSWORD=secure_password_change_in_production
```

### FusionAuth Configuration

FusionAuth provides OAuth2 authentication for web applications:

```env
FUSIONAUTH_APP_MEMORY=512M
FUSIONAUTH_APP_RUNTIME_MODE=production
FUSIONAUTH_SEARCH_ENGINE_TYPE=database
```

## Initial Setup Scripts

### Automated Setup
The project includes setup scripts for streamlined initialization:

```bash
cd scripts/setup
npm install
npm run build
npm start -- --api-key <your-fusionauth-api-key>
```

**Steps:**
1. Navigate to setup scripts directory
2. Install setup application dependencies
3. Build the setup application
4. Run automated setup with your FusionAuth API key

### Manual Setup Steps

#### 1. Install Application Dependencies

The monorepo uses npm workspaces, so you can install all dependencies from the root:

```bash
cd app
npm install
```

This single command installs dependencies for all packages in the monorepo:
- gamehub-model
- service-ip
- player-ip
- content-store
- gamehub-admin

#### 2. Build Shared Model

The Jinaga model must be built before other services can use it:

```bash
npm run build:model
npm run generate-policies
```

**Note:** Run these commands from the app directory (monorepo root)

#### 3. Configure Environment

Set up the environment configuration for the mesh infrastructure:

```bash
cd ../mesh
cp .env.example .env
# Edit .env file with your specific configuration
```

#### 4. Set Up Secrets

Generate and configure the required secrets:

```bash
# Generate service authentication secrets
SHARED_SECRET=$(openssl rand -base64 32)
mkdir -p secrets/service-ip/clients
echo "$SHARED_SECRET" > secrets/service-ip/clients/player-ip
mkdir -p secrets/player-ip
echo "$SHARED_SECRET" > secrets/player-ip/player-ip-client-secret

# Generate JWT secrets for production
JWT_SECRET=$(openssl rand -base64 32)
PLAYER_JWT_SECRET=$(openssl rand -base64 32)

# Update .env file with generated secrets
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
sed -i "s/PLAYER_JWT_SECRET=.*/PLAYER_JWT_SECRET=$PLAYER_JWT_SECRET/" .env
```

## Development Workflow

The monorepo supports both local development and production-like environments.

### Local Development Mode (Recommended for Development)

For active development, use the monorepo's development scripts:

```bash
cd app
npm install
npm run build:model
npm run dev:admin
```

**Or for player-ip OAuth service:**
```bash
npm run dev:player-ip
```

**Available Development Scripts:**
- `npm run build` - Build all packages
- `npm run build:model` - Build only the gamehub-model package
- `npm run build:service-ip` - Build only the service-ip package
- `npm run build:player-ip` - Build only the player-ip package
- `npm run dev:admin` - Start development mode for gamehub-admin
- `npm run dev:service-ip` - Start development mode for service-ip
- `npm run dev:player-ip` - Start development mode for player-ip OAuth service
- `npm run start:service-ip` - Start production mode for service-ip
- `npm run start:player-ip` - Start production mode for player-ip
- `npm run generate-policies` - Generate Jinaga policies from gamehub-model

### Production-like Environment

Start all services using Docker Compose for a production-like environment with the new infrastructure:

```bash
cd mesh/
docker-compose up -d
docker-compose ps
docker-compose logs -f [service-name]
```

**Commands explained:**
1. Navigate to mesh directory
2. Start all services in detached mode
3. View service status
4. View logs (replace `[service-name]` with actual service name)

#### Development URLs (Production Mode)

The new infrastructure provides the following endpoints through NGINX reverse proxy:

| Service | Endpoint | Description |
|---------|----------|-------------|
| **Main Gateway** | http://localhost | NGINX reverse proxy |
| **Admin Portal** | http://localhost/admin/ | GameHub admin interface |
| **FusionAuth** | http://localhost/auth/ | Identity management |
| **Replicator** | http://localhost/replicator/ | Real-time data sync |
| **Player API** | http://localhost/player-ip/ | Player authentication |
| **Service API** | http://localhost/service-ip/ | Service authentication |
| **Content Store** | http://localhost/content/ | File storage |

#### Service Health Checks

All services include comprehensive health checks:

```bash
# Check overall system health
curl http://localhost/health

# Check individual service health
curl http://localhost/player-ip/health
curl http://localhost/service-ip/health
curl http://localhost/content/health
curl http://localhost/replicator/health
curl http://localhost/auth/api/status
```

**Database and Infrastructure Health:**
```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready -U gamehub_admin -d gamehub

# Check service logs
docker-compose logs -f postgres
docker-compose logs -f fusionauth
docker-compose logs -f gamehub-replicator
```

When you make changes to the model or authorization rules:

```bash
cd app
npm run build:model
npm run generate-policies
cd ../mesh
docker-compose restart gamehub-replicator
```

When you make changes to the admin application:

```bash
cd app
npm run build:admin
cd ../mesh
docker-compose restart nginx
```

**Or build and deploy to container:**
```bash
cd app/gamehub-admin
npm run build:container
```

## Next Steps

With the infrastructure set up successfully, proceed to [Jinaga Data Model](./04-jinaga-model.md) to understand and configure the data layer.

**Key current Features Now Available:**
- PostgreSQL database for FusionAuth
- FusionAuth OAuth2 provider
- Jinaga replicator with real-time sync
- NGINX reverse proxy with SSL support
- Network segmentation for security
- Comprehensive health monitoring

---

*Encountering setup issues? Check the [Troubleshooting Guide](./10-troubleshooting.md) for solutions to common problems.*