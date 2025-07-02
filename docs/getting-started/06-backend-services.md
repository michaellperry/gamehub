# Backend Services

This guide covers the setup and configuration of the backend services that provide authentication, API endpoints, and content management for the GameHub platform.

## Table of Contents

- [Backend Services Architecture](#backend-services-architecture)
- [Player Identity Provider (player-ip)](#player-identity-provider-player-ip)
- [Game Service Identity Provider (game-service)](#game-service-identity-provider-game-service)
- [Content Store Service](#content-store-service)
- [Database Integration](#database-integration)
- [API Design and Implementation](#api-design-and-implementation)
- [Security Implementation](#security-implementation)
- [Development and Testing](#development-and-testing)

## Backend Services Architecture

### Overview of Backend Services

GameHub uses a microservices architecture with three specialized backend services that handle different aspects of the platform:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   player-ip     │    │  game-service   │    │ content-store   │
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
│   ├── gap/                    # Game Application Protocol
│   │   ├── index.ts           # GAP initialization
│   │   ├── jinaga-config.ts   # Jinaga configuration
│   │   ├── provider.ts        # GAP provider implementation
│   │   └── subscription.ts    # Real-time subscriptions
│   ├── config/
│   │   ├── database.ts        # SQLite database setup
│   │   └── environment.ts     # Environment configuration
│   ├── gamehub-model/         # Shared data models
│   ├── models/                # Service-specific models
│   │   ├── gap.ts            # GAP type definitions
│   │   ├── auth.ts           # Authentication models
│   │   ├── session.ts        # Game session models
│   │   └── user.ts           # User models
│   ├── repository/            # Data access layer
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

### JWT Token Generation and Validation

```typescript
// JWT token generation with game session context
export const generateAccessToken = (userId: string, sessionId: string): string => {
  const payload: AccessTokenPayload = {
    sub: userId,
    session_id: sessionId,
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + getAccessTokenExpiration()
  };

  return jwt.sign(payload, JWT_SECRET, {
    keyid: JWT_KEY_ID,
    algorithm: 'HS256',
  });
};

// JWT token verification
export const verifyJwt = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid JWT token');
  }
};
```

### Refresh Token Rotation Mechanisms

The service supports configurable refresh token rotation for enhanced security:

```typescript
// Refresh token handling with rotation
const handleRefreshTokenGrant = async (tokenRequest: TokenRequest, res: Response) => {
  const refreshTokenObj = getRefreshToken(tokenRequest.refresh_token);
  
  // Validate refresh token
  if (!refreshTokenObj || refreshTokenObj.expires_at < new Date()) {
    throw new Error('Invalid or expired refresh token');
  }

  // Generate new access token
  const accessToken = generateAccessToken(refreshTokenObj.user_id, refreshTokenObj.session_id);

  let tokenResponse: TokenResponse = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: getAccessTokenExpiration(),
    scope: refreshTokenObj.scope
  };

  // Optional refresh token rotation
  if (ROTATE_REFRESH_TOKENS) {
    revokeRefreshToken(tokenRequest.refresh_token);
    const newRefreshToken = createRefreshToken(
      refreshTokenObj.user_id,
      refreshTokenObj.client_id,
      refreshTokenObj.scope,
      refreshTokenObj.session_id
    );
    tokenResponse.refresh_token = newRefreshToken.token;
  }

  return res.status(200).json(tokenResponse);
};
```

### SQLite Database Integration

The service uses SQLite for local session storage and authentication data:

```typescript
// Database schema initialization
const initializeDatabase = () => {
  // Users table for identity management
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      identity_cookie TEXT UNIQUE,
      email TEXT,
      phone_number TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // User identities for cookie-based authentication
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_identities (
      cookie_value TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Authorization codes for OAuth flow
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_codes (
      code TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      redirect_uri TEXT NOT NULL,
      code_challenge TEXT NOT NULL,
      code_challenge_method TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      user_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT ''
    )
  `);

  // Refresh tokens with revocation support
  db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      scope TEXT NOT NULL,
      session_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked BOOLEAN DEFAULT 0
    )
  `);
};
```

### API Endpoints and Request/Response Patterns

#### Authentication Endpoints

**GET /authenticate**
- Initiates OAuth 2.0 authorization flow
- Supports QR code-based authentication
- Creates identity cookies for new users

```typescript
// Authentication request validation
const validateAuthRequest = (query: any): AuthRequest => {
  const { 
    client_id, 
    redirect_uri, 
    response_type, 
    scope, 
    code_challenge,
    code_challenge_method,
    gap_id
  } = query;
  
  // Validate required OAuth 2.0 parameters
  if (!client_id || !redirect_uri || !response_type || !scope ||
      !code_challenge || !code_challenge_method || !gap_id) {
    throw new Error('Missing required OAuth 2.0 parameters');
  }

  // Only support authorization code flow
  if (response_type !== 'code') {
    throw new Error('Unsupported response_type');
  }

  return { client_id, redirect_uri, response_type, scope, code_challenge, code_challenge_method, gapId: gap_id };
};
```

**POST /token**
- Exchanges authorization codes for access tokens
- Handles refresh token grants
- Implements PKCE verification

```typescript
// Token endpoint with grant type handling
router.post('/token', asyncHandler(async (req: Request, res: Response) => {
  const tokenRequest = validateTokenRequest(req.body);

  if (tokenRequest.grant_type === 'authorization_code') {
    return handleAuthorizationCodeGrant(tokenRequest, res);
  } else if (tokenRequest.grant_type === 'refresh_token') {
    return handleRefreshTokenGrant(tokenRequest, res);
  } else {
    throw new Error('Unsupported grant_type');
  }
}));
```

### Environment Configuration

```bash
# Server configuration
PORT=8082
NODE_ENV=development

# JWT configuration
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRES_IN=1h
JWT_ISSUER=player-ip
JWT_AUDIENCE=gamehub-player
JWT_KEY_ID=player-ip-key

# CORS configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# SQLite configuration
SQLITE_DB_PATH=./data/player-ip.db

# Refresh token configuration
REFRESH_TOKEN_EXPIRES_IN=14d
ROTATE_REFRESH_TOKENS=true
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

## Game Service Identity Provider (game-service)

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
│   │   └── environment.ts     # Environment configuration
│   ├── models/                # Service models and types
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

### Service-to-Service Authentication Patterns

```typescript
// Client credentials validation
const validateClientCredentials = (clientId: string, clientSecret: string): boolean => {
  const client = getClientById(clientId);
  
  if (!client) {
    return false;
  }

  // Verify client secret using secure comparison
  return crypto.timingSafeEqual(
    Buffer.from(client.secret),
    Buffer.from(clientSecret)
  );
};

// Service token generation
const generateServiceToken = (clientId: string, scopes: string[]): string => {
  const payload = {
    sub: clientId,
    iss: 'game-service',
    aud: 'gamehub-services',
    scope: scopes.join(' '),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  };

  return jwt.sign(payload, JWT_SECRET);
};
```

### Client Configuration and Management

The service uses file-based client storage for security and simplicity:

```typescript
// File-based client storage structure
interface ServiceClient {
  id: string;
  name: string;
  secret: string;
  scopes: string[];
  created_at: string;
  active: boolean;
}

// Client directory structure
// clients/
// ├── admin-portal.json
// ├── player-app.json
// └── content-store.json

// Example client configuration
{
  "id": "admin-portal",
  "name": "GameHub Admin Portal",
  "secret": "secure-client-secret-hash",
  "scopes": ["admin", "sessions:read", "sessions:write", "players:read"],
  "created_at": "2024-01-01T00:00:00Z",
  "active": true
}
```

### JWT Token Issuance for Services

```typescript
// Token endpoint for client credentials flow
router.post('/token', async (req: Request, res: Response) => {
  const { grant_type, client_id, client_secret, scope } = req.body;

  // Validate grant type
  if (grant_type !== 'client_credentials') {
    return res.status(400).json({
      error: 'unsupported_grant_type',
      error_description: 'Only client_credentials grant type is supported'
    });
  }

  // Validate client credentials
  if (!validateClientCredentials(client_id, client_secret)) {
    return res.status(401).json({
      error: 'invalid_client',
      error_description: 'Invalid client credentials'
    });
  }

  // Generate service token
  const requestedScopes = scope ? scope.split(' ') : [];
  const client = getClientById(client_id);
  const allowedScopes = requestedScopes.filter(s => client.scopes.includes(s));

  const accessToken = generateServiceToken(client_id, allowedScopes);

  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: allowedScopes.join(' ')
  });
});
```

### Environment Configuration

```bash
# Server configuration
PORT=8081
NODE_ENV=development

# JWT configuration
JWT_SECRET=your-service-jwt-secret
JWT_ISSUER=game-service
JWT_AUDIENCE=gamehub-services

# CORS configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Client storage
CLIENTS_DIR=./clients
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
├── auth/                      # Authentication configurations
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

### Authentication Integration with Identity Providers

```javascript
// Authentication middleware with provider support
const authenticate = (configs, allowAnonymous) => {
  return async (req, res, next) => {
    // Check for anonymous access
    if (allowAnonymous) {
      return next();
    }

    // Extract Bearer token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);

    // Validate token against configured providers
    for (const config of configs) {
      try {
        const isValid = await validateTokenWithProvider(token, config);
        if (isValid) {
          return next();
        }
      } catch (error) {
        console.warn(`Token validation failed for provider ${config.name}:`, error.message);
      }
    }

    return res.status(401).json({ error: 'Invalid or expired token' });
  };
};
```

### File Upload and Retrieval Workflows

```javascript
// File upload with content-addressable storage
app.post('/upload', authMiddleware, (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No files were uploaded' });
    }

    const uploadedFile = req.files.file;
    const contentType = req.body.contentType || uploadedFile.mimetype;

    // Generate SHA-256 hash for content addressing
    const contentHash = crypto.createHash('sha256')
      .update(uploadedFile.data)
      .digest('hex');

    // Create filename with hash and content type
    const sanitizedContentType = encodeURIComponent(contentType);
    const filename = `${contentHash}.${sanitizedContentType}`;
    const filepath = path.join(STORAGE_DIR, filename);

    // Idempotent operation - only write if file doesn't exist
    if (!fs.existsSync(filepath)) {
      uploadedFile.mv(filepath);
    }

    return res.status(200).json({
      contentHash,
      contentType,
      size: uploadedFile.size,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'File upload failed' });
  }
});

// Content retrieval by hash
app.get('/content/:hash', (req, res) => {
  try {
    const hash = req.params.hash;

    // Find file with matching hash prefix
    const files = fs.readdirSync(STORAGE_DIR);
    const matchingFile = files.find(file => file.startsWith(hash));

    if (!matchingFile) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const filepath = path.join(STORAGE_DIR, matchingFile);
    
    // Extract content type from filename
    const contentTypeEncoded = matchingFile.substring(hash.length + 1);
    const contentType = decodeURIComponent(contentTypeEncoded);

    // Serve file with proper content type
    res.setHeader('Content-Type', contentType);
    res.sendFile(filepath);
  } catch (error) {
    console.error('Retrieval error:', error);
    return res.status(500).json({ error: 'Content retrieval failed' });
  }
});
```

### Environment Configuration

```bash
# Server configuration
PORT=8081
NODE_ENV=development

# Storage configuration
STORAGE_DIR=./storage
AUTH_DIR=./auth

# File upload limits
MAX_FILE_SIZE=52428800  # 50MB in bytes

# CORS configuration
CORS_ORIGIN=*
```

## Database Integration

### SQLite Setup and Configuration

The player-ip service uses SQLite for local data persistence, providing a lightweight, serverless database solution for authentication and session management.

```typescript
// SQLite database configuration with Better SQLite3
import BetterSqlite3, { Database } from 'better-sqlite3';

const db: Database = new BetterSqlite3(SQLITE_DB_PATH, { 
  verbose: process.env.NODE_ENV !== 'production' ? console.log : undefined,
  fileMustExist: false
});

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

// Performance optimizations
db.pragma('journal_mode = WAL');  // Write-Ahead Logging
db.pragma('synchronous = NORMAL'); // Balance safety and performance
```

### Connection Management and Pooling

```typescript
// Repository pattern with prepared statements
export class AuthRepository {
  private db: Database;
  private statements: Map<string, any> = new Map();

  constructor(database: Database) {
    this.db = database;
    this.prepareStatements();
  }

  private prepareStatements() {
    // Prepare frequently used statements for better performance
    this.statements.set('getUserById', 
      this.db.prepare('SELECT * FROM users WHERE id = ?'));
    
    this.statements.set('getUserByCookie', 
      this.db.prepare(`
        SELECT u.* FROM users u 
        JOIN user_identities ui ON u.id = ui.user_id 
        WHERE ui.cookie_value = ?
      `));
    
    this.statements.set('createAuthCode', 
      this.db.prepare(`
        INSERT INTO auth_codes 
        (code, client_id, redirect_uri, code_challenge, code_challenge_method, 
         expires_at, user_id, event_id, scope) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `));
  }

  getUserById(id: string): User | undefined {
    return this.statements.get('getUserById').get(id);
  }

  getUserByCookie(cookieValue: string): User | undefined {
    return this.statements.get('getUserByCookie').get(cookieValue);
  }
}
```

## API Design and Implementation

### Express.js Server Setup and Configuration

```typescript
// Express application setup with security middleware
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// Security middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration for cross-origin requests
app.use(cors({
  origin: CORS_ORIGIN.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

### Error Handling and Response Formatting

```typescript
// Centralized error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('API Error:', err);

  // OAuth 2.0 error responses
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: err.message
    });
  }

  if (err.name === 'AuthenticationError') {
    return res.status(401).json({
      error: 'invalid_client',
      error_description: 'Authentication failed'
    });
  }

  // Default server error
  res.status(500).json({
    error: 'server_error',
    error_description: 'Internal server error'
  });
};

