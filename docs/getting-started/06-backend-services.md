# Backend Services

This guide covers the setup and configuration of the backend services that provide authentication, API endpoints, and content management for the GameHub platform.

## Table of Contents

- [Backend Services](#backend-services)
  - [Table of Contents](#table-of-contents)
  - [Backend Services Architecture](#backend-services-architecture)
    - [Overview of Backend Services](#overview-of-backend-services)
    - [Service Communication Patterns](#service-communication-patterns)
    - [API Design Principles](#api-design-principles)
  - [Player IP Management (player-ip)](#player-ip-management-player-ip)
    - [Service Purpose and Functionality](#service-purpose-and-functionality)
    - [Directory Structure](#directory-structure)
    - [Development Commands](#development-commands)
  - [Service Identity Provider (service-ip)](#service-identity-provider-service-ip)
    - [OAuth 2.0 Client Credentials Flow Implementation](#oauth-20-client-credentials-flow-implementation)
    - [Directory Structure](#directory-structure-1)
    - [Development Commands](#development-commands-1)
    - [Environment Configuration](#environment-configuration)
    - [Client Management](#client-management)
    - [API Endpoints](#api-endpoints)
  - [Content Store Service](#content-store-service)
    - [File Storage and Content Management](#file-storage-and-content-management)
    - [Directory Structure](#directory-structure-2)
  - [Troubleshooting Common Issues](#troubleshooting-common-issues)
    - [Authentication Issues](#authentication-issues)
    - [Database Issues](#database-issues)
    - [File Upload Issues](#file-upload-issues)
  - [Next Steps](#next-steps)

## Backend Services Architecture

### Overview of Backend Services

GameHub uses a microservices architecture with three specialized backend services that handle different aspects of the platform:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   player-ip     │    │   service-ip    │    │ content-store   │
│   Port: 8082    │    │   Port: 8083    │    │   Port: 8081    │
│                 │    │                 │    │                 │
│ • OAuth 2.0 +   │    │ • Client Creds  │    │ • File Upload   │
│   PKCE Flow     │    │   Flow          │    │ • Content Hash  │
│ • JWT Tokens    │    │ • Service Auth  │    │ • Static Serve  │
│ • SQLite DB     │    │ • File-based    │    │ • Auth Protect  │
│ • Cookie Auth   │    │   Clients       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Frontend Apps  │
                    │                 │
                    │ • Admin Portal  │
                    │ • Player App    │
                    └─────────────────┘
```

### Service Communication Patterns

1. **Frontend to player-ip**: OAuth 2.0 Authorization Code Flow with PKCE
2. **Frontend to service-ip**: Client Credentials Flow for service authentication
3. **Frontend to content-store**: Bearer token authentication via player-ip
4. **Service-to-service**: JWT token validation and service client authentication via service-ip

### API Design Principles

- **RESTful Architecture**: Standard HTTP methods and resource-based URLs
- **Stateless Design**: Each request contains all necessary information
- **JWT-based Authentication**: Secure, stateless token-based auth
- **CORS Support**: Cross-origin resource sharing for web applications
- **Error Standardization**: Consistent error response formats
- **Content Negotiation**: JSON for APIs, multipart for file uploads

## Player IP Management (player-ip)

### Service Purpose and Functionality

The player-ip service is now a Node.js console application for player IP management rather than a web service. It handles player identity and IP address management operations.

**Key Features:**
- Node.js console application
- Player IP address management
- Integration with shared gamehub-model
- TypeScript-based implementation
- Part of the monorepo workspace

### Directory Structure

```
app/player-ip/
├── src/
│   └── index.ts              # Main console application entry point
├── package.json              # Package configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Service documentation
```

The player-ip application is a simple console application that depends on the shared `gamehub-model` package for data models and business logic.

### Development Commands

Since player-ip is part of the monorepo, you can use the workspace commands:

```bash
# From the app directory (monorepo root)
# Install dependencies for all packages
npm install

# Start development mode for player-ip
npm run dev:player-ip

# Build only the player-ip package
npm run build:player-ip

# Or work directly in the package directory
cd app/player-ip
npm run dev
npm run build
```

## Service Identity Provider (service-ip)

### OAuth 2.0 Client Credentials Flow Implementation

The service-ip service implements OAuth 2.0 Client Credentials Flow for service-to-service authentication, providing JWT tokens for backend services and administrative applications. It runs on **Port 8083** and is fully integrated into the GameHub monorepo.

**Key Features:**
- OAuth 2.0 Client Credentials Flow for service authentication
- File-based client configuration and management
- JWT token issuance and validation for services
- Secure client secret management
- Docker containerization support
- Integration with mesh infrastructure
- TypeScript implementation with Express.js

### Directory Structure

```
app/service-ip/
├── src/
│   ├── config/
│   │   └── environment.ts    # Environment configuration and validation
│   ├── models/
│   │   ├── client.ts         # Client model definitions
│   │   └── index.ts          # Model exports
│   ├── repository/
│   │   ├── file/
│   │   │   └── client.repository.ts  # File-based client storage
│   │   └── index.ts          # Repository exports
│   ├── routes/
│   │   ├── token.ts          # OAuth token endpoint
│   │   └── index.ts          # Route exports
│   ├── utils/
│   │   ├── jwt.ts            # JWT utilities and validation
│   │   └── index.ts          # Utility exports
│   └── server.ts             # Express server setup
├── secrets/
│   └── clients/              # Client credential files
├── package.json              # Package configuration
├── tsconfig.json             # TypeScript configuration
├── Dockerfile                # Docker container configuration
├── .env.example              # Environment template
└── README.md                 # Service documentation
```

### Development Commands

Service-ip uses the standard monorepo development workflow. See [Project Setup - Development Scripts](./03-project-setup.md#development-workflow) for complete command reference.

**Service-specific commands:**
```bash
npm run dev:service-ip      # Development mode
npm run build:service-ip    # Build only
npm run start:service-ip    # Production mode
```

### Environment Configuration

Service-ip uses standard environment configuration. See [Deployment - Environment Variables](./09-deployment.md#environment-variables) for complete setup.

**Key Variables:**
- `PORT=8083` - Service port
- `JWT_SECRET` - Shared secret for token signing
- `CLIENTS_DIR` - Client credentials directory path

### Client Management

Service-ip uses file-based client management stored in `mesh/secrets/service-ip/clients/`. Each client has both a JSON configuration file and a plain text secret file.

**Client Configuration Example:**
```json
{
  "clientId": "test-client",
  "clientSecret": "generated-secret-value",
  "scopes": ["read", "write"],
  "description": "Test client for development"
}
```

For detailed client setup procedures, see [Deployment - Client Management](./09-deployment.md#secrets-management).

### API Endpoints

**Primary Endpoint:**
- `POST /oauth/token` - OAuth 2.0 Client Credentials token endpoint
- `GET /health` - Service health check

**Standard OAuth 2.0 Response:**
```json
{
  "access_token": "JWT_TOKEN",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

For detailed API usage, testing procedures, and integration examples, see:
- [Deployment - Service Testing](./09-deployment.md#health-checks-and-monitoring)
- [Troubleshooting - Service IP Issues](./10-troubleshooting.md#service-ip-issues)

## Content Store Service

### File Storage and Content Management

The content-store service provides secure file upload, storage, and retrieval capabilities with content-based addressing and authentication integration.

**Key Features:**
- Content-addressable storage using SHA-256 hashing
- Multi-part file upload handling with size limits
- Authentication integration with identity providers
- Static file serving with proper content types
- Idempotent upload operations
- Storage volume management and persistence

### Directory Structure

```
app/content-store/
├── auth/                     # Authentication configurations
│   ├── allow-anonymous       # Anonymous access flag
│   ├── example.provider      # Example auth provider config
│   └── README.md             # Authentication setup guide
├── src/
│   ├── authenticate.js       # Authentication middleware
│   └── server.js             # Express server (JavaScript)
├── storage/                  # File storage directory
├── package.json
└── Dockerfile
```

## Troubleshooting Common Issues

### Authentication Issues

**Problem**: "Invalid JWT token" errors
**Solution**: 
- Verify JWT_SECRET matches between services
- Check token expiration times
- Ensure proper token format (Bearer prefix)

**Problem**: CORS errors in browser
**Solution**:
- Verify CORS_ORIGIN includes frontend URL
- Check that credentials: true is set
- Ensure preflight OPTIONS requests are handled

### Database Issues

**Problem**: SQLite database locked errors
**Solution**:
- Enable WAL mode: `db.pragma('journal_mode = WAL')`
- Check for unclosed database connections
- Implement proper connection cleanup

**Problem**: Performance issues with large datasets
**Solution**:
- Add appropriate database indexes
- Use prepared statements
- Implement pagination for large result sets

### File Upload Issues

**Problem**: File upload fails with large files
**Solution**:
- Increase file size limits in express-fileupload
- Check available disk space
- Implement chunked upload for very large files

**Problem**: Content retrieval returns 404
**Solution**:
- Verify content hash is correct
- Check file permissions in storage directory
- Ensure storage directory exists and is writable

## Next Steps

With the backend services configured and running, you can:

1. **Proceed to [Docker Orchestration](./07-docker-orchestration.md)** to containerize the services
2. **Review [Authentication](./08-authentication.md)** for detailed auth flow documentation
3. **Check [Deployment](./09-deployment.md)** for production deployment strategies
4. **Consult [Troubleshooting](./10-troubleshooting.md)** for common issues and solutions

---

*For additional help with Node.js, Express.js, or OAuth 2.0 concepts, refer to the official documentation:*
- *[Node.js Documentation](https://nodejs.org/docs/)*
- *[Express.js Documentation](https://expressjs.com/)*
- *[OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)*
- *[JWT RFC](https://tools.ietf.org/html/rfc7519)*