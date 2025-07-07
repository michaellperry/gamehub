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
    - [Automated Setup with init-mesh.sh](#automated-setup-with-init-meshsh)
    - [Service Authentication Setup](#service-authentication-setup)
    - [Database Configuration](#database-configuration)
    - [FusionAuth Configuration](#fusionauth-configuration)
  - [FusionAuth Setup](#fusionauth-setup)
    - [Prerequisites for FusionAuth Setup](#prerequisites-for-fusionauth-setup)
    - [Obtaining a FusionAuth API Key](#obtaining-a-fusionauth-api-key)
    - [Running FusionAuth Setup](#running-fusionauth-setup)
      - [Option 1: Using the Shell Script (Recommended)](#option-1-using-the-shell-script-recommended)
      - [Option 2: Using npm Commands](#option-2-using-npm-commands)
      - [Option 3: Development Mode](#option-3-development-mode)
    - [FusionAuth Setup Configuration Options](#fusionauth-setup-configuration-options)
    - [What the FusionAuth Setup Does](#what-the-fusionauth-setup-does)
    - [Generated Files](#generated-files)
    - [Post-FusionAuth Setup Steps](#post-fusionauth-setup-steps)
  - [Initial Setup Scripts](#initial-setup-scripts)
    - [Complete Automated Setup](#complete-automated-setup)
    - [Legacy Manual Setup](#legacy-manual-setup)
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
    - [Immediate Next Steps](#immediate-next-steps)
    - [Development Workflow](#development-workflow-1)
    - [Troubleshooting](#troubleshooting)
    - [Ready for Development](#ready-for-development)

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

### Automated Setup with init-mesh.sh

The recommended way to initialize the mesh environment is using the automated setup script:

```bash
./scripts/init-mesh.sh
```

**What the script does:**
- Copies `.env.example` to `.env` if it doesn't exist
- Generates secure random secrets for production use
- Creates all required directories in the `mesh/secrets/` structure
- Sets up service authentication credentials
- Ensures client secrets are synchronized between services
- Is idempotent and safe to run multiple times

**The script automatically configures:**
- `POSTGRES_PASSWORD` - Database password for PostgreSQL
- `JWT_SECRET` - JWT signing secret for service-ip
- `PLAYER_JWT_SECRET` - JWT signing secret for player-ip
- Service-to-service authentication secrets
- All required directory structures

### Service Authentication Setup

If you prefer manual setup or need to understand the authentication flow, backend services require client credentials for inter-service communication.

The `init-mesh.sh` script handles this automatically, but for reference, the manual process involves:

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

### Database Configuration

The infrastructure uses PostgreSQL as the database for FusionAuth. The `init-mesh.sh` script automatically handles the environment setup, but you can also configure manually:

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

## FusionAuth Setup

GameHub includes an automated FusionAuth setup application that configures OAuth applications, authentication providers, and generates all necessary configuration files.

### Prerequisites for FusionAuth Setup

Before running the FusionAuth setup, ensure you have:

1. **FusionAuth Running**: The mesh infrastructure should be running with FusionAuth accessible
2. **FusionAuth API Key**: An API key with the following permissions:
   - Application management (`/api/application/*`)
   - System configuration (`/api/system-configuration`)
   - Key management (`/api/key`)
   - Tenant access (`/api/tenant`)

### Obtaining a FusionAuth API Key

1. **Start the mesh infrastructure** (if not already running):
   ```bash
   cd mesh
   docker compose up -d
   ```

2. **Access FusionAuth Admin Interface**:
   ```
   http://localhost/auth/admin
   ```

3. **Create API Key**:
   - Navigate to Settings → API Keys
   - Click "Add API Key"
   - Name: `GameHub Setup Key`
   - Select required permissions (see prerequisites above)
   - Save and copy the API key

### Running FusionAuth Setup

#### Option 1: Using the Shell Script (Recommended)

```bash
# From the GameHub project root
./scripts/setup.sh YOUR_FUSIONAUTH_API_KEY
```

**What this does:**
- Validates Node.js environment
- Installs setup application dependencies
- Builds the TypeScript application
- Runs the FusionAuth setup with your API key
- Provides next steps for completion

#### Option 2: Using npm Commands

```bash
# Navigate to setup directory
cd setup

# Install dependencies and build
npm install
npm run build

# Run the setup
npm start -- --api-key YOUR_FUSIONAUTH_API_KEY
```

#### Option 3: Development Mode

```bash
cd setup
npm install
npm run dev -- --api-key YOUR_FUSIONAUTH_API_KEY --verbose
```

### FusionAuth Setup Configuration Options

The setup application supports extensive configuration options:

```bash
./scripts/setup.sh YOUR_API_KEY \
  --fusion-auth-url http://localhost/auth \
  --app-name "GameHub" \
  --admin-redirect-uri http://localhost/admin/callback \
  --player-redirect-uri http://localhost/player/callback \
  --verbose \
  --force
```

**Key Options:**
- `--fusion-auth-url`: FusionAuth base URL (default: `http://localhost/auth`)
- `--app-name`: Application name in FusionAuth (default: `GameHub`)
- `--admin-redirect-uri`: Admin OAuth callback URL
- `--player-redirect-uri`: Player OAuth callback URL
- `--verbose`: Enable detailed logging
- `--force`: Overwrite existing configuration files

For complete configuration options, see the [FusionAuth Setup Documentation](../setup/README.md).

### What the FusionAuth Setup Does

The automated setup performs the following operations:

1. **Creates FusionAuth Application**: Sets up OAuth 2.0 application with PKCE security
2. **Configures CORS**: Adds necessary cross-origin request permissions
3. **Generates Provider Files**: Creates authentication provider for Jinaga replicator
4. **Creates Environment Files**: Generates configuration for mesh and admin application
5. **Retrieves Signing Keys**: Obtains JWT signing key information

### Generated Files

The setup creates these configuration files:

- `mesh/replicator/authentication/fusionauth.provider` - Replicator authentication provider
- `mesh/.env.local` - Mesh environment variables
- `app/gamehub-admin/.env.container.local` - Admin application environment

### Post-FusionAuth Setup Steps

After the FusionAuth setup completes, you must complete these additional steps:

1. **Create a Tenant**:
   - Navigate to `http://localhost/admin/tenants`
   - Create a new tenant for your game/organization
   - **Important**: Copy the generated tenant public key

2. **Update Configuration with Tenant Key**:
   ```bash
   cd setup
   npm run update-tenant-key -- --tenant-key "YOUR_TENANT_PUBLIC_KEY"
   ```

3. **Restart the Docker Stack**:
   ```bash
   cd mesh
   docker compose down && docker compose up -d
   ```

4. **Authorize Service Principal**:
   - Check player-ip logs for the service principal public key
   - Add it in the admin app's Service Principals page

For detailed post-setup instructions, see the [FusionAuth Setup Documentation](../setup/README.md#post-setup-steps).

## Initial Setup Scripts

### Complete Automated Setup

For a complete setup including FusionAuth configuration:

```bash
# 1. Initialize mesh infrastructure
./scripts/init-mesh.sh

# 2. Start the infrastructure
cd mesh
docker compose up -d

# 3. Run FusionAuth setup
./scripts/setup.sh YOUR_FUSIONAUTH_API_KEY

# 4. Follow post-setup steps (see FusionAuth Setup Documentation)
```

### Legacy Manual Setup
The project also supports manual setup for advanced users who need custom configuration:

### Manual Setup Steps

**Recommended:** Use the automated setup script `./scripts/init-mesh.sh` for initial configuration. The manual steps below are provided for advanced users who need custom configuration.

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

**Recommended:** Use `./scripts/init-mesh.sh` to automatically set up the environment.

For manual setup, configure the mesh infrastructure environment:

```bash
cd ../mesh
cp .env.example .env
# Edit .env file with your specific configuration
```

#### 4. Set Up Secrets

**Recommended:** The `init-mesh.sh` script handles all secret generation automatically.

For manual secret setup:

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
docker compose up -d
docker compose ps
docker compose logs -f [service-name]
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
docker compose exec postgres pg_isready -U gamehub_admin -d gamehub

# Check service logs
docker compose logs -f postgres
docker compose logs -f fusionauth
docker compose logs -f gamehub-replicator
```

When you make changes to the model or authorization rules:

```bash
cd app
npm run build:model
npm run generate-policies
cd ../mesh
docker compose restart gamehub-replicator
```

When you make changes to the admin application:

```bash
cd app
npm run build:admin
cd ../mesh
docker compose restart nginx
```

**Or build and deploy to container:**
```bash
cd app/gamehub-admin
npm run build:container
```

## Next Steps

After completing the project setup, including the FusionAuth configuration, you have several paths forward:

### Immediate Next Steps

1. **Complete FusionAuth Setup** (if not already done):
   - Follow the [FusionAuth Setup Documentation](../setup/README.md) for detailed instructions
   - Ensure all post-setup steps are completed, including tenant creation and service principal authorization

2. **Verify Setup**:
   ```bash
   # Check all services are running
   cd mesh
   docker compose ps
   
   # Test health endpoints
   curl http://localhost/health
   curl http://localhost/admin/
   ```

3. **Proceed to Data Model Configuration**:
   - Continue to [Jinaga Data Model](./04-jinaga-model.md) to understand and configure the data layer

### Development Workflow

With the infrastructure set up successfully, you now have access to:

**Core Infrastructure:**
- PostgreSQL database for FusionAuth and application data
- FusionAuth OAuth2 provider with configured applications
- Jinaga replicator with real-time synchronization
- NGINX reverse proxy with SSL support
- Network segmentation for security
- Comprehensive health monitoring

**Development Endpoints:**
- **Admin Interface**: `http://localhost/admin/` - GameHub administration
- **FusionAuth Admin**: `http://localhost/auth/admin` - Identity management
- **API Gateway**: `http://localhost/` - Main application gateway
- **Replicator**: `http://localhost/replicator/` - Real-time data sync

### Troubleshooting

If you encounter issues during setup:

1. **Check Service Status**:
   ```bash
   docker compose ps
   docker compose logs [service-name]
   ```

2. **Verify FusionAuth Setup**:
   - Ensure API key has correct permissions
   - Check that all configuration files were generated
   - Verify tenant creation and service principal authorization

3. **Review Documentation**:
   - [FusionAuth Setup Documentation](../setup/README.md) for detailed setup instructions
   - [Troubleshooting Guide](./10-troubleshooting.md) for common issues

### Ready for Development

Once setup is complete, you can begin:
- Developing GameHub applications
- Configuring game-specific data models
- Setting up user authentication flows
- Building administrative interfaces

---

*Encountering setup issues? Check the [Troubleshooting Guide](./10-troubleshooting.md) for solutions to common problems.*