// Async route handler wrapper
const asyncHandler = (handler: Function) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
```

## Security Implementation

### JWT Token Security and Validation

```typescript
// JWT security configuration
const JWT_CONFIG = {
  algorithm: 'HS256' as const,
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
  expiresIn: JWT_EXPIRES_IN,
  keyid: JWT_KEY_ID
};

// Token validation with comprehensive checks
export const validateJwtToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_CONFIG.algorithm],
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      clockTolerance: 30 // 30 seconds clock skew tolerance
    }) as JwtPayload;

    // Additional validation checks
    if (!decoded.sub || !decoded.session_id) {
      throw new Error('Invalid token payload');
    }

    return decoded;
  } catch (error) {
    throw new Error(`Token validation failed: ${error.message}`);
  }
};
```

### CORS Configuration for Cross-Origin Requests

```typescript
// CORS configuration with security considerations
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = CORS_ORIGIN.split(',').map(o => o.trim());
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-HTTP-Method-Override'
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

### Input Validation and Sanitization

```typescript
// Input validation utilities
export const sanitizeInput = {
  string: (input: string, maxLength: number = 255): string => {
    return input.trim()
      .replace(/[<>]/g, '') // Remove potential XSS characters
      .substring(0, maxLength);
  },

  url: (url: string): string => {
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid URL protocol');
      }
      return parsed.toString();
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  },

  scope: (scope: string): string[] => {
    return scope.split(' ')
      .map(s => s.trim())
      .filter(s => /^[a-zA-Z0-9_:.-]+$/.test(s)) // Only allow safe characters
      .slice(0, 10); // Limit number of scopes
  }
};

// Request validation middleware
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate and sanitize request data
      req.body = sanitizeRequestBody(req.body, schema);
      req.query = sanitizeRequestQuery(req.query, schema);
      next();
    } catch (error) {
      res.status(400).json({
        error: 'invalid_request',
        error_description: error.message
      });
    }
  };
};
```

