# Getting Started with GameHub

Welcome to the GameHub platform - a comprehensive collaborative multiplayer game management system built with modern web technologies including React, Jinaga, and Docker orchestration.

## Overview

GameHub is a full-stack application designed to manage multiplayer gaming sessions and collaborative gameplay experiences. The platform is built as a Node.js monorepo using npm workspaces, containing shared libraries and multiple applications including administrative dashboards and backend services, all orchestrated through Docker Compose.

## Architecture

The platform is built using:
- **Frontend**: React applications with Vite build system
- **Data Layer**: Jinaga for distributed data management
- **Backend**: Node.js services with Express
- **Authentication**: OAuth-based authentication system
- **Orchestration**: Docker Compose for service management
- **Deployment**: GitHub Actions CI/CD pipelines

## Quick Start

1. **Prerequisites**: Ensure you have Docker, Node.js, and required development tools installed
2. **Clone & Setup**: Clone the repository and navigate to the app directory
3. **Initialize Mesh**: Run `./scripts/init-mesh.sh` to set up `.env` with secrets
4. **Install Dependencies**: Run `npm install` to install all workspace dependencies
5. **Build Shared Model**: Run `npm run build:model` to build the shared Jinaga model
6. **Start Development**: Use `npm run dev:admin` or `npm run dev:player-ip` for development
7. **Production Mode**: Use Docker Compose to start all services for production-like environment

## Documentation Sections

Follow these guides in order to set up your development environment:

### 📋 [Prerequisites](./01-prerequisites.md)
System requirements, development tools, and environment setup

### 🏗️ [Architecture Overview](./02-architecture-overview.md)
High-level system architecture and component relationships

### 🚀 [Project Setup](./03-project-setup.md)
Initial project setup, directory structure, and configuration

### 📊 [Jinaga Data Model](./04-jinaga-model.md)
Data model setup, fact definitions, and distribution rules

### ⚛️ [React Applications](./05-react-applications.md)
Frontend application setup with Vite and component architecture

### 🔧 [Backend Services](./06-backend-services.md)
API services, routing, and business logic configuration

### 🐳 [Docker Orchestration](./07-docker-orchestration.md)
Container setup, service networking, and Docker Compose configuration

### 🔐 [Authentication](./08-authentication.md)
OAuth setup, user management, and security configuration

### 🚀 [Deployment](./09-deployment.md)
CI/CD pipelines, Azure deployment, and production configuration

### 🔧 [Troubleshooting](./10-troubleshooting.md)
Common issues, debugging tips, and solutions

---

*This documentation is designed to get you up and running quickly. Each section builds upon the previous one, so we recommend following them in order.*