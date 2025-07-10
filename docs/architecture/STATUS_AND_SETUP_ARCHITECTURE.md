# GameHub Status and Setup Pages System Architecture

## Executive Summary

This document outlines the comprehensive architecture and implementation plan for the GameHub status and setup pages system. The system provides HTTP-based observability and guided setup capabilities through three main components:

1. **Relay Service** - Centralized observability aggregation at `http://localhost/relay`
2. **Status Page** - HTTP polling dashboard at `http://localhost/status`
3. **Setup Page** - Guided configuration walkthrough at `http://localhost/setup`

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Design](#architecture-design)
- [Component Specifications](#component-specifications)
- [API Specifications](#api-specifications)
- [Data Flow Diagrams](#data-flow-diagrams)
- [Integration Plan](#integration-plan)
- [Implementation Roadmap](#implementation-roadmap)
- [Technology Stack](#technology-stack)
- [File Structure](#file-structure)

## System Overview

### Current GameHub Infrastructure

GameHub operates as a microservices architecture with the following existing services:

- **NGINX Reverse Proxy** - Routes traffic at `http://localhost`
- **FusionAuth** - OAuth authentication at `/auth/`
- **Player IP Service** - Player authentication at `/player-ip/` (Port 8082)
- **Service IP Provider** - Service-to-service auth at Port 8083
- **Content Store** - File storage at `/content/` (Port 8081)
- **Jinaga Replicator** - Real-time data sync at `/replicator/`
- **Admin Portal** - Management interface at `/portal/`

### New System Components

The status and setup system adds three new components that integrate seamlessly with existing infrastructure:

```
┌─────────────────────────────────────────────────────────────────┐
│                        NGINX Reverse Proxy                      │
│                      http://localhost                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
        │ Relay Service│ │Status Page│ │ Setup Page  │
        │   /relay     │ │  /status  │ │   /setup    │
        └──────────────┘ └───────────┘ └─────────────┘
                │
        ┌───────▼──────────────────────────────────────┐
        │           Existing Services                   │
        │  ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │
        │  │Player IP│ │Service  │ │  Content Store  │ │
        │  │ :8082   │ │IP :8083 │ │     :8081       │ │
        │  └─────────┘ └─────────┘ └─────────────────┘ │
        │  ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │
        │  │Replicator│ │FusionAuth│ │  Admin Portal  │ │
        │  │ :8080   │ │ :9011   │ │                 │ │
        │  └─────────┘ └─────────┘ └─────────────────┘ │
        └──────────────────────────────────────────────┘
```

## Architecture Design

### Design Principles

1. **Non-Intrusive Integration** - Minimal changes to existing services
2. **Configuration-Driven** - JSON-based service discovery and configuration
3. **HTTP Polling Updates** - Periodic status monitoring with HTTP polling
4. **Progressive Enhancement** - Graceful degradation when services are unavailable
5. **Container-Native** - Docker-first deployment strategy
6. **Security-First** - Proper authentication and authorization

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Layer                              │
│  ┌─────────────────┐              ┌─────────────────────────────┐│
│  │   Status Page   │              │      Setup Page            ││
│  │   (React SPA)   │              │     (React SPA)            ││
│  │                 │              │                             ││
│  │ • Service Cards │              │ • Step-by-step Guide       ││
│  │ • Health Status │              │ • Configuration Forms      ││
│  │ • Config Tooltips│              │ • Command Generation       ││
│  │ • Real-time Updates│            │ • Progress Tracking        ││
│  └─────────────────┘              └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                            │
│                    (NGINX Routing)                              │
│                                                                 │
│  /status → Status Page SPA                                      │
│  /setup  → Setup Page SPA                                       │
│  /relay  → Relay Service API                                    │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                   Service Layer                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 Relay Service                               ││
│  │                                                             ││
│  │ • Service Discovery (JSON Config)                          ││
│  │ • Health Check Aggregation                                 ││
│  │ • Configuration Status Polling                             ││
│  │ • Readiness Assessment                                      ││
│  │ • HTTP Polling Updates                                     ││
│  │ • Error Handling & Retry Logic                             ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                 Integration Layer                               │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │  Player IP  │ │ Service IP  │ │Content Store│ │Admin Portal ││
│  │             │ │             │ │             │ │             ││
│  │ /health     │ │ /health     │ │ /health     │ │ (function)  ││
│  │ /configured │ │ /configured │ │ /configured │ │ getConfig() ││
│  │ /ready      │ │ /ready      │ │ /ready      │ │             ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Component Specifications

### 1. Relay Service

**Purpose**: Centralized observability aggregation service that polls all GameHub services and provides a unified API.

**Technical Specifications**:
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Port**: 8084 (internal), accessible via `/relay` through NGINX
- **Configuration**: JSON-based service discovery via `RELAY_CONFIG` environment variable
- **Deployment**: Docker container in GameHub mesh

**Key Features**:
- Configurable service discovery
- Parallel health check execution
- Intelligent retry logic with exponential backoff
- HTTP polling support for periodic updates
- Comprehensive error handling
- Metrics collection and logging

**Configuration Schema**:
```json
{
  "services": {
    "service-ip": {
      "name": "Service IP",
      "healthEndpoint": "http://service-ip:8083/health",
      "configuredEndpoint": "http://service-ip:8083/configured",
      "readyEndpoint": "http://service-ip:8083/ready",
      "timeout": 5000,
      "retries": 3
    },
    "player-ip": {
      "name": "Player IP",
      "healthEndpoint": "http://player-ip:8082/health",
      "configuredEndpoint": "http://player-ip:8082/configured",
      "readyEndpoint": "http://player-ip:8082/ready",
      "timeout": 5000,
      "retries": 3
    },
    "content-store": {
      "name": "Content Store",
      "healthEndpoint": "http://content-store:8081/health",
      "configuredEndpoint": "http://content-store:8081/configured",
      "readyEndpoint": "http://content-store:8081/ready",
      "timeout": 5000,
      "retries": 3
    }
  },
  "bundles": {
    "admin-portal": {
      "name": "Admin Portal",
      "type": "bundle",
      "configFunction": "getConfiguredGroups"
    }
  },
  "polling": {
    "interval": 10000,
    "timeout": 30000
  }
}
```

### 2. Status Page

**Purpose**: HTTP polling dashboard displaying health, configuration, and readiness status of all GameHub services.

**Technical Specifications**:
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Query for server state
- **Polling**: HTTP polling connection to Relay Service
- **Deployment**: Static files served by NGINX at `/status`

**Key Features**:
- Service status cards with color-coded indicators
- Configuration tooltips showing detailed status
- Periodic updates via HTTP polling
- Responsive design for mobile and desktop
- Error boundaries and graceful degradation
- Accessibility compliance (WCAG 2.1)

**UI Components**:
```
┌─────────────────────────────────────────────────────────────────┐
│                    GameHub Status Dashboard                      │
├─────────────────────────────────────────────────────────────────┤
│  Last Updated: 2025-01-09 10:30:15 AM                    🔄    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Service IP    │  │   Player IP     │  │  Content Store  │ │
│  │                 │  │                 │  │                 │ │
│  │ Health:    🟢   │  │ Health:    🟢   │  │ Health:    🟢   │ │
│  │ Config:    🟢ⓘ  │  │ Config:    🟡ⓘ  │  │ Config:    🟢ⓘ  │ │
│  │ Ready:     🟢   │  │ Ready:     🔴   │  │ Ready:     🟢   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │  Admin Portal   │  │   Replicator    │                      │
│  │                 │  │                 │                      │
│  │ Health:    N/A  │  │ Health:    🟢   │                      │
│  │ Config:    🟡ⓘ  │  │ Config:    🟢ⓘ  │                      │
│  │ Ready:     N/A  │  │ Ready:     🟢   │                      │
│  └─────────────────┘  └─────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Setup Page

**Purpose**: Guided walkthrough for configuring the GameHub environment with step-by-step instructions.

**Technical Specifications**:
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Context for setup state
- **Deployment**: Static files served by NGINX at `/setup`

**Key Features**:
- Progressive step-by-step workflow
- Dynamic command generation based on user input
- Integration with existing setup scripts
- Real-time validation and feedback
- Copy-to-clipboard functionality
- Progress persistence in localStorage

**Setup Steps**:
1. **Prerequisites Verification**
   - Node.js version check
   - Docker availability
   - Git configuration
   - Port availability

2. **Repository Setup**
   - Clone verification
   - Dependency installation
   - Environment initialization with `init-mesh.sh`

3. **FusionAuth Configuration**
   - API key collection
   - Application creation guidance
   - CORS configuration
   - Generated command execution

4. **Tenant Creation**
   - Tenant setup walkthrough
   - Public key collection
   - Configuration file updates

5. **Service Principal Authorization**
   - Service principal key extraction
   - Admin portal authorization
   - Final verification

## API Specifications

### Relay Service API

#### GET /relay
Returns the current status of all configured services.

**Response Schema**:
```json
{
  "timestamp": "2025-01-09T15:30:15.123Z",
  "services": {
    "service-ip": {
      "health": true,
      "configured": true,
      "configuredGroups": {
        "jwt": true,
        "clients": ["player-ip"]
      },
      "ready": true,
      "lastChecked": "2025-01-09T15:30:14.890Z",
      "responseTime": 45
    },
    "player-ip": {
      "health": true,
      "configured": false,
      "configuredGroups": {
        "jwt": true,
        "service-ip": false
      },
      "ready": false,
      "lastChecked": "2025-01-09T15:30:14.920Z",
      "responseTime": 67,
      "error": null
    }
  },
  "bundles": {
    "admin-portal": {
      "configured": false,
      "configuredGroups": {
        "client": true,
        "tenant": false
      },
      "lastChecked": "2025-01-09T15:30:14.950Z"
    }
  },
  "summary": {
    "totalServices": 3,
    "healthyServices": 3,
    "configuredServices": 2,
    "readyServices": 2,
    "overallStatus": "degraded"
  }
}
```

#### GET /relay/status
Periodic status updates via HTTP polling.

**Response Format**:
Same as GET /relay endpoint, providing current status of all services for polling clients.

### Service Integration Endpoints

Each GameHub service must implement these standardized endpoints:

#### GET /health
Basic health check endpoint.

**Response**: 
- **200 OK**: Service is running
- **503 Service Unavailable**: Service is down

#### GET /configured
Configuration status endpoint.

**Response Schema**:
```json
{
  "configured": true,
  "groups": {
    "jwt": true,
    "service-ip": true,
    "clients": ["player-ip", "admin-portal"]
  }
}
```

#### GET /ready
Readiness check endpoint.

**Response**:
- **200 OK**: Service is ready to handle requests
- **503 Service Unavailable**: Service is not ready

## Data Flow Diagrams

### Status Page Data Flow

```
┌─────────────────┐    HTTP Polling  ┌─────────────────┐
│   Status Page   │◄────────────────►│  Relay Service  │
│   (React SPA)   │                  │                 │
└─────────────────┘                  └─────────────────┘
         │                                     │
         │ Initial Load                        │ Polling Loop
         │ (HTTP GET)                          │ (Every 10s)
         ▼                                     ▼
┌─────────────────┐                  ┌─────────────────┐
│ Service Status  │                  │ Health Checks   │
│ Display         │                  │ Parallel Exec   │
└─────────────────┘                  └─────────────────┘
                                               │
                                               ▼
                                    ┌─────────────────┐
                                    │ Service APIs    │
                                    │ /health         │
                                    │ /configured     │
                                    │ /ready          │
                                    └─────────────────┘
```

### Setup Page Data Flow

```
┌─────────────────┐                  ┌─────────────────┐
│   Setup Page    │                  │  Relay Service  │
│   (React SPA)   │◄────────────────►│                 │
└─────────────────┘   Status Check   └─────────────────┘
         │                                     │
         │ Step Validation                     │
         ▼                                     ▼
┌─────────────────┐                  ┌─────────────────┐
│ User Input      │                  │ Configuration   │
│ Collection      │                  │ Validation      │
└─────────────────┘                  └─────────────────┘
         │                                     │
         │ Command Generation                  │
         ▼                                     ▼
┌─────────────────┐                  ┌─────────────────┐
│ Script          │                  │ Service Status  │
│ Execution       │                  │ Monitoring      │
│ Guidance        │                  │                 │
└─────────────────┘                  └─────────────────┘
```

## Integration Plan

### Phase 1: Service Endpoint Implementation

**Objective**: Add observability endpoints to existing services.

**Tasks**:
1. **Player IP Service** (`app/player-ip/`)
   - Add `/health` endpoint
   - Add `/configured` endpoint with JWT and service-ip groups
   - Add `/ready` endpoint
   - Update Docker health checks

2. **Service IP Provider** (`app/service-ip/`)
   - Add `/health` endpoint
   - Add `/configured` endpoint with JWT and clients groups
   - Add `/ready` endpoint
   - Update Docker health checks

3. **Content Store** (`app/content-store/`)
   - Add `/health` endpoint
   - Add `/configured` endpoint with secrets group
   - Add `/ready` endpoint
   - Update Docker health checks

4. **Admin Portal** (`app/gamehub-admin/`)
   - Export `getConfiguredGroups()` function
   - Add client and tenant configuration checks
   - Build-time configuration validation

### Phase 2: Relay Service Development

**Objective**: Create the centralized observability service.

**Tasks**:
1. **Service Creation** (`app/relay-service/`)
   - Initialize Node.js TypeScript project
   - Implement Express.js server
   - Add service discovery configuration
   - Implement parallel health checking
   - Add HTTP polling support for periodic updates

2. **Docker Integration**
   - Create Dockerfile
   - Add to `docker-compose.yml`
   - Configure environment variables
   - Set up networking

3. **NGINX Configuration**
   - Add `/relay` route to `nginx.conf`
   - Configure proxy settings
   - Add HTTP polling support

### Phase 3: Status Page Development

**Objective**: Create the HTTP polling status dashboard.

**Tasks**:
1. **React Application** (`app/status-page/`)
   - Initialize Vite React TypeScript project
   - Implement service status cards
   - Add HTTP polling integration
   - Create responsive UI with TailwindCSS

2. **Build Integration**
   - Add build process to Docker Compose
   - Configure NGINX static file serving
   - Set up `/status` route

### Phase 4: Setup Page Development

**Objective**: Create the guided setup experience.

**Tasks**:
1. **React Application** (`app/setup-page/`)
   - Initialize Vite React TypeScript project
   - Implement step-by-step workflow
   - Add form validation and command generation
   - Create progress tracking system

2. **Integration with Existing Scripts**
   - Integrate with `init-mesh.sh`
   - Connect to FusionAuth setup process
   - Add tenant creation guidance
   - Implement service principal workflow

### Phase 5: Testing and Documentation

**Objective**: Ensure system reliability and maintainability.

**Tasks**:
1. **Testing**
   - Unit tests for all components
   - Integration tests for API endpoints
   - End-to-end testing for setup workflow
   - Load testing for Relay Service

2. **Documentation**
   - API documentation
   - Deployment guides
   - Troubleshooting documentation
   - Developer onboarding guides

## Implementation Roadmap

### Sprint 1 (Week 1-2): Foundation
- [ ] Service endpoint implementation (Player IP, Service IP, Content Store)
- [ ] Admin Portal configuration function
- [ ] Basic Relay Service structure
- [ ] Docker integration setup

### Sprint 2 (Week 3-4): Core Services
- [ ] Complete Relay Service implementation
- [ ] HTTP polling updates
- [ ] NGINX routing configuration
- [ ] Basic Status Page structure

### Sprint 3 (Week 5-6): Status Dashboard
- [ ] Complete Status Page implementation
- [ ] Periodic UI updates
- [ ] Responsive design
- [ ] Error handling and graceful degradation

### Sprint 4 (Week 7-8): Setup Experience
- [ ] Setup Page foundation
- [ ] Step-by-step workflow implementation
- [ ] Integration with existing setup scripts
- [ ] Command generation and validation

### Sprint 5 (Week 9-10): Polish and Testing
- [ ] Comprehensive testing suite
- [ ] Performance optimization
- [ ] Documentation completion
- [ ] Production deployment preparation

## Technology Stack

### Backend Services
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5+
- **Framework**: Express.js 4+
- **HTTP Client**: axios for polling
- **HTTP Client**: axios
- **Validation**: Zod
- **Logging**: winston
- **Testing**: Jest + supertest

### Frontend Applications
- **Framework**: React 18
- **Language**: TypeScript 5+
- **Build Tool**: Vite 5+
- **Styling**: TailwindCSS 3+
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **HTTP Polling**: axios for periodic requests
- **Testing**: Vitest + React Testing Library

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: NGINX
- **Service Discovery**: JSON configuration
- **Networking**: Docker bridge networks
- **Volume Management**: Docker volumes

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript compiler
- **Build System**: Vite (frontend), tsc (backend)
- **Version Control**: Git

## File Structure

```
gamehub/
├── app/
│   ├── relay-service/                 # NEW: Relay Service
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── services/
│   │   │   │   ├── health-checker.ts
│   │   │   │   ├── config-manager.ts
│   │   │   │   └── polling-manager.ts
│   │   │   ├── routes/
│   │   │   │   ├── status.ts
│   │   │   │   └── polling.ts
│   │   │   ├── types/
│   │   │   │   └── service-config.ts
│   │   │   └── utils/
│   │   │       ├── logger.ts
│   │   │       └── retry.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── status-page/                   # NEW: Status Dashboard
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   │   ├── ServiceCard.tsx
│   │   │   │   ├── StatusIndicator.tsx
│   │   │   │   ├── ConfigTooltip.tsx
│   │   │   │   └── Dashboard.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── usePolling.ts
│   │   │   │   └── useServiceStatus.ts
│   │   │   ├── services/
│   │   │   │   └── api.ts
│   │   │   └── types/
│   │   │       └── service-status.ts
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   │
│   ├── setup-page/                    # NEW: Setup Guide
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   │   ├── SetupStep.tsx
│   │   │   │   ├── StepCard.tsx
│   │   │   │   ├── CommandGenerator.tsx
│   │   │   │   ├── ProgressTracker.tsx
│   │   │   │   └── SetupWizard.tsx
│   │   │   ├── steps/
│   │   │   │   ├── PrerequisitesStep.tsx
│   │   │   │   ├── RepositoryStep.tsx
│   │   │   │   ├── FusionAuthStep.tsx
│   │   │   │   ├── TenantStep.tsx
│   │   │   │   └── ServicePrincipalStep.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSetupState.ts
│   │   │   │   └── useStepValidation.ts
│   │   │   ├── services/
│   │   │   │   └── setup-api.ts
│   │   │   └── types/
│   │   │       └── setup-types.ts
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   │
│   ├── player-ip/                     # MODIFIED: Add endpoints
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── health.ts          # NEW
│   │   │   │   ├── configured.ts      # NEW
│   │   │   │   └── ready.ts           # NEW
│   │   │   └── services/
│   │   │       └── config-checker.ts  # NEW
│   │   └── ...
│   │
│   ├── service-ip/                    # MODIFIED: Add endpoints
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── health.ts          # NEW
│   │   │   │   ├── configured.ts      # NEW
│   │   │   │   └── ready.ts           # NEW
│   │   │   └── services/
│   │   │       └── config-checker.ts  # NEW
│   │   └── ...
│   │
│   ├── content-store/                 # MODIFIED: Add endpoints
│   │   ├── src/
│   │   │   ├── health.js              # NEW
│   │   │   ├── configured.js          # NEW
│   │   │   └── ready.js               # NEW
│   │   └── ...
│   │
│   └── gamehub-admin/                 # MODIFIED: Add config function
│       ├── src/
│       │   └── config/
│       │       └── status-check.ts    # NEW
│       └── ...
│
├── mesh/
│   ├── docker-compose.yml             # MODIFIED: Add new services
│   ├── nginx/
│   │   └── nginx.conf                 # MODIFIED: Add new routes
│   └── ...
│
└── docs/
    ├── architecture/
    │   └── STATUS_AND_SETUP_ARCHITECTURE.md  # THIS FILE
    ├── api/
    │   ├── relay-service-api.md        # NEW
    │   ├── service-endpoints.md        # NEW
    │   └── websocket-protocol.md       # NEW
    └── deployment/
        ├── status-setup-deployment.md  # NEW
        └── troubleshooting.md          # NEW
```

## Security Considerations

### Authentication and Authorization
- All endpoints use existing GameHub authentication mechanisms
- Relay Service operates within internal Docker network
- No sensitive data exposed in status endpoints
- Setup page validates user permissions before showing sensitive operations

### Network Security
- Internal service communication via Docker networks
- NGINX reverse proxy handles external access
- HTTP polling requests use same-origin policy
- Rate limiting on status endpoints

### Data Privacy
- No personal data in status responses
- Configuration details limited to boolean flags
- Audit logging for setup operations
- Secure handling of API keys and secrets

## Performance Considerations

### Scalability
- Relay Service designed for horizontal scaling
- Efficient polling with configurable intervals
- HTTP request pooling
- Caching of status responses

### Monitoring
- Health check timeouts and retries
- Performance metrics collection
- Error rate monitoring
- Resource usage tracking

### Optimization
- Parallel service health checks
- Optimized HTTP polling intervals
- Lazy loading of setup page components
- Efficient React re-rendering

## Conclusion

This architecture provides a comprehensive, scalable, and maintainable solution for GameHub's status and setup requirements. The design integrates seamlessly with existing infrastructure while providing powerful new capabilities for observability and guided configuration.

The phased implementation approach ensures minimal disruption to existing services while delivering value incrementally. The technology choices align with GameHub's current stack and development practices, ensuring consistency and maintainability.

Key benefits of this architecture:
- **Periodic visibility** into system health and configuration
- **Guided setup experience** reducing onboarding friction
- **Minimal service changes** preserving existing functionality
- **Scalable design** supporting future growth
- **Comprehensive testing** ensuring reliability
- **Clear documentation** supporting maintenance and development