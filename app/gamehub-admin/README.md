# GameHub Admin

A modern React web application built with Vite that demonstrates integration with the GameHub model system.

## Overview

This application serves as an admin interface for the GameHub system, showcasing:
- **Vite + React + TypeScript** modern web development stack
- **GameHub Model Integration** - demonstrates importing and using the gamehub-model package
- **Type Safety** - proper TypeScript integration with GameHub entities
- **Hot Module Replacement** - fast development experience with Vite HMR

## Features

- 🎮 **GameHub Model Demo** - Shows successful import of gamehub-model package
- 🏗️ **Type References** - Demonstrates usage of Tenant, Player, GameSession types
- 📊 **Module Stats** - Displays authorization and distribution module information
- 🔍 **Sample Data** - JSON preview of GameHub entity structures
- ⚡ **Fast Development** - Vite-powered development server with HMR

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Built gamehub-model package (run `npm run build` in `../gamehub-model`)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── App.tsx          # Main React component
├── App.css          # Component styles
├── main.tsx         # React application entry point
├── index.css        # Global styles
└── vite-env.d.ts    # Vite environment types
```

## Configuration Files

- `vite.config.ts` - Vite configuration with gamehub-model alias
- `tsconfig.json` - TypeScript configuration extending root config
- `tsconfig.node.json` - TypeScript config for Node.js tools
- `.eslintrc.cjs` - ESLint configuration

## GameHub Model Integration

The application demonstrates importing from the gamehub-model package:

```typescript
// Import the model modules
import { model, authorization, distribution } from 'gamehub-model'
import { Tenant, Player, GameSession } from 'gamehub-model/model'
import { User } from 'jinaga'
```

### Type Usage Examples

```typescript
// Create GameHub entities
const sampleUser = new User('admin@gamehub.com')
const sampleTenant = new Tenant(sampleUser)
const samplePlayer = new Player(sampleTenant, new Date().toISOString())
const sampleSession = new GameSession(sampleTenant, 'demo-session')
```

## Development Notes

- The application uses Vite aliases to resolve gamehub-model imports
- Process polyfills are configured for browser compatibility
- Hot Module Replacement provides instant feedback during development
- TypeScript provides full type safety with GameHub model types

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Troubleshooting

### Common Issues

1. **Module not found errors**: Ensure gamehub-model is built (`npm run build` in gamehub-model directory)
2. **Process errors**: The Vite config includes process polyfills for browser compatibility
3. **Type errors**: Check that TypeScript paths are correctly configured

### Development Server

The development server runs on port 3000 by default. If the port is busy, Vite will automatically use the next available port.

## Technology Stack

- **Vite** - Fast build tool and development server
- **React 18** - UI library with modern features
- **TypeScript** - Type-safe JavaScript
- **ESLint** - Code linting and formatting
- **GameHub Model** - Domain model and business logic
- **Jinaga** - Fact-based modeling framework