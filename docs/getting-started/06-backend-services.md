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
    - [Environment Configuration](#environment-configuration)
    - [API Endpoints](#api-endpoints)
  - [Service Identity Provider (service-ip)](#service-identity-provider-service-ip)
    - [OAuth 2.0 Client Credentials Flow Implementation](#oauth-20-client-credentials-flow-implementation)
    - [Directory Structure](#directory-structure-1)
    - [Development Commands](#development-commands-1)
    - [Environment Configuration](#environment-configuration-1)
    - [Client Management](#client-management)
    - [API Endpoints](#api-endpoints-1)
  - [Content Store Service (content-store)](#content-store-service-content-store)
    - [Content-Addressable Storage and File Management](#content-addressable-storage-and-file-management)
    - [Directory Structure](#directory-structure-2)
    - [Development Commands](#development-commands-2)
    - [Environment Configuration](#environment-configuration-2)
    - [Authorization Provider Setup](#authorization-provider-setup)
    - [API Endpoints](#api-endpoints-2)
    - [Integration Examples](#integration-examples)
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

The player-ip service is a comprehensive OAuth 2.0 identity provider that handles player authentication and authorization for the GameHub platform. It runs on **Port 8082** and provides secure authentication flows for frontend applications with current infrastructure integration.

**Key Features:**
- **OAuth 2.0 Authorization Server**: Complete implementation supporting Authorization Code flow with PKCE
- **JWT Token Management**: Secure token generation and validation
- **Refresh Token Support**: Long-lived refresh tokens with optional rotation
- **SQLite Database**: Persistent storage for users, sessions, and tokens
- **Docker Support**: Containerized deployment with health checks
- **Service Discovery**: Integration with service-ip for inter-service communication

### Authentication Flow

The player-ip service implements a standard OAuth 2.0 Authorization Code flow with PKCE:

1. **Authorization Request**: Client redirects user to `/authenticate` with required parameters
2. **User Authentication**: Service validates user identity via cookie-based authentication
3. **Authorization Code**: Service generates and returns authorization code to client
4. **Token Exchange**: Client exchanges authorization code for access token via `/token`
5. **Resource Access**: Client uses access token for authenticated API requests

**Required OAuth Parameters:**
- `client_id`: OAuth client identifier
- `redirect_uri`: Client callback URL
- `response_type`: Must be "code" (Authorization Code flow)
- `scope`: Requested permissions (e.g., "openid profile")
- `code_challenge`: PKCE challenge for security
- `code_challenge_method`: PKCE method ("S256" or "plain")

### API Endpoints

**Authentication Endpoints:**
- `GET /authenticate` - OAuth authorization endpoint
- `GET /authenticate_retry` - Retry authentication after cookie setup
- `POST /token` - OAuth token endpoint (authorization code and refresh token grants)
- `POST /revoke` - Token revocation endpoint

**User Management:**
- `GET /userinfo` - User information endpoint
- `POST /logout` - User logout endpoint
- `GET /profile` - User profile endpoint

**Service Management:**
- `GET /health` - Health check endpoint
- `GET /configured` - Configuration status endpoint
- `GET /ready` - Readiness check endpoint
- `GET /public-key` - Service public key for service principal creation

### Directory Structure

```
app/player-ip/
├── src/
│   ├── config/
│   │   ├── database.ts       # SQLite database configuration
│   │   └── environment.ts    # Environment configuration and validation
│   ├── models/
│   │   ├── auth.ts           # Authentication model definitions
│   │   ├── user.ts           # User model definitions
│   │   └── index.ts          # Model exports
│   ├── repository/
│   │   ├── sqlite/
│   │   │   ├── auth.repository.ts      # Authentication data access
│   │   │   ├── user.repository.ts      # User data access
│   │   │   └── refresh-token.repository.ts # Token management
│   │   └── index.ts          # Repository exports
│   ├── routes/
│   │   ├── auth.ts           # OAuth 2.0 authentication endpoints
│   │   └── index.ts          # Route exports
│   ├── utils/
│   │   ├── jwt.ts            # JWT utilities and validation
│   │   ├── oauth.ts          # OAuth 2.0 flow utilities
│   │   ├── cookie.ts         # Cookie management utilities
│   │   └── index.ts          # Utility exports
│   └── server.ts             # Express server setup
├── package.json              # Package configuration
├── tsconfig.json             # TypeScript configuration
├── Dockerfile                # Docker container configuration
├── .env.example              # Environment template
└── README.md                 # Service documentation
```

### Development Commands

Player-ip uses the standard monorepo development workflow. See [Project Setup - Development Scripts](./03-project-setup.md#development-workflow) for complete command reference.

**Service-specific commands:**
```bash
npm run dev:player-ip       # Development mode
npm run build:player-ip     # Build only
npm run start:player-ip     # Production mode
```

### Environment Configuration

Player-ip uses standard environment configuration. See [Deployment - Environment Variables](./09-deployment.md#environment-variables) for complete setup.

**Key Variables:**
- `PORT=8082` - Service port
- `JWT_SECRET` - Shared secret for token signing
- `SQLITE_DB_PATH` - SQLite database path
- `SERVICE_IP_URL` - Service IP endpoint for backend authentication
- `REPLICATOR_URL` - Jinaga replicator endpoint for data sync
- `CORS_ORIGIN` - Allowed origins for CORS
- `REFRESH_TOKEN_EXPIRES_IN` - Refresh token expiration time
- `ROTATE_REFRESH_TOKENS` - Enable refresh token rotation

### API Endpoints

**Primary Endpoints:**
- `GET /auth/authorize` - OAuth 2.0 authorization endpoint
- `POST /auth/token` - OAuth 2.0 token endpoint
- `POST /auth/refresh` - Token refresh endpoint
- `POST /auth/logout` - User logout endpoint
- `GET /health` - Service health check

**OAuth 2.0 Flow:**
1. Frontend redirects to `/auth/authorize` with PKCE parameters
2. User authenticates and grants consent
3. Service redirects back with authorization code
4. Frontend exchanges code for tokens at `/auth/token`
5. Access tokens are used for API authentication
6. Refresh tokens are used to obtain new access tokens

For detailed API usage, testing procedures, and integration examples, see:
- [Deployment - Service Testing](./09-deployment.md#health-checks-and-monitoring)
- [Troubleshooting - Player IP Issues](./10-troubleshooting.md#player-ip-issues)

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
  "clientId": "your-client-id",
  "clientSecret": "generated-secret-value",
  "scopes": ["read", "write"],
  "description": "Test client for development"
}
```

For detailed client setup procedures, see [Deployment - Client Management](./09-deployment.md#secrets-management).

### API Endpoints

**Primary Endpoint:**
- `POST /token` - OAuth 2.0 Client Credentials token endpoint
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

## Content Store Service (content-store)

### Content-Addressable Storage and File Management

The content-store service provides secure, efficient file storage and retrieval using content-addressable storage with SHA-256 hashing. It runs on **Port 8081** and integrates seamlessly with the GameHub authentication infrastructure.

**Key Features:**
- Content-addressable storage using SHA-256 hashing for automatic deduplication
- Multipart file upload with configurable size limits (default 50MB)
- JWT-based authentication supporting tokens from both service-ip and player-ip
- Authorization provider configuration compatible with Jinaga replicator format
- Public content retrieval with proper MIME type handling
- Idempotent upload operations (duplicate files return existing hash)
- Docker containerization with persistent volume storage
- CORS support for cross-origin requests

### Directory Structure

```
app/content-store/
├── auth/                     # Authentication configurations
│   ├── allow-anonymous       # Anonymous access flag (optional)
│   ├── example.provider      # Example auth provider config
│   └── README.md             # Authentication setup guide
├── src/
│   ├── authenticate.js       # JWT authentication middleware
│   └── server.js             # Express server implementation
├── storage/                  # File storage directory (Docker volume)
├── package.json              # Package configuration
└── Dockerfile                # Container configuration
```

### Development Commands

Content-store uses the standard monorepo development workflow:

```bash
npm run dev:content-store     # Development mode with hot reload
npm run build:content-store   # Build Docker image
npm run start:content-store   # Production mode
```

### Environment Configuration

**Key Environment Variables:**
- `PORT=8081` - Service port
- `STORAGE_DIR=/app/storage` - File storage directory path
- `AUTH_DIR=/app/auth` - Authentication configuration directory
- `NODE_ENV=production` - Runtime environment

### Authorization Provider Setup

The content store uses the same authorization provider format as the Jinaga replicator, supporting multiple authentication sources simultaneously.

**Provider File Format** (`.provider` extension):
```json
{
  "provider": "service-ip",
  "issuer": "service-ip",
  "audience": "service-clients",
  "key_id": "service-ip-key",
  "key": "shared-jwt-secret-key"
}
```

**Required Fields:**
- `provider`: Unique identifier for the authentication provider
- `issuer`: JWT issuer claim (must match token issuer)
- `audience`: JWT audience claim (must match token audience)
- `key_id`: Key identifier for JWT verification
- `key`: Shared secret or public key for JWT signature verification

**Multiple Provider Support:**
Place multiple `.provider` files in the auth directory to support authentication from different sources:
- `service-ip.provider` - For service-to-service authentication
- `player-ip.provider` - For player authentication
- `external.provider` - For third-party authentication providers

**Anonymous Access:**
Create an `allow-anonymous` file (no extension) in the auth directory to allow unauthenticated access to upload endpoints (not recommended for production).

### API Endpoints

**Upload Endpoint:**
- `POST /upload` - Protected file upload
  - **Authentication**: Required (JWT Bearer token)
  - **Content-Type**: `multipart/form-data`
  - **File Field**: `file`
  - **Optional Fields**: `contentType` (override MIME type)
  - **Response**: `{ contentHash, contentType, size, message }`
  - **Max Size**: 50MB (configurable)

**Retrieval Endpoint:**
- `GET /content/:hash` - Public content retrieval
  - **Authentication**: Not required
  - **Parameters**: `hash` - SHA-256 content hash (full or prefix)
  - **Response**: File content with appropriate Content-Type header
  - **Caching**: Content is immutable (aggressive caching recommended)

**Health Check:**
- `GET /health` - Service health status
  - **Authentication**: Not required
  - **Response**: `{ status, service, timestamp, version }`

### Integration Examples

**Upload from Frontend (with player authentication):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/content-store/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${playerToken}`
  },
  body: formData
});

const result = await response.json();
console.log('Content hash:', result.contentHash);
```

**Service-to-Service Upload:**
```javascript
const formData = new FormData();
formData.append('file', buffer, { filename: 'document.pdf' });

const response = await fetch('http://content-store:8081/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${serviceToken}`
  },
  body: formData
});
```

**Content Retrieval:**
```html
<!-- Direct image reference -->
<img src="/content-store/content/a1b2c3d4e5f6..." alt="Uploaded image" />

<!-- Or via JavaScript -->
<script>
const contentUrl = `/content-store/content/${contentHash}`;
</script>
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

**Problem**: Database connection errors
**Solution**:
- Check SQLite database file permissions
- Ensure database directory exists and is writable
- Verify SQLite database path in environment variables

**Problem**: SQLite database locked errors (fallback mode)
**Solution**:
- Enable WAL mode: `db.pragma('journal_mode = WAL')`
- Check for unclosed database connections
- Implement proper connection cleanup

**Problem**: Performance issues with large datasets
**Solution**:
- Add appropriate database indexes
- Use prepared statements
- Implement pagination for large result sets
- Consider PostgreSQL for better performance (current)

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