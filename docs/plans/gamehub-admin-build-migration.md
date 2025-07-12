# GameHub Admin Build Mechanism Migration Plan

## Overview

This plan outlines the migration from the current Docker-based `gamehub-admin-builder` service to an NPM script-based build mechanism for the GameHub Admin frontend application. The new approach will use Vite's build system with environment-specific configuration files, similar to the pattern used in the original LaunchKings project.

## Current State Analysis

### Current Build Mechanism
- **Service**: `gamehub-admin-builder` in [`mesh/docker-compose.yml`](../mesh/docker-compose.yml)
- **Process**: Multi-stage Docker build that:
  1. Builds `gamehub-model` dependency
  2. Builds the admin frontend using Vite
  3. Copies built files to a shared volume (`gamehub-admin-dist`)
  4. NGINX serves files from the shared volume
- **Environment**: Uses standard Vite environment variables
- **Deployment**: Automatic via `docker-compose up`

### Target Build Mechanism (from LaunchKings)
- **Process**: NPM script (`build:container`) that:
  1. Builds using Vite with `--mode container`
  2. Copies built files directly to NGINX static directory
- **Environment**: Uses `.env.container` for container-specific variables
- **Deployment**: Manual build step before `docker-compose up`

## Key Differences Identified

| Aspect | Current (GameHub) | Target (LaunchKings) |
|--------|-------------------|---------------------|
| Build Trigger | Docker service | NPM script |
| Environment Config | Standard `.env` files | `.env.container` + `.env.container.local` |
| File Distribution | Docker volume | Direct file copy |
| Build Timing | During `docker-compose up` | Before `docker-compose up` |
| Dependencies | Built in Docker | Pre-built locally |

## Migration Steps

### 1. Environment Configuration Setup ✅ COMPLETED

#### 1.1 Create Environment Template ✅ COMPLETED
Create [`app/gamehub-admin/.env.container`](../app/gamehub-admin/.env.container) with shared container configuration:

```env
# Container-specific environment variables for GameHub Admin
# This file contains default values that are common across deployments

# Vite Configuration
VITE_API_BASE_URL=http://localhost:8080
VITE_REPLICATOR_URL=http://localhost:8080/jinaga
VITE_CONTENT_STORE_URL=http://localhost:8081

# Authentication Configuration  
VITE_FUSIONAUTH_URL=http://localhost:9011
VITE_CLIENT_ID=
VITE_TENANT_PUBLIC_KEY=

# Application Configuration
VITE_APP_NAME=GameHub Admin
VITE_APP_VERSION=1.0.0
```

#### 1.2 Update Setup Script ✅ COMPLETED
Modify [`setup/src/services/fileGenerator.ts`](../setup/src/services/fileGenerator.ts):
- Change `createViteEnvironmentFiles()` method to generate `.env.container.local` instead of `.env.container.local`
- Update file path to use `.env.container.local` (developer-specific overrides)
- Ensure the base `.env.container` template is not overwritten

### 2. Package.json Updates ✅ COMPLETED

