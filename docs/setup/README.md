# GameHub FusionAuth Setup Documentation

This comprehensive guide covers the automated FusionAuth setup process for GameHub, including detailed explanations, configuration options, troubleshooting, and post-setup verification.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup Process](#detailed-setup-process)
- [Configuration Options](#configuration-options)
- [Generated Files](#generated-files)
- [Post-Setup Steps](#post-setup-steps)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)
- [Next Steps](#next-steps)

## Overview

The GameHub FusionAuth setup application is an automated tool that configures FusionAuth for the GameHub ecosystem. It creates and configures OAuth applications, sets up authentication providers, generates configuration files, and prepares the environment for seamless integration.

### What the Setup Application Does

The setup process performs the following operations:

1. **Creates FusionAuth Application**: Establishes a new OAuth 2.0 application in FusionAuth with proper security settings
2. **Configures OAuth Settings**: Sets up PKCE (Proof Key for Code Exchange) and other OAuth security configurations
3. **Configures CORS**: Adds necessary CORS origins to allow cross-origin requests from GameHub applications
4. **Generates Provider Files**: Creates authentication provider configuration for the Jinaga replicator
5. **Creates Environment Files**: Generates environment configuration files for mesh infrastructure and admin application
6. **Retrieves Signing Keys**: Obtains JWT signing key information for token validation

### Architecture Integration

The setup application integrates with the following GameHub components:

- **FusionAuth**: OAuth 2.0 identity provider
- **Jinaga Replicator**: Real-time data synchronization with authentication
- **GameHub Admin**: Administrative web interface
- **Player IP**: Player authentication service
- **Service IP**: Service-to-service authentication
- **Content Store**: File storage with authentication

## Prerequisites

Before running the setup application, ensure you have the following:

### System Requirements

- **Node.js**: Version 18.0.0 or higher
- **npm**: Latest version (comes with Node.js)
- **Operating System**: macOS, Linux, or Windows with WSL2

### FusionAuth Requirements

- **Running FusionAuth Instance**: FusionAuth must be running and accessible
- **API Key**: FusionAuth API key with the following permissions:
  - Application management
  - System configuration
  - Key management
  - CORS configuration

### How to Obtain a FusionAuth API Key

1. **Access FusionAuth Admin Interface**:
   ```
   http://localhost/auth/admin
   ```

2. **Navigate to API Keys**:
   - Go to Settings → API Keys
   - Click "Add API Key"

3. **Configure API Key Permissions**:
   - **Name**: `GameHub Setup Key`
   - **Permissions**: Select the following:
     - `/api/application/*` (GET, POST, PUT, DELETE)
     - `/api/system-configuration` (GET, PUT)
     - `/api/key` (GET)
     - `/api/tenant` (GET)

4. **Save and Copy**: Save the API key and copy it for use in the setup process

### Network Requirements

- FusionAuth accessible at the configured URL (default: `http://localhost/auth`)
- Write permissions to the GameHub project directories
- Internet access for downloading dependencies

## Quick Start

For users who want to get started immediately:

### Using the Shell Script (Recommended)

```bash
# Navigate to the GameHub project root
cd /path/to/gamehub

# Run the setup script with your API key
./scripts/setup.sh YOUR_FUSIONAUTH_API_KEY
```

### Using npm Commands

```bash
# Navigate to the setup directory
cd setup

# Install dependencies
npm install

# Build the application
npm run build

# Run the setup
npm start -- --api-key YOUR_FUSIONAUTH_API_KEY
```

### Using Development Mode

```bash
# Navigate to the setup directory
cd setup

# Install dependencies
npm install

# Run directly with ts-node
npm run dev -- --api-key YOUR_FUSIONAUTH_API_KEY
```

## Detailed Setup Process

### Step 1: Environment Preparation

The setup application first validates the environment:

1. **Node.js Version Check**: Ensures Node.js >= 18.0.0
2. **Dependency Installation**: Installs required npm packages
3. **TypeScript Compilation**: Builds the application if needed
4. **Input Validation**: Validates all configuration parameters

### Step 2: FusionAuth Application Creation

The application creates a new OAuth 2.0 application in FusionAuth with:

- **Name**: Configurable (default: "GameHub")
- **Client Authentication**: PKCE required for security
- **Enabled Grants**: Authorization Code with PKCE
- **Redirect URIs**: Admin and player callback URLs
- **Registration**: Not required (handled by GameHub)

### Step 3: CORS Configuration

Updates FusionAuth system configuration to allow cross-origin requests from:

- Admin application URLs
- Player application URLs
- Content store URLs
- Replicator URLs

### Step 4: Signing Key Retrieval

Retrieves the default JWT signing key information for:

- Token validation configuration
- Provider file generation
- Environment variable setup

### Step 5: File Generation

Creates the following configuration files:

1. **Provider Files**: Authentication provider for Jinaga replicator
2. **Environment Files**: Mesh infrastructure configuration
3. **Vite Environment Files**: Admin application configuration

### Step 6: Verification

Performs post-setup verification:

- Validates created files exist
- Checks file permissions
- Verifies configuration syntax

## Configuration Options

The setup application supports extensive configuration through command-line options:

### Required Options

| Option      | Description        | Example               |
| ----------- | ------------------ | --------------------- |
| `--api-key` | FusionAuth API key | `--api-key abc123...` |

### URL Configuration

| Option                  | Description            | Default                              | Example                                                   |
| ----------------------- | ---------------------- | ------------------------------------ | --------------------------------------------------------- |
| `--fusion-auth-url`     | FusionAuth base URL    | `http://localhost/auth`              | `--fusion-auth-url http://fusionauth.example.com`         |
| `--admin-redirect-uri`  | Admin OAuth callback   | `http://localhost/admin/callback`    | `--admin-redirect-uri https://admin.example.com/callback` |
| `--player-redirect-uri` | Player OAuth callback  | `http://localhost/player/callback`   | `--player-redirect-uri https://app.example.com/callback`  |
| `--content-store-url`   | Content store URL      | `http://localhost/content`           | `--content-store-url https://content.example.com`         |
| `--replicator-url`      | Jinaga replicator URL  | `http://localhost/replicator/jinaga` | `--replicator-url https://sync.example.com/jinaga`        |
| `--player-ip-url`       | Player IP service URL  | `http://localhost/player-ip`         | `--player-ip-url https://auth.example.com`                |
| `--player-app-url`      | Player application URL | `http://localhost/player`            | `--player-app-url https://app.example.com`                |

### Application Configuration

| Option           | Description                 | Default                  | Example                            |
| ---------------- | --------------------------- | ------------------------ | ---------------------------------- |
| `--app-name`     | FusionAuth application name | `GameHub`                | `--app-name "My Game Platform"`    |
| `--jwt-secret`   | JWT signing secret          | `development-secret-key` | `--jwt-secret "prod-secret-123"`   |
| `--jwt-issuer`   | JWT token issuer            | `player-ip`              | `--jwt-issuer "my-game-auth"`      |
| `--jwt-audience` | JWT token audience          | `gamehub-player`         | `--jwt-audience "my-game-players"` |

### Behavior Options

| Option      | Description              | Default | Example     |
| ----------- | ------------------------ | ------- | ----------- |
| `--force`   | Overwrite existing files | `false` | `--force`   |
| `--verbose` | Enable detailed logging  | `false` | `--verbose` |

### Configuration Examples

#### Development Environment

```bash
npm run dev -- \
  --api-key YOUR_API_KEY \
  --verbose
```

#### Production Environment

```bash
npm start -- \
  --api-key YOUR_API_KEY \
  --fusion-auth-url https://auth.yourdomain.com \
  --app-name "Your Game Platform" \
  --admin-redirect-uri https://admin.yourdomain.com/callback \
  --player-redirect-uri https://app.yourdomain.com/callback \
  --content-store-url https://content.yourdomain.com \
  --replicator-url https://sync.yourdomain.com/jinaga \
  --player-ip-url https://auth.yourdomain.com \
  --jwt-secret "your-production-secret" \
  --force
```

#### Custom Development Setup

```bash
npm run dev -- \
  --api-key YOUR_API_KEY \
  --fusion-auth-url http://localhost:9011 \
  --admin-redirect-uri http://localhost:3000/callback \
  --player-redirect-uri http://localhost:3001/callback \
  --verbose
```

## Generated Files

The setup application creates the following files in your GameHub project:

### 1. FusionAuth Provider File

**Location**: `mesh/replicator/authentication/fusionauth.provider`

**Purpose**: Configures Jinaga replicator to authenticate with FusionAuth

**Content Structure**:
```
provider=fusionauth
issuer=http://localhost/auth
audience=gamehub-player
key_id=<signing-key-id>
key=<public-key-pem>
```

**Usage**: Used by the Jinaga replicator to validate JWT tokens from FusionAuth

### 2. Mesh Environment File

**Location**: `mesh/.env`

**Purpose**: Environment variables for Docker Compose infrastructure

**Content Structure**:
```env
# FusionAuth Configuration
FUSIONAUTH_CLIENT_ID=<generated-client-id>
FUSIONAUTH_ISSUER=http://localhost/auth
FUSIONAUTH_AUDIENCE=gamehub-player

# JWT Configuration
JWT_ISSUER=player-ip
JWT_AUDIENCE=gamehub-player

# Service URLs
CONTENT_STORE_URL=http://localhost/content
REPLICATOR_URL=http://localhost/replicator/jinaga
PLAYER_IP_URL=http://localhost/player-ip
```

**Usage**: Loaded by Docker Compose services for runtime configuration

### 3. Admin Application Environment File

**Location**: `app/gamehub-admin/.env.container.local`

**Purpose**: Environment variables for the Vite-based admin application

**Content Structure**:
```env
# FusionAuth OAuth Configuration
VITE_FUSIONAUTH_URL=http://localhost/auth
VITE_FUSIONAUTH_CLIENT_ID=<generated-client-id>
VITE_FUSIONAUTH_REDIRECT_URI=http://localhost/admin/callback

# API Endpoints
VITE_REPLICATOR_URL=http://localhost/replicator/jinaga
VITE_CONTENT_STORE_URL=http://localhost/content
```

**Usage**: Used by Vite during build and runtime for the admin application

### File Permissions and Security

- All generated files have appropriate read permissions
- Secret values are properly escaped and formatted
- Files are created with restrictive permissions where applicable
- Existing files are backed up before overwriting (when using `--force`)

## Post-Setup Steps

After the setup application completes successfully, follow these steps to complete the GameHub configuration:

### 1. Create a Tenant

**Purpose**: Tenants in GameHub represent isolated game environments

**Steps**:
1. Navigate to the admin application: `http://localhost/portal/tenants`
2. Click "Create New Tenant"
3. Fill in tenant details:
   - **Name**: Your game or organization name
   - **Description**: Brief description of the tenant
4. Click "Save"
5. **Important**: Copy the generated tenant public key

### 2. Update Configuration Files with Tenant Key

**Purpose**: The tenant public key is required for service authentication

**Files to Update**:

#### Update `mesh/.env`
Add the tenant public key:
```env
TENANT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
<your-tenant-public-key>
-----END PUBLIC KEY-----"
```

#### Update `app/gamehub-admin/.env.container.local`
Add the tenant public key:
```env
VITE_TENANT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
<your-tenant-public-key>
-----END PUBLIC KEY-----"
```

**Automated Method**:
Use the included setup script:
```bash
./scripts/setup-tenant.sh "YOUR_TENANT_PUBLIC_KEY"
```

**Alternative Method**:
Use the utility script directly:
```bash
cd setup
npm run update-tenant-key -- --tenant-key "YOUR_TENANT_PUBLIC_KEY"
```

### 3. Rebuild the Admin Application

**Purpose**: Apply the new tenant configuration to the admin application

**Commands**:
```bash
cd app
npm run build:admin:container
```

**Verification**:
```bash
# Check build completed successfully
cd app
npm run build:admin:container

# Check service logs
cd ../mesh
docker compose logs -f gamehub-admin
```

### 4. Authorize the Service Principal

**Purpose**: Allow the player-ip service to authenticate with the system

**Steps**:
1. **View player-ip logs**:
   ```bash
   docker compose logs player-ip | grep "Service Principal"
   ```

2. **Copy the public key** from the log output

3. **Navigate to admin application**: `http://localhost/admin/service-principals`

4. **Add new Service Principal**:
   - **Name**: `player-ip-service`
   - **Public Key**: Paste the copied public key
   - **Permissions**: Select appropriate permissions for player authentication

5. **Save** the Service Principal

### 5. Verify Setup

**Purpose**: Ensure all components are working correctly

**Health Checks**:
```bash
# Check overall system health
curl http://localhost/health

# Check individual services
curl http://localhost/player-ip/health
curl http://localhost/service-ip/health
curl http://localhost/content/health
curl http://localhost/replicator/health
curl http://localhost/auth/api/status
```

**Expected Results**: All health checks should return HTTP 200 with success status

## Verification

### Automated Verification

The setup application includes built-in verification steps:

1. **File Creation Verification**: Confirms all expected files were created
2. **Configuration Syntax Verification**: Validates generated configuration syntax
3. **FusionAuth Connection Verification**: Tests API connectivity
4. **Permission Verification**: Checks file permissions are correct

### Manual Verification Steps

#### 1. Verify FusionAuth Application

1. **Access FusionAuth Admin**: `http://localhost/auth/admin`
2. **Navigate to Applications**: Applications → View All
3. **Find Your Application**: Look for the application name (default: "GameHub")
4. **Verify Configuration**:
   - OAuth settings are correct
   - Redirect URIs match your configuration
   - PKCE is enabled

#### 2. Verify Generated Files

```bash
# Check provider file exists and has content
cat mesh/replicator/authentication/fusionauth.provider

# Check environment files exist
ls -la mesh/.env
ls -la app/gamehub-admin/.env.container.local

# Verify file permissions
ls -la mesh/replicator/authentication/fusionauth.provider
```

#### 3. Verify CORS Configuration

Test CORS settings by making a request from your admin application:

```javascript
// In browser console at http://localhost/admin
fetch('http://localhost/auth/api/status')
  .then(response => console.log('CORS working:', response.ok))
  .catch(error => console.error('CORS issue:', error));
```

#### 4. Verify JWT Configuration

Check that JWT settings are properly configured:

```bash
# Check JWT issuer in environment
grep JWT_ISSUER mesh/.env

# Verify signing key is present
grep -A 10 "key=" mesh/replicator/authentication/fusionauth.provider
```

### Integration Testing

#### Test OAuth Flow

1. **Navigate to admin application**: `http://localhost/admin`
2. **Click login**: Should redirect to FusionAuth
3. **Complete authentication**: Should redirect back to admin
4. **Verify token**: Check browser developer tools for JWT token

#### Test API Authentication

```bash
# Test service-to-service authentication
curl -H "Authorization: Bearer <service-token>" \
     http://localhost/player-ip/api/test

# Test player authentication
curl -H "Authorization: Bearer <player-token>" \
     http://localhost/content/api/files
```

## Troubleshooting

### Common Issues and Solutions

#### 1. API Key Issues

**Problem**: "Invalid API key" or "Insufficient permissions"

**Solutions**:
- Verify API key is correct and not expired
- Check API key permissions in FusionAuth admin
- Ensure API key has all required permissions:
  - Application management
  - System configuration
  - Key management

**Verification**:
```bash
# Test API key manually
curl -H "Authorization: <your-api-key>" \
     http://localhost/auth/api/status
```

#### 2. Connection Issues

**Problem**: "Connection refused" or "Network error"

**Solutions**:
- Verify FusionAuth is running: `docker compose ps`
- Check FusionAuth URL is correct
- Verify network connectivity
- Check firewall settings

**Verification**:
```bash
# Test FusionAuth connectivity
curl http://localhost/auth/api/status

# Check Docker services
docker compose logs fusionauth
```

#### 3. File Permission Errors

**Problem**: "Permission denied" when creating files

**Solutions**:
- Check write permissions on target directories
- Run setup with appropriate user permissions
- Use `--force` flag to overwrite existing files

**Verification**:
```bash
# Check directory permissions
ls -la mesh/replicator/authentication/
ls -la mesh/
ls -la app/gamehub-admin/

# Fix permissions if needed
chmod 755 mesh/replicator/authentication/
```

#### 4. CORS Issues

**Problem**: Cross-origin requests blocked

**Solutions**:
- Verify CORS origins were added correctly
- Check FusionAuth system configuration
- Restart FusionAuth after CORS changes

**Verification**:
```bash
# Check CORS configuration in FusionAuth
curl -H "Authorization: <api-key>" \
     http://localhost/auth/api/system-configuration
```

#### 5. Build Issues

**Problem**: TypeScript compilation errors

**Solutions**:
- Ensure Node.js version >= 18.0.0
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript configuration: `npx tsc --noEmit`

**Verification**:
```bash
# Check Node.js version
node --version

# Verify TypeScript installation
npx tsc --version

# Test compilation
npm run build
```

#### 6. Environment Variable Issues

**Problem**: Services not finding configuration

**Solutions**:
- Verify environment files were created correctly
- Check file paths and names
- Rebuild admin application after file changes

**Verification**:
```bash
# Check environment files exist
ls -la mesh/.env
ls -la app/gamehub-admin/.env.container.local

# Verify content
cat mesh/.env
```

### Debug Mode

Enable verbose logging for detailed troubleshooting:

```bash
npm run dev -- --api-key YOUR_API_KEY --verbose
```

This provides detailed information about:
- API requests and responses
- File operations
- Configuration validation
- Error stack traces

### Getting Help

If you encounter issues not covered in this guide:

1. **Check the logs**: Use `--verbose` flag for detailed output
2. **Verify prerequisites**: Ensure all requirements are met
3. **Test manually**: Try individual steps manually to isolate issues
4. **Check documentation**: Review FusionAuth documentation for API details
5. **Community support**: Reach out to the GameHub community

### Log Analysis

Common log patterns and their meanings:

```bash
# Successful setup
[INFO] FusionAuth setup completed successfully

# API key issues
[ERROR] Request failed with status code 401
[ERROR] Invalid API key or insufficient permissions

# Network issues
[ERROR] connect ECONNREFUSED
[ERROR] Network error connecting to FusionAuth

# File permission issues
[ERROR] EACCES: permission denied
[ERROR] Cannot write to file
```

## Advanced Usage

### Custom Configuration Files

You can create custom configuration files for different environments:

#### Development Configuration

Create `setup/.env.development`:
```env
API_KEY=dev-api-key
FUSION_AUTH_URL=http://localhost:9011
APP_NAME=GameHub Development
VERBOSE=true
```

#### Production Configuration

Create `setup/.env.production`:
```env
API_KEY=prod-api-key
FUSION_AUTH_URL=https://auth.yourdomain.com
APP_NAME=Your Game Platform
FORCE=true
```

#### Using Configuration Files

```bash
# Load development configuration
npm run dev -- --env-file .env.development

# Load production configuration
npm start -- --env-file .env.production
```

### Scripted Setup

For automated deployments, create setup scripts:

#### Basic Setup Script

```bash
#!/bin/bash
# setup-gamehub.sh

set -e

API_KEY="$1"
ENVIRONMENT="${2:-development}"

if [[ -z "$API_KEY" ]]; then
    echo "Usage: $0 <api-key> [environment]"
    exit 1
fi

cd setup

# Install dependencies
npm install

# Build application
npm run build

# Run setup based on environment
case "$ENVIRONMENT" in
    "production")
        npm start -- \
            --api-key "$API_KEY" \
            --fusion-auth-url "https://auth.yourdomain.com" \
            --app-name "Your Game Platform" \
            --force
        ;;
    "staging")
        npm start -- \
            --api-key "$API_KEY" \
            --fusion-auth-url "https://staging-auth.yourdomain.com" \
            --app-name "Your Game Platform (Staging)" \
            --force
        ;;
    *)
        npm run dev -- \
            --api-key "$API_KEY" \
            --verbose
        ;;
esac

echo "Setup completed for $ENVIRONMENT environment"
```

#### CI/CD Integration

For continuous integration/deployment:

```yaml
# .github/workflows/setup.yml
name: GameHub Setup

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to setup'
        required: true
        default: 'development'
        type: choice
        options:
        - development
        - staging
        - production

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd setup
        npm install
        
    - name: Run GameHub setup
      run: |
        cd setup
        npm start -- \
          --api-key "${{ secrets.FUSIONAUTH_API_KEY }}" \
          --fusion-auth-url "${{ vars.FUSIONAUTH_URL }}" \
          --app-name "${{ vars.APP_NAME }}" \
          --force
      env:
        NODE_ENV: ${{ github.event.inputs.environment }}
```

### Multi-Tenant Setup

For multi-tenant deployments:

```bash
# Setup multiple tenants
for tenant in tenant1 tenant2 tenant3; do
    npm start -- \
        --api-key "$API_KEY" \
        --app-name "GameHub-$tenant" \
        --admin-redirect-uri "http://localhost/admin/$tenant/callback" \
        --player-redirect-uri "http://localhost/player/$tenant/callback" \
        --force
done
```

### Backup and Restore

#### Backup Configuration

```bash
#!/bin/bash
# backup-config.sh

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup generated files
cp mesh/.env "$BACKUP_DIR/"
cp app/gamehub-admin/.env.container.local "$BACKUP_DIR/"
cp mesh/replicator/authentication/fusionauth.provider "$BACKUP_DIR/"

echo "Configuration backed up to $BACKUP_DIR"
```

#### Restore Configuration

```bash
#!/bin/bash
# restore-config.sh

BACKUP_DIR="$1"

if [[ -z "$BACKUP_DIR" ]]; then
    echo "Usage: $0 <backup-directory>"
    exit 1
fi

# Restore files
cp "$BACKUP_DIR/.env" mesh/
cp "$BACKUP_DIR/.env.container.local" app/gamehub-admin/
cp "$BACKUP_DIR/fusionauth.provider" mesh/replicator/authentication/

echo "Configuration restored from $BACKUP_DIR"
```

## Next Steps

After successfully completing the FusionAuth setup, proceed with the following:

### 1. Complete GameHub Setup

Continue with the remaining GameHub setup steps:

- **Model Configuration**: Set up Jinaga data models
- **Application Deployment**: Deploy GameHub applications
- **User Management**: Configure user roles and permissions
- **Game Configuration**: Set up game-specific settings

### 2. Development Workflow

Set up your development environment:

```bash
# Start development services
cd app
npm run dev:admin

# In another terminal
npm run dev:player-ip
```

### 3. Production Deployment

Prepare for production deployment:

- **SSL Certificates**: Configure HTTPS for production
- **Domain Configuration**: Set up custom domains
- **Monitoring**: Implement logging and monitoring
- **Backup Strategy**: Set up automated backups

### 4. Security Hardening

Implement additional security measures:

- **API Key Rotation**: Regularly rotate FusionAuth API keys
- **JWT Secret Management**: Use secure secret management
- **Network Security**: Configure firewalls and network policies
- **Audit Logging**: Enable comprehensive audit logging

### 5. Testing

Implement comprehensive testing:

- **Integration Tests**: Test OAuth flows
- **Load Testing**: Test authentication performance
- **Security Testing**: Perform security audits
- **User Acceptance Testing**: Test user workflows

### 6. Documentation

Create additional documentation:

- **User Guides**: End-user documentation
- **API Documentation**: Developer API guides
- **Deployment Guides**: Production deployment procedures
- **Troubleshooting Guides**: Common issues and solutions

### 7. Monitoring and Maintenance

Set up ongoing maintenance:

- **Health Monitoring**: Monitor service health
- **Performance Monitoring**: Track authentication performance
- **Log Analysis**: Analyze authentication logs
- **Regular Updates**: Keep dependencies updated

---

## Support and Resources

### Documentation Links

- [GameHub Getting Started Guide](../getting-started/README.md)
- [FusionAuth Documentation](https://fusionauth.io/docs/)
- [Jinaga Documentation](https://jinaga.com/documents/)
- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)

### Community Resources

- GameHub Community Forum
- FusionAuth Community
- Stack Overflow (tag: gamehub)

### Professional Support

For enterprise support and consulting:

- GameHub Enterprise Support
- FusionAuth Professional Services
- Custom Integration Services

---

*This documentation is maintained as part of the GameHub project. For updates and contributions, please refer to the project repository.*