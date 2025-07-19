# Remove Player-IP Public Key Endpoint Implementation Plan

## Overview

This plan outlines the steps to remove the player-ip public key endpoint from the relay-service configuration, eliminate the third step from the setup wizard, and remove the shared secret authentication between player-ip and service-ip services.

## Progress Summary
- ❌ **Phase 1: Relay Service Configuration** - PENDING
- ❌ **Phase 2: Player-IP Service Updates** - PENDING  
- ❌ **Phase 3: Setup Wizard Updates** - PENDING
- ❌ **Phase 4: Admin Portal Updates** - PENDING
- ❌ **Phase 5: Documentation Updates** - PENDING
- ❌ **Phase 6: Testing and Validation** - PENDING

**Current Status**: Planning phase - ready to begin implementation

## Prerequisites
- [ ] GameHub development environment is running
- [ ] Access to all service configuration files
- [ ] Understanding of current authentication flow between services
- [ ] Backup of current configuration before making changes

## Phase 1: Relay Service Configuration ❌

### 1.1 Remove Player-IP Public Key Endpoint from Relay Config
**Location**: `app/relay-service/src/config/environment.ts`

**Required Changes**:
- [ ] Remove `publicKeyEndpoint` from player-ip service configuration
- [ ] Update `DEFAULT_RELAY_CONFIG` to exclude player-ip public key endpoint
- [ ] Ensure player-ip still has health, configured, and ready endpoints

**Files to Update**:
```typescript
// Remove this line from player-ip configuration:
publicKeyEndpoint: 'http://player-ip:8082/public-key',
```

### 1.2 Update Relay Service Documentation
**Location**: `app/relay-service/README.md`

**Required Changes**:
- [ ] Remove player-ip from public key endpoint examples
- [ ] Update configuration examples to exclude player-ip public key endpoint
- [ ] Update API documentation to reflect changes

## Phase 2: Player-IP Service Updates ❌

### 2.1 Remove Public Key Endpoint and Jinaga Dependencies
**Location**: `app/player-ip/src/routes/index.ts`

**Required Changes**:
- [ ] Remove `/public-key` endpoint (lines 100-126)
- [ ] Remove Jinaga imports: `import { jinagaClient } from '../gap/jinaga-config.js'` and `import { User } from 'jinaga'`
- [ ] Remove Jinaga client usage in public key endpoint
- [ ] Update route exports to exclude public key endpoint

### 2.2 Remove Service Principal Configuration Check
**Location**: `app/player-ip/src/routes/index.ts`

**Required Changes**:
- [ ] Remove `servicePrincipal` from `configuredGroups` object
- [ ] Update configuration validation logic
- [ ] Remove service principal validation from ready check

### 2.3 Remove Service-IP Client Secret Dependencies
**Location**: `app/player-ip/src/routes/index.ts`

**Required Changes**:
- [ ] Remove `SERVICE_IP_CLIENT_SECRET_FILE` environment variable check
- [ ] Remove `fs.existsSync(process.env.SERVICE_IP_CLIENT_SECRET_FILE)` validation
- [ ] Update `serviceIpConfigured` logic to exclude client secret file check

### 2.4 Update Player-IP Environment Configuration
**Location**: `app/player-ip/src/config/environment.ts`

**Required Changes**:
- [ ] Remove `SERVICE_IP_CLIENT_SECRET_FILE` environment variable
- [ ] Update environment validation if needed

### 2.5 Update Player-IP Docker Configuration
**Location**: `mesh/docker-compose.yml`

**Required Changes**:
- [ ] Remove `SERVICE_IP_CLIENT_SECRET_FILE` environment variable
- [ ] Remove volume mount for player-ip client secret
- [ ] Remove `REPLICATOR_URL` environment variable
- [ ] Remove dependency on `gamehub-replicator` service
- [ ] Update player-ip service configuration

### 2.6 Remove Jinaga Dependencies
**Location**: `app/player-ip/`

