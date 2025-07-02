# React Applications

This guide provides comprehensive documentation for setting up and configuring React applications with Vite in the GameHub platform, including the admin portal and player interface with Jinaga integration, authentication, and TailwindCSS styling.

## Table of Contents

- [React + Vite Setup](#react--vite-setup)
- [Project Structure and Architecture](#project-structure-and-architecture)
- [Jinaga Integration](#jinaga-integration)
- [Authentication Integration](#authentication-integration)
- [Styling and UI Framework](#styling-and-ui-framework)
- [Build Configuration](#build-configuration)
- [Development Workflow](#development-workflow)

## React + Vite Setup

### Project Initialization

The GameHub platform includes two React applications built with Vite:

1. **Admin Portal** (`app/gamehub-admin/`) - Management interface for session organizers
2. **Player Portal** (`app/gamehub-player/`) - Participant interface for game players

### Technology Stack

- **React 19**: Latest React with concurrent features and improved performance
- **TypeScript 5.7**: Type-safe development with latest language features
- **Vite 6.2**: Fast build tool and development server with HMR
- **React Router 7.2**: Client-side routing with data loading
- **TailwindCSS 3.4**: Utility-first CSS framework
- **Jinaga 6.7**: Real-time data synchronization and fact-based modeling
- **react-oauth2-code-pkce 1.22**: OAuth2 PKCE authentication flow

### Package Configuration

#### Admin Portal Dependencies
```json
{
  "dependencies": {
    "@types/jsonwebtoken": "^9.0.9",
    "express": "^4.18.2",
    "jinaga": "^6.7.8",
    "jinaga-react": "^5.2.0",
    "json-2-csv": "^5.5.9",
    "qr-code-styling": "^1.9.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-oauth2-code-pkce": "^1.22.2",
    "react-router-dom": "^7.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react-swc": "^3.8.0",
    "autoprefixer": "^10.4.21",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.7.2",
    "vite": "^6.2.0"
  }
}
```

#### Player Portal Dependencies
```json
{
  "dependencies": {
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "jinaga": "^6.7.8",
    "jinaga-react": "^5.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-oauth2-code-pkce": "^1.22.2",
    "react-router-dom": "^7.2.0",
    "tailwind-merge": "^3.2.0"
  }
}
```

### TypeScript Configuration

#### Main TypeScript Config (`tsconfig.json`)
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

#### Application TypeScript Config (`tsconfig.app.json`)
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "types": ["node"],
    "sourceMap": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,

    /* Path Aliases */
    "paths": {
      "@model/*": ["../gamehub-model/*", "node_modules/gamehub-model/*"]
    },
    "baseUrl": "."
  },
  "include": ["src", "src/types/*.d.ts"],
  "exclude": ["node_modules"]
}
```

### Vite Configuration

#### Development and Production Config (`vite.config.ts`)
```typescript
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  
  return {
    plugins: [react()],
    base: env.VITE_BASE_NAME || '/', // Use VITE_BASE_NAME from env files
    server: {
      port: 3000,
      strictPort: true, // Fail if port is already in use
    },
    build: {
      sourcemap: true, // Enable source maps for production builds
    },
    resolve: {
      alias: {
        '@model': path.resolve(__dirname, '../gamehub-model')
      }
    }
  }
})
```

### Environment Variable Management

#### Development Environment (`.env`)
```env
VITE_BASE_NAME: '/'
VITE_CONTENT_STORE_URL: 'http://localhost/content'
VITE_PLAYER_APP_URL: 'http://localhost/player'
```

#### Container Environment (`.env.container`)
```env
VITE_BASE_NAME=/portal/
VITE_REPLICATOR_URL=http://localhost/replicator/jinaga
VITE_AUTHORIZATION_ENDPOINT=http://localhost/auth/oauth2/authorize
VITE_TOKEN_ENDPOINT=http://localhost/auth/oauth2/token
VITE_REDIRECT_URI=http://localhost/portal/callback
VITE_LOGOUT_ENDPOINT=http://localhost/auth/oauth2/logout
VITE_CONTENT_STORE_URL=http://localhost/content
VITE_PLAYER_APP_URL=http://localhost/player
```

#### Production Environment (`.env.production`)
```env
VITE_BASE_NAME=/portal/
VITE_REPLICATOR_URL=https://gamehub.example.com/replicator/jinaga
VITE_AUTHORIZATION_ENDPOINT=https://gamehub.example.com/auth/oauth2/authorize
VITE_TOKEN_ENDPOINT=https://gamehub.example.com/auth/oauth2/token
VITE_REDIRECT_URI=https://gamehub.example.com/portal/callback
VITE_LOGOUT_ENDPOINT=https://gamehub.example.com/auth/oauth2/logout
VITE_CONTENT_STORE_URL=https://gamehub.example.com/content
VITE_PLAYER_APP_URL=https://gamehub.example.com/player
```

### Hot Module Replacement and Development Server

Vite provides fast HMR with the following features:
- **Instant Updates**: Component changes reflect immediately without full page reload
- **State Preservation**: React state is maintained during updates
- **CSS Hot Reload**: Style changes apply instantly
- **Error Overlay**: Development errors displayed in browser overlay
- **Fast Refresh**: React Fast Refresh for component updates

## Project Structure and Architecture

### Directory Organization Following Atomic Design

Both applications follow atomic design principles for component organization:

#### Admin Portal Structure
```
app/gamehub-admin/
├── public/                     # Static assets
│   └── rocket.svg             # Application icon
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── atoms/            # Basic UI elements
│   │   │   ├── Alert.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Icon.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   └── LoadingIndicator.tsx
│   │   ├── molecules/        # Composite components
│   │   │   ├── EmptyState.tsx
│   │   │   ├── FormField.tsx
│   │   │   ├── ListItem.tsx
│   │   │   ├── LogoUploader.tsx
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
├── .env.container           # Container environment variables
├── .env.production          # Production environment variables
├── package.json             # Dependencies and scripts
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # TailwindCSS configuration
└── tsconfig.json            # TypeScript configuration
```

#### Player Portal Structure
```
app/gamehub-player/
├── public/                   # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── atoms/          # Basic UI elements
│   │   ├── molecules/      # Composite components
│   │   ├── organisms/      # Complex components
│   │   └── templates/      # Page templates
│   ├── player/             # Player-specific features
│   ├── auth/               # Authentication components
│   ├── sessions/           # Session participation features
│   ├── home/               # Landing page components
│   ├── legal/              # Legal and compliance pages
│   ├── services/           # API and utility services
│   ├── styles/             # Global styles
│   ├── theme/              # Theme configuration
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
└── [configuration files]
```

### Component Hierarchy Examples

#### Atoms - Basic UI Elements
```typescript
// Button atom with comprehensive props
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  // Implementation with TailwindCSS classes
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 border border-transparent shadow-sm',
    secondary: 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500 border border-gray-300 shadow-sm',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-transparent shadow-sm',
    text: 'bg-transparent text-primary-600 hover:text-primary-700 hover:bg-gray-50 focus:ring-primary-500',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Icon name="loading" className="animate-spin mr-2" />}
      {!isLoading && icon && iconPosition === 'left' && <Icon name={icon} className="mr-2" />}
      {children}
      {!isLoading && icon && iconPosition === 'right' && <Icon name={icon} className="ml-2" />}
    </button>
  );
};
```

### Shared Utilities and Services Structure

#### Service Layer Organization
```typescript
// services/contentStore.ts - Content management service
export class ContentStoreService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_CONTENT_STORE_URL;
  }

  async uploadImage(file: File): Promise<string> {
    // Implementation
  }

  async getImageUrl(path: string): Promise<string> {
    // Implementation
  }
}