### Secret Management and Environment Variables

```typescript
// Environment variable validation
const validateEnvironment = () => {
  const required = [
    'JWT_SECRET',
    'SERVER_PORT',
    'SQLITE_DB_PATH'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('Warning: JWT_SECRET should be at least 32 characters long');
  }
};

// Initialize environment validation
validateEnvironment();
```

## Development and Testing

### Local Development Setup and Configuration

```bash
# Development environment setup script
#!/bin/bash

# Create data directories
mkdir -p data
mkdir -p app/content-store/storage
mkdir -p app/game-service/clients

# Install dependencies for all services
echo "Installing dependencies..."
cd app/player-ip && npm install && cd ../..
cd app/game-service && npm install && cd ../..
cd app/content-store && npm install && cd ../..

# Copy environment templates
cp app/player-ip/.env.example app/player-ip/.env
cp app/game-service/.env.example app/game-service/.env

# Generate JWT secrets
echo "Generating JWT secrets..."
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))" >> app/player-ip/.env
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))" >> app/game-service/.env

echo "Development environment setup complete!"
```

### Testing Strategies for Backend Services

```typescript
// Unit test example for JWT utilities
import { generateAccessToken, verifyJwt } from '../src/utils/jwt';

describe('JWT Utilities', () => {
  const userId = 'test-user-123';
  const sessionId = 'test-session-456';

  test('should generate and verify access token', () => {
    const token = generateAccessToken(userId, sessionId);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const payload = verifyJwt(token);
    expect(payload.sub).toBe(userId);
    expect(payload.session_id).toBe(sessionId);
    expect(payload.iss).toBe('player-ip');
  });

  test('should reject invalid tokens', () => {
    expect(() => {
      verifyJwt('invalid-token');
    }).toThrow('Invalid JWT token');
  });
});

// Integration test example for authentication flow
describe('Authentication Flow', () => {
  test('should complete OAuth 2.0 flow', async () => {
    // 1. Start authentication
    const authResponse = await request(app)
      .get('/authenticate')
      .query({
        client_id: 'test-client',
        redirect_uri: 'http://localhost:3000/callback
        response_type: 'code',
        scope: 'openid profile',
        code_challenge: 'test-challenge',
        code_challenge_method: 'S256',
        gap_id: 'test-gap'
      })
      .expect(302);

    // 2. Extract authorization code from redirect
    const location = authResponse.headers.location;
    const code = new URL(location).searchParams.get('code');
    expect(code).toBeDefined();

    // 3. Exchange code for token
    const tokenResponse = await request(app)
      .post('/token')
      .send({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'http://localhost:3000/callback',
        client_id: 'test-client',
        code_verifier: 'test-verifier'
      })
      .expect(200);

    expect(tokenResponse.body.access_token).toBeDefined();
    expect(tokenResponse.body.token_type).toBe('Bearer');
  });
});
```