**Required Changes**:
- [ ] Remove `jinaga` dependency from `package.json`
- [ ] Remove `gamehub-model` dependency from `package.json` (if only used for Jinaga)
- [ ] Remove any Jinaga configuration files if they exist
- [ ] Update test files to remove Jinaga-related test setup
- [ ] Remove `SKIP_JINAGA_SUBSCRIPTION` environment variable usage
- [ ] Update Docker environment variables to remove `REPLICATOR_URL`
- [ ] Remove Jinaga imports from test files
- [ ] Update test configuration to not require Jinaga setup
- [ ] Update `test-integration.js` to remove Jinaga client import
- [ ] Update `test-auth-alignment.js` to remove Jinaga configuration
- [ ] Update `test-auth-alignment-http.js` to remove Jinaga setup
- [ ] Update all test files in `tests/` directory to remove Jinaga dependencies

### 2.7 Update Player-IP Documentation
**Location**: `app/player-ip/README.md`

**Required Changes**:
- [ ] Remove public key endpoint documentation
- [ ] Update API endpoints list
- [ ] Remove service principal configuration references
- [ ] Remove Jinaga integration documentation
- [ ] Update environment variables table to remove Jinaga-related variables

## Phase 3: Setup Wizard Updates ❌

### 3.1 Remove Third Step from Setup Wizard
**Location**: `mesh/nginx/html/setup/app.js`

**Required Changes**:
- [ ] Remove `renderServicePrincipalStep()` method (lines 474-493)
- [ ] Update step validation logic to remove step 3
- [ ] Remove service principal validation from `isStepCompleted()` method
- [ ] Update step completion logic to only check steps 1 and 2

### 3.2 Update Setup Wizard Step Configuration
**Location**: `mesh/nginx/html/setup/app.js`

**Required Changes**:
- [ ] Update `steps` array to only include FusionAuth and Tenant steps
- [ ] Remove step 3 from step definitions
- [ ] Update step validation keys

### 3.3 Update Setup Wizard Documentation
**Location**: `mesh/nginx/html/setup/README.md`

**Required Changes**:
- [ ] Remove step 3 documentation
- [ ] Update step count from 3 to 2
- [ ] Remove service principal authorization references

## Phase 4: Admin Portal Updates ❌

### 4.1 Remove Service Principal Functionality
**Location**: `app/gamehub-admin/src/service-principals/`

**Required Changes**:
- [ ] Remove `ServicePrincipals.tsx` component
- [ ] Remove `useServicePrincipals.ts` hook
- [ ] Remove `useKnownServices.ts` hook
- [ ] Remove `KnownServicesModal.tsx` component

### 4.2 Update Admin Portal Routes
**Location**: `app/gamehub-admin/src/App.tsx`

**Required Changes**:
- [ ] Remove ServicePrincipals import
- [ ] Remove service principals route from routing configuration

### 4.3 Update Admin Portal Status Check
**Location**: `app/gamehub-admin/src/config/status-check.ts`

**Required Changes**:
- [ ] Remove `servicePrincipal` from configuration interface
- [ ] Remove `checkServicePrincipalConfiguration()` function
- [ ] Update `getConfiguredGroups()` to exclude service principal check

### 4.4 Update Relay Service Integration
**Location**: `app/gamehub-admin/src/services/relayService.ts`

**Required Changes**:
- [ ] Remove `fetchPublicKeys()` function if only used for service principals
- [ ] Update any remaining relay service integration

## Phase 5: Infrastructure and Script Updates ❌

### 5.1 Update Mesh Initialization Script
**Location**: `scripts/init-mesh.sh`

**Required Changes**:
- [ ] Remove player-ip client secret generation
- [ ] Remove shared secret synchronization between services
- [ ] Update script to not create player-ip client secret file
- [ ] Update documentation comments

### 5.2 Update Docker Compose Configuration
**Location**: `mesh/docker-compose.yml`

**Required Changes**:
- [ ] Remove `SERVICE_IP_CLIENT_SECRET_FILE` environment variable from player-ip
- [ ] Remove volume mount for player-ip secrets if no longer needed
- [ ] Update service dependencies if needed

### 5.3 Update Environment Configuration
**Location**: `mesh/.env`

**Required Changes**:
- [ ] Remove any player-ip client secret variables
- [ ] Remove `REPLICATOR_URL` environment variable
- [ ] Update environment variable documentation

## Phase 6: Documentation Updates ❌

### 6.1 Update Setup Guide
**Location**: `SETUP_GUIDE.md`

**Required Changes**:
- [ ] Change from "3-Step Setup Guide" to "2-Step Setup Guide"
- [ ] Remove step 3 documentation
- [ ] Update step numbering
- [ ] Remove service principal configuration references

### 6.2 Update Getting Started Documentation
**Location**: `docs/getting-started/`

**Required Changes**:
- [ ] Update `06-backend-services.md` to remove public key endpoint documentation
- [ ] Update `09-deployment.md` to remove service principal setup
- [ ] Update `02-architecture-overview.md` to remove Jinaga integration from player-ip
- [ ] Update any other references to player-ip public key functionality
- [ ] Remove references to Jinaga replicator dependency for player-ip

### 6.3 Update Setup Documentation
**Location**: `docs/setup/README.md`

**Required Changes**:
- [ ] Remove step 4 (Authorize the Service Principal) from post-setup steps
- [ ] Update step numbering and references
- [ ] Remove service principal authorization documentation

## Phase 7: Testing and Validation ❌

### 7.1 Test Relay Service
**Required Steps**:
- [ ] Verify relay service starts without errors
- [ ] Confirm player-ip is still monitored for health/configured/ready
- [ ] Verify public key aggregation no longer includes player-ip
- [ ] Test relay service API endpoints

### 7.2 Test Player-IP Service
**Required Steps**:
- [ ] Verify player-ip service starts without errors
- [ ] Test health endpoint functionality
- [ ] Test configured endpoint (should not include service principal)
- [ ] Verify no public key endpoint is available
- [ ] Test OAuth 2.0 authentication flows

### 7.3 Test Setup Wizard
**Required Steps**:
- [ ] Verify setup wizard loads with only 2 steps
- [ ] Test step 1 (FusionAuth) functionality
- [ ] Test step 2 (Tenant) functionality
- [ ] Verify no step 3 appears
- [ ] Test completion flow

### 7.4 Test Admin Portal
**Required Steps**:
- [ ] Verify admin portal loads without service principals
- [ ] Test tenant management functionality
- [ ] Verify no service principal routes are accessible
- [ ] Test status dashboard integration

### 7.5 Integration Testing
**Required Steps**:
- [ ] Test complete authentication flow from frontend to player-ip
- [ ] Verify service-to-service communication still works
- [ ] Test Docker Compose mesh startup
- [ ] Verify all health checks pass

## Success Criteria

- [ ] Player-ip service no longer exposes `/public-key` endpoint
- [ ] Relay service no longer includes player-ip in public key aggregation
- [ ] Setup wizard only shows 2 steps (FusionAuth and Tenant)
- [ ] Admin portal no longer has service principal management
- [ ] Player-ip service starts without SERVICE_IP_CLIENT_SECRET_FILE dependency
- [ ] Player-ip service no longer has Jinaga dependencies
- [ ] Player-ip service no longer depends on gamehub-replicator
- [ ] All test files run without Jinaga configuration
- [ ] All health checks pass for all services
- [ ] Authentication flows work correctly
- [ ] Documentation is updated and accurate

## Rollback Plan

If issues arise during implementation:

1. **Immediate Rollback**: Restore from git commit before changes
2. **Partial Rollback**: Re-enable specific functionality if needed
3. **Documentation**: Update rollback procedures in this plan

## Notes

- This change simplifies the authentication architecture by removing the service principal concept
- Player-ip will continue to function for OAuth 2.0 authentication without service principal authorization
- The change reduces complexity in the setup process
- All existing OAuth 2.0 flows should continue to work as before
- Service-to-service communication will be simplified
- Player-ip becomes a standalone OAuth 2.0 provider without Jinaga dependencies
- The service no longer requires real-time data synchronization capabilities
- This simplifies the deployment and reduces the number of required services

## Dependencies

- All services must be updated consistently
- Documentation must be updated across all relevant files
- Testing must be comprehensive to ensure no regressions
- Deployment scripts may need updates if they reference removed functionality 