// services/csvProcessor.ts - CSV data processing
export class CSVProcessor {
  static async exportAttendees(data: AttendeeData[]): Promise<string> {
    // Implementation
  }
}
```

### Asset Management and Static File Handling

- **Public Assets**: Static files in `public/` directory served directly
- **Dynamic Imports**: Code splitting with dynamic imports
- **Image Optimization**: Vite handles image optimization automatically
- **SVG Handling**: SVG files imported as React components or URLs

## Jinaga Integration

### Jinaga Client Configuration

#### Development Mode Setup (`jinaga-config.ts`)
```typescript
import { authorization } from "@model/authorization";
import { JinagaBrowser } from "jinaga";
import { AuthProvider } from "./auth/AuthProvider";

export const authProvider = new AuthProvider();

export const j = JinagaBrowser.create({
    indexedDb: "jinaga-gamehub-admin",
    httpEndpoint: import.meta.env.VITE_REPLICATOR_URL,
    httpAuthenticationProvider: authProvider
});

// Export authorization rules for the replicator
export const authorizationRules = authorization;
```

### Pre-populated Sample Data Setup

The Jinaga client automatically handles:
- **Local Storage**: IndexedDB for offline-first functionality
- **Synchronization**: Automatic sync with remote replicator
- **Conflict Resolution**: Built-in conflict resolution for concurrent updates

### React Hooks Integration with jinaga-react

#### Custom Hook Example (`useSessions.ts`)
```typescript
import { User } from "jinaga";
import { useSpecification } from "jinaga-react";
import { useState } from "react";
import { useUser } from "../auth/UserProvider";
import { j } from "../jinaga-config";
import { Administrator, GameSession, SessionName, model, Tenant, GameRound } from "@model/model";
import { useTenant } from "../tenants/useTenant";

