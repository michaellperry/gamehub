# Prerequisites

This guide covers the system requirements and prerequisites needed to develop and run the GameHub platform.

## Table of Contents

- [Prerequisites](#prerequisites)
  - [Table of Contents](#table-of-contents)
  - [System Requirements](#system-requirements)
    - [Operating System](#operating-system)
    - [Hardware Requirements](#hardware-requirements)
  - [Development Tools](#development-tools)
    - [Node.js and npm](#nodejs-and-npm)
    - [Docker and Docker Compose](#docker-and-docker-compose)
    - [Git](#git)
  - [Environment Setup](#environment-setup)
    - [Environment Variables](#environment-variables)
    - [Network Configuration](#network-configuration)
    - [Development vs Production Ports](#development-vs-production-ports)
  - [Verification](#verification)
    - [Check Installations](#check-installations)
  - [Next Steps](#next-steps)

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

### Node.js and npm
- **Version**: Node.js 18.x or later
- **Package Manager**: npm 9.x or later
- **Installation**: Download from [nodejs.org](https://nodejs.org/)

### Docker and Docker Compose
- **Docker**: Version 20.x or later
- **Docker Compose**: Version 2.x or later
- **Installation**: Download Docker Desktop from [docker.com](https://docker.com/)

### Git
- **Version**: Git 2.30 or later
- **Configuration**: Set up user name and email
- **SSH Keys**: Configure SSH keys for repository access

## Environment Setup

### Environment Variables
Create the following environment files in the `mesh/` directory:
- `.env`: Main environment configuration
- `.env.local`: Local overrides (optional, not committed to git)

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

## Next Steps

Once all prerequisites are met, proceed to the [Architecture Overview](./02-architecture-overview.md) to understand the system design before setting up the project.

---

*Having issues with prerequisites? Check the [Troubleshooting Guide](./10-troubleshooting.md) for common setup problems and solutions.*