# Backend Services

This guide covers the setup and configuration of the backend services that provide authentication, API endpoints, and content management for the GameHub platform.

## Table of Contents

- [Backend Services](#backend-services)
  - [Table of Contents](#table-of-contents)
  - [Backend Services Architecture](#backend-services-architecture)
    - [Overview of Backend Services](#overview-of-backend-services)
    - [Service Communication Patterns](#service-communication-patterns)
    - [API Design Principles](#api-design-principles)
  - [Player Identity Provider (player-ip)](#player-identity-provider-player-ip)
    - [Service Purpose and Authentication Flow](#service-purpose-and-authentication-flow)
    - [Directory Structure](#directory-structure)
    - [Development Commands](#development-commands)
  - [Service Identity Provider (service-ip)](#service-identity-provider-service-ip)
    - [Client Credentials Flow Implementation](#client-credentials-flow-implementation)
    - [Directory Structure](#directory-structure-1)
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
│   player-ip     │    │  servcice-ip    │    │ content-store   │
│   Port: 8082    │    │   Port: 8081    │    │   Port: 8081    │
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
2. **Frontend to game-service**: Client Credentials Flow for service authentication
3. **Frontend to content-store**: Bearer token authentication via player-ip
4. **Service-to-service**: JWT token validation and service client authentication

### API Design Principles

- **RESTful Architecture**: Standard HTTP methods and resource-based URLs
- **Stateless Design**: Each request contains all necessary information
- **JWT-based Authentication**: Secure, stateless token-based auth
- **CORS Support**: Cross-origin resource sharing for web applications
- **Error Standardization**: Consistent error response formats
- **Content Negotiation**: JSON for APIs, multipart for file uploads

## Player Identity Provider (player-ip)

### Service Purpose and Authentication Flow

The player-ip service implements OAuth 2.0 Authorization Code Flow with PKCE (Proof Key for Code Exchange) to provide secure authentication for player applications.

**Key Features:**
- OAuth 2.0 + PKCE implementation
- JWT token generation and validation
- Refresh token rotation mechanisms
- SQLite database for session storage
- Cookie-based identity management
- QR code authentication support

### Directory Structure

```
app/player-ip/
├── src/
│   ├── gap/                  # Game Access Protocol
│   │   ├── index.ts          # GAP initialization
│   │   ├── jinaga-config.ts  # Jinaga configuration
│   │   ├── provider.ts       # GAP provider implementation
│   │   └── subscription.ts   # Real-time subscriptions
│   ├── config/
│   │   ├── database.ts       # SQLite database setup
│   │   └── environment.ts    # Environment configuration
│   ├── gamehub-model/        # Shared data models
│   ├── models/               # Service-specific models
│   │   ├── gap.ts            # GAP type definitions
│   │   ├── auth.ts           # Authentication models
│   │   ├── session.ts        # Game session models
│   │   └── user.ts           # User models
│   ├── repository/           # Data access layer
│   │   ├── index.ts          # Repository exports
│   │   ├── memory/           # In-memory implementations
│   │   └── sqlite/           # SQLite implementations
│   ├── routes/
│   │   ├── auth.ts           # Authentication endpoints
│   │   └── index.ts          # Route configuration
│   ├── utils/
│   │   ├── cookie.ts         # Cookie utilities
│   │   ├── jwt.ts            # JWT utilities
│   │   ├── oauth.ts          # OAuth utilities
│   │   └── service-client.ts # Service client utilities
│   └── server.ts             # Express server setup
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env
```

### Development Commands

```bash
# Navigate to service
cd app/player-ip

# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Generate JWT for testing
node generate-jwt.js
```

## Service Identity Provider (service-ip)

### Client Credentials Flow Implementation

The game-service implements OAuth 2.0 Client Credentials Flow for service-to-service authentication, providing JWT tokens for backend services and administrative applications.

**Key Features:**
- Client Credentials Flow for service authentication
- File-based client configuration and management
- JWT token issuance for services
- Service-to-service authentication patterns
- Client secret validation and security

### Directory Structure

```
app/game-service/
├── src/
│   ├── config/
│   │   └── environment.ts    # Environment configuration
│   ├── models/               # Service models and types
│   ├── repository/
│   │   └── file/             # File-based client storage
│   ├── routes/               # API route handlers
│   ├── utils/                # JWT and client utilities
│   └── server.ts             # Express server setup
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env
```

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