### Debugging Techniques and Logging

```typescript
// Structured logging configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'player-ip' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
};

// Debug configuration for VS Code
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Player IP",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/app/player-ip/src/server.ts",
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "*"
      },
      "runtimeArgs": ["-r", "ts-node/register"],
      "sourceMaps": true,
      "cwd": "${workspaceFolder}/app/player-ip"
    },
    {
      "name": "Debug Game Service",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/app/game-service/src/server.ts",
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "*"
      },
      "runtimeArgs": ["-r", "ts-node/register"],
      "sourceMaps": true,
      "cwd": "${workspaceFolder}/app/game-service"
    }
  ]
}
```

### Performance Monitoring and Optimization

```typescript
// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`
      });
    }
    
    // Collect metrics
    collectMetric('http_request_duration', duration, {
      method: req.method,
      status: res.statusCode.toString()
    });
  });
  
  next();
};

// Database performance optimization
export const optimizeDatabase = (db: Database) => {
  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  
  // Optimize SQLite settings
  db.pragma('cache_size = 10000');
  db.pragma('temp_store = memory');
  db.pragma('mmap_size = 268435456'); // 256MB
  
  // Create indexes for frequently queried columns
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_identity_cookie 
    ON users(identity_cookie);
    
    CREATE INDEX IF NOT EXISTS idx_auth_codes_expires_at 
    ON auth_codes(expires_at);
    
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id 
    ON refresh_tokens(user_id);
  `);
};
```

### Integration Testing with Frontend Applications

```typescript
// End-to-end test setup
import { chromium, Browser, Page } from 'playwright';

describe('Frontend Integration Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should authenticate user through QR code flow', async () => {
    // 1. Navigate to player app
    await page.goto('http://localhost:3000');
    
    // 2. Click QR code scan button
    await page.click('[data-testid="qr-scan-button"]');
    
    // 3. Mock QR code scan with test GAP ID
    await page.evaluate(() => {
      window.mockQRScan('test-gap-id');
    });
    
    // 4. Verify authentication redirect
    await page.waitForURL(/.*authenticate.*gap_id=test-gap-id/);
    
    // 5. Complete authentication flow
    await page.waitForURL(/.*callback.*code=/);
    
    // 6. Verify user is logged in
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });

  test('should upload and retrieve content', async () => {
    // 1. Authenticate first
    await authenticateUser(page);
    
    // 2. Navigate to upload page
    await page.goto('http://localhost:3000/upload');
    
    // 3. Upload test file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-files/sample.jpg');
    
    await page.click('[data-testid="upload-button"]');
    
    // 4. Verify upload success
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    
    // 5. Verify file can be retrieved
    const contentHash = await page.locator('[data-testid="content-hash"]').textContent();
    const response = await page.request.get(`http://localhost:8081/content/${contentHash}`);
    expect(response.status()).toBe(200);
  });
});
```

### Development Commands and Scripts

```bash
# Package.json scripts for development workflow
{
  "scripts": {
    "dev:all": "concurrently \"npm run dev:player-ip\" \"npm run dev:game-service\" \"npm run dev:content-store\"",
    "dev:player-ip": "cd app/player-ip && npm run dev",
    "dev:game-service": "cd app/game-service && npm run dev",
    "dev:content-store": "cd app/content-store && npm run dev",
    
    "build:all": "npm run build:player-ip && npm run build:game-service",
    "build:player-ip": "cd app/player-ip && npm run build",
    "build:game-service": "cd app/game-service && npm run build",
    
    "test:all": "npm run test:player-ip && npm run test:game-service && npm run test:integration",
    "test:player-ip": "cd app/player-ip && npm test",
    "test:game-service": "cd app/game-service && npm test",
    "test:integration": "playwright test",
    
    "lint:all": "npm run lint:player-ip && npm run lint:game-service",
    "lint:player-ip": "cd app/player-ip && eslint src/",
    "lint:game-service": "cd app/game-service && eslint src/",
    
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    
    "setup:dev": "./scripts/setup-dev.sh",
    "cleanup:db": "rm -f data/*.db",
    "generate:client": "node scripts/generate-client.js"
  }
}