const sessionsInTenant = model.given(Tenant).match(tenant =>
    GameSession.in(tenant)
        .select(session => ({
            fact: session,
            id: session.id,
            names: SessionName.of(session)
        }))
);

const isAdministratorOfTenant = model.given(Tenant, User).match((tenant, user) =>
    Administrator.of(tenant)
        .join(admin => admin.user, user)
);

async function createSession(tenant: Tenant | null, name: string) {
    if (tenant) {
        const session = await j.fact(new GameSession(tenant, crypto.randomUUID()));
        await j.fact(new SessionName(session, name, []));
        await j.fact(new GameRound(session, 1));
        await j.fact(new GameRound(session, 2));
    }
}

export interface SessionViewModel {
    id: string;
    name: string;
    updateName(name: string): void;
}

export function useSessions() {
    const tenant = useTenant();
    const { user } = useUser();
    const { data: sessions, error: sessionsError } = useSpecification(j, sessionsInTenant, tenant);
    const { data: isAdmin, error: isAdminError } = useSpecification(j, isAdministratorOfTenant, tenant, user);
    const [ actionError, setActionError ] = useState<Error | null>(null);

    return {
        isConfigured: !!tenant,
        sessions: sessions?.map<SessionViewModel>(session => ({
            id: session.id,
            name: session.names.length > 0 ? session.names[0].value : session.id.substring(0, 7),
            updateName: (name: string) => updateSessionName(session.fact, name, session.names)
                .then(() => setActionError(null))
                .catch(setActionError)
        })) || null,
        error: actionError || sessionsError || isAdminError,
        canAddSession: tenant && isAdmin && isAdmin.length > 0,
        addSession: (name: string) => createSession(tenant, name)
            .then(() => setActionError(null))
            .catch(setActionError)
    };
}
```

### Real-time Data Synchronization Patterns

- **Reactive Updates**: Components automatically re-render when data changes
- **Optimistic Updates**: Local changes applied immediately, synced in background
- **Conflict Resolution**: Automatic handling of concurrent modifications
- **Offline Support**: Local-first architecture with sync when online

### Model Path Aliases and Import Configuration

Path aliases configured in both Vite and TypeScript:

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@model': path.resolve(__dirname, '../gamehub-model')
  }
}

// tsconfig.app.json
"paths": {
  "@model/*": ["../gamehub-model/*", "node_modules/gamehub-model/*"]
}
```

Usage in components:
```typescript
import { GameSession, SessionName, Tenant } from "@model/model";
import { authorization } from "@model/authorization";
```

## Authentication Integration

### OAuth2 PKCE Flow Implementation

