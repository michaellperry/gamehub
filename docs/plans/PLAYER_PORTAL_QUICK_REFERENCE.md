# GameHub Player Portal - Quick Reference

## Overview
The GameHub Player Portal is a React application that allows players to participate in game sessions. It's served at `/player/` through NGINX and integrates with the existing GameHub infrastructure.

## Key Implementation Details

### Application Structure
- **Location**: `app/gamehub-player/`
- **Framework**: React 18 + TypeScript + Vite + TailwindCSS
- **Authentication**: Player-IP OAuth2 + PKCE flow
- **Real-time Data**: Jinaga client connecting to replicator
- **Deployment**: NGINX at `/player/` path

### Critical Configuration Files

#### Package Configuration
**File**: `app/gamehub-player/package.json`
- **Name**: "gamehub-player"
- **Type**: "module"
- **Key Dependencies**:
  - `gamehub-model`: "*" (local package)
  - `jinaga`: "^6.7.8"
  - `jinaga-react`: "^5.2.0"
  - `react-oauth2-code-pkce`: "^1.23.1"
  - `react-router-dom`: "^7.6.3"

#### Vite Configuration
**File**: `app/gamehub-player/vite.config.ts`
- **Base Path**: `/player/` for deployment
- **Path Aliases**: `@/` for src, `@model/` for gamehub-model
- **Environment**: Load VITE_* variables

#### Environment Variables
**Required Variables**:
- `VITE_BASE_NAME=/player/`
- `VITE_PLAYER_IP_URL=http://localhost/player-ip/`
- `VITE_REPLICATOR_URL=http://localhost/replicator/`
- `VITE_CONTENT_STORE_URL=http://localhost/content/`
- `VITE_APP_TITLE=GameHub Player`

### Authentication Flow
1. Player visits `/player/`
2. App checks for existing authentication
3. If not authenticated, redirect to Player-IP OAuth endpoint
4. Player completes OAuth2 PKCE flow
5. App exchanges code for access token
6. App initializes Jinaga client with token
7. App redirects to main player interface

### NGINX Integration
**File**: `mesh/nginx/nginx.conf`
**Location Block**:
```nginx
location /player/ {
    alias /var/www/player/;
    try_files $uri $uri/ /player/index.html;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1h;
        add_header Cache-Control "public";
    }
}
```

### Docker Compose Integration
**File**: `mesh/docker-compose.yml`
**NGINX Service Update**:
```yaml
volumes:
  - ./nginx/app/gamehub-player:/var/www/player:ro
```

### Build Process
**Container Build Script**:
```json
"build:container": "vite build --mode container && mkdir -p ../../mesh/nginx/app/gamehub-player && cp -r dist/* ../../mesh/nginx/app/gamehub-player"
```

## Integration Points

### Backend Services
- **Player-IP** (`http://localhost/player-ip/`): OAuth2 authentication
- **Jinaga Replicator** (`http://localhost/replicator/`): Real-time data sync
- **Content Store** (`http://localhost/content/`): File storage
- **Service-IP** (`http://localhost/service-ip/`): Service authentication

### Frontend Dependencies
- **gamehub-model**: Shared domain model and types
- **jinaga**: Real-time data synchronization
- **jinaga-react**: React hooks for Jinaga
- **react-oauth2-code-pkce**: OAuth2 PKCE authentication

## Development Workflow

### 1. Setup Development Environment
```bash
# Create application directory
mkdir -p app/gamehub-player
cd app/gamehub-player

# Initialize package.json with dependencies
# Configure TypeScript, Vite, TailwindCSS
# Set up ESLint and Prettier
```

### 2. Core Implementation
```bash
# Implement authentication flow
# Set up Jinaga client integration
# Create basic routing structure
# Add session management
# Implement real-time game interface
```

### 3. Build and Deploy
```bash
# Build for container deployment
npm run build:container

# Test with NGINX
cd ../../mesh
docker compose up -d nginx
```

### 4. Testing
```bash
# Test authentication flow
# Validate real-time data sync
# Test content integration
# Verify NGINX routing
```

## Key Differences from Admin Portal

| Aspect | Admin Portal | Player Portal |
|--------|-------------|---------------|
| **Authentication** | FusionAuth OAuth2 | Player-IP OAuth2 + PKCE |
| **Path** | `/portal/` | `/player/` |
| **Focus** | Administration | Game participation |
| **Features** | Tenant management, user admin | Session participation, real-time gameplay |
| **Target Users** | Administrators | Game players |

## Reference Implementation
- **Admin Portal**: `app/gamehub-admin/` (completed)
- **Detailed Plan**: `docs/plans/GAMEHUB_PLAYER_APP_PLAN.md`
- **Migration Plan**: `docs/plans/MIGRATION_PLAN.md`

## Success Criteria
- [ ] Players can authenticate using Player-IP OAuth2 flow
- [ ] Application connects to Jinaga replicator successfully
- [ ] Real-time game session updates work correctly
- [ ] Content from content-store displays properly
- [ ] Application is accessible at `/player/` path
- [ ] All authentication flows work securely

## Timeline
- **Week 1**: Foundation and authentication (Days 1-7)
- **Week 2**: Core features and real-time interface (Days 8-14)
- **Week 3**: Integration and testing (Days 15-21)

## Next Steps
1. Follow the detailed implementation plan in `docs/plans/GAMEHUB_PLAYER_APP_PLAN.md`
2. Use the admin portal as a reference implementation
3. Test each component individually before integration
4. Validate end-to-end functionality with existing infrastructure 