# Development setup script
#!/bin/bash
# scripts/setup-dev.sh

echo "Setting up GameHub development environment..."

# Create necessary directories
mkdir -p data
mkdir -p app/content-store/storage
mkdir -p app/game-service/clients
mkdir -p logs

# Install dependencies
echo "Installing dependencies..."
cd app/player-ip && npm install && cd ../..
cd app/game-service && npm install && cd ../..
cd app/content-store && npm install && cd ../..

# Generate environment files
echo "Generating environment configuration..."
cat > app/player-ip/.env << EOF
NODE_ENV=development
PORT=8082
JWT_SECRET=$(openssl rand -hex 64)
JWT_EXPIRES_IN=1h
JWT_ISSUER=player-ip
JWT_AUDIENCE=gamehub-player
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
SQLITE_DB_PATH=./data/player-ip.db
REFRESH_TOKEN_EXPIRES_IN=14d
ROTATE_REFRESH_TOKENS=true
EOF

cat > app/game-service/.env << EOF
NODE_ENV=development
PORT=8081
JWT_SECRET=$(openssl rand -hex 64)
JWT_ISSUER=game-service
JWT_AUDIENCE=gamehub-services
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CLIENTS_DIR=./clients
EOF

# Create sample client configuration
cat > app/game-service/clients/admin-portal.json << EOF
{
  "id": "admin-portal",
  "name": "GameHub Admin Portal",
  "secret": "$(openssl rand -hex 32)",
  "scopes": ["admin", "sessions:read", "sessions:write", "players:read"],
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "active": true
}
EOF