#### Authentication Configuration (`auth-config.ts`)
```typescript
import { TAuthConfig, TRefreshTokenExpiredEvent } from "react-oauth2-code-pkce";

export const authConfig: TAuthConfig = {
  clientId: import.meta.env.VITE_CLIENT_ID,
  authorizationEndpoint: import.meta.env.VITE_AUTHORIZATION_ENDPOINT,
  tokenEndpoint: import.meta.env.VITE_TOKEN_ENDPOINT,
  redirectUri: import.meta.env.VITE_REDIRECT_URI,
  scope: 'openid profile offline_access',
  storageKeyPrefix: 'ROCP_admin_',
  onRefreshTokenExpire: (event: TRefreshTokenExpiredEvent) => event.logIn(undefined, undefined, "popup"),
  logoutEndpoint: import.meta.env.VITE_LOGOUT_ENDPOINT,
};
```

### FusionAuth Integration Patterns

#### OAuth2 Authentication Provider (`oauth-auth-provider.ts`)
```typescript
import { AuthenticationProvider, HttpHeaders } from "jinaga";
import { IAuthContext } from "react-oauth2-code-pkce";

export class OAuth2AuthenticationProvider implements AuthenticationProvider {
  constructor(private authContext: IAuthContext) {}

  async getHeaders(): Promise<HttpHeaders> {
    const { token } = this.authContext;
    
    if (!token) {
      return {};
    }
    
    return {
      "Authorization": `Bearer ${token}`
    };
  }

  async reauthenticate(): Promise<boolean> {
    const { token, logIn } = this.authContext;
    
    // If we have a token, try to refresh it
    if (token) {
      try {
        // The react-oauth2-code-pkce library will handle token refresh
        await logIn();
        return true; // Indicate that we successfully refreshed the token
      } catch (error) {
        console.error("Failed to refresh token:", error);
        return false; // Indicate that we failed to refresh the token
      }
    }
    
    // If we don't have a token, we need to redirect to login
    return false;
  }
}
```

### Protected Routes and Authentication Guards

#### Protected Route Component (`ProtectedRoute.tsx`)
```typescript
import { useAuth } from "react-oauth2-code-pkce";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token, logIn } = useAuth();
  const location = useLocation();

  if (!token) {
    // Store the current location for redirect after login
    sessionStorage.setItem('redirectUrl', location.pathname);
    logIn();
    return <div>Redirecting to login...</div>;
  }

  return <>{children}</>;
};
```

### User Context and State Management

#### Application Entry Point (`main.tsx`)
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from "react-oauth2-code-pkce"
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { authConfig } from "./auth/auth-config.ts"
import { UserProvider } from "./auth/UserProvider.tsx"
import './index.css'
import { authProvider, j } from "./jinaga-config.ts"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider authConfig={authConfig}>
      <UserProvider j={j} authProvider={authProvider}>
        <BrowserRouter basename={import.meta.env.VITE_BASE_NAME ?? '/'}>
          <App />
        </BrowserRouter>
      </UserProvider>
    </AuthProvider>
  </StrictMode>,
)
```

### Token Management and Refresh Patterns

- **Automatic Refresh**: `react-oauth2-code-pkce` handles token refresh automatically
- **Storage**: Tokens stored securely in browser storage with configurable prefix
- **Expiration Handling**: Automatic re-authentication on token expiry
- **Logout**: Proper cleanup of tokens and session data

## Styling and UI Framework

### TailwindCSS Setup and Configuration

#### TailwindCSS Configuration (`tailwind.config.js`)
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0066ff', // Primary brand color
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433',
        },
        secondary: {
          50: '#f2f2f2',
          100: '#e6e6e6',
          200: '#cccccc',
          300: '#b3b3b3',
          400: '#999999',
          500: '#808080', // Secondary brand color
          600: '#666666',
          700: '#4d4d4d',
          800: '#333333',
          900: '#1a1a1a',
        },
        dark: {
          bg: '#121212',
          surface: '#1e1e1e',
          border: '#2e2e2e',
          text: {
            primary: '#ffffff',
            secondary: '#a0aec0'
          }
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
```

### Design System Implementation

