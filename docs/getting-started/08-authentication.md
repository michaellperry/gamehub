# Authentication

This guide covers the comprehensive setup and configuration of the authentication system for the GameHub platform, including FusionAuth integration, OAuth2 + PKCE implementation, multi-application authentication, and security best practices.

## Table of Contents

- [Authentication Architecture Overview](#authentication-architecture-overview)
- [FusionAuth Setup and Configuration](#fusionauth-setup-and-configuration)
- [OAuth2 PKCE Flow Implementation](#oauth2-pkce-flow-implementation)
- [Identity Provider Integration](#identity-provider-integration)
- [Frontend Authentication Integration](#frontend-authentication-integration)
- [Backend Authentication Middleware](#backend-authentication-middleware)
- [Security Best Practices](#security-best-practices)
- [Multi-Tenant Authentication](#multi-tenant-authentication)
- [Development and Testing](#development-and-testing)
- [Troubleshooting](#troubleshooting)

## Authentication Architecture Overview

### Authentication Strategy

GameHub implements a comprehensive authentication system using:

- **Identity Provider**: FusionAuth (self-hosted)
- **Authentication Flow**: OAuth2 Authorization Code Flow with PKCE
- **Token Management**: JWT tokens with refresh token rotation
- **Session Management**: Secure token storage with expiration handling
- **Authorization**: Role-based access control (RBAC) with tenant isolation
- **Multi-Application Support**: Separate authentication contexts for admin and player portals

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Authentication Architecture                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Admin     │    │   Player    │    │ FusionAuth  │         │
│  │ Application │    │ Application │    │   Server    │         │
│  │ (Port 3000) │    │ (Port 3001) │    │ (Port 9011) │         │
│  └─────┬───────┘    └─────┬───────┘    └─────┬───────┘         │
│        │                  │                  │                 │
│        │ OAuth2 + PKCE    │ OAuth2 + PKCE    │                 │
│        └──────────────────┼──────────────────┘                 │
│                           │                                    │
│  ┌─────────────┐    ┌─────┴───────┐    ┌─────────────┐         │
│  │Game Service │    │ Player-IP   │    │Content Store│         │
│  │ (Port 8083) │    │ (Port 8082) │    │ (Port 8081) │         │
│  │             │    │             │    │             │         │
│  │ JWT Service │    │ JWT Verify  │    │ JWT Verify  │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Flow Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │    │   React     │    │ FusionAuth  │    │  Backend    │
│             │    │    App      │    │   Server    │    │  Services   │
└─────┬───────┘    └─────┬───────┘    └─────┬───────┘    └─────┬───────┘
      │                  │                  │                  │
      │ 1. Login Request │                  │                  │
      ├─────────────────►│                  │                  │
      │                  │ 2. Generate PKCE │                  │
      │                  │    Challenge     │                  │
      │                  │                  │                  │
      │                  │ 3. Redirect to   │                  │
      │                  │    Authorization │                  │
      │                  ├─────────────────►│                  │
      │                  │                  │                  │
      │ 4. User Authentication & Consent     │                  │
      │◄─────────────────┼─────────────────►│                  │
      │                  │                  │                  │
      │ 5. Authorization Code + State        │                  │
      │◄─────────────────┼──────────────────┤                  │
      │                  │                  │                  │
      │ 6. Send Auth Code│                  │                  │
      ├─────────────────►│ 7. Exchange Code │                  │
      │                  │    + PKCE Verify │                  │
      │                  ├─────────────────►│                  │
      │                  │                  │                  │
      │                  │ 8. Access Token  │                  │
      │                  │    + Refresh     │                  │
      │                  │◄─────────────────┤                  │
      │ 9. Store Tokens  │                  │                  │
      │◄─────────────────┤                  │                  │
      │                  │                  │                  │
      │ 10. API Request with Bearer Token    │                  │
      │─────────────────────────────────────┼─────────────────►│
      │                  │                  │ 11. Verify JWT   │
      │                  │                  │◄─────────────────┤
      │                  │                  │ 12. JWT Valid    │
      │                  │                  ├─────────────────►│
      │ 13. API Response │                  │                  │
      │◄─────────────────┼─────────────────────────────────────┤
```

### User Roles and Permissions

- **System Admin**: Full system access across all tenants
- **Tenant Admin**: Administrative access within specific tenant
- **Game Admin**: Game session management and monitoring within tenant
- **Player**: Game session participation and gameplay access
- **Service Principal**: Inter-service authentication for backend communication

## FusionAuth Setup and Configuration

### Automated Setup (Recommended)

The project includes an automated FusionAuth setup script that streamlines the configuration process:

```bash
# Navigate to setup directory
cd scripts/setup

# Install dependencies
npm install

# Run the setup script
npx ts-node setup-fusionauth.ts --api-key <your-fusionauth-api-key>
```

**Script Options:**
```bash
# Full command with all options
npx ts-node setup-fusionauth.ts \
  --api-key <your-api-key> \
  --fusion-auth-url http://localhost:9011 \
  --app-name GameHub
```

**What the script does:**
1. Creates a new FusionAuth application
2. Configures OAuth2 settings (PKCE required, client authentication not required)
3. Sets up CORS configuration for cross-origin requests
4. Generates provider configuration files
5. Creates environment variable files

### Manual FusionAuth Configuration

If you prefer manual setup, follow these steps:

#### 1. Initial FusionAuth Setup

1. Navigate to `http://localhost:9011` after starting the Docker stack
2. Complete the setup wizard to create an admin user
3. Create a new Application in FusionAuth

#### 2. OAuth2 Configuration

Configure the application with these settings:

```json
{
  "application": {
    "name": "GameHub",
    "oauthConfiguration": {
      "clientAuthenticationPolicy": "NotRequired",
      "proofKeyForCodeExchangePolicy": "Required",
      "authorizedRedirectURLs": [
        "http://localhost:3000/callback",
        "http://localhost:3001/callback",
        "http://localhost/portal/callback",
        "http://localhost/player/callback"
      ],
      "logoutURL": "http://localhost:3000/",
      "enabledGrants": [
        "authorization_code",
        "refresh_token"
      ],
      "generateRefreshTokens": true,
      "refreshTokenTimeToLiveInMinutes": 43200,
      "refreshTokenUsagePolicy": "Reusable"
    }
  }
}
```

#### 3. CORS Configuration

Enable CORS in FusionAuth System Configuration:

```json
{
  "systemConfiguration": {
    "corsConfiguration": {
      "allowCredentials": true,
      "allowedHeaders": [
        "Accept",
        "Access-Control-Request-Headers",
        "Access-Control-Request-Method",
        "Authorization",
        "Content-Type",
        "Last-Event-ID",
        "Origin",
        "X-FusionAuth-TenantId",
        "X-Requested-With"
      ],
      "allowedMethods": [
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "HEAD",
        "OPTIONS"
      ],
      "allowedOrigins": [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost"
      ],
      "enabled": true,
      "exposedHeaders": [
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Credentials"
      ],
      "preflightMaxAgeInSeconds": 0
    }
  }
}
```

### Environment Configuration

After FusionAuth setup, configure environment variables:

**Admin Application (`.env`):**
```bash
VITE_CLIENT_ID=your-fusionauth-client-id
VITE_AUTHORIZATION_ENDPOINT=http://localhost:9011/oauth2/authorize
VITE_TOKEN_ENDPOINT=http://localhost:9011/oauth2/token
VITE_REDIRECT_URI=http://localhost:3000/callback
VITE_LOGOUT_ENDPOINT=http://localhost:9011/oauth2/logout
```

**Player Application (`.env`):**
```bash
VITE_CLIENT_ID=your-fusionauth-client-id
VITE_AUTHORIZATION_ENDPOINT=http://localhost:9011/oauth2/authorize
VITE_TOKEN_ENDPOINT=http://localhost:9011/oauth2/token
VITE_REDIRECT_URI=http://localhost:3001/callback
VITE_LOGOUT_ENDPOINT=http://localhost:9011/oauth2/logout
```

## OAuth2 PKCE Flow Implementation

### Frontend Integration with react-oauth2-code-pkce

The project uses the [`react-oauth2-code-pkce`](https://www.npmjs.com/package/react-oauth2-code-pkce) library for OAuth2 implementation.

#### Admin Application Configuration

```typescript
// app/gamehub-admin/src/auth/auth-config.ts
import { TAuthConfig, TRefreshTokenExpiredEvent } from "react-oauth2-code-pkce";

export const authConfig: TAuthConfig = {
  clientId: import.meta.env.VITE_CLIENT_ID,
  authorizationEndpoint: import.meta.env.VITE_AUTHORIZATION_ENDPOINT,
  tokenEndpoint: import.meta.env.VITE_TOKEN_ENDPOINT,
  redirectUri: import.meta.env.VITE_REDIRECT_URI,
  scope: 'openid profile offline_access',
  storageKeyPrefix: 'ROCP_admin_',
  onRefreshTokenExpire: (event: TRefreshTokenExpiredEvent) =>
    event.logIn(undefined, undefined, "popup"),
  logoutEndpoint: import.meta.env.VITE_LOGOUT_ENDPOINT,
};
```

#### Player Application Configuration

```typescript
// app/gamehub-player/src/auth/AccessProvider.tsx
const authConfig: TAuthConfig = {
  clientId: getEnv('VITE_CLIENT_ID'),
  authorizationEndpoint: getEnv('VITE_AUTHORIZATION_ENDPOINT'),
  tokenEndpoint: getEnv('VITE_TOKEN_ENDPOINT'),
  redirectUri: getEnv('VITE_REDIRECT_URI'),
  scope: 'openid profile offline_access',
  storageKeyPrefix: 'ROCP_player_',
  onRefreshTokenExpire: (event: TRefreshTokenExpiredEvent) => {
    // Get GAP ID from localStorage for player-specific flow
    const persistedGapId = getStoredGapId();
    
    if (!persistedGapId) {
      window.location.href = '/access';
      return;
    }
    
    try {
      event.logIn(undefined, { gap_id: persistedGapId }, "popup");
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem(GAP_ID_STORAGE_KEY);
      window.location.href = '/access';
    }
  },
  logoutEndpoint: getEnv('VITE_LOGOUT_ENDPOINT'),
};
```

### Jinaga Authentication Provider Integration

Both applications integrate with Jinaga using custom authentication providers:

```typescript
// OAuth2AuthenticationProvider for Jinaga integration
import { AuthenticationProvider, HttpHeaders } from "jinaga";
import { IAuthContext } from "react-oauth2-code-pkce";

export class OAuth2AuthenticationProvider implements AuthenticationProvider {
  constructor(private authContext: IAuthContext) {}

  async getHeaders(): Promise<HttpHeaders> {
    const { token } = this.authContext;
    
    if (!token) {
      return {};
    }
    
    return {
      "Authorization": `Bearer ${token}`
    };
  }

  async reauthenticate(): Promise<boolean> {
    const { token, logIn } = this.authContext;
    
    if (token) {
      try {
        await logIn();
        return true;
      } catch (error) {
        console.error("Failed to refresh token:", error);
        return false;
      }
    }
    
    return false;
  }
}
```

### Token Storage and Management

**Admin Application:**
- Uses `localStorage` with prefix `ROCP_admin_`
- Automatic token refresh on expiration
- Popup-based re-authentication

**Player Application:**
- Uses `localStorage` with prefix `ROCP_player_`
- GAP ID (Game Access Pass) persistence with 30-day expiration
- Custom refresh logic with GAP ID parameter

```typescript
// GAP ID storage with expiration
const storeGapId = (gapId: string) => {
  const data = {
    gapId,
    timestamp: Date.now(),
    expiresIn: 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  localStorage.setItem(GAP_ID_STORAGE_KEY, JSON.stringify(data));
};

const getStoredGapId = (): string | null => {
  const storedData = localStorage.getItem(GAP_ID_STORAGE_KEY);
  if (!storedData) return null;
  
  try {
    const data = JSON.parse(storedData);
    const isExpired = Date.now() > data.timestamp + data.expiresIn;
    
    if (isExpired) {
      localStorage.removeItem(GAP_ID_STORAGE_KEY);
      return null;
    }
    
    return data.gapId;
  } catch (e) {
    localStorage.removeItem(GAP_ID_STORAGE_KEY);
    return null;
  }
};
```

## Identity Provider Integration

### Service-to-Service Authentication

The system implements service-to-service authentication using JWT tokens generated by the Game Service Identity Provider.

#### Game-Service (Game Service Identity Provider)

```typescript
// app/game-service/src/routes/token.ts
router.post('/token', asyncHandler(async (req: Request, res: Response) => {
  const tokenRequest = validateTokenRequest(req.body);
  
  // Validate client credentials
  const isValid = await validateClientCredentials(
    tokenRequest.client_id,
    tokenRequest.client_secret
  );
  
  if (!isValid) {
    return res.status(401).json({
      error: 'invalid_client',
      error_description: 'Invalid client credentials'
    });
  }
  
  // Generate access token
  const accessToken = generateServiceToken(
    tokenRequest.client_id,
    tokenRequest.scope
  );
  
  const tokenResponse: TokenResponse = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: parseInt(JWT_EXPIRES_IN.replace('h', '')) * 3600
  };
  
  return res.status(200).json(tokenResponse);
}));
```

#### JWT Token Generation

```typescript
// app/game-service/src/utils/jwt.ts
export const generateServiceToken = (clientId: string, scope?: string): string => {
  const payload: TokenPayload = {
    sub: clientId,
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + parseInt(JWT_EXPIRES_IN.replace('h', '')) * 3600
  };

  if (scope) {
    payload.scope = scope;
  }

  return jwt.sign(payload, JWT_SECRET, {
    keyid: JWT_KEY_ID,
    algorithm: 'HS256',
  });
};
```

### Player-IP Authentication Flow

The Player Identity Provider handles player-specific authentication:

```javascript
// app/player-ip/generate-jwt.js - Example JWT generation
const payload = {
  gap_id: gapId,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
};

const token = jwt.sign(payload, JWT_SECRET);
```

## Frontend Authentication Integration

### React Authentication Context

Both applications use React Context for authentication state management:

```typescript
// Example authentication hook usage
const { isAuthenticated, user, login, logout, getAccessToken } = useAuth();

// Protected component example
if (!isAuthenticated) {
  return <Navigate to="/login" />;
}
```

### Protected Routes Implementation

```typescript
// Protected route wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.some(role => 
      user.roles?.includes(role)
    );
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
```

### Login/Logout Components

```typescript
// Login button component
export const LoginButton: React.FC = () => {
  const { login, logout, isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <Button variant="secondary" disabled>Loading...</Button>;
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">
          Welcome, {user.name}
        </span>
        <Button variant="secondary" onClick={logout}>
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button variant="primary" onClick={login}>
      Sign In
    </Button>
  );
};
```

## Backend Authentication Middleware

### Content Store Authentication

The content store uses a flexible authentication system that supports multiple providers:

```javascript
// app/content-store/src/authenticate.js
function authenticate(configs, allowAnonymous) {
  return (req, res, next) => {
    try {
      if (req.method === "OPTIONS") {
        next();
        return;
      }
      
      const authorization = req.headers.authorization;
      if (authorization) {
        const match = authorization.match(/^Bearer (.*)$/);
        if (match) {
          const token = match[1];
          const payload = decode(token);
          
          // Validate issuer and audience
          const issuer = payload.iss;
          let possibleConfigs = configs.filter(config => config.issuer === issuer);
          
          const audience = payload.aud;
          possibleConfigs = possibleConfigs.filter(config => config.audience === audience);
          
          // Verify JWT signature
          const config = possibleConfigs.find(config => 
            config.keyId === decode(token, { complete: true }).header.kid
          );
          
          if (config) {
            const verified = verify(token, config.key);
            req.user = {
              id: payload.sub,
              provider: config.provider,
              profile: {
                displayName: payload.display_name ?? ""
              }
            };
          }
        }
      } else if (!allowAnonymous) {
        res.status(401).send("No token");
        return;
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}
```

### Provider Configuration

Authentication providers are configured using JSON files:

```json
// mesh/front-end/authentication/fusionauth.provider
{
  "provider": "FusionAuth",
  "issuer": "localhost:9011",
  "audience": "your-client-id",
  "key_id": "your-key-id",
  "key": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
}
```

### JWT Token Validation

```typescript
// JWT validation middleware example
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Decode and verify token
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header.kid) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // Verify with appropriate key
    const payload = jwt.verify(token, signingKey, {
      audience: process.env.JWT_AUDIENCE,
      issuer: process.env.AUTH_AUTHORITY,
      algorithms: ['RS256']
    }) as any;

    req.user = {
      id: payload.sub,
      email: payload.email || payload.preferred_username,
      name: payload.name,
      roles: payload.roles || [],
      tenantId: payload.tid
    };

    next();
  } catch (error) {
    console.error('Token validation failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

## Security Best Practices

### Token Security

1. **Secure Storage**: Tokens are stored in `localStorage` with appropriate prefixes
2. **Automatic Refresh**: Refresh tokens are used to maintain sessions
3. **Token Rotation**: Refresh tokens can be rotated for enhanced security
4. **Expiration Handling**: Proper handling of token expiration and renewal

### CORS Configuration

```javascript
// CORS setup for cross-origin requests
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Authorization',
    'Content-Type',
    'X-Requested-With',
    'X-FusionAuth-TenantId'
  ]
}));
```

### Input Validation

```typescript
// Token request validation
const validateTokenRequest = (body: any): TokenRequest => {
  const { grant_type, client_id, client_secret, scope } = body;

  if (!grant_type || !client_id || !client_secret) {
    const missingParams = [];
    if (!grant_type) missingParams.push('grant_type');
    if (!client_id) missingParams.push('client_id');
    if (!client_secret) missingParams.push('client_secret');
    throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
  }

  if (grant_type !== 'client_credentials') {
    throw new Error('Unsupported grant_type');
  }

  return { grant_type, client_id, client_secret, scope };
};
```

### Private Browsing Detection

```typescript
// Detect private browsing mode
const isPrivateBrowsingMode = (): boolean => {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return false;
  } catch (e) {
    return true;
  }
};

// Handle private browsing limitations
useEffect(() => {
  if (isPrivateBrowsingMode()) {
    console.warn('Private browsing mode detected. Authentication persistence may be limited.');
  }
}, []);
```

## Multi-Tenant Authentication

### Tenant Isolation

The system implements tenant isolation at multiple levels:

1. **User Context**: Users are associated with specific tenants
2. **Data Access**: Authorization rules enforce tenant boundaries
3. **Service Authentication**: Service principals can access multiple tenants based on configuration

### Role-Based Access Control

```typescript
// Role-based authorization middleware
export const requireRole = (requiredRoles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const hasRequiredRole = roles.some(role => req.user!.roles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.roles
      });
    }

    next();
  };
};
```

### Tenant Context Management

```typescript
// Tenant isolation middleware
export const enforceTenantIsolation = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const requestedTenantId = req.params.tenantId || req.body.tenantId;
  const userTenantId = req.user?.tenantId;

  // System admins can access any tenant
  if (req.user?.roles.includes('SystemAdmin')) {
    return next();
  }

  // Users can only access their own tenant
  if (requestedTenantId && requestedTenantId !== userTenantId) {
    return res.status(403).json({ 
      error: 'Access denied to requested tenant' 
    });
  }

  next();
};
```

## Development and Testing

### Local Development Setup

1. **Start Docker Stack**: `docker-compose up -d`
2. **Run FusionAuth Setup**: Use the automated setup script
3. **Configure Applications**: Set environment variables
4. **Test Authentication**: Verify login/logout flows

### Development Mode Features

**Player Application Development Mode:**
```typescript
// Development bypass for player authentication
if (import.meta.env.DEV) {
  const developValue = {
    gapId: "-----PLAYER USER-----",
    setGapId: (gapId: string | null) => {},
  };
  return (
    <AccessContext.Provider value={value}>
      {children}
    </AccessContext.Provider>
  );
}
```

### Testing Authentication Flows

1. **Unit Tests**: Test authentication providers and token handling
2. **Integration Tests**: Test full OAuth2 flows
3. **E2E Tests**: Test user authentication journeys
4. **Security Tests**: Test token validation and authorization

### Mock Authentication

For development and testing, implement mock authentication providers:

```typescript
// Mock authentication provider for testing
export class MockAuthenticationProvider implements AuthenticationProvider {
  constructor(private mockToken: string) {}

  async getHeaders(): Promise<HttpHeaders> {
    return {
      "Authorization": `Bearer ${this.mockToken}`
    };
  }

  async reauthenticate(): Promise<boolean> {
    return true;
  }
}
```

## Troubleshooting

### Common Issues

**1. CORS Errors**
- Ensure FusionAuth CORS is properly configured
- Verify allowed origins include your application URLs
- Check that credentials are allowed in CORS settings

**2. Token Validation Failures**
- Verify JWT signing keys are correctly configured
- Check token expiration times
- Ensure issuer and audience claims match configuration

**3. Refresh Token Issues**
- Verify refresh token policy in FusionAuth
- Check refresh token expiration settings
- Ensure proper error handling for expired refresh tokens

**4. Private Browsing Mode**
- Implement fallback authentication for private browsing
- Provide user guidance for private browsing limitations
- Consider session-based authentication as alternative

### Debug Tools

**1. Token Inspection**
```typescript
// Debug token contents
const debugToken = (token: string) => {
  try {
    const decoded = jwt.decode(token, { complete: true });
    console.log('Token Header:', decoded?.header);
    console.log('Token Payload:', decoded?.payload);
  } catch (error) {
    console.error('Token decode error:', error);
  }
};
```

**2. Authentication State Logging**
```typescript
// Log authentication state changes
useEffect(() => {
  console.log('Auth State:', {
    isAuthenticated,
    user: user?.id,
    tokenExpiry: token ? jwt.decode(token)?.exp : null
  });
}, [isAuthenticated, user, token]);
```

**3. Network Request Debugging**
```typescript
// Log authentication headers
const logAuthHeaders = async () => {
  const headers = await authProvider.getHeaders();
  console.log('Auth Headers:', headers);
};
```

### Error Handling Patterns

```typescript
// Comprehensive error handling for authentication
const handleAuthError = (error: any) => {
  if (error.response?.status === 401) {
    // Token expired or invalid
    logout();
    navigate('/login');
  } else if (error.response?.status === 403) {
    // Insufficient permissions
    navigate('/unauthorized');
  } else if (error.code === 'NETWORK_ERROR') {
    // Network connectivity issues
    showErrorMessage('Network error. Please check your connection.');
  } else {
    // Generic error handling
    console.error('Authentication error:', error);
    showErrorMessage('Authentication failed. Please try again.');
  }
};
```

### Performance Monitoring

```typescript
// Monitor authentication performance
const measureAuthTime = async (operation: string, fn: () => Promise<any>) => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`${operation} completed in ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`${operation} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};
```

## Next Steps

After completing the authentication setup:

1. **Configure User Management**: Set up user registration and profile management
2.