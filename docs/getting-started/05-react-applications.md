# React Applications

This guide provides comprehensive documentation for setting up and configuring React applications with Vite in the GameHub platform, including the admin portal and player interface with Jinaga integration, authentication, and TailwindCSS styling.

## Table of Contents

- [React Applications](#react-applications)
  - [Table of Contents](#table-of-contents)
  - [React + Vite Setup](#react--vite-setup)
    - [Project Initialization](#project-initialization)
    - [Technology Stack](#technology-stack)
  - [Project Structure and Architecture](#project-structure-and-architecture)
    - [Directory Organization Following Atomic Design](#directory-organization-following-atomic-design)
      - [Admin Portal Structure](#admin-portal-structure)
  - [Jinaga Integration](#jinaga-integration)
    - [Pre-populated Sample Data Setup](#pre-populated-sample-data-setup)
    - [Data Synchronization Patterns](#data-synchronization-patterns)
  - [Next Steps](#next-steps)

## React + Vite Setup

### Project Initialization

The GameHub platform includes a React application built with Vite as part of the monorepo:

1. **Admin Portal** (`app/gamehub-admin/`) - Management interface for session organizers

Note: The player interface is now handled by the `player-ip` console application rather than a separate React application.

### Technology Stack

- **React 19**: Latest React with concurrent features and improved performance
- **TypeScript 5.7**: Type-safe development with latest language features
- **Vite 6.2**: Fast build tool and development server with HMR
- **React Router 7.2**: Client-side routing with data loading
- **TailwindCSS 3.4**: Utility-first CSS framework
- **Jinaga 6.7**: Data synchronization and fact-based modeling
- **react-oauth2-code-pkce 1.22**: OAuth2 PKCE authentication flow

## Project Structure and Architecture

### Directory Organization Following Atomic Design

The admin application follows atomic design principles for component organization:

#### Admin Portal Structure
```
app/gamehub-admin/
├── public/                   # Static assets
│   └── rocket.svg            # Application icon
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── atoms/            # Basic UI elements
│   │   │   ├── Alert.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Icon.tsx
│   │   │   └── LoadingIndicator.tsx
│   │   ├── molecules/        # Composite components
│   │   │   ├── EmptyState.tsx
│   │   │   ├── FormField.tsx
│   │   │   ├── ListItem.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── ModalFooter.tsx
│   │   │   └── PageHeader.tsx
│   │   └── organisms/        # Complex components
│   │       └── ResourceList.tsx
│   ├── auth/                 # Authentication components
│   │   ├── AuthProvider.tsx
│   │   ├── LoginButton.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── UserProvider.tsx
│   │   ├── auth-config.ts
│   │   └── oauth-auth-provider.ts
│   ├── sessions/             # Session management features
│   ├── tenants/              # Tenant management
│   ├── invitations/          # Invitation system
│   ├── service-principals/   # Service principal management
│   ├── services/             # API and utility services
│   ├── styles/               # Global styles
│   ├── theme/                # Theme configuration
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── .env                      # Development environment variables
├── .env.container            # Container environment variables
├── .env.production           # Production environment variables
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # TailwindCSS configuration
└── tsconfig.json             # TypeScript configuration
```

The admin application is part of the monorepo and depends on the shared `gamehub-model` package for data models and Jinaga integration.

## Jinaga Integration

The Jinaga client automatically handles:
- **Local Storage**: IndexedDB for offline-first functionality
- **Synchronization**: Automatic sync with remote replicator
- **Conflict Detection**: Built-in conflict detection for concurrent updates

### Pre-populated Sample Data Setup

The `jinaga-config.ts` file initializes sample data for development. This data is only used while in development mode, which uses the in-memory Jinaga Client. Define sample facts to set up scenarios for testing and development.

### Data Synchronization Patterns

- **Reactive Updates**: Components automatically re-render when data changes
- **Optimistic Updates**: Local changes applied immediately, synced in background
- **Conflict Detection**: Concurrent modifications are visible as multiple candidate instances
- **Offline Support**: Local-first architecture with sync when online

## Next Steps

With the React admin application configured and running:

1. **Backend Integration**: Set up API services in [Backend Services](./06-backend-services.md)
2. **Development Workflow**: Use `npm run dev:admin` from the monorepo root to start development
3. **Building**: Use `npm run build:admin` to build the admin application
4. **Model Updates**: Remember to run `npm run build:model` after making changes to the shared model