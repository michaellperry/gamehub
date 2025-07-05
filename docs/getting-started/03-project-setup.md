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
    - [Local Development Mode (Recommended for Development)](#local-development-mode-recommended-for-development)
    - [Production-like Environment](#production-like-environment)
      - [Development URLs (Production Mode)](#development-urls-production-mode)
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
├── player-ip/              # Node.js console application for player IP management
├── gamehub-admin/          # Vite-based web application for administration
└── [other legacy services] # Additional services (being migrated)
```

**Key Components:**
- **gamehub-model** - Shared TypeScript library with dual ESM/CJS builds
- **service-ip** - OAuth 2.0 Client Credentials service for service-to-service authentication
- **player-ip** - Node.js console application for player IP management
- **gamehub-admin** - Vite-based web application for administration

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
Backend services require client credentials for inter-service communication.

Run these commands to generate and configure the shared secrets:

```bash
SHARED_SECRET=$(openssl rand -base64 32)
mkdir -p mesh/secrets/service-ip/clients
echo "$SHARED_SECRET" > mesh/secrets/service-ip/clients/player-ip
mkdir -p mesh/secrets/player-ip
echo "$SHARED_SECRET" > mesh/secrets/player-ip/service-ip-client
```

**What these commands do:**
1. Generate a random 32-bit shared secret encoded in base-64
2. Create service IP client credentials directory
3. Store the player-ip client credentials with the shared secret
4. Create player IP service credentials directory  
5. Store the service IP client credentials (using the same shared secret)

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
- player-ip
- gamehub-admin

#### 2. Build Shared Model

The Jinaga model must be built before other services can use it:

```bash
npm run build:model
npm run generate-policies
```

**Note:** Run these commands from the app directory (monorepo root)

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

**Or for player-ip console application:**
```bash
npm run dev:player-ip
```

**Available Development Scripts:**
- `npm run build` - Build all packages
- `npm run build:model` - Build only the gamehub-model package
- `npm run build:service-ip` - Build only the service-ip package
- `npm run dev:admin` - Start development mode for gamehub-admin
- `npm run dev:service-ip` - Start development mode for service-ip
- `npm run dev:player-ip` - Start development mode for player-ip
- `npm run start:service-ip` - Start production mode for service-ip
- `npm run generate-policies` - Generate Jinaga policies from gamehub-model

### Production-like Environment
Start all services using Docker Compose for a production-like environment:

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
- **Main Application**: http://localhost (Nginx routes to appropriate apps)
- **Admin Portal**: http://localhost/admin
- **FusionAuth Admin**: http://localhost:9011
- **Jinaga Replicator**: http://localhost:8080 (internal)

When you make changes to the model or authorization rules:

```bash
npm run build:model
npm run generate-policies
cd ../mesh
docker compose restart front-end-replicator
```

When you make changes to the admin application:

```bash
npm run build:admin
```

**Or build and deploy to container:**
```bash
cd gamehub-admin
npm run build:container
```

## Next Steps

With the project set up successfully, proceed to [Jinaga Data Model](./04-jinaga-model.md) to understand and configure the data layer.

---

*Encountering setup issues? Check the [Troubleshooting Guide](./10-troubleshooting.md) for solutions to common problems.*