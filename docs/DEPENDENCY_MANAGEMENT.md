# Dependency Management in GameHub Monorepo

This document outlines the guidelines and best practices for managing dependencies in the GameHub monorepo structure.

## Overview

The GameHub monorepo uses npm workspaces to manage multiple packages while sharing common dependencies at the root level. This approach reduces duplication, ensures version consistency, and simplifies dependency management.

## Architecture

```
app/
├── package.json          # Root package with shared dependencies
├── package-lock.json     # Single lock file for entire monorepo
├── player-ip/
│   └── package.json      # Service-specific dependencies only
├── service-ip/
│   └── package.json      # Service-specific dependencies only
├── gamehub-model/
│   └── package.json      # Model-specific dependencies
└── gamehub-admin/
    └── package.json      # Admin app dependencies
```

## Dependency Categories

### 1. Common Dependencies (Root Level)

These dependencies are shared across multiple services and should be defined in the root `app/package.json`:

**Runtime Dependencies:**
- `better-sqlite3` - Database access
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management
- `express` - Web framework
- `jsonwebtoken` - JWT token handling
- `uuid` - UUID generation

**Development Dependencies:**
- `@types/better-sqlite3`
- `@types/cors`
- `@types/express`
- `@types/jsonwebtoken`
- `@types/uuid`
- `@types/node`
- `typescript`
- `rimraf`

### 2. Service-Specific Dependencies

These dependencies are unique to individual services and should be defined in their respective `package.json` files:

**Player-IP Service:**
- `gamehub-model` - Local model package
- `jinaga` - Event sourcing framework
- `cookie-parser` - Cookie parsing middleware
- `fs-extra` - Enhanced file system operations

**Service-IP Service:**
- `cookie-parser` - Cookie parsing middleware
- `fs-extra` - Enhanced file system operations

**GameHub Model:**
- `jinaga` - Event sourcing framework

**GameHub Admin:**
- React and Vite-related dependencies

## Guidelines

### Adding New Dependencies

1. **Determine Scope**: First, determine if the dependency will be used by multiple services or just one.

2. **Common Dependencies**: If used by 2+ services, add to root `app/package.json`:
   ```bash
   cd app
   npm install <package-name>
   ```

3. **Service-Specific Dependencies**: If used by only one service, add to that service's `package.json`:
   ```bash
   cd app/<service-name>
   npm install <package-name>
   ```

4. **Type Definitions**: Always add corresponding `@types/*` packages for TypeScript support.

### Updating Dependencies

1. **Update Root Dependencies**:
   ```bash
   cd app
   npm update <package-name>
   ```

2. **Update Service Dependencies**:
   ```bash
   cd app/<service-name>
   npm update <package-name>
   ```

3. **Update All Dependencies**:
   ```bash
   cd app
   npm update --workspaces
   ```

### Removing Dependencies

1. **From Root**:
   ```bash
   cd app
   npm uninstall <package-name>
   ```

2. **From Service**:
   ```bash
   cd app/<service-name>
   npm uninstall <package-name>
   ```

## Installation Process

### Fresh Installation

```bash
cd app
rm -rf node_modules package-lock.json
rm -rf */node_modules
npm install
```

### Regular Installation

```bash
cd app
npm install
```

## Validation

Use the provided validation script to check dependency synchronization:

```bash
node scripts/validate-dependencies.js
```

This script will:
- Verify common dependencies are in the root package.json
- Check that services don't duplicate common dependencies
- Validate package-lock.json synchronization
- Report any dependency management issues

## CI/CD Integration

The validation script is integrated into CI workflows to prevent dependency management issues:

- **Player-IP CI**: Triggers on changes to `app/player-ip/**`, `app/package.json`, `app/package-lock.json`
- **Service-IP CI**: Triggers on changes to `app/service-ip/**`, `app/package.json`, `app/package-lock.json`

## Troubleshooting

### Common Issues

1. **Module Not Found Errors**
   - Ensure the dependency is installed at the correct level (root vs service)
   - Run `npm install` from the app directory
   - Check that the dependency is listed in the appropriate package.json

2. **Version Conflicts**
   - Use `npm ls` to identify version conflicts
   - Ensure common dependencies are only defined at the root level
   - Run the validation script to identify issues

3. **Package-lock.json Issues**
   - Delete node_modules and package-lock.json, then reinstall:
     ```bash
     cd app
     rm -rf node_modules package-lock.json */node_modules
     npm install
     ```

4. **Workspace Resolution Issues**
   - Ensure all workspace packages are listed in root package.json workspaces array
   - Verify workspace package names match directory names

### Build Failures

If you encounter build failures related to dependencies:

1. **Check Dependency Location**: Verify dependencies are in the correct package.json
2. **Validate Installation**: Run `npm install` from the app directory
3. **Run Validation**: Execute `node scripts/validate-dependencies.js`
4. **Clean Install**: Perform a fresh installation if issues persist

### Performance Optimization

- Keep the dependency tree as flat as possible
- Avoid duplicate dependencies across workspaces
- Regularly audit and remove unused dependencies
- Use `npm audit` to identify security vulnerabilities

## Best Practices

1. **Consistency**: Always use the same version of a dependency across the monorepo
2. **Minimal Duplication**: Avoid installing the same dependency in multiple places
3. **Regular Maintenance**: Periodically review and update dependencies
4. **Security**: Run `npm audit` regularly and address vulnerabilities
5. **Documentation**: Update this document when changing dependency management patterns

## Scripts

The following npm scripts are available for dependency management:

```bash
# Install all dependencies
npm run install-all

# Build all packages
npm run build

# Run tests across all packages
npm run test

# Validate dependencies
node scripts/validate-dependencies.js
```

## Support

For questions or issues related to dependency management:

1. Check this documentation first
2. Run the validation script to identify issues
3. Review CI build logs for specific error messages
4. Consult the team for complex dependency conflicts