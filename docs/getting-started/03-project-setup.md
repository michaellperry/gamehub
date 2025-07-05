# Project Setup

This guide walks you through the initial project setup, directory structure understanding, and basic configuration needed to start development.

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
  - [Initial Setup Scripts](#initial-setup-scripts)
    - [Automated Setup](#automated-setup)
    - [Manual Setup Steps](#manual-setup-steps)
      - [1. Install Application Dependencies](#1-install-application-dependencies)
      - [2. Build Shared Model](#2-build-shared-model)
  - [Development Workflow](#development-workflow)
    - [Production-like Environment (Recommended)](#production-like-environment-recommended)
      - [Development URLs (Production Mode)](#development-urls-production-mode)
    - [Local Development Mode](#local-development-mode)
  - [Next Steps](#next-steps)

## Repository Setup

### Clone the Repository
```bash
# Clone the repository
git clone <repository-url>
cd gamehub

# Verify the clone
ls -la
```

### Git Configuration
```bash
# Set up Git user information
git config user.name "Your Name"
git config user.email "your.email@company.com"

# Set up Git hooks (if available)
# ./scripts/setup-git-hooks.sh
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
```
app/
├── gamehub-admin/          # Admin React application
├── gamehub-player/         # Player React application
├── gamehub-model/          # Shared Jinaga data model
├── service-ip/             # Core backend service
├── player-ip/              # Player-specific service
├── content-store/          # File management service
└── load-test/              # Performance testing
```

### Infrastructure Structure (`/mesh`)
```
mesh/
├── nginx/                  # Reverse proxy configuration
├── front-end/              # Frontend routing and policies
├── secrets/                # Secret management
└── docker compose files    # Service orchestration
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
Backend services require client credentials for inter-service communication:

```bash
# Generate a random 32-bit shared secret encoded in base-64
SHARED_SECRET=$(openssl rand -base64 32)

# Create service IP client credentials
mkdir -p mesh/secrets/service-ip/clients
echo "player-ip:$SHARED_SECRET" > mesh/secrets/service-ip/clients/player-ip

# Create player IP service credentials (using the same shared secret)
mkdir -p mesh/secrets/player-ip
echo "$SHARED_SECRET" > mesh/secrets/player-ip/service-ip-client
```

## Initial Setup Scripts

### Automated Setup
The project includes setup scripts for streamlined initialization:

```bash
# Navigate to setup scripts
cd scripts/setup

# Install setup application dependencies
npm install

# Build the setup application
npm run build

# Run automated setup
npm start -- --api-key <your-fusionauth-api-key>
```

### Manual Setup Steps

#### 1. Install Application Dependencies
```bash
# Install shared model dependencies (required first)
cd app/gamehub-model
npm install
npm run build

# Install admin app dependencies
cd ../gamehub-admin
npm install

# Install player app dependencies
cd ../gamehub-player
npm install

# Install backend service dependencies
cd ../service-ip
npm install

cd ../player-ip
npm install

cd ../content-store
npm install
```

#### 2. Build Shared Model
The Jinaga model must be built before other services can use it:

```bash
cd app/gamehub-model
npm run build

# Generate authorization policies
npm run generate-policies
```

## Development Workflow

### Production-like Environment (Recommended)
Start all services using Docker Compose for a production-like environment:

```bash
# Navigate to mesh directory
cd mesh/

# Start all services
docker compose up -d

# View service status
docker compose ps

# View logs
docker compose logs -f [service-name]
```

#### Development URLs (Production Mode)
- **Main Application**: http://localhost (Nginx routes to appropriate apps)
- **Admin Portal**: http://localhost/admin
- **Player Portal**: http://localhost/player
- **FusionAuth Admin**: http://localhost:9011
- **Jinaga Replicator**: http://localhost:8080 (internal)

When you make a change to service code, run this command again to update the containers. This is not necessary for deploying common application changes.

```bash
# After changing authorization or distribution rules, build and deploy a policy file for the replicator
cd app/gamehub-model
npm run build
npm run generate-policies

# Restart the replicator service to apply changes
cd ../../mesh
docker compose restart front-end-replicator
```

```bash
# After changing the admin portal, build and deploy a new bundle to NGINX
cd app/gamehub-admin
npm run build:container
```

```bash
# After changing the player app, build and deploy a new bundle to NGINX
cd app/gamehub-player
npm run build:container
```

### Local Development Mode
In development mode, applications use an in-memory data store seeded with test data. Edit the test data in `jinaga-config.ts` to set up local development scenarios.

```bash
# Admin app development
cd app/gamehub-admin
npm run dev  # Usually runs on http://localhost:5173
```

```bash
# Player app development
cd app/gamehub-player
npm run dev  # Usually runs on http://localhost:5174
```

## Next Steps

With the project set up successfully, proceed to [Jinaga Data Model](./04-jinaga-model.md) to understand and configure the data layer.

---

*Encountering setup issues? Check the [Troubleshooting Guide](./10-troubleshooting.md) for solutions to common problems.*