#### Component Styling Patterns
- **Utility Classes**: TailwindCSS utility classes for rapid development
- **Component Variants**: Consistent styling variants across components
- **Responsive Design**: Mobile-first responsive design patterns
- **State Management**: Hover, focus, and active states

### Theme Management and Dark Mode Support

#### Theme Provider (`ThemeProvider.tsx`)
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

## Build Configuration

### Dual Build Targets

#### Development vs Production Builds

**Development Build:**
```bash
npm run dev
# - Fast HMR
# - Source maps enabled
# - Development environment variables
# - Local replicator endpoints
```

**Production Build:**
```bash
npm run build
# - Optimized bundle
# - Tree shaking
# - Code splitting
# - Production environment variables
# - Remote endpoints
```

**Container Build:**
```bash
npm run build:container
# - Container-specific environment
# - Docker-optimized paths
# - Nginx-ready static files
```

### Environment-specific Configuration Injection

Build scripts automatically load environment variables based on mode:
- `.env` - Development defaults
- `.env.container` - Container deployment
- `.env.production` - Production deployment

### Asset Optimization and Bundling

Vite automatically handles:
- **Code Splitting**: Automatic route-based code splitting
- **Tree Shaking**: Dead code elimination
- **Asset Optimization**: Image and CSS optimization
- **Bundle Analysis**: Built-in bundle analyzer

### Source Map Configuration

Source maps enabled for all builds:
```typescript
// vite.config.ts
build: {
  sourcemap: true, // Enable source maps for production builds
}
```

### Production Deployment Preparation

Build output optimized for:
- **Static Hosting**: Ready for CDN deployment
- **Docker Containers**: Nginx-compatible structure
- **Progressive Web App**: Service worker ready

## Development Workflow

### Local Development Setup

#### Getting Started
```bash
# Navigate to application directory
cd app/gamehub-admin  # or app/gamehub-player

# Install dependencies
npm install

# Start development server
npm run dev

# Application available at http://localhost:3000
```

#### Development Commands
```bash
# Development server with HMR
npm run dev

# Type checking
tsc --noEmit

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview

# Container build
npm run build:container
```

### Component Development and Testing

#### Component Development Pattern
1. **Create Component**: Start with atomic components
2. **Add Types**: Define comprehensive TypeScript interfaces
3. **Style with Tailwind**: Use utility classes for styling
4. **Add Interactions**: Implement event handlers and state
5. **Test Integration**: Test with Jinaga data flow

#### Example Development Flow
```typescript
// 1. Define component interface
interface ComponentProps {
  // Props definition
}

// 2. Implement component
const Component: React.FC<ComponentProps> = (props) => {
  // Implementation
};

// 3. Export with proper typing
export default Component;
export type { ComponentProps };
```

### Integration with Backend Services

#### Service Integration Pattern
```typescript
// Custom hook for backend integration
export function useBackendData() {
  const { data, error, loading } = useSpecification(j, specification, ...params);
  
  return {
    data: data?.map(transformData) || [],
    error,
    loading,
    actions: {
      create: (data) => j.fact(new FactType(data)),
      update: (fact, data) => j.fact(new UpdateFact(fact, data)),
    }
  };
}
```

### Debugging Techniques and Tools

#### Development Tools
- **React DevTools**: Component tree inspection and profiling
- **Vite DevTools**: Build analysis and performance monitoring
- **Browser DevTools**: Network, console, and performance debugging
- **TypeScript**: Compile-time error detection

#### Debugging Patterns
```typescript
// Environment-based logging
const isDev = import.meta.env.DEV;

if (isDev) {
  console.log('Debug info:', data);
}

// Error boundaries for production
class ErrorBoundary extends React.Component {
  // Error boundary implementation
}
```

### Performance Optimization

#### Code Splitting
```typescript
// Route-based code splitting
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Component with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>
```

#### Bundle Optimization
- **Dynamic Imports**: Load components on demand
- **Tree Shaking**: Eliminate unused code
- **Asset Optimization**: Optimize images and fonts
- **Caching**: Leverage browser caching strategies

## Next Steps

With React applications configured and running:

1. **Backend Integration**: Set up API services in [Backend Services](./06-backend-services.md)