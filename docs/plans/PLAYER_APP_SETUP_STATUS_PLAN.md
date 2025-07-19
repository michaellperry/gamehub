# Player App Setup and Status Dashboard Integration Plan

## Overview

This plan outlines the implementation of adding the GameHub Player App (`gamehub-player`) to both the setup wizard and status dashboard. The player app is a React-based frontend application that provides the player interface for GameHub, and it needs to be integrated into the observability and setup systems.

## Progress Summary
- ❌ **Phase 1: Player App Status Check Implementation** - PENDING
- ❌ **Phase 2: Status Dashboard Integration** - PENDING  
- ❌ **Phase 3: Setup Wizard Integration** - PENDING
- ❌ **Phase 4: Testing and Validation** - PENDING

**Current Status**: Planning phase - Player app exists but is not integrated into setup/status systems

## Prerequisites
- [x] GameHub Player App exists at `app/gamehub-player/`
- [x] Status Dashboard is operational at `/status/`
- [x] Setup Wizard is operational at `/setup/`
- [x] Admin Portal bundle integration is working as reference
- [x] NGINX configuration supports `/player/` route
- [x] Docker Compose includes player app build process

## Phase 1: Player App Status Check Implementation ✅

### 1.1 Create Status Check Module
**Location**: `app/gamehub-player/src/config/status-check.ts`

**Required Steps**:
- [ ] Create status check module similar to admin portal
- [ ] Implement configuration validation functions
- [ ] Export `getConfigured()` function globally
- [ ] Add environment variable checks for player app configuration

**Configuration Checks to Implement**:
- [ ] **Client Configuration**: Check if FusionAuth client is configured for player app
- [ ] **Authentication Setup**: Verify OAuth provider configuration
- [ ] **Jinaga Integration**: Validate replicator connection and auth provider setup
- [ ] **Environment Variables**: Check required environment variables are set

### 1.2 Update Player App Entry Point
**Location**: `app/gamehub-player/src/main.tsx`

**Required Changes**:
- [ ] Import status check module to make function globally available
- [ ] Ensure function is available before React app renders

### 1.3 Add Environment Variable Validation
**Location**: `app/gamehub-player/src/config/status-check.ts`

**Required Environment Checks**:
- [ ] `VITE_CLIENT_ID` - FusionAuth client ID for player app
- [ ] `VITE_REPLICATOR_URL` - Jinaga replicator endpoint
- [ ] `VITE_AUTH_URL` - FusionAuth authentication endpoint
- [ ] `VITE_TENANT_PUBLIC_KEY` - Tenant public key for authentication

## Phase 2: Status Dashboard Integration 🔄

### 2.1 Add Player App Bundle Configuration
**Location**: `mesh/nginx/html/status/app.js`

**Required Changes**:
- [ ] Add `player-app` to `bundleConfigs` object
- [ ] Configure discovery URL as `/player/`
- [ ] Set config function as `getConfigured`
- [ ] Add display name and icon for player app

**Bundle Configuration to Add**:
```javascript
'player-app': {
    name: 'Player App',
    discoveryUrl: '/player/',
    discoveryMethod: 'html-parse',
    configFunction: 'getConfigured'
}
```

### 2.2 Update Status Dashboard Display Functions
**Location**: `mesh/nginx/html/status/app.js`

**Required Changes**:
- [ ] Add `getBundleDisplayName()` case for `player-app`
- [ ] Add `getBundleIcon()` case for `player-app`
- [ ] Ensure proper sorting and display in service grid

### 2.3 Test Bundle Discovery
**Required Steps**:
- [ ] Verify player app bundle is discoverable via HTML parsing
- [ ] Test `getConfigured()` function execution
- [ ] Validate configuration status display
- [ ] Check tooltip functionality for player app

## Phase 3: Setup Wizard Integration 🔄

### 3.1 Add Player App Bundle Configuration
**Location**: `mesh/nginx/html/setup/app.js`

**Required Changes**:
- [ ] Add `player-app` to `bundleConfigs` object in setup wizard
- [ ] Configure same discovery settings as status dashboard
- [ ] Ensure bundle scanning works during setup process

### 3.2 Add Player App Setup Step
**Location**: `mesh/nginx/html/setup/app.js`