echo "Development environment setup complete!"
echo "Run 'npm run dev:all' to start all services"
```

### API Testing and Documentation

```bash
# API testing with curl examples

# 1. Test player authentication flow
curl -X GET "http://localhost:8082/authenticate" \
  -G \
  -d "client_id=test-client" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "response_type=code" \
  -d "scope=openid profile" \
  -d "code_challenge=test-challenge" \
  -d "code_challenge_method=S256" \
  -d "aap_id=test-aap" \
  -v

# 2. Exchange authorization code for token
curl -X POST "http://localhost:8082/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTH_CODE_FROM_STEP_1" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "client_id=test-client" \
  -d "code_verifier=test-verifier"

# 3. Test service authentication
curl -X POST "http://localhost:8081/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=admin-portal" \
  -d "client_secret=CLIENT_SECRET_FROM_CONFIG" \
  -d "scope=admin events:read"

# 4. Test file upload
curl -X POST "http://localhost:8081/upload" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -F "file=@test-image.jpg" \
  -F "contentType=image/jpeg"

# 5. Test content retrieval
curl -X GET "http://localhost:8081/content/CONTENT_HASH" \
  -H "Accept: image/jpeg" \
  -o downloaded-image.jpg
```

### Health Checks and Monitoring

```typescript
// Health check endpoints for all services
app.get('/health', (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'player-ip',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: checkDatabaseHealth(),
    dependencies: checkDependencies()
  };

  res.status(200).json(health);
});

