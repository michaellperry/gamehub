# Architecture Overview

This guide provides a high-level overview of the GameHub platform architecture, including system components, data flow, and service interactions.

## Table of Contents

- [System Architecture](#system-architecture)
- [Core Components](#core-components)
- [Data Architecture](#data-architecture)
- [Service Communication](#service-communication)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)

## System Architecture

### High-Level Overview
GameHub follows a microservices architecture pattern with the following key characteristics:
- **Frontend**: Multiple React applications for different user roles
- **Backend**: Node.js services with RESTful APIs
- **Data Layer**: Jinaga for distributed data management
- **Orchestration**: Docker Compose for local development
- **Authentication**: OAuth 2.0 with Azure AD integration

### Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐
│  Admin Portal   │    │  Player Portal  │
│   (React/Vite)  │    │   (React/Vite)  │
│   Static Files  │    │   Static Files  │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │       Nginx           │
         │   (Port 80)           │
         │  Reverse Proxy        │
         └───┬───────────────┬───┘
             │               │
    ┌────────▼────┐    ┌─────▼──────┐
    │  Player IP  │    │Content Store│
    │ (Port 8082) │    │(Port 8081)  │
    └─────┬───────┘    └─────┬──────┘
          │                  │
          └──────┬───────────┘
                 │
    ┌────────────▼────────────┐
    │      Service IP         │
    │     (Port 8083)         │
    └─────────┬───────────────┘
              │
    ┌─────────▼─────────┐
    │ Jinaga Replicator │
    │   (Port 8080)     │
    └─────────┬─────────┘
              │
    ┌─────────▼─────────┐    ┌─────────────┐
    │   PostgreSQL      │    │ FusionAuth  │
    │   (Port 5432)     │    │(Port 9011)  │
    │  Database + Auth  │    │Auth Service │
    └───────────────────┘    └─────────────┘
```

## Core Components

### Frontend Applications

#### Admin Portal (`gamehub-admin`)
- **Purpose**: Administrative interface for game session management
- **Technology**: React 18 + TypeScript + Vite
- **Features**: Session creation, player management, analytics dashboard
- **Authentication**: OAuth 2.0 with admin role requirements

#### Player Portal (`gamehub-player`)
- **Purpose**: Player interface for game session participation
- **Technology**: React 18 + TypeScript + Vite
- **Features**: Session registration, gameplay interactions, real-time updates
- **Authentication**: OAuth 2.0 with player access

### Backend Services

#### Service IP (Port 8083)
- **Purpose**: Core business logic and API endpoints
- **Technology**: Node.js + Express + TypeScript
- **Responsibilities**: Game session management, player operations, business rules
- **Data Access**: Jinaga model integration
- **Authentication**: JWT-based with service-to-service communication
- **Client Management**: Handles client credentials in `/app/secrets/clients`

#### Player IP (Port 8082)
- **Purpose**: Player-specific operations and data processing
- **Technology**: Node.js + Express + TypeScript
- **Responsibilities**: Registration handling, gameplay processing, notifications
- **Data Access**: SQLite local storage + Jinaga replicator integration
- **Authentication**: JWT with refresh token rotation
- **External APIs**: Communicates with Service IP and FusionAuth

#### Content Store (Port 8081)
- **Purpose**: File and media management service
- **Technology**: Node.js with file system integration
- **Responsibilities**: Image uploads, document storage, asset serving
- **Storage**: Docker volume mounting with persistent storage
- **Authentication**: Provider-based authentication integration

#### Jinaga Replicator (Port 8080)
- **Purpose**: Distributed data synchronization and event sourcing
- **Technology**: Jinaga replicator service (Docker image)
- **Version**: jinaga/jinaga-replicator:3.5.2
- **Responsibilities**: Fact distribution, authorization policies, subscriptions
- **Storage**: PostgreSQL backend with volume persistence

## Data Architecture

### Jinaga Model
- **Pattern**: Event sourcing with immutable facts
- **Distribution**: Automatic data synchronization across services
- **Authorization**: Rule-based access control
- **Benefits**: Audit trail, real-time updates, conflict resolution

### Data Flow
1. **Player Actions**: Frontend applications capture player interactions
2. **API Calls**: REST APIs process requests and validate data
3. **Fact Creation**: Business logic creates immutable facts
4. **Distribution**: Jinaga distributes facts to relevant subscribers
5. **UI Updates**: Frontend applications receive real-time updates

### Storage Layers
- **PostgreSQL**: Primary data storage for Jinaga facts
- **SQLite**: Local development and testing database
- **File System**: Static assets and uploaded content
- **Memory**: Caching and session management

## Service Communication

### API Communication
- **Protocol**: HTTP/HTTPS with RESTful endpoints
- **Format**: JSON request/response bodies
- **Authentication**: Bearer tokens with OAuth 2.0
- **Error Handling**: Standardized error responses

### Real-time Updates
- **Technology**: Jinaga subscription system
- **Pattern**: Observer pattern with automatic updates
- **Scope**: Cross-service data synchronization
- **Performance**: Optimized for minimal network overhead

### Inter-service Communication
- **Internal APIs**: Direct HTTP calls between services
- **Shared Models**: Common TypeScript interfaces and types
- **Data Consistency**: Jinaga ensures eventual consistency
- **Service Discovery**: Docker Compose networking

## Security Architecture

### Authentication Flow
1. **OAuth Provider**: Azure AD handles user authentication
2. **Token Validation**: Services validate JWT tokens
3. **Role Authorization**: Role-based access control (RBAC)
4. **Session Management**: Secure session handling

### Data Security
- **Encryption**: HTTPS for all external communication
- **Authorization Rules**: Jinaga-based access control
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries

### Network Security
- **Container Isolation**: Docker network segmentation
- **Port Exposure**: Minimal external port exposure
- **Reverse Proxy**: Nginx for request routing and SSL termination
- **Environment Variables**: Secure configuration management

## Deployment Architecture

### Development Environment
- **Docker Compose**: Local service orchestration
- **Hot Reload**: Development servers with live updates
- **Database**: Local PostgreSQL container
- **Networking**: Internal Docker networks

### Production Environment
- **Container Registry**: Azure Container Registry (ACR)
- **Orchestration**: Docker Compose on Azure Container Instances
- **Database**: Azure Database for PostgreSQL (compatible with v16.0)
- **Static Assets**: Nginx-served React builds
- **Authentication**: Self-hosted FusionAuth instance
- **Monitoring**: Container logs and health checks
- **Networking**: Internal Docker networks with Nginx reverse proxy

### CI/CD Pipeline
- **Source Control**: Git with Azure DevOps
- **Build Process**: Multi-stage Docker builds for each service
- **Testing**: Automated unit and integration tests
- **Deployment**: Container-based deployment with health checks
- **Pipeline File**: `.azure-pipelines.yml` in project root

### Service Communication Patterns
- **Frontend → Nginx**: HTTP/HTTPS requests to port 80
- **Nginx → Services**: Internal routing to service ports
- **Services → Jinaga**: HTTP API calls to replicator
- **Services → Database**: PostgreSQL connections
- **Service-to-Service**: JWT-authenticated HTTP calls
- **Authentication Flow**: FusionAuth OAuth 2.0 with JWT tokens

## Next Steps

Now that you understand the system architecture, proceed to [Project Setup](./03-project-setup.md) to begin configuring your development environment.

---

*Need more details about specific components? Each component is covered in detail in the subsequent setup guides.*