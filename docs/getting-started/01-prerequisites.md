# Prerequisites

This guide covers the system requirements and prerequisites needed to develop and run the GameHub platform.

## Table of Contents

- [System Requirements](#system-requirements)
- [Development Tools](#development-tools)
- [Runtime Dependencies](#runtime-dependencies)
- [Optional Tools](#optional-tools)
- [Environment Setup](#environment-setup)
- [Verification](#verification)

## System Requirements

### Operating System
- **macOS**: 10.15 (Catalina) or later
- **Windows**: Windows 10/11 with WSL2 enabled
- **Linux**: Ubuntu 18.04+ or equivalent distribution

### Hardware Requirements
- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: At least 10GB free space for development environment
- **CPU**: Multi-core processor recommended for Docker containers

## Development Tools

### Required Tools

#### Node.js and npm
- **Version**: Node.js 18.x or later
- **Package Manager**: npm 9.x or later
- **Installation**: Download from [nodejs.org](https://nodejs.org/)

#### Docker and Docker Compose
- **Docker**: Version 20.x or later
- **Docker Compose**: Version 2.x or later
- **Installation**: Download Docker Desktop from [docker.com](https://docker.com/)

#### Git
- **Version**: Git 2.30 or later
- **Configuration**: Set up user name and email
- **SSH Keys**: Configure SSH keys for repository access

### Code Editor
- **Recommended**: Visual Studio Code with extensions:
  - TypeScript and JavaScript Language Features
  - Docker extension
  - GitLens
  - Prettier - Code formatter
  - ESLint

## Runtime Dependencies

### Database Systems
- **PostgreSQL**: Version 16.0 or later for Jinaga replicator and FusionAuth
- **SQLite**: For local development and player-ip service data storage

### Authentication Services
- **FusionAuth**: Self-hosted authentication service (handled via Docker)
- **OAuth 2.0**: JWT-based authentication with refresh token support
- **Certificates**: SSL certificates for HTTPS (development and production)

### Container Registry
- **Azure Container Registry**: For production deployments
- **Docker Hub**: Alternative for public images

## Optional Tools

### Development Utilities
- **Postman**: API testing and development
- **Azure CLI**: For Azure resource management and container registry access
- **FusionAuth CLI**: For authentication service management
- **HTTP files**: VS Code REST Client extension for API testing

### Monitoring and Debugging
- **Docker Desktop**: Container management and monitoring
- **Browser DevTools**: Chrome/Firefox developer tools
- **Network Tools**: curl, wget for API testing
- **Database Tools**: pgAdmin, DBeaver for PostgreSQL management

## Environment Setup

### Environment Variables
Create the following environment files in the `mesh/` directory:
- `.env`: Main environment configuration
- `.env.local`: Local overrides (optional, not committed to git)

Required environment variables:
```bash
# Database Configuration
POSTGRES_USER=gamehub_user
POSTGRES_PASSWORD=secure_password_here
DATABASE_USERNAME=fusionauth_user
DATABASE_PASSWORD=fusionauth_password_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# FusionAuth Configuration
FUSIONAUTH_APP_MEMORY=512M
FUSIONAUTH_APP_RUNTIME_MODE=development
FUSIONAUTH_SEARCH_ENGINE_TYPE=database
```

### Network Configuration
- **Port 80**: Nginx reverse proxy (main entry point)
- **Port 8080**: Jinaga replicator (internal)
- **Port 8081**: Content store service (internal)
- **Port 8082**: Player IP service (internal)
- **Port 8083**: Service IP (internal)
- **Port 9011**: FusionAuth admin interface
- **Port 5432**: PostgreSQL database (internal)

### Development vs Production Ports
- **Development**: Individual services run on separate ports (3000-3010)
- **Production**: All traffic routes through Nginx on port 80

## Verification

### Check Installations
```bash
# Verify Node.js and npm (should be 18.x or later)
node --version
npm --version

# Verify Docker and Docker Compose
docker --version
docker-compose --version

# Verify Git configuration
git --version
git config --list | grep user
```

### Test Docker Setup
```bash
# Test Docker installation
docker run hello-world

# Test Docker Compose with project
cd mesh/
docker-compose config  # Validate compose file

# Test PostgreSQL image pull
docker pull postgres:16.0-bookworm
```

### Validate Development Environment
- [ ] Node.js 18.x or later installed
- [ ] Docker Desktop running and accessible
- [ ] Git configured with user name and email
- [ ] Code editor set up with recommended extensions
- [ ] Environment variables configured in `mesh/.env`
- [ ] All required ports available (80, 8080-8083, 9011, 5432)
- [ ] Azure CLI installed (for production deployments)

### Test Project Structure Access
```bash
# Verify project structure
ls -la app/
ls -la mesh/
ls -la docs/

# Check key configuration files
cat mesh/docker-compose.yml | head -20
cat app/gamehub-model/package.json | grep version
```

## Next Steps

Once all prerequisites are met, proceed to the [Architecture Overview](./02-architecture-overview.md) to understand the system design before setting up the project.

---

*Having issues with prerequisites? Check the [Troubleshooting Guide](./10-troubleshooting.md) for common setup problems and solutions.*