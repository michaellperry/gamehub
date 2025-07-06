# Dependency Management in GameHub Monorepo

This document outlines the guidelines and best practices for managing dependencies in the GameHub monorepo structure.

## Overview

The GameHub monorepo uses npm workspaces with a **per-project dependency strategy**. This approach ensures that each project maintains its own runtime dependencies while sharing only essential build tooling at the root level. This strategy provides better isolation, clearer dependency ownership, and more flexible deployment options.

## Architecture

```
app/
├── package.json          # Minimal shared dev dependencies only
├── package-lock.json     # Single lock file for entire monorepo
├── player-ip/
│   └── package.json      # All runtime + service-specific dev dependencies
├── service-ip/
│   └── package.json      # All runtime + service-specific dev dependencies
├── gamehub-model/
│   └── package.json      # Runtime dependencies + build tools
└── gamehub-admin/
    └── package.json      # React app dependencies
```

## Dependency Categories

### 1. Shared Dependencies (Root Level)

These are **minimal shared development dependencies** that are required by all projects for build tooling:

**Shared Development Dependencies:**
- `typescript` - TypeScript compiler used by all projects
- `rimraf` - Cross-platform cleanup utility for build processes
- `@types/node` - Node.js type definitions required by build tools, CLI scripts, and servers

### 2. Per-Project Dependencies

Each project manages its own runtime dependencies and project-specific development dependencies:

**Player-IP Service:**
- **Runtime**: `better-sqlite3`, `cors`, `dotenv`, `express`, `jsonwebtoken`, `uuid`, `gamehub-model`, `jinaga`, `cookie-parser`, `fs-extra`
- **Dev**: Corresponding `@types/*` packages, testing tools, linting tools

**Service-IP Service:**
- **Runtime**: `cors`, `dotenv`, `express`, `jsonwebtoken`, `cookie-parser`, `fs-extra`
- **Dev**: Corresponding `@types/*` packages, build tools

**GameHub Model:**
- **Runtime**: `jinaga`
- **Dev**: Build and compilation tools

**GameHub Admin:**
- **Runtime**: `react`, `react-dom`, `jinaga`, `gamehub-model`
- **Dev**: Vite, React tooling, TypeScript configuration

## Benefits of Per-Project Strategy

1. **Isolation**: Each project has complete control over its dependencies
2. **Flexibility**: Projects can use different versions of the same dependency if needed
3. **Clarity**: Dependencies are co-located with the code that uses them
4. **Deployment**: Easier to create minimal container images with only required dependencies
5. **Maintenance**: Easier to identify and update dependencies for specific projects

## Guidelines

### Adding New Dependencies

1. **Determine Project Scope**: Identify which specific project needs the dependency.

2. **Runtime Dependencies**: Add to the specific project's `package.json`:
   ```bash
   cd app/<project-name>
   npm install <package-name>
   ```

3. **Development Dependencies**: Add to the specific project's `package.json`:
   ```bash
   cd app/<project-name>
   npm install --save-dev <package-name>
   ```

4. **Shared Build Tools**: Only add to root if it's a build tool needed by ALL projects:
   ```bash
   cd app
   npm install --save-dev <package-name>
   ```

5. **Type Definitions**: Always add corresponding `@types/*` packages to the same project that uses the runtime dependency.

### Updating Dependencies

1. **Update Project Dependencies**:
   ```bash
   cd app/<project-name>
   npm update <package-name>
   ```

2. **Update Root Dependencies** (rare):
   ```bash
   cd app
   npm update <package-name>
   ```

3. **Update All Dependencies**:
   ```bash
   cd app
   npm update --workspaces
   ```

### Removing Dependencies

1. **From Project**:
   ```bash
   cd app/<project-name>
   npm uninstall <package-name>
   ```

2. **From Root** (rare):
   ```bash
   cd app
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

Use the provided validation script to check dependency management compliance:

```bash
node scripts/validate-dependencies.js
```

This script will:
- Verify that only essential build tools are in the root package.json
- Check that projects properly manage their own runtime dependencies
- Validate package-lock.json synchronization
- Report any dependency management issues

## CI/CD Integration

The validation script is integrated into CI workflows to prevent dependency management issues:

- **Player-IP CI**: Triggers on changes to `app/player-ip/**`, `app/package.json`, `app/package-lock.json`
- **Service-IP CI**: Triggers on changes to `app/service-ip/**`, `app/package.json`, `app/package-lock.json`
- **Admin CI**: Triggers on changes to `app/gamehub-admin/**`, `app/package.json`, `app/package-lock.json`
- **Model CI**: Triggers on changes to `app/gamehub-model/**`, `app/package.json`, `app/package-lock.json`

## Troubleshooting

### Common Issues

1. **Module Not Found Errors**
   - Ensure the dependency is installed in the correct project's package.json
   - Run `npm install` from the app directory to sync workspaces
   - Check that the dependency is listed in the project's package.json, not the root

2. **Version Conflicts**
   - Each project can have its own version of dependencies
   - Use `npm ls --workspace=<project-name>` to check project-specific versions
   - Run the validation script to identify configuration issues

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
   - Check that local package references use correct syntax (e.g., `"gamehub-model": "file:../gamehub-model"`)

### Build Failures

If you encounter build failures related to dependencies:

1. **Check Dependency Location**: Verify dependencies are in the correct project's package.json
2. **Validate Installation**: Run `npm install` from the app directory
3. **Run Validation**: Execute `node scripts/validate-dependencies.js`
4. **Clean Install**: Perform a fresh installation if issues persist
5. **Check Project-Specific Issues**: Navigate to the specific project and run `npm install` there

### Performance Optimization

- Each project maintains only the dependencies it actually uses
- Container images can be optimized by including only project-specific dependencies
- Regularly audit and remove unused dependencies from individual projects
- Use `npm audit --workspace=<project-name>` to check security vulnerabilities per project

## Best Practices

1. **Project Ownership**: Each project owns and manages its dependencies completely
2. **Minimal Root**: Keep root dependencies limited to essential build tools only
3. **Type Safety**: Always install `@types/*` packages in the same project as runtime dependencies
4. **Regular Maintenance**: Periodically review and update dependencies per project
5. **Security**: Run `npm audit` per workspace and address vulnerabilities promptly
6. **Documentation**: Update this document when changing dependency management patterns
7. **Validation**: Always run the validation script before committing dependency changes

## Scripts

The following npm scripts are available for dependency management:

```bash
# Install all dependencies
npm run install-all

# Build all packages
npm run build

# Build specific projects
npm run build:model
npm run build:player-ip
npm run build:admin
npm run build:service-ip

# Run development servers
npm run dev:player-ip
npm run dev:admin
npm run dev:service-ip

# Run tests across all packages
npm run test

# Validate dependencies
npm run validate-dependencies
```

## Migration Notes

This monorepo has migrated from a shared dependency model to a per-project dependency model. Key changes:

- **Runtime dependencies** moved from root to individual projects
- **Type definitions** moved to the projects that use the corresponding runtime dependencies
- **Root dependencies** reduced to only essential build tools
- **Project isolation** improved for better maintainability and deployment flexibility

## Support

For questions or issues related to dependency management:

1. Check this documentation first
2. Run the validation script to identify issues: `npm run validate-dependencies`
3. Review CI build logs for specific error messages
4. Check project-specific package.json files for dependency locations
5. Consult the team for complex dependency conflicts