// Database health check
const checkDatabaseHealth = () => {
  try {
    const result = db.prepare('SELECT 1 as test').get();
    return { status: 'connected', test: result.test === 1 };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
};

// External dependencies health check
const checkDependencies = async () => {
  const checks = [];
  
  // Check service-ip connectivity
  try {
    const response = await fetch('http://localhost:8081/health');
    checks.push({ service: 'service-ip', status: response.ok ? 'healthy' : 'unhealthy' });
  } catch (error) {
    checks.push({ service: 'service-ip', status: 'unreachable' });
  }
  
  // Check content-store connectivity
  try {
    const response = await fetch('http://localhost:8081/health');
    checks.push({ service: 'content-store', status: response.ok ? 'healthy' : 'unhealthy' });
  } catch (error) {
    checks.push({ service: 'content-store', status: 'unreachable' });
  }
  
  return checks;
};
```

## Best Practices and Recommendations

### Security Best Practices

1. **JWT Secret Management**: Use strong, randomly generated secrets (64+ characters)
2. **Token Expiration**: Keep access tokens short-lived (1 hour or less)
3. **Refresh Token Rotation**: Enable rotation for enhanced security
4. **CORS Configuration**: Restrict origins to known domains in production
5. **Input Validation**: Always validate and sanitize user inputs
6. **HTTPS Only**: Use HTTPS in production environments
7. **Rate Limiting**: Implement rate limiting to prevent abuse

### Performance Optimization

1. **Database Indexing**: Create indexes on frequently queried columns
2. **Connection Pooling**: Use prepared statements for better performance
3. **Caching**: Implement caching for frequently accessed data
4. **Compression**: Enable gzip compression for API responses
5. **Monitoring**: Set up performance monitoring and alerting

### Development Workflow

1. **Environment Separation**: Use different configurations for dev/staging/prod
2. **Automated Testing**: Implement comprehensive test suites
3. **Code Quality**: Use linting and formatting tools
4. **Documentation**: Keep API documentation up to date
5. **Version Control**: Use semantic versioning for releases

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