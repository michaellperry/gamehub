# GameHub Monorepo

This is a Node.js monorepo using npm workspaces containing the GameHub applications and shared libraries.

## Structure

- **gamehub-model** - Shared TypeScript library with Jinaga domain model (dual ESM/CJS builds)
- **player-ip** - Node.js console application for player IP management
- **gamehub-admin** - Vite-based web application for administration

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
npm install
```

This will install dependencies for all workspace packages.

## Available Scripts

### Root Level Scripts

- `npm run build` - Build all packages
- `npm run build:model` - Build only the gamehub-model package
- `npm run build:player-ip` - Build only the player-ip package
- `npm run build:admin` - Build only the gamehub-admin package
- `npm run clean` - Clean build artifacts from all packages
- `npm run dev` - Start development mode for all applicable packages
- `npm run dev:player-ip` - Start development mode for player-ip
- `npm run dev:admin` - Start development mode for gamehub-admin
- `npm run test` - Run tests for all packages
- `npm run lint` - Run linting for all packages
- `npm run type-check` - Run TypeScript type checking for all packages
- `npm run generate-policies` - Generate Jinaga policies from gamehub-model

### Working with Individual Packages

You can also run scripts for individual packages:

```bash
# Run a script in a specific workspace
npm run <script> --workspace=<package-name>

# Example: build only the model
npm run build --workspace=gamehub-model
```

## Development Workflow

1. **Install dependencies**: `npm install`
2. **Build the shared model**: `npm run build:model`
3. **Start development**: `npm run dev:admin` or `npm run dev:player-ip`

## Package Dependencies

- **player-ip** depends on **gamehub-model**
- **gamehub-admin** depends on **gamehub-model**

The workspace configuration ensures that packages can reference each other using their package names, and npm will automatically link them during installation.

## TypeScript Configuration

The monorepo uses a root `tsconfig.json` that can be extended by individual packages. Each package can have its own TypeScript configuration while inheriting common settings from the root.