**Required Changes**:
- [ ] Add new step to `steps` array for player app configuration
- [ ] Create `renderPlayerAppStep()` function
- [ ] Add validation logic for player app configuration
- [ ] Update step completion logic

**New Step Configuration**:
```javascript
{
    id: 4,
    title: 'Player App Configuration',
    description: 'Configure player authentication and game session access',
    estimatedTime: '10 minutes',
    validationKey: 'playerApp'
}
```

### 3.3 Implement Player App Step Content
**Location**: `mesh/nginx/html/setup/app.js`

**Required Implementation**:
- [ ] Create step content with player app configuration guidance
- [ ] Add validation for player app bundle status
- [ ] Include setup instructions for player authentication
- [ ] Add completion criteria based on player app configuration

### 3.4 Update Setup Validation Logic
**Location**: `mesh/nginx/html/setup/app.js`

**Required Changes**:
- [ ] Add player app validation to `isStepCompleted()` function
- [ ] Update `getStepStatusIcon()` and `getStepStatusText()` for new step
- [ ] Modify `allStepsCompleted()` to include player app step
- [ ] Update total step count from 3 to 4

## Phase 4: Testing and Validation 🔄

### 4.1 Player App Status Check Testing
**Required Tests**:
- [ ] Test `getConfigured()` function in development environment
- [ ] Verify environment variable validation
- [ ] Test configuration status reporting
- [ ] Validate error handling for missing configuration

### 4.2 Status Dashboard Integration Testing
**Required Tests**:
- [ ] Verify player app appears in status dashboard
- [ ] Test bundle discovery and loading
- [ ] Validate configuration status display
- [ ] Test tooltip functionality for player app
- [ ] Verify auto-refresh includes player app status

### 4.3 Setup Wizard Integration Testing
**Required Tests**:
- [ ] Verify player app step appears in setup wizard
- [ ] Test step completion validation
- [ ] Validate progress tracking includes player app
- [ ] Test setup completion with player app configured
- [ ] Verify step navigation and status indicators

### 4.4 End-to-End Testing
**Required Tests**:
- [ ] Complete setup wizard with all steps including player app
- [ ] Verify status dashboard shows all services and bundles
- [ ] Test player app accessibility after setup completion
- [ ] Validate configuration persistence across restarts

## Success Criteria

- [ ] Player app appears in status dashboard with proper configuration status
- [ ] Setup wizard includes player app configuration step
- [ ] Player app configuration is validated during setup process
- [ ] Status dashboard tooltips show detailed player app configuration
- [ ] Setup wizard progress tracking includes player app step
- [ ] Player app is accessible and functional after setup completion
- [ ] Configuration status is accurate and updates in real-time
- [ ] Error handling works gracefully for missing player app configuration

## Implementation Notes

### Player App Configuration Requirements
The player app needs the following configuration to be considered "configured":
- FusionAuth client ID properly set (not default)
- Jinaga replicator URL configured
- Authentication provider properly initialized
- Tenant public key available for authentication

### Bundle Discovery Process
The player app bundle will be discovered by:
1. Fetching `/player/` HTML page
2. Parsing for `<script type="module" crossorigin>` tags
3. Loading the discovered JavaScript bundle
4. Executing `getConfigured()` function
5. Displaying configuration status in dashboard

### Setup Wizard Integration
The player app step will:
1. Guide users through player authentication setup
2. Validate FusionAuth client configuration
3. Check Jinaga replicator connectivity
4. Verify tenant authentication setup
5. Mark step complete when all validations pass

### Status Dashboard Display
The player app will appear as a bundle card showing:
- Health status (N/A for bundles)
- Configuration status with detailed tooltip
- Ready status based on configuration completion
- Last checked timestamp and response time

## Related Documentation

- [Status and Setup Architecture](../architecture/STATUS_AND_SETUP_ARCHITECTURE.md)
- [Admin Portal Status Check Implementation](../architecture/ADMIN_PORTAL_STATUS_CHECK.md)
- [GameHub Player App Documentation](../getting-started/PLAYER_APP_GUIDE.md)
- [Bundle Integration Guide](../architecture/BUNDLE_INTEGRATION_GUIDE.md)

## Notes

This implementation follows the same patterns established by the admin portal integration, ensuring consistency across the GameHub observability system. The player app will be treated as a frontend bundle rather than a backend service, similar to the admin portal, which allows for configuration-based status checking rather than health endpoint monitoring. 