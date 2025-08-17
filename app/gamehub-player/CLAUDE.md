# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GameHub Player is a React-based gaming application that uses Jinaga for real-time data synchronization and state management. The application enables users to join gaming playgrounds, participate in games, and manage real-time gaming sessions.

## Key Commands

### Development
```bash
npm run dev                    # Start development server on port 3000
npm run build                  # Build for production
npm run build:container        # Build for container deployment
npm run build:model            # Build the gamehub-model dependency
npm run preview                # Preview production build
```

### Code Quality
```bash
npm run lint                   # Run ESLint
npm run type-check             # Run TypeScript type checking
npm run generate-policies      # Generate authorization policies from model
```

### Testing
```bash
npm run test                   # Run tests in watch mode
npm run test:run               # Run tests once
npm run test:ui                # Run tests with UI interface
npm run test:coverage          # Run tests with coverage report
npm run test:watch             # Run tests in watch mode (alias for test)
```

## Architecture

### Core Technologies
- **React 18** with TypeScript for UI
- **Vite** for build tooling and development server
- **Jinaga** for real-time data synchronization and immutable facts
- **Tailwind CSS** for styling with custom gaming theme
- **React Router** for navigation
- **Vitest** with React Testing Library for testing

### Key Dependencies
- `gamehub-model` - Local workspace dependency containing shared model definitions
- `jinaga` and `jinaga-react` - Real-time data synchronization framework
- `react-oauth2-code-pkce` - OAuth2 authentication

### Project Structure
```
src/
├── auth/                      # OAuth2 authentication and providers
├── components/                # Atomic design system (atoms/molecules/organisms)
├── hooks/                     # Custom React hooks for game logic
├── pages/                     # Route components (HomePage, PlaygroundPage, GamePage)
├── services/                  # Background services and Jinaga configuration
├── test/                      # Test files and utilities
└── utils/                     # Utility functions (dates, environment, gaming names)
```

### Jinaga Integration
- **Configuration**: `src/jinaga-config.ts` sets up Jinaga browser instance with authorization
- **Real-time Facts**: Uses immutable facts for game state, players, challenges, and sessions
- **Authorization**: Tenant-based authorization rules from gamehub-model
- **Development Mode**: Automatically creates test data (tenant, player, player name)

### Component Architecture
- **Atomic Design**: Components organized as atoms → molecules → organisms
- **Gaming-focused**: UI optimized for real-time gaming interactions
- **Tailwind Integration**: Custom theme with primary blue color palette
- **Responsive**: Mobile-first design for various screen sizes

### Authentication Flow
- OAuth2 PKCE flow with `react-oauth2-code-pkce`
- Multiple provider layers: AccessProvider → UserProvider → PlayerSessionsProvider
- Custom AuthProvider class implements Jinaga's AuthenticationProvider interface

### Path Aliases
- `@model` - Points to `../gamehub-model/dist/esm` (production) or `../gamehub-model` (tests)
- `@` - Points to `./src`

## Testing Strategy

### Jinaga Testing
- Uses `JinagaTest.create()` for isolated test instances
- Custom utilities in `jinaga-test-utils.ts` for common scenarios
- Authorization and distribution rule testing
- See `src/test/JINAGA_TESTING_STRATEGY.md` for comprehensive testing patterns

### Component Testing
- React Testing Library with jsdom environment
- Component tests focus on user interactions, not implementation
- Test files located in `src/test/components/`

### Configuration
- Global test setup in `src/test/setup.ts`
- Coverage reporting with v8 provider
- UI testing interface available via `npm run test:ui`

## Environment Variables
- `VITE_BASE_NAME` - Base path for routing (defaults to `/`)
- `VITE_REPLICATOR_URL` - Jinaga replicator endpoint (production only)
- Development mode uses in-memory storage and local test data

## Build Modes
- **Development**: Uses memory storage, creates test data, no authentication
- **Container**: Builds for container deployment with specific copy to mesh/nginx
- **Production**: Uses IndexedDB storage, connects to replicator, requires authentication