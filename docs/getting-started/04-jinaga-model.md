# Jinaga Data Model

This guide covers the setup and configuration of the Jinaga data model, which provides distributed data management and real-time synchronization across the GameHub platform.

## Table of Contents

- [Overview](#overview)
- [Jinaga Model Package Structure](#jinaga-model-package-structure)
- [Data Model Architecture](#data-model-architecture)
- [Authorization Rules](#authorization-rules)
- [Distribution Rules](#distribution-rules)
- [Security Policy Generation](#security-policy-generation)
- [Development Workflow](#development-workflow)
- [Integration Examples](#integration-examples)
- [Testing Strategies](#testing-strategies)
- [Migration Patterns](#migration-patterns)

## Overview

### What is Jinaga?

Jinaga is a distributed data management system that uses immutable facts and event sourcing to provide:

- **Immutable Facts**: All data is stored as immutable facts that never change
- **Event Sourcing**: Changes are recorded as a sequence of events over time
- **Automatic Distribution**: Data synchronizes automatically across services and clients
- **Conflict Resolution**: Built-in handling of concurrent updates through fact succession
- **Real-time Updates**: UI updates automatically when data changes anywhere in the system

### Benefits for GameHub

- **Audit Trail**: Complete history of all changes with immutable facts
- **Offline Support**: Applications work offline and sync when reconnected
- **Scalability**: Distributed architecture scales horizontally
- **Multi-tenant Security**: Fine-grained authorization and distribution rules
- **Real-time Collaboration**: Multiple players can work simultaneously with automatic conflict resolution

## Jinaga Model Package Structure

The GameHub platform uses an isolated npm package for the Jinaga data model, enabling code sharing across multiple applications while maintaining consistency.

### Directory Organization

```
app/gamehub-model/
├── package.json              # Dual build configuration (ESM + CJS)
├── tsconfig.base.json         # Base TypeScript configuration
├── tsconfig.json             # ESM build configuration
├── tsconfig.cjs.json         # CommonJS build configuration
├── tsconfig.types.json       # Type declarations configuration
├── index.ts                  # Main entry point with policy generation
├── model/                    # Fact definitions organized by domain
│   ├── index.ts             # Combined model builder
│   ├── bookkeeping.ts       # Financial and accounting facts
│   ├── gamehub.ts           # Core platform facts (tenants, sessions, players)
│   ├── gameplay.ts          # Gameplay and interaction facts
│   └── invitation.ts        # Invitation and access control facts
├── authorization/           # Authorization rules by domain
│   ├── index.ts            # Combined authorization rules
│   ├── tenantAuthorization.ts
│   ├── sessionAuthorization.ts
│   ├── playerAuthorization.ts
│   ├── gameplayAuthorization.ts
│   └── ...
├── distribution/           # Distribution rules by domain
│   ├── index.ts           # Combined distribution rules
│   ├── tenantDistribution.ts
│   ├── sessionDistribution.ts
│   ├── playerDistribution.ts
│   └── ...
├── services/              # Business logic and helper functions
│   ├── index.ts          # Service exports
│   └── gameAllocations.ts # Game allocation algorithms
└── test/                 # Dual module system testing
    ├── package.json      # CJS test configuration
    ├── package-esm.json  # ESM test configuration
    └── test-*.js         # Test files for both module systems
```

### Package.json Configuration

The model package supports dual build targets for maximum compatibility:

```json
{
  "name": "gamehub-model",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/types/index.d.ts",
        "default": "./dist/esm/index.js"
      },
      "require": {
        "types": "./dist/types/index.d.ts",
        "default": "./dist/cjs/index.js"
      }
    },
    "./authorization": {
      "import": "./dist/esm/authorization/index.js",
      "require": "./dist/cjs/authorization/index.js"
    },
    "./distribution": {
      "import": "./dist/esm/distribution/index.js",
      "require": "./dist/cjs/distribution/index.js"
    },
    "./model": {
      "import": "./dist/esm/model/index.js",
      "require": "./dist/cjs/model/index.js"
    }
  },
  "scripts": {
    "build": "npm run clean && npm run build:esm && npm run build:cjs && npm run build:types",
    "build:esm": "tsc -p tsconfig.esm.json",
    "build:cjs": "tsc -p tsconfig.cjs.json",
    "build:types": "tsc -p tsconfig.types.json",
    "generate-policies": "npm run build:cjs && node --enable-source-maps ./dist/cjs --generate-policies > ../../mesh/front-end/policies/gamehub.policy"
  }
}
```

### TypeScript Configuration

**Base Configuration (`tsconfig.base.json`)**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist", "test"]
}
```

**ESM Build (`tsconfig.json`)**:
```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "outDir": "./dist/esm"
  }
}
```

**CommonJS Build (`tsconfig.cjs.json`)**:
```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "outDir": "./dist/cjs"
  }
}
```

## Data Model Architecture

### Fact Definition Patterns

Jinaga facts are defined as TypeScript classes with specific patterns:

```typescript
export class Tenant {
    static Type = "GameHub.Tenant" as const;
    public type = Tenant.Type;

    constructor(
        public creator: User
    ) { }
}

export class TenantName {
    static Type = "GameHub.Tenant.Name" as const;
    public type = TenantName.Type;

    constructor(
        public tenant: Tenant,
        public name: string,
        public prior: TenantName[]  // For mutable data using succession
    ) { }

    // Helper method to get current name
    static current(tenant: LabelOf<Tenant>) {
        return tenant.successors(TenantName, name => name.tenant)
            .notExists(name => name.successors(TenantName, next => next.prior));
    }
}
```

### Model Organization by Domain

#### Core Platform (gamehub.ts)
```typescript
// Tenant management
export class Tenant { /* ... */ }
export class Administrator { /* ... */ }

// Session management
export class GameSession { /* ... */ }
export class SessionDate { /* ... */ }
export class SessionName { /* ... */ }

// Player management
export class Player { /* ... */ }
export class PlayerInformation { /* ... */ }
export class PlayerSession { /* ... */ }

// Gameplay basics
export class GamePlayer { /* ... */ }
export class GameWinner { /* ... */ }
```

#### Gameplay System (gameplay.ts)
```typescript
// Game mechanics
export class GameAction { /* ... */ }
export class ActionAllocation { /* ... */ }

// Game phases
export class GamePhase { /* ... */ }
export class PhaseTransition { /* ... */ }
```

#### Financial Tracking (bookkeeping.ts)
```typescript
// Financial records
export class Transaction { /* ... */ }
export class Account { /* ... */ }
export class Allocation { /* ... */ }
```

#### Access Control (invitation.ts)
```typescript
// Invitation system
export class Invitation { /* ... */ }
export class InvitationAcceptance { /* ... */ }
export class AccessToken { /* ... */ }
```

### Relationship Modeling

Jinaga uses predecessor relationships to model entity connections:

```typescript
export const gameHubModel = (b: ModelBuilder) => b
    .type(User)
    .type(Tenant, m => m
        .predecessor("creator", User)
    )
    .type(Administrator, m => m
        .predecessor("tenant", Tenant)
        .predecessor("user", User)
    )
    .type(GameSession, m => m
        .predecessor("tenant", Tenant)
    )
    .type(PlayerSession, m => m
        .predecessor("player", Player)
        .predecessor("session", GameSession)
    );
```

### Immutable Data Patterns

For mutable data, Jinaga uses the "prior" pattern:

```typescript
export class SessionName {
    constructor(
        public session: GameSession,
        public value: string,
        public prior: SessionName[]  // References to previous versions
    ) { }

    // Get the current (latest) name
    static current(session: LabelOf<GameSession>) {
        return session.successors(SessionName, name => name.session)
            .notExists(name => name.successors(SessionName, next => next.prior));
    }
}

// Usage: Update session name
const newSessionName = await jinaga.fact({
    type: SessionName.Type,
    session: existingSession,
    value: "Updated Session Name",
    prior: [currentSessionName]  // Supersede the current name
});
```

### Static Helper Methods

Each fact class includes static methods for common query patterns:

```typescript
export class Administrator {
    // Get administrators of a tenant
    static of(tenant: LabelOf<Tenant>) {
        return tenant.successors(Administrator, admin => admin.tenant);
    }

    // Get tenants administered by a user
    static by(user: LabelOf<User>) {
        return user.successors(Administrator, admin => admin.user);
    }

    // Get all admin users of a tenant
    static usersOf(tenant: LabelOf<Tenant>) {
        return tenant.successors(Administrator, admin => admin.tenant)
            .selectMany(admin => admin.user.predecessor());
    }
}
```

## Authorization Rules

Authorization rules determine who can create facts, ensuring data security and business rule enforcement.

### Authorization Structure

```typescript
export const tenantAuthorization = (a: AuthorizationRules) => a
    // Anyone can create a tenant (they become the creator)
    .type(Tenant, t => t.creator)
    
    // Tenant creators can add administrators
    .type(Administrator, admin => admin.tenant.creator)
    
    // Existing administrators can add new administrators
    .type(Administrator, admin => Administrator.usersOf(admin.tenant));
```

### Permission Patterns

#### Creator-based Authorization
```typescript
.type(Tenant, tenant => tenant.creator)
```

#### Role-based Authorization
```typescript
.type(GameSession, session => Administrator.usersOf(session.tenant))
```

#### Self-service Authorization
```typescript
.type(PlayerInformation, info => info.player.user.predecessor())
```

#### Conditional Authorization
```typescript
.type(GameAction, action =>
    PlayerSession.usersOf(action.player.session)
        .join(user => user, action.player.user.predecessor())
        .join(playerSession => playerSession.session, action.player.session.predecessor())
        .where(playerSession => /* game is active */)
)
```

### Service Principal Authorization

For backend services that need elevated permissions:

```typescript
export class ServicePrincipal {
    static Type = "GameHub.ServicePrincipal" as const;
    public type = ServicePrincipal.Type;

    constructor(
        public tenant: Tenant,
        public name: string,
        public createdAt: Date | string
    ) { }
}

// Authorization for service operations
.type(SystemOperation, operation =>
    ServicePrincipal.in(operation.tenant)
        .selectMany(sp => sp.user.predecessor())
)
```

### Multi-tenant Authorization

Authorization rules automatically enforce tenant boundaries:

```typescript
.type(GameSession, session =>
    Administrator.usersOf(session.tenant)  // Only tenant admins
)

.type(PlayerSession, playerSession =>
    playerSession.player.user.predecessor()  // Only the player
        .join(user => Player.by(user), playerSession.player.predecessor())
        .where(player => player.tenant === playerSession.session.tenant)  // Same tenant
)
```

## Distribution Rules

Distribution rules determine which facts are synchronized to which clients, optimizing network usage and ensuring data privacy.

### Distribution Structure

```typescript
export const tenantDistribution = (r: DistributionRules) => r
    // Share tenant administrators with other administrators
    .share(model.given(Tenant, User).match((tenant, user) =>
        Administrator.of(tenant)
            .join(admin => admin.user, user)
    ))
    .with(model.given(Tenant, User).match((tenant, user) =>
        Administrator.usersOf(tenant)
    ))

    // Share tenants with their administrators
    .share(model.given(User).match(user =>
        Administrator.by(user)
            .selectMany(admin => admin.tenant.predecessor())
    ))
    .with(model.given(User).match(user => user.predecessor()));
```

### Data Synchronization Policies

#### Admin-only Data
```typescript
.share(model.given(GameSession, User).match((session, user) =>
    ActionAllocation.for(session)  // Sensitive game data
))
.with(model.given(GameSession, User).match((session, user) =>
    Administrator.usersOf(session.tenant)  // Only admins
))
```

#### Player-specific Data
```typescript
.share(model.given(Player, User).match((player, user) =>
    PlayerInformation.current(player)
        .join(info => info.player.user, user)  // Only their own info
))
.with(model.given(Player, User).match((player, user) =>
    user.predecessor()
))
```

#### Public Session Data
```typescript
.share(model.given(GameSession, User).match((session, user) =>
    SessionName.current(session)  // Public session information
))
.with(model.given(GameSession, User).match((session, user) =>
    PlayerSession.usersOf(session)  // All session players
))
```

### Performance Optimization

Distribution rules optimize data transfer by:

1. **Selective Sharing**: Only relevant facts are distributed
2. **User-specific Filtering**: Each user receives only their authorized data
3. **Lazy Loading**: Facts are distributed on-demand
4. **Incremental Updates**: Only changes are synchronized

### Real-time Update Patterns

```typescript
// Real-time session updates for players
.share(model.given(GameSession, User).match((session, user) =>
    SessionDate.of(session)
        .join(date => PlayerSession.usersOf(date.session), user)
))
.with(model.given(GameSession, User).match((session, user) =>
    PlayerSession.usersOf(session)
))
```

## Security Policy Generation

The model package includes automated policy generation for the replicator service.

### Policy Generation Script

```typescript
// In index.ts
if (process.argv.includes("--generate-policies")) {
    const authorizationRules = describeAuthorizationRules(model, authorization);
    const distributionRules = describeDistributionRules(distribution);
    console.log(authorizationRules);
    console.log(distributionRules);
}
```

### Build Pipeline Integration

```json
{
  "scripts": {
    "generate-policies": "npm run build:cjs && node --enable-source-maps ./dist/cjs --generate-policies > ../../mesh/front-end/policies/gamehub.policy"
  }
}
```

### Policy Deployment

1. **Build**: Compile the model to CommonJS
2. **Generate**: Extract policies from authorization and distribution rules
3. **Deploy**: Write policies to the mesh configuration
4. **Validate**: Replicator service validates policies on startup

### Rollback Mechanisms

```bash
# Backup current policies
cp mesh/front-end/policies/gamehub.policy mesh/front-end/policies/gamehub.policy.backup

# Generate new policies
npm run generate-policies

# Test deployment
docker-compose restart jinaga-replicator

# Rollback if needed
cp mesh/front-end/policies/gamehub.policy.backup mesh/front-end/policies/gamehub.policy
```

## Development Workflow

### Setting Up a New Project

1. **Create Model Package**:
```bash
mkdir my-app-model
cd my-app-model
npm init -y
npm install jinaga
npm install -D typescript @types/node rimraf
```

2. **Configure Package Structure**:
```json
{
  "type": "module",
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    },
    "./authorization": {
      "import": "./dist/esm/authorization/index.js",
      "require": "./dist/cjs/authorization/index.js"
    },
    "./distribution": {
      "import": "./dist/esm/distribution/index.js",
      "require": "./dist/cjs/distribution/index.js"
    }
  }
}
```

3. **Create Directory Structure**:
```bash
mkdir -p model authorization distribution services test
```

4. **Set Up TypeScript Configurations**:
- Copy `tsconfig.base.json`, `tsconfig.json`, `tsconfig.cjs.json`, `tsconfig.types.json`
- Adjust paths and settings as needed

### Integration with React Applications

#### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@model': process.env.DOCKER_BUILD === 'true'
        ? path.resolve(__dirname, 'node_modules/my-app-model')
        : path.resolve(__dirname, '../my-app-model')
    }
  }
});
```

#### React Hook Integration
```typescript
import { useJinaga } from 'jinaga-react';
import { GameSession, SessionName } from '@model/model';

export function useSessionName(session: GameSession) {
    const jinaga = useJinaga();
    
    return jinaga.watch(SessionName.current(session), sessionName => ({
        name: sessionName?.value || 'Unnamed Session'
    }));
}
```

#### Component Usage
```typescript
import { useSessionName } from './hooks/useSessionName';

export function SessionDisplay({ session }: { session: GameSession }) {
    const { name } = useSessionName(session);
    
    return <h1>{name}</h1>;
}
```

## Testing Strategies

### Dual Module System Testing

The model package includes tests for both ESM and CommonJS:

```bash
# Test directory structure
test/
├── package.json          # CJS configuration
├── package-esm.json      # ESM configuration  
├── test-cjs.js          # CommonJS tests
└── test-esm.js          # ESM tests
```

### Model Testing Patterns

```typescript
// test-model.ts
import { buildModel } from 'jinaga';
import { model, Tenant, Administrator } from '../model';

describe('Tenant Model', () => {
    it('should create tenant with creator', () => {
        const user = { type: 'User' };
        const tenant = new Tenant(user);
        
        expect(tenant.creator).toBe(user);
        expect(tenant.type).toBe('GameHub.Tenant');
    });
    
    it('should find administrators of tenant', () => {
        const specification = Administrator.of(tenant);
        expect(specification).toBeDefined();
    });
});
```

### Authorization Testing

```typescript
// test-authorization.ts
import { describeAuthorizationRules } from 'jinaga';
import { model, authorization } from '../index';

describe('Authorization Rules', () => {
    it('should generate valid authorization rules', () => {
        const rules = describeAuthorizationRules(model, authorization);
        expect(rules).toContain('GameHub.Tenant');
        expect(rules).toContain('GameHub.Administrator');
    });
});
```

### Distribution Testing

```typescript
// test-distribution.ts
import { describeDistributionRules } from 'jinaga';
import { distribution } from '../distribution';

describe('Distribution Rules', () => {
    it('should generate valid distribution rules', () => {
        const rules = describeDistributionRules(distribution);
        expect(rules).toBeDefined();
        expect(rules.length).toBeGreaterThan(0);
    });
});
```

## Migration Patterns

### Adding New Facts

1. **Define the Fact**:
```typescript
export class NewFeature {
    static Type = "GameHub.NewFeature" as const;
    public type = NewFeature.Type;

    constructor(
        public tenant: Tenant,
        public data: string
    ) { }
}
```

2. **Register in Model**:
```typescript
export const gameHubModel = (b: ModelBuilder) => b
    // ... existing types
    .type(NewFeature, m => m
        .predecessor("tenant", Tenant)
    );
```

3. **Add Authorization**:
```typescript
export const newFeatureAuthorization = (a: AuthorizationRules) => a
    .type(NewFeature, feature => Administrator.usersOf(feature.tenant));
```

4. **Add Distribution**:
```typescript
export const newFeatureDistribution = (r: DistributionRules) => r
    .share(model.given(Tenant, User).match((tenant, user) =>
        NewFeature.in(tenant)
    ))
    .with(model.given(Tenant, User).match((tenant, user) =>
        Administrator.usersOf(tenant)
    ));
```

### Modifying Existing Facts

For breaking changes, use versioned fact types:

```typescript
// Old version (keep for compatibility)
export class GameSessionV1 {
    static Type = "GameHub.GameSession" as const;
    // ... existing structure
}

// New version
export class GameSession {
    static Type = "GameHub.GameSession.V2" as const;
    // ... new structure
}

// Migration helper
export class SessionMigration {
    static Type = "GameHub.GameSession.Migration" as const;
    
    constructor(
        public oldSession: GameSessionV1,
        public newSession: GameSession
    ) { }
}
```

### Deprecation Strategy

1. **Phase 1**: Add new facts alongside old ones
2. **Phase 2**: Migrate data using migration facts
3. **Phase 3**: Update applications to use new facts
4. **Phase 4**: Remove old fact types (major version bump)

## Integration Examples

### Backend Service Integration

```typescript
// service.ts
import { JinagaBrowser } from 'jinaga';
import { model, authorization, distribution } from 'my-app-model';

const jinaga = JinagaBrowser.create({
    httpEndpoint: process.env.JINAGA_ENDPOINT,
    model,
    authorization,
    distribution
});

export { jinaga };
```

### Frontend Application Integration

```typescript
// App.tsx
import { JinagaProvider } from 'jinaga-react';
import { jinaga } from './services/jinaga';

export function App() {
    return (
        <JinagaProvider jinaga={jinaga}>
            <Router>
                <Routes>
                    {/* Your routes */}
                </Routes>
            </Router>
        </JinagaProvider>
    );
}
```

### Docker Integration

```dockerfile
# Dockerfile
FROM node:18-alpine

# Copy model package
COPY ../my-app-model /app/my-app-model
WORKDIR /app/my-app-model
RUN npm ci && npm run build

# Copy and build application
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

CMD ["npm", "start"]
```

## Next Steps

With the Jinaga data model configured, you can:

1. **Set up React Applications**: Use the model in frontend applications with real-time data binding
2. **Configure Backend Services**: Integrate the model with Node.js services for server-side operations
3. **Deploy with Docker**: Use the model package in containerized environments
4. **Implement Authentication**: Secure your model with proper user authentication
5. **Monitor and Debug**: Use Jinaga's built-in tools for debugging and monitoring

For detailed implementation examples, see the [React Applications](./05-react-applications.md) guide.

---

*For more information about Jinaga concepts and advanced patterns, visit the [official Jinaga documentation](https://jinaga.com/documents/).*