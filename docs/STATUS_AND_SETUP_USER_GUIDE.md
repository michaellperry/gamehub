# GameHub Status and Setup Pages - User Guide

## Overview

This user guide provides comprehensive instructions for using the GameHub Status and Setup Pages system. The system consists of two main user interfaces that help you monitor and configure your GameHub environment.

## Table of Contents

- [Getting Started](#getting-started)
- [Status Page Guide](#status-page-guide)
- [Setup Page Guide](#setup-page-guide)
- [Configuration Validation](#configuration-validation)
- [Common Scenarios](#common-scenarios)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Access Points

The GameHub Status and Setup system provides two main interfaces:

- **Status Page**: [`http://localhost/status`](http://localhost/status) - Monitor service health and configuration
- **Setup Page**: [`http://localhost/setup`](http://localhost/setup) - Guided configuration wizard

### Prerequisites

Before using the system, ensure:
- GameHub services are deployed and running
- You have access to the GameHub environment
- Your browser supports modern web standards (Chrome 90+, Firefox 88+, Safari 14+)

### First-Time Access

1. **Open your web browser**
2. **Navigate to the Status Page**: [`http://localhost/status`](http://localhost/status)
3. **Check system status** - You should see service cards displaying current health
4. **If services are unconfigured**, navigate to the Setup Page: [`http://localhost/setup`](http://localhost/setup)

## Status Page Guide

### Overview

The Status Page provides periodic monitoring of all GameHub services with visual indicators for health, configuration, and readiness status.

### Interface Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    GameHub Status Dashboard                      │
├─────────────────────────────────────────────────────────────────┤
│  🟢 Connected  Last Updated: 2025-01-09 10:30:15 AM      🔄    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Service IP    │  │   Player IP     │  │  Content Store  │ │
│  │                 │  │                 │  │                 │ │
│  │ Health:    🟢   │  │ Health:    🟢   │  │ Health:    🟢   │ │
│  │ Config:    🟢ⓘ  │  │ Config:    🟡ⓘ  │  │ Config:    🟢ⓘ  │ │
│  │ Ready:     🟢   │  │ Ready:     🔴   │  │ Ready:     🟢   │ │
│  │                 │  │                 │  │                 │ │
│  │ Response: 45ms  │  │ Response: 67ms  │  │ Response: 23ms  │ │
│  │ Updated: 10:30  │  │ Updated: 10:30  │  │ Updated: 10:30  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    System Summary                           │ │
│  │  Total Services: 3  |  Healthy: 3  |  Configured: 2       │ │
│  │  Ready: 2          |  Overall Status: Degraded            │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Status Indicators

#### Health Status
- **🟢 Healthy**: Service is running and responding
- **🔴 Unhealthy**: Service is down or not responding
- **🟡 Unknown**: Service status cannot be determined

#### Configuration Status
- **🟢 Configured**: All required configuration is complete
- **🟡 Partial**: Some configuration groups are missing
- **🔴 Not Configured**: Required configuration is missing
- **ⓘ Info Icon**: Hover for detailed configuration information

#### Ready Status
- **🟢 Ready**: Service is ready to handle requests
- **🔴 Not Ready**: Service is not ready (may be starting or misconfigured)
- **🟡 Unknown**: Readiness status cannot be determined

### Using the Status Page

#### Periodic Monitoring

1. **Connection Status**: Check the connection indicator in the top bar
   - **🟢 Connected**: Periodic updates are active
   - **🔴 Disconnected**: Updates may be delayed, automatic reconnection in progress

2. **Automatic Updates**: The page updates automatically every 10 seconds via HTTP polling
   - No manual refresh needed for normal operation
   - Updates occur at regular intervals when service status changes

3. **Manual Refresh**: Click the refresh button (🔄) to force an immediate update
   - Useful when troubleshooting or after making configuration changes
   - Shows loading animation during refresh

#### Configuration Details

1. **Hover for Details**: Move your mouse over the configuration status (ⓘ) to see detailed information
   
   **Example Tooltip for Player IP Service:**
   ```
   Configuration Groups:
   ✅ JWT: Configured
   ❌ Service-IP: Missing client secret
   ```

2. **Configuration Groups by Service**:

   **Service IP Provider:**
   - `jwt`: JWT token configuration
   - `clients`: Configured client applications

   **Player IP Service:**
   - `jwt`: JWT token configuration  
   - `service-ip`: Service IP provider connection

   **Content Store:**
   - `secrets`: Authentication provider configuration

#### Performance Monitoring

1. **Response Times**: Each service card shows the last response time
   - Normal: < 100ms
   - Slow: 100-500ms
   - Very Slow: > 500ms

2. **Last Updated**: Shows when each service was last checked
   - Should update every 10 seconds during normal operation
   - Stale timestamps may indicate connectivity issues

#### System Summary

The bottom panel provides overall system health:
- **Total Services**: Number of monitored services
- **Healthy Services**: Services responding to health checks
- **Configured Services**: Services with complete configuration
- **Ready Services**: Services ready to handle requests
- **Overall Status**: System-wide health assessment

### Mobile and Responsive Usage

The Status Page is optimized for all device sizes:

**Mobile Phones (< 480px):**
- Single column layout
- Larger touch targets
- Simplified information display

**Tablets (480px - 768px):**
- Two-column grid layout
- Touch-friendly interface
- Full feature set available

**Desktop (> 768px):**
- Three-column grid layout
- Hover interactions
- Complete feature set

### Accessibility Features

The Status Page includes comprehensive accessibility support:

- **Screen Reader Support**: All status information is announced
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Clear visual indicators
- **Focus Management**: Proper focus handling for interactive elements

## Setup Page Guide

### Overview

The Setup Page provides a guided walkthrough for configuring your GameHub environment. It breaks down the setup process into manageable steps with clear instructions and automated command generation.

### Setup Workflow

The setup process consists of 6 main steps:

1. **Prerequisites Verification** (5 minutes)
2. **Repository Setup** (10 minutes)
3. **Environment Initialization** (5 minutes)
4. **FusionAuth Configuration** (15 minutes)
5. **Tenant Creation** (10 minutes)
6. **Service Principal Authorization** (5 minutes)

### Step-by-Step Guide

#### Step 1: Prerequisites Verification

**Purpose**: Verify your system meets all requirements for GameHub.

**What You'll See:**
- System requirements checklist
- Automated verification commands
- Port availability check

**Actions Required:**
1. **Check Node.js Version**:
   ```bash
   node --version
   # Should be 18.0.0 or higher
   ```

2. **Check Docker Installation**:
   ```bash
   docker --version
   docker-compose --version
   ```

3. **Verify Git Configuration**:
   ```bash
   git --version
   git config --global user.name
   git config --global user.email
   ```

4. **Check Port Availability**:
   ```bash
   netstat -tuln | grep -E ':(80|8081|8082|8083|8084|9011)'
   # Should show no conflicts
   ```

**Completion Criteria**: All system checks pass with green indicators.

#### Step 2: Repository Setup

**Purpose**: Prepare the GameHub codebase and dependencies.

**What You'll See:**
- Repository cloning instructions
- Dependency installation commands
- Build verification steps

**Actions Required:**
1. **Clone Repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd gamehub
   ```

2. **Install Root Dependencies**:
   ```bash
   npm install
   ```

3. **Build Shared Model**:
   ```bash
   cd app/gamehub-model
   npm install
   npm run build
   cd ../..
   ```

4. **Verify Build**:
   ```bash
   ls -la app/gamehub-model/dist/
   ```

**Completion Criteria**: All dependencies installed and shared model built successfully.

#### Step 3: Environment Initialization

**Purpose**: Initialize the Docker environment and start core services.

**What You'll See:**
- Docker Compose commands
- Service startup sequence
- Health check verification

**Actions Required:**
1. **Navigate to Mesh Directory**:
   ```bash
   cd mesh
   ```

2. **Copy Environment Configuration**:
   ```bash
   cp .env.example .env
   ```

3. **Start Infrastructure Services**:
   ```bash
   docker-compose up -d fusionauth postgres
   ```

4. **Wait for Services** (60 seconds):
   ```bash
   # Wait for FusionAuth to be ready
   sleep 60
   ```

5. **Start GameHub Services**:
   ```bash
   docker-compose up -d content-store service-ip player-ip relay-service nginx
   ```

6. **Verify Services**:
   ```bash
   docker-compose ps
   ```

**Completion Criteria**: All Docker services running and accessible.

#### Step 4: FusionAuth Configuration

**Purpose**: Configure OAuth authentication and API access.

**What You'll See:**
- FusionAuth admin interface link
- API key collection form
- Application configuration instructions
- Generated configuration commands

**Actions Required:**
1. **Access FusionAuth Admin**:
   - Open [`http://localhost:9011/admin`](http://localhost:9011/admin)
   - Complete initial setup wizard if first time

2. **Create API Key**:
   - Navigate to Settings → API Keys
   - Click "Add API Key"
   - Copy the generated key

3. **Paste API Key in Setup Page**:
   - Return to setup page
   - Paste API key in the provided field
   - Click "Generate Commands"

4. **Create Application**:
   - Use the generated commands to create OAuth application
   - Copy the generated Application ID

5. **Configure CORS**:
   - Add `http://localhost` to allowed origins
   - Save configuration

**Generated Commands Example:**
```bash
# These commands are generated based on your API key
curl -X POST http://localhost:9011/api/application \
  -H "Authorization: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "application": {
      "name": "GameHub",
      "oauthConfiguration": {
        "authorizedRedirectURLs": ["http://localhost/auth/callback"],
        "enabledGrants": ["authorization_code", "refresh_token"]
      }
    }
  }'
```

**Completion Criteria**: FusionAuth application created and API key configured.

#### Step 5: Tenant Creation

**Purpose**: Set up multi-tenancy and configure tenant keys.

**What You'll See:**
- Tenant creation form
- Public key collection interface
- Configuration file update commands

**Actions Required:**
1. **Access Admin Portal**:
   - Navigate to [`http://localhost/portal`](http://localhost/portal)
   - Log in with FusionAuth credentials

2. **Create Tenant**:
   - Click "Create New Tenant"
   - Fill in tenant information
   - Generate tenant keys

3. **Copy Public Key**:
   - Copy the generated public key
   - Paste into setup page form

4. **Update Configuration**:
   - Use generated commands to update environment
   - Restart affected services

**Generated Commands Example:**
```bash
# Update environment with tenant public key
echo 'VITE_TENANT_PUBLIC_KEY=<your-public-key>' >> .env

# Restart admin portal
docker-compose restart gamehub-admin
```

**Completion Criteria**: Tenant created and public key configured.

#### Step 6: Service Principal Authorization

**Purpose**: Complete service-to-service authentication setup.

**What You'll See:**
- Service principal extraction commands
- Authorization verification steps
- Final system validation

**Actions Required:**
1. **Extract Service Principal**:
   ```bash
   # Commands generated based on your configuration
   docker-compose exec player-ip cat /app/service-principal.json
   ```

2. **Authorize Service Principal**:
   - Use admin portal to authorize service principal
   - Grant necessary permissions

3. **Verify Authorization**:
   ```bash
   # Test service connectivity
   curl -s http://localhost:8082/ready
   ```

4. **Final Validation**:
   - Return to Status Page
   - Verify all services show as ready

**Completion Criteria**: All services configured and ready.

### Setup Page Features

#### Progress Tracking

- **Visual Progress Bar**: Shows completion percentage
- **Step Indicators**: Clear visual indication of current step
- **Completion Status**: Checkmarks for completed steps

#### Command Generation

- **Dynamic Commands**: Commands generated based on your input
- **Copy to Clipboard**: One-click copying of generated commands
- **Syntax Highlighting**: Clear command formatting

#### Form Validation

- **Periodic Validation**: Regular feedback on form inputs
- **Error Messages**: Clear error descriptions and solutions
- **Required Field Indicators**: Visual indication of required fields

#### Progress Persistence

- **Local Storage**: Setup progress saved automatically
- **Resume Capability**: Continue setup after browser refresh
- **Reset Option**: Clear progress and start over if needed

### Mobile Usage

The Setup Page is fully responsive:

**Mobile Optimizations:**
- Touch-friendly buttons and forms
- Simplified command display
- Swipe navigation between steps
- Optimized text input fields

## Configuration Validation

### Understanding Configuration Status

Each service has specific configuration requirements:

#### Service IP Provider Configuration
- **JWT Configuration**: Token signing and validation settings
- **Client Configuration**: Registered client applications

**Validation Checks:**
```bash
# Check JWT configuration
curl -s http://localhost:8083/configured | jq '.configuredGroups.jwt'

# Check client configuration
curl -s http://localhost:8083/configured | jq '.configuredGroups.clients'
```

#### Player IP Service Configuration
- **JWT Configuration**: Token validation settings
- **Service IP Configuration**: Connection to Service IP provider

**Validation Checks:**
```bash
# Check JWT configuration
curl -s http://localhost:8082/configured | jq '.configuredGroups.jwt'

# Check Service IP configuration
curl -s http://localhost:8082/configured | jq '.configuredGroups["service-ip"]'
```

#### Content Store Configuration
- **Secrets Configuration**: Authentication provider setup

**Validation Checks:**
```bash
# Check secrets configuration
curl -s http://localhost:8081/configured | jq '.configuredGroups.secrets'
```

### Configuration Troubleshooting

#### Common Configuration Issues

**Issue 1: JWT Configuration Missing**
- **Symptoms**: JWT group shows as `false`
- **Solution**: Set JWT environment variables
- **Commands**:
  ```bash
  # Add to .env file
  JWT_SECRET=your-secret-key
  JWT_EXPIRES_IN=1h
  JWT_ISSUER=gamehub
  JWT_AUDIENCE=gamehub-services
  JWT_KEY_ID=gamehub-key
  ```

**Issue 2: Service IP Connection Failed**
- **Symptoms**: Service-IP group shows as `false`
- **Solution**: Configure service IP connection
- **Commands**:
  ```bash
  # Add to .env file
  SERVICE_IP_URL=http://service-ip:8083
  SERVICE_IP_CLIENT_ID=player-ip
  SERVICE_IP_CLIENT_SECRET_FILE=/app/secrets/service-ip-secret
  ```

**Issue 3: Authentication Secrets Missing**
- **Symptoms**: Secrets group shows as `false`
- **Solution**: Configure authentication provider
- **Commands**:
  ```bash
  # Create authentication provider file
  echo "provider-config" > mesh/secrets/content-store/auth-provider
  ```

## Common Scenarios

### Scenario 1: Fresh Installation

**Situation**: Setting up GameHub for the first time.

**Steps**:
1. Access Status Page to see current state
2. Note which services are unconfigured
3. Use Setup Page to complete configuration
4. Return to Status Page to verify completion

**Expected Timeline**: 45-60 minutes

### Scenario 2: Service Recovery

**Situation**: One or more services are showing as unhealthy.

**Steps**:
1. Check Status Page for affected services
2. Review service logs: `docker-compose logs [service-name]`
3. Restart affected services: `docker-compose restart [service-name]`
4. Monitor Status Page for recovery

**Expected Timeline**: 5-10 minutes

### Scenario 3: Configuration Updates

**Situation**: Need to update service configuration.

**Steps**:
1. Update configuration files or environment variables
2. Restart affected services
3. Use Status Page to verify configuration changes
4. Use Setup Page if guided reconfiguration needed

**Expected Timeline**: 10-15 minutes

### Scenario 4: Adding New Services

**Situation**: Adding new services to GameHub.

**Steps**:
1. Update Relay Service configuration with new service endpoints
2. Restart Relay Service
3. New services will automatically appear in Status Page
4. Configure new services using Setup Page if needed

**Expected Timeline**: 15-20 minutes

## Best Practices

### Monitoring Best Practices

1. **Regular Status Checks**: Check Status Page daily during development
2. **Monitor Response Times**: Watch for performance degradation
3. **Configuration Validation**: Verify configuration after changes
4. **Error Investigation**: Investigate unhealthy services immediately

### Setup Best Practices

1. **Follow Step Order**: Complete setup steps in the provided sequence
2. **Verify Each Step**: Ensure each step completes successfully before proceeding
3. **Save Configuration**: Keep backup copies of working configurations
4. **Document Changes**: Record any custom configuration changes

### Maintenance Best Practices

1. **Regular Updates**: Keep services and dependencies updated
2. **Configuration Backup**: Regularly backup configuration files
3. **Performance Monitoring**: Monitor response times and resource usage
4. **Security Reviews**: Regularly review and update security configurations

## Troubleshooting

### Status Page Issues

**Problem**: Status Page not loading
- **Check**: NGINX service is running
- **Solution**: `docker-compose restart nginx`

**Problem**: Services showing as unknown
- **Check**: Relay Service is running and configured
- **Solution**: `docker-compose restart relay-service`

**Problem**: HTTP polling connection failed
- **Check**: Browser console for connection errors
- **Solution**: Verify NGINX HTTP configuration

### Setup Page Issues

**Problem**: Commands not generating
- **Check**: All required fields are filled
- **Solution**: Complete form validation and retry

**Problem**: Setup progress lost
- **Check**: Browser localStorage is enabled
- **Solution**: Re-enable localStorage or use incognito mode

**Problem**: Configuration not taking effect
- **Check**: Services restarted after configuration changes
- **Solution**: Restart affected services and verify

### General Issues

**Problem**: Services not responding
- **Check**: Docker containers are running
- **Solution**: `docker-compose ps` and restart failed services

**Problem**: Port conflicts
- **Check**: Required ports are available
- **Solution**: Stop conflicting services or change ports

**Problem**: Permission errors
- **Check**: File permissions and Docker access
- **Solution**: Fix file permissions or run with appropriate privileges

This user guide provides comprehensive instructions for effectively using the GameHub Status and Setup Pages system. Follow these guidelines to successfully monitor and configure your GameHub environment.