#### 2.1 Add Container Build Script ✅ COMPLETED
Update [`app/gamehub-admin/package.json`](../app/gamehub-admin/package.json) to include:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:container": "vite build --mode container && mkdir -p ../../mesh/nginx/app/gamehub-admin && cp -r dist/* ../../mesh/nginx/app/gamehub-admin",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

### 3. Docker Compose Modifications ✅ COMPLETED

#### 3.1 Remove gamehub-admin-builder Service ✅ COMPLETED
Remove the entire `gamehub-admin-builder` service definition (lines 203-235) from [`mesh/docker-compose.yml`](../mesh/docker-compose.yml).

#### 3.2 Update NGINX Configuration ✅ COMPLETED
Modify the `nginx` service in [`mesh/docker-compose.yml`](../mesh/docker-compose.yml):

**Before:**
```yaml
volumes:
  - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
  - ./nginx/ssl:/etc/nginx/ssl:ro
  - gamehub-admin-dist:/var/www/admin:ro
  - ./nginx/html:/usr/share/nginx/html:ro
```

**After:**
```yaml
volumes:
  - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
  - ./nginx/ssl:/etc/nginx/ssl:ro
  - ./nginx/app/gamehub-admin:/var/www/admin:ro
  - ./nginx/html:/usr/share/nginx/html:ro
```

#### 3.3 Remove Volume Definition ✅ COMPLETED
Remove the `gamehub-admin-dist` volume definition from the volumes section (lines 297-299).

#### 3.4 Update Dependencies ✅ COMPLETED
Remove `gamehub-admin-builder` from the nginx service's `depends_on` list.

### 4. Git Configuration Updates

#### 4.1 Update .gitignore Rules
Modify [`.gitignore`](./.gitignore) to:

**Add:**
```gitignore
# Environment files - local overrides only
app/gamehub-admin/.env.container.local
```

**Ensure tracked:**
```gitignore
# Environment templates should be tracked
!app/gamehub-admin/.env.container
```

**Update existing rule:**
Change line 172 from:
```gitignore
mesh/nginx/app
```
To:
```gitignore
mesh/nginx/app/
!mesh/nginx/app/.gitkeep
```

### 5. Build Process Documentation

#### 5.1 Add Monorepo Build Script
Update [`app/package.json`](../app/package.json) to include a container build script:

```json
{
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "build:model": "npm run build --workspace=gamehub-model",
    "build:player-ip": "npm run build --workspace=player-ip",
    "build:admin": "npm run build --workspace=gamehub-admin",
    "build:admin:container": "npm run build:model && npm run build:container --workspace=gamehub-admin",
    "build:service-ip": "npm run build --workspace=service-ip",
    "build:content-store": "npm run build --workspace=content-store"
  }
}
```

This script will:
1. Build the `gamehub-model` dependency first
2. Run the `build:container` script in the `gamehub-admin` workspace

#### 5.2 Update Documentation

**Update [`docs/getting-started/09-deployment.md`](../docs/getting-started/09-deployment.md):**

Add new section:
```markdown
## Building the Admin Frontend

Before starting the Docker services, you need to build the admin frontend:

```bash
# From the project root
cd app
npm run build:admin:container

# Then start the services
cd ../mesh
docker-compose up
```

Alternatively, you can build manually:
```bash
cd app/gamehub-admin
npm run build:container
cd ../../mesh
docker-compose up
```
```

**Update [`docs/getting-started/10-troubleshooting.md`](../docs/getting-started/10-troubleshooting.md):**

Add troubleshooting section:
```markdown
### Admin Frontend Build Issues

#### Problem: Admin interface not loading
**Symptoms:** 404 errors when accessing `/admin`

**Solution:**
1. Ensure the admin frontend is built:
   ```bash
   cd app
   npm run build:admin:container
   ```
2. Verify files exist in `mesh/nginx/app/gamehub-admin/`
3. Restart nginx service:
   ```bash
   cd mesh
   docker-compose restart nginx
   ```

#### Problem: Environment variables not loading
**Symptoms:** Application shows default values or connection errors

**Solution:**
1. Check `.env.container.local` exists in `app/gamehub-admin/`
2. Verify environment variables are prefixed with `VITE_`
3. Rebuild the application after environment changes
```

### 6. NGINX Configuration Verification

#### 6.1 Check nginx.conf
Verify that [`mesh/nginx/nginx.conf`](../mesh/nginx/nginx.conf) correctly serves files from `/var/www/admin` for the `/admin` location.

If needed, update the admin location block:
```nginx
location /admin {
    alias /var/www/admin;
    try_files $uri $uri/ /admin/index.html;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7. Migration Workflow

#### 7.1 Pre-Migration Checklist
- [ ] Backup current working deployment
- [ ] Ensure all developers have Node.js and npm installed
- [ ] Document current environment variables in use
- [ ] Test build process in development environment

#### 7.2 Migration Steps
1. **Prepare Environment Files**
   ```bash
   # Create base template
   cp app/gamehub-admin/.env.example app/gamehub-admin/.env.container
   # Edit .env.container with container-specific defaults
   
   # Run setup script to generate .env.container.local
   cd setup
   npm run setup
   ```

2. **Update Package Configuration**
   ```bash
   cd app/gamehub-admin
   # Update package.json with new build script
   npm install  # Ensure dependencies are current
   ```

3. **Test Build Process**
   ```bash
   # Test the new build script from app directory
   cd app
   npm run build:admin:container
   # Verify files are created in mesh/nginx/app/gamehub-admin/
   ```

4. **Update Docker Configuration**
   ```bash
   cd mesh
   # Update docker-compose.yml
   # Remove gamehub-admin-builder service
   # Update nginx volume mappings
   ```

5. **Test Deployment**
   ```bash
   # Start services without admin builder
   docker-compose up
   # Verify admin interface loads at http://localhost/admin
   ```

#### 7.3 Rollback Plan
If issues occur during migration:

1. **Immediate Rollback**
   ```bash
   # Restore original docker-compose.yml
   git checkout HEAD~1 -- mesh/docker-compose.yml
   docker-compose up
   ```

2. **Gradual Rollback**
   - Keep both build mechanisms temporarily
   - Add `gamehub-admin-builder` service back as fallback
   - Test thoroughly before removing old mechanism

### 8. Testing Strategy

#### 8.1 Development Testing
- [ ] Build process works on clean checkout
- [ ] Environment variables load correctly
- [ ] Admin interface functions properly
- [ ] Hot reload works in development mode

#### 8.2 Integration Testing
- [ ] Docker services start without admin builder
- [ ] NGINX serves admin files correctly
- [ ] Admin interface connects to backend services
- [ ] Authentication flow works end-to-end

#### 8.3 Performance Testing
- [ ] Build time comparison (Docker vs NPM)
- [ ] Bundle size optimization
- [ ] Load time measurements

### 9. Benefits of Migration

#### 9.1 Development Experience
- **Faster Builds**: NPM builds are typically faster than Docker builds
- **Better Caching**: Node modules and build artifacts cached locally
- **Easier Debugging**: Direct access to build process and outputs
- **IDE Integration**: Better integration with development tools

#### 9.2 Deployment Flexibility
- **Selective Builds**: Can build admin without rebuilding entire stack
- **Environment Separation**: Clear separation of dev vs container configs
- **CI/CD Integration**: Easier to integrate with build pipelines
- **Resource Usage**: Reduced Docker resource consumption

#### 9.3 Maintenance
- **Simplified Architecture**: Fewer moving parts in Docker setup
- **Standard Tooling**: Uses standard Node.js/Vite toolchain
- **Version Control**: Build artifacts can be optionally tracked
- **Troubleshooting**: Easier to debug build issues

### 10. Risks and Mitigations

#### 10.1 Identified Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Build process breaks | High | Low | Comprehensive testing, rollback plan |
| Environment variables missing | Medium | Medium | Template files, documentation |
| Developer workflow disruption | Medium | High | Clear migration guide, training |
| Deployment automation breaks | High | Low | Update CI/CD scripts, testing |

#### 10.2 Mitigation Strategies
- **Gradual Migration**: Keep both systems running during transition
- **Documentation**: Comprehensive guides and troubleshooting
- **Testing**: Thorough testing at each step
- **Communication**: Clear communication to development team

## Conclusion

This migration will modernize the GameHub Admin build process, making it more efficient and developer-friendly while maintaining the same functionality. The new approach aligns with industry standards and provides better flexibility for future enhancements.

The migration should be executed carefully with proper testing at each step and a clear rollback plan in case of issues. Once completed, the development workflow will be more streamlined and the deployment process more transparent.

## Next Steps

1. Review this plan with the development team
2. Set up a development environment for testing
3. Execute the migration steps in a controlled manner
4. Update team documentation and training materials
5. Monitor the new system for any issues post-migration

---

## Completion Status

### Completed Steps
- ✅ **Step 2: Package.json Updates** - Completed on January 12, 2025
  - ✅ **Step 2.1: Add Container Build Script** - Completed on January 12, 2025
- ✅ **Step 3: Docker Compose Modifications** - Completed on January 12, 2025
  - ✅ **Step 3.1: Remove gamehub-admin-builder Service** - Completed on January 12, 2025
  - ✅ **Step 3.2: Update NGINX Configuration** - Completed on January 12, 2025
  - ✅ **Step 3.3: Remove Volume Definition** - Completed on January 12, 2025
  - ✅ **Step 3.4: Update Dependencies** - Completed on January 12, 2025

### Remaining Steps
- [ ] Step 1: Environment Configuration Setup
- [ ] Step 4: Git Configuration Updates
- [ ] Step 5: Build Process Documentation
- [ ] Step 6: NGINX Configuration Verification
- [ ] Step 7: Migration Workflow
- [ ] Step 8: Testing Strategy

---

**Document Version**: 1.1
**Created**: January 2025
**Last Updated**: January 12, 2025
**Status**: In Progress - Steps 2 & 3 Completed