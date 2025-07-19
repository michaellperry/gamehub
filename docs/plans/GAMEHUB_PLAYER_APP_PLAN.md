# GameHub Player Application Development Plan

## Overview
This plan outlines the creation of the GameHub Player application - a React-based web application that allows players to participate in game sessions. The application will be served at the `/player/` path through NGINX and integrated with the existing GameHub infrastructure.

## Prerequisites
- [ ] GameHub infrastructure is running (Docker Compose services)
- [ ] gamehub-model package is built and available
- [ ] Player-IP service is operational and accessible
- [ ] Jinaga replicator is running with GameHub policies
- [ ] NGINX reverse proxy is configured and serving admin portal

## Phase 1: Application Foundation Setup

### 1.1 Create Application Directory Structure
**Location**: `app/gamehub-player/`

**Required Directory Structure**:
- [ ] Run Vite CLI command (creates base structure automatically)
- [ ] Create additional directories in `src/`:
  - [ ] Create `src/pages/` for page components
  - [ ] Create `src/hooks/` for custom React hooks
  - [ ] Create `src/utils/` for utility functions
  - [ ] Create `src/types/` for TypeScript type definitions
  - [ ] Create `src/services/` for API service functions

### 1.2 Initialize Application with Vite CLI
**Command**: `npm create vite@latest app/gamehub-player -- --template react-ts`

**Required Steps**:
- [ ] Run Vite CLI command to create React TypeScript template
- [ ] Navigate to the created directory: `cd app/gamehub-player`
- [ ] Install base dependencies: `npm install`
- [ ] Add additional required dependencies:
  - [ ] `npm install jinaga@6.7.8 jinaga-react@5.2.0`
  - [ ] `npm install react-router-dom@7.6.3`
  - [ ] `npm install react-oauth2-code-pkce@1.23.1`
  - [ ] `npm install gamehub-model`
- [ ] Add development dependencies:
  - [ ] `npm install -D tailwindcss postcss autoprefixer`
  - [ ] `npm install -D @types/node`
- [ ] Update package.json with custom scripts and metadata
- [ ] Add container build script to package.json

**Key Dependencies to Add**:
- Jinaga 6.7.8
- jinaga-react 5.2.0
- react-router-dom 7.6.3
- react-oauth2-code-pkce 1.23.1
- gamehub-model
- TailwindCSS (dev dependency)

### 1.3 Configure Build Tools

#### TypeScript Configuration
**File**: `app/gamehub-player/tsconfig.json`
- [ ] Update existing tsconfig.json for GameHub requirements
- [ ] Set up path aliases for @/ and @model/
- [ ] Configure module resolution
- [ ] Set up strict type checking
- [ ] Configure output directory

**File**: `app/gamehub-player/tsconfig.node.json`
- [ ] Update existing tsconfig.node.json for GameHub requirements

#### Vite Configuration
**File**: `app/gamehub-player/vite.config.ts`
- [ ] Update existing vite.config.ts for GameHub requirements
- [ ] Set up base path for /player/ deployment
- [ ] Configure path aliases (@/ and @model/)
- [ ] Set up environment variable loading
- [ ] Configure build output directory
- [ ] Set up development server configuration
- [ ] Configure source maps for debugging

#### TailwindCSS Configuration
**File**: `app/gamehub-player/tailwind.config.js`
- [ ] Configure content paths for component scanning
- [ ] Set up theme customization
- [ ] Configure plugins (forms, typography, etc.)

**File**: `app/gamehub-player/postcss.config.js`
- [ ] Configure PostCSS with TailwindCSS and Autoprefixer

## Phase 2: Application Architecture Setup

### 2.1 HTML Entry Point
**File**: `app/gamehub-player/index.html`
- [ ] Update existing index.html for GameHub requirements
- [ ] Set up viewport configuration
- [ ] Add title and description
- [ ] Configure favicon and other static assets

### 2.2 Application Entry Point
**File**: `app/gamehub-player/src/main.tsx`
- [ ] Update existing main.tsx for GameHub requirements
- [ ] Configure React Router
- [ ] Set up Jinaga client initialization
- [ ] Configure authentication provider
- [ ] Set up error boundaries
- [ ] Configure development tools

### 2.3 Root Component Structure
**File**: `app/gamehub-player/src/App.tsx`
- [ ] Update existing App.tsx for GameHub requirements
- [ ] Set up routing configuration
- [ ] Configure authentication flow
- [ ] Set up Jinaga context provider
- [ ] Configure layout structure

### 2.4 Authentication Integration
**File**: `app/gamehub-player/src/services/auth.ts`
- [ ] Create authentication service
- [ ] Configure OAuth2 PKCE flow with Player-IP
- [ ] Set up token management
- [ ] Configure refresh token handling
- [ ] Set up authentication state management

### 2.5 Jinaga Client Configuration
**File**: `app/gamehub-player/src/services/jinaga.ts`
- [ ] Configure Jinaga client connection
- [ ] Set up authentication headers

## Phase 3: Core Application Features

### 3.1 Authentication Flow
**Required Components**:
- [ ] Authentication callback handler
- [ ] Protected route wrapper
- [ ] Authentication context provider
- [ ] Token refresh mechanism

**Authentication Flow Steps**:
1. [ ] Player visits /player/ application
2. [ ] Application checks for existing authentication
3. [ ] If not authenticated, redirect to Player-IP OAuth endpoint
4. [ ] Player completes OAuth2 PKCE flow
5. [ ] Application receives authorization code
6. [ ] Application exchanges code for access token
7. [ ] Application stores tokens securely
8. [ ] Application initializes Jinaga client with token
9. [ ] Application redirects to main player interface

## Phase 4: UI/UX Implementation

### 4.1 Design System Setup
**Required Files**:
- [ ] Create design tokens (colors, typography, spacing)
- [ ] Set up component library structure
- [ ] Configure TailwindCSS theme
- [ ] Create base component styles

### 4.2 Layout Components
**Required Components**:
- [ ] Main layout wrapper
- [ ] Header component with navigation
- [ ] Sidebar component (if needed)
- [ ] Footer component
- [ ] Loading states
- [ ] Error boundaries

### 4.3 Form Components
**Required Components**:
- [ ] Input components
- [ ] Button components
- [ ] Form validation
- [ ] Error message display
- [ ] Success message display

### 4.4 Navigation
**Required Components**:
- [ ] Navigation menu
- [ ] Breadcrumb navigation
- [ ] Tab navigation
- [ ] Mobile responsive navigation

## Phase 5: Container Build Configuration

### 5.1 Build Script Configuration
**Update package.json scripts**:
- [ ] Add build:container script
- [ ] Configure build output for NGINX deployment
- [ ] Set up environment-specific builds
- [ ] Configure asset optimization

### 5.2 Environment Configuration
**Required Environment Files**:
- [ ] Create .env with all required variables
- [ ] Create .env.container for container builds
- [ ] Update the setup scripts to write VITE_CLIENT_ID and VITE_TENANT_PUBLIC_KEY to .env.container.local
- [ ] Document all environment variables

**Required Environment Variables**:
- [ ] VITE_BASE_NAME=/player/
- [ ] VITE_PLAYER_IP_URL=http://localhost/player-ip/
- [ ] VITE_REPLICATOR_URL=http://localhost/replicator/
- [ ] VITE_CONTENT_STORE_URL=http://localhost/content/
- [ ] VITE_APP_TITLE=GameHub Player

## Phase 6: NGINX Integration

### 6.1 NGINX Configuration Update
**File**: `mesh/nginx/nginx.conf`

**Required Changes**:
- [ ] Add location block for /player/ path
- [ ] Configure static file serving
- [ ] Set up proper routing for SPA
- [ ] Configure caching headers
- [ ] Set up security headers
- [ ] Configure error pages

**Location Block Configuration**:
- [ ] Serve static files from /var/www/player/
- [ ] Configure try_files for SPA routing
- [ ] Set up caching for static assets
- [ ] Configure security headers
- [ ] Set up proper MIME types

### 6.2 Docker Compose Update
**File**: `mesh/docker-compose.yml`

**Required Changes**:
- [ ] Add volume mount for player application
- [ ] Update NGINX service configuration
- [ ] Ensure proper file permissions
- [ ] Configure build process integration

### 6.3 Build Process Integration
**Required Steps**:
- [ ] Create build script that copies to NGINX directory
- [ ] Set up automated build process
- [ ] Configure development workflow
- [ ] Set up production deployment process

This plan provides a comprehensive roadmap for creating the GameHub Player application while maintaining consistency with the existing GameHub architecture and ensuring proper integration with all backend services. 