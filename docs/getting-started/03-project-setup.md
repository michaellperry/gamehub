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
  - [Initial Setup Scripts](#initial-setup-scripts)
    - [Automated Setup](#automated-setup)
    - [Manual Setup Steps](#manual-setup-steps)
      - [1. Install Application Dependencies](#1-install-application-dependencies)
      - [2. Build Shared Model](#2-build-shared-model)
  - [Development Workflow](#development-workflow)
    - [Local Development Mode (Recommended for Development)](#local-development-mode-recommended-for-development)
    - [Production-like Environment](#production-like-environment)
      - [Development URLs (Production Mode)](#development-urls-production-mode)
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

The `/app` directory contains a Node.js monorepo using npm workspaces with the following structure:

```
app/
├── package.json            # Root package.json with workspace configuration
├── tsconfig.json           # Root TypeScript configuration
├── gamehub-model/          # Shared TypeScript library with Jinaga domain model
├── player-ip/              # Node.js console application for player IP management
├── gamehub-admin/          # Vite-based web application for administration
└── [other legacy services] # Additional services (being migrated)
```

**Key Components:**
- **gamehub-model** - Shared TypeScript library with dual ESM/CJS builds
- **player-ip** - Node.js console application for player IP management
- **gamehub-admin** - Vite-based web application for administration
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

The monorepo uses npm workspaces, so you can install all dependencies from the root:

```bash
# Navigate to the app directory (monorepo root)
cd app

# Install dependencies for all workspace packages
npm install
```

This single command installs dependencies for all packages in the monorepo:
- gamehub-model
- player-ip
- gamehub-admin

#### 2. Build Shared Model

The Jinaga model must be built before other services can use it:

```bash
# From the app directory (monorepo root)
npm run build:model

# Generate authorization policies
npm run generate-policies
```

## Development Workflow

The monorepo supports both local development and production-like environments.

### Local Development Mode (Recommended for Development)

For active development, use the monorepo's development scripts:

```bash
# Navigate to the app directory (monorepo root)
cd app

# Install dependencies for all packages
npm install

# Build the shared model (required first)
npm run build:model

# Start development mode for admin application
npm run dev:admin  # Usually runs on http://localhost:5173

# OR start development mode for player-ip console application
npm run dev:player-ip
```

**Available Development Scripts:**
- `npm run build` - Build all packages
- `npm run build:model` - Build only the gamehub-model package
- `npm run dev:admin` - Start development mode for gamehub-admin
- `npm run dev:player-ip` - Start development mode for player-ip
- `npm run generate-policies` - Generate Jinaga policies from gamehub-model

### Production-like Environment
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
- **FusionAuth Admin**: http://localhost:9011
- **Jinaga Replicator**: http://localhost:8080 (internal)

When you make changes to the model or authorization rules:

```bash
# From the app directory (monorepo root)
npm run build:model
npm run generate-policies

# Restart the replicator service to apply changes
cd ../mesh
docker compose restart front-end-replicator
```

When you make changes to the admin application:

```bash
# From the app directory (monorepo root)
npm run build:admin

# Or build and deploy to container
cd gamehub-admin
npm run build:container
```

## Next Steps

With the project set up successfully, proceed to [Jinaga Data Model](./04-jinaga-model.md) to understand and configure the data layer.

---

*Encountering setup issues? Check the [Troubleshooting Guide](./10-troubleshooting.md) for solutions to common problems.*