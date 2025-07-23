# Jinaga Data Model

This guide covers the setup and configuration of the Jinaga data model, which provides distributed data management and real-time synchronization across the GameHub platform.

## Table of Contents

- [Jinaga Data Model](#jinaga-data-model)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
    - [What is Jinaga?](#what-is-jinaga)
    - [Benefits for GameHub](#benefits-for-gamehub)
  - [Jinaga Model Package Structure](#jinaga-model-package-structure)
    - [Directory Organization](#directory-organization)
  - [Data Model Architecture](#data-model-architecture)
    - [Fact Definition Patterns](#fact-definition-patterns)
    - [Model Composition](#model-composition)
    - [Mutable Property Pattern](#mutable-property-pattern)
    - [Static Helper Methods](#static-helper-methods)
  - [Authorization Rules](#authorization-rules)
    - [Authorization Structure](#authorization-structure)
    - [Permission Patterns](#permission-patterns)
      - [Creator-based Authorization](#creator-based-authorization)
      - [Role-based Authorization](#role-based-authorization)
      - [Self-service Authorization](#self-service-authorization)
    - [Service Principal Authorization](#service-principal-authorization)
  - [Distribution Rules](#distribution-rules)
    - [Distribution Rules Structure](#distribution-rules-structure)
  - [Security Policy Generation](#security-policy-generation)
  - [Migration Patterns](#migration-patterns)
    - [Adding New Fact Types](#adding-new-fact-types)
    - [Modifying Existing Fact Types](#modifying-existing-fact-types)
  - [Next Steps](#next-steps)

## Overview

### Recommended Implementation Order

When creating implementation plans for new Jinaga features, follow this order to ensure each step builds upon the decisions made in previous steps:

1. **Define Facts** - Start with immutable facts that represent your domain concepts
2. **Build the User Interface** - Create React components to identify user workflows and data requirements
3. **Define Custom Hooks and View Models** - Encapsulate business logic and identify data access patterns
4. **Define Specifications for Querying Facts** - Create specifications that match UI requirements
5. **Define Authorization Rules Based on Commands** - Determine who can create each fact type
6. **Define Distribution Rules Based on Specifications** - Enable the specifications used in custom hooks
7. **Generate Policies** - Build and validate security policies
8. **Write Tests of Custom Hooks** - Test with authorization and distribution rules

This order ensures that your Jinaga model supports actual user workflows rather than creating a model that doesn't match user needs.

### What is Jinaga?

Jinaga is a distributed data management system that uses immutable facts and historical modeling to provide:

- **Immutable Facts**: All data is stored as immutable facts that never change
- **Historical Modeling**: Changes are recorded as a graph of facts over time
- **Automatic Distribution**: Data synchronizes automatically across services and clients
- **Conflict Detection**: Built-in recognition of concurrent updates through fact succession
- **Real-time Updates**: UI updates automatically when data changes anywhere in the system

### Benefits for GameHub

- **Audit Trail**: Complete history of all changes with immutable facts
- **Offline Support**: Applications work offline and sync when reconnected
- **Scalability**: Distributed architecture scales horizontally
- **Multi-tenant Security**: Fine-grained authorization and distribution rules
- **Real-time Collaboration**: Multiple players can work simultaneously with automatic conflict detection

## Jinaga Model Package Structure

The GameHub platform uses an isolated npm package for the Jinaga data model, enabling code sharing across multiple applications while maintaining consistency.

### Directory Organization

```
app/gamehub-model/
├── package.json              # Dual build configuration (ESM + CJS)
├── tsconfig.base.json        # Base TypeScript configuration
├── tsconfig.json             # ESM build configuration
├── tsconfig.cjs.json         # CommonJS build configuration
├── tsconfig.types.json       # Type declarations configuration
├── index.ts                  # Main entry point with policy generation
├── model/                    # Fact definitions organized by domain
│   ├── index.ts              # Combined model builder
│   ├── bookkeeping.ts        # State-management facts
│   ├── gamehub.ts            # Core platform facts (tenants, sessions, players)
│   ├── gameplay.ts           # Gameplay and interaction facts
│   └── invitation.ts         # Invitation and access control facts
├── authorization/            # Authorization rules by domain
│   ├── index.ts              # Combined authorization rules
│   ├── tenantAuthorization.ts
│   ├── sessionAuthorization.ts
│   ├── playerAuthorization.ts
│   ├── gameplayAuthorization.ts
│   └── ...
├── distribution/             # Distribution rules by domain
│   ├── index.ts              # Combined distribution rules
│   ├── tenantDistribution.ts
│   ├── sessionDistribution.ts
│   ├── playerDistribution.ts
│   └── ...
├── services/                 # Business logic and helper functions
│   ├── index.ts              # Service exports
│   └── gameAllocations.ts    # Game allocation algorithms
└── test/                     # Dual module system testing
    ├── package.json          # CJS test configuration
    ├── package-esm.json      # ESM test configuration
    └── test-*.js             # Test files for both module systems
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
        public prior: TenantName[]  // For mutable data, references to immediately previous versions
    ) { }

    // Helper method to get current name
    static current(tenant: LabelOf<Tenant>) {
        return tenant.successors(TenantName, name => name.tenant)
            .notExists(name => name.successors(TenantName, next => next.prior));
    }
}
```

### Model Composition

Jinaga uses predecessor relationships to model entity connections. Compose a model to represent the predecessor relationships between entities:

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
    )
    ;

export const model = (b: ModelBuilder) => b
    .with(gameHubModel)
    ;
```

### Mutable Property Pattern

For mutable data, Jinaga uses the mutable pattern. It stores the immediate previous version of the fact in a `prior` array:

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

// Usage: Display the current session name
const sessionNameSpec = model.given(GameSession).match(session =>
    SessionName.current(session)
);
const { data } = useSpecification(jinagaClient, sessionNameSpec, gameSession);
const sessionName =
    data === null ? "Loading" :
    data.length === 0 ? "Unnamed session" :
    data[0].value;      // Ignoring concurrent edits

// Usage: Update session name
const updateSessionName = async (newSessionName: string) => {
    if (data === null) {
        return;  // Still loading
    }
    if (data.length === 1 && data[0].value === newSessionName) {
        return;  // No change needed
    }
    await jinagaClient.fact(new SessionName(gameSession, newSessionName, data));    
}
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

## Distribution Rules

Distribution rules determine which users can execute a specification, ensuring that only authorized data is synchronized to clients.

### Distribution Rules Structure

```typescript
export const tenantDistribution = (r: DistributionRules) => r
    // Share tenant administrators with other administrators
    .share(model.given(Tenant, User).match((tenant, user) =>
        Administrator.of(tenant)
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

## Security Policy Generation

The model package includes automated policy generation for the replicator service.

The `generate-policies` script compiles the model to CommonJS and generates security policies based on the defined authorization and distribution rules. It outputs the policies to a directory mounted to the replicator in the Docker Compose mesh.

In the monorepo, you can run the policy generation from the root:

```bash
# From the app directory (monorepo root)
npm run generate-policies
```

This script is defined in the root package.json and runs the policy generation for the gamehub-model package:

```json
{
  "scripts": {
    "generate-policies": "npm run generate-policies --workspace=gamehub-model"
  }
}
```

Run this script after making changes to the model or rules to ensure the replicator has the latest policies. Then restart the replicator service to apply the new policies.

```bash
# From the app directory (monorepo root)
npm run build:model
npm run generate-policies

# Navigate to mesh and restart the replicator
cd ../mesh
docker compose restart front-end-replicator
```

## Migration Patterns

### Adding New Fact Types

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
    )
    ;
```

3. **Add Authorization**:
```typescript
export const newFeatureAuthorization = (a: AuthorizationRules) => a
    .type(NewFeature, feature => Administrator.usersOf(feature.tenant))
    ;
```

4. **Add Distribution**:
```typescript
export const newFeatureDistribution = (r: DistributionRules) => r
    .share(model.given(Tenant, User).match((tenant, user) =>
        NewFeature.in(tenant)
    ))
    .with(model.given(Tenant, User).match((tenant, user) =>
        Administrator.usersOf(tenant)
    ))
    ;
```

### Modifying Existing Fact Types

If the structure of a fact changes, the old instances of facts will be loaded as JSON objects into the new structure. The new structure should be backward compatible to avoid breaking existing applications.

To add a field to a fact type, declare that field as optional. The field will be `undefined` for existing facts, allowing the application to handle it gracefully.

To remove a field from a fact type, drop the field. While the field will still be loaded for existing facts, the application will not be able to access it.

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