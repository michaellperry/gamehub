# Project Setup

This guide walks you through the initial project setup, directory structure understanding, and basic configuration needed to start development.

## Table of Contents

- [Repository Setup](#repository-setup)
- [Directory Structure](#directory-structure)
- [Environment Configuration](#environment-configuration)
- [Initial Setup Scripts](#initial-setup-scripts)
- [Development Workflow](#development-workflow)
- [Verification](#verification)

## Repository Setup

### Clone the Repository
```bash
# Clone the repository
git clone <repository-url>
cd gamehub

# Verify the clone
ls -la
```

### Branch Strategy
- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: Individual feature branches
- **hotfix/***: Critical production fixes

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
└── docker-compose files   # Service orchestration
```

### Scripts Structure (`/scripts`)
```
scripts/
├── setup/                  # Initial setup automation
│   ├── src/               # Setup script source code
│   └── package.json       # Setup dependencies
└── deployment/            # Deployment automation
```

## Environment Configuration

### Main Environment Configuration
The primary environment configuration is located in the `mesh/` directory:

```bash
# Navigate to mesh directory
cd mesh/

# Create main environment file
cat > .env << 'EOF'
# Database Configuration
POSTGRES_USER=gamehub_user
POSTGRES_PASSWORD=your_secure_password_here
DATABASE_USERNAME=fusionauth_user
DATABASE_PASSWORD=fusionauth_password_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_minimum_32_characters

# FusionAuth Configuration
FUSIONAUTH_APP_MEMORY=512M
FUSIONAUTH_APP_RUNTIME_MODE=development
FUSIONAUTH_SEARCH_ENGINE_TYPE=database
EOF

# Create optional local overrides (not committed to git)
touch .env.local
```

### Frontend Application Configuration
Frontend applications are built as static files and served via Nginx in production:

#### Development Environment Variables
For development mode, create `.env` files in each React application:

```bash
# Admin Application
cd app/gamehub-admin
cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:8082
VITE_REPLICATOR_URL=http://localhost:8080/jinaga
VITE_CONTENT_STORE_URL=http://localhost:8081
VITE_AUTH_URL=http://localhost:9011
EOF

# Player Application
cd ../gamehub-player
cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:8082
VITE_REPLICATOR_URL=http://localhost:8080/jinaga
VITE_CONTENT_STORE_URL=http://localhost:8081
VITE_AUTH_URL=http://localhost:9011
EOF
```

### Service Authentication Setup
Backend services require client credentials for inter-service communication:

```bash
# Create service IP client credentials
mkdir -p mesh/secrets/service-ip/clients
echo "player-ip:secure_client_secret_here" > mesh/secrets/service-ip/clients/player-ip

# Create player IP service credentials
mkdir -p mesh/secrets/player-ip
echo "secure_client_secret_here" > mesh/secrets/player-ip/service-ip-client
```

## Initial Setup Scripts

### Automated Setup
The project includes setup scripts for streamlined initialization:

```bash
# Navigate to setup scripts
cd scripts/setup

# Install setup script dependencies
npm install

# Run automated setup (when available)
npm run setup
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

#### 3. Database and Services Setup
```bash
# Navigate to mesh directory
cd mesh/

# Start core services (database, auth)
docker-compose up -d db fusionauth

# Wait for services to be ready
docker-compose logs -f db fusionauth

# Start remaining services
docker-compose up -d
```

## Development Workflow

### Production-like Environment (Recommended)
Start all services using Docker Compose for a production-like environment:

```bash
# Navigate to mesh directory
cd mesh/

# Start all services
docker-compose up -d

# View service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]
```

### Development URLs (Production Mode)
- **Main Application**: http://localhost (Nginx routes to appropriate apps)
- **Admin Portal**: http://localhost/admin
- **Player Portal**: http://localhost/player
- **FusionAuth Admin**: http://localhost:9011
- **Jinaga Replicator**: http://localhost:8080 (internal)

### Individual Development Mode
For frontend development with hot reload:

```bash
# Terminal 1: Start backend services
cd mesh/
docker-compose up -d service-ip player-ip content-store front-end-replicator db fusionauth

# Terminal 2: Admin app development
cd app/gamehub-admin
npm run dev  # Usually runs on http://localhost:5173

# Terminal 3: Player app development
cd app/gamehub-player
npm run dev  # Usually runs on http://localhost:5174
```

### Code Quality Tools
```bash
# In each application directory
cd app/[application-name]

# Run linting (if configured)
npm run lint

# Run type checking
npm run type-check

# Run tests (if available)
npm run test

# Build for production
npm run build
```

### Model Development Workflow
When modifying the shared Jinaga model:

```bash
cd app/gamehub-model

# Make changes to model files
# Then rebuild and regenerate policies
npm run build
npm run generate-policies

# Restart services that depend on the model
cd ../mesh
docker-compose restart service-ip player-ip front-end-replicator
```

## Verification

### Check Service Health
```bash
# Navigate to mesh directory
cd mesh/

# Verify all services are running
docker-compose ps

# Check service logs
docker-compose logs -f

# Test main application
curl -I http://localhost

# Test FusionAuth
curl -I http://localhost:9011

# Test Jinaga replicator
curl -I http://localhost:8080
```

### Verify Frontend Applications
- [ ] Main application loads at http://localhost
- [ ] Admin portal accessible at http://localhost/admin
- [ ] Player portal accessible at http://localhost/player
- [ ] No console errors in browser developer tools
- [ ] Static assets load correctly (CSS, JS, images)

### Verify Backend Services
- [ ] All Docker containers running (`docker-compose ps`)
- [ ] Database connection established (check logs)
- [ ] Jinaga replicator responding
- [ ] Service-to-service authentication working
- [ ] File upload functionality works (content-store)
- [ ] FusionAuth admin interface accessible

### Verify Data Model
```bash
# Check model build
cd app/gamehub-model
ls -la dist/

# Verify policy generation
cat ../../mesh/front-end/policies/gamehub.policy

# Test model in applications
cd ../gamehub-admin
npm run build  # Should complete without errors
```

### Common Setup Issues
- **Port 80 conflicts**: Ensure no other web server is running
- **Docker issues**: Verify Docker Desktop is running and has sufficient resources
- **Permission errors**: Check file permissions on secret files
- **Environment variables**: Verify all required variables are set in `mesh/.env`
- **Model build errors**: Ensure gamehub-model builds successfully first
- **Service startup order**: Database and FusionAuth must start before other services

## Next Steps

With the project set up successfully, proceed to [Jinaga Data Model](./04-jinaga-model.md) to understand and configure the data layer.

---

*Encountering setup issues? Check the [Troubleshooting Guide](./10-troubleshooting.md) for solutions to common problems.*