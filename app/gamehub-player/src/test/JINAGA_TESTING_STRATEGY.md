# Jinaga Testing Strategy

This document describes the testing strategy for Jinaga-based applications using the built-in `JinagaTest` utilities.

## Overview

Jinaga provides a comprehensive testing framework through `JinagaTest.create()` that allows you to create isolated test instances with full control over:

- **Authorization Rules** - Test what facts a user can create and modify
- **Distribution Rules** - Test what specifications a user can execute
- **Simulated Users** - Test as specific logged-in users
- **Pre-initialized State** - Start tests with existing facts
- **Memory Store** - Isolated, in-memory fact storage
- **Observable Source** - Real-time fact observation

Each JinagaTest instance is completely isolated and does not communicate with other instances.

## JinagaTest Configuration Options

The `JinagaTest.create()` method accepts a configuration object with these options:

### Core Configuration

```typescript
interface JinagaTestConfig {
  model?: Model,                           // Jinaga model specification
  authorization?: (a: AuthorizationRules) => AuthorizationRules,  // Auth rules
  distribution?: (d: DistributionRules) => DistributionRules,    // Distribution rules
  user?: {},                              // Simulated logged-in user
  device?: {},                            // Simulated device
  initialState?: {}[],                    // Pre-initialized facts
  purgeConditions?: (p: PurgeConditions) => PurgeConditions,  // Purge rules
  feedRefreshIntervalSeconds?: number     // Feed refresh interval
}
```

### 1. Authorization Rules

Test with specific authorization policies:

```typescript
import { tenantAuthorization } from 'gamehub-model/authorization/tenantAuthorization';

const jinaga = JinagaTest.create({
  authorization: (a) => tenantAuthorization(a)
});
```

**Available Authorization Options:**
- `tenantAuthorization` - GameHub tenant-based authorization
- `userAuthorization` - User-based authorization  
- `bookkeepingAuthorization` - Bookkeeping authorization
- Custom authorization rules for specific test scenarios

### 2. Distribution Rules

Test what specifications a user is allowed to execute:

```typescript
import { tenantDistribution } from 'gamehub-model/distribution/tenantDistribution';

const jinaga = JinagaTest.create({
  distribution: (d) => tenantDistribution(d),
  user: new User('test-user-key')
});
```

Distribution rules determine which specifications a user can execute, not which facts they can access. If a user lacks permission to execute a specification, the query will fail.

**Available Distribution Options:**
- `tenantDistribution` - GameHub tenant-based specification execution permissions
- `bookkeepingDistribution` - Bookkeeping specification execution permissions
- Custom distribution rules for specific test scenarios

### 3. Simulated Users

Test as specific logged-in users:

```typescript
const jinaga = JinagaTest.create({
  user: new User('test-user-key')
});
```

### 4. Pre-initialized State

Start tests with existing facts:

```typescript
const user = new User('test-user-key');
const tenant = new Tenant(user);

const jinaga = JinagaTest.create({
  initialState: [user, tenant],
  user: user
});
```

**Initial State Options:**
- Array of fact objects to pre-populate the test store
- Facts are created before the test runs
- Useful for complex test scenarios

## Testing Utilities

### JinagaTestUtils Class

Provides convenient methods for common testing scenarios:

#### Basic Test Instance
```typescript
const jinaga = JinagaTestUtils.createBasicTestInstance(new User('test-user-key'));
```

#### Test Instance with Authorization
```typescript
const jinaga = JinagaTestUtils.createTestInstanceWithAuth(
  new User('test-user-key'),
  authorizationRules
);
```

#### Test Instance with Distribution
```typescript
const jinaga = JinagaTestUtils.createTestInstanceWithDistribution(
  new User('test-user-key'),
  distributionRules
);
```

#### Test Instance with Pre-initialized State
```typescript
const jinaga = JinagaTestUtils.createTestInstanceWithState(
  [user, tenant, player],
  new User('test-user-key')
);
```

#### Complex Test Instance
```typescript
const { jinaga, users } = await JinagaTestUtils.createComplexTestInstance(
  [
    new User('admin'),
    new User('player1'),
    new User('player2')
  ],
  async (j, users) => {
    // Custom setup logic
    const tenant = await j.fact(new Tenant(users[0]));
    // ... more setup
  }
);
```

### Test Scenarios

Predefined scenarios for common use cases:

#### Single User with Tenant
```typescript
const { jinaga, tenant, owner } = await TestScenarios.singleUserWithTenant(
  new User('test-owner-key')
);
```

#### Multiple Users in Tenant
```typescript
const { jinaga, users } = await TestScenarios.multipleUsersInTenant([
  new User('user1'),
  new User('user2'),
  new User('user3')
]);
```

#### Tenant with Active Playground
```typescript
const { jinaga, tenant, players, playground, joins } = 
  await TestScenarios.tenantWithActivePlayground(
    new User('test-owner-key'),
    5 // 5 players
  );
```

### Test Data Factories

Helper methods for creating test data:

```typescript
const factories = JinagaTestUtils.createTestDataFactories();

// Create tenant
const { tenant, admin } = await factories.createTestTenant(jinaga, user);

// Create player
const { player, playerName } = await factories.createTestPlayer(jinaga, user, tenant);

// Create playground
const playground = await factories.createTestPlayground(jinaga, tenant, 'TEST-001');

// Create join
const join = await factories.createTestJoin(jinaga, player, playground);
```

## Testing Patterns

### 1. Testing Fact Creation Authorization

```typescript
describe('Player Fact Creation', () => {
  it('should allow player to create challenge', async () => {
    const playerUser = new User('player-123');
    const tenantOwner = new User('tenant-owner');
    const opponentUser = new User('opponent-456');
    
    const tenant = new Tenant(tenantOwner);
    const player = new Player(playerUser, tenant);
    const opponent = new Player(opponentUser, tenant);

    const jinaga = JinagaTest.create({
      authorization: (a) => tenantAuthorization(a),
      user: playerUser,
      initialState: [tenantOwner, tenant, playerUser, opponentUser, player, opponent]
    });

    // Test that this player can create a challenge
    const challenge = await jinaga.fact(new Challenge(player, opponent, new Date()));
    expect(challenge).toBeDefined();
  });

  it('should prevent unauthorized fact creation', async () => {
    const playerUser = new User('player-123');
    const tenantOwner = new User('tenant-owner');
    const tenant = new Tenant(tenantOwner);

    const jinaga = JinagaTest.create({
      authorization: (a) => tenantAuthorization(a),
      user: playerUser,
      initialState: [tenantOwner, tenant, playerUser]
    });

    // Test that this player cannot create tenant-level settings
    await expect(async () => {
      await jinaga.fact(new TenantSettings(tenant, 'config'));
    }).rejects.toThrow();
  });
});
```

### 2. Component Testing with Jinaga

```typescript
import { render, screen } from '@testing-library/react';
import { JinagaProvider } from 'jinaga-react';

describe('MyComponent', () => {
  it('should render with Jinaga context', () => {
    const jinaga = JinagaTestUtils.createBasicTestInstance(new User('test-user-key'));

    render(
      <JinagaProvider jinaga={jinaga}>
        <MyComponent />
      </JinagaProvider>
    );

    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### 3. Testing Specification Execution with Distribution Rules

```typescript
describe('Specification Execution', () => {
  it('should allow authorized user to execute specification', async () => {
    const playerUser = new User('player-123');
    const tenantOwner = new User('tenant-owner');
    const tenant = new Tenant(tenantOwner);
    const player = new Player(playerUser, tenant);
    const playground = new Playground(tenant, 'TEST-001');

    const jinaga = JinagaTest.create({
      distribution: (d) => tenantDistribution(d),
      user: playerUser,
      initialState: [tenantOwner, tenant, playerUser, player, playground]
    });

    // Test that this user can execute the specification
    const games = await jinaga.query(Game.inPlayground(playground));
    expect(games).toBeDefined(); // Should not throw
  });

  it('should prevent unauthorized specification execution', async () => {
    const unauthorizedUser = new User('unauthorized-user');
    const tenantOwner = new User('tenant-owner');
    const tenant = new Tenant(tenantOwner);
    const playground = new Playground(tenant, 'TEST-001');

    const jinaga = JinagaTest.create({
      distribution: (d) => tenantDistribution(d),
      user: unauthorizedUser,
      initialState: [tenantOwner, tenant, playground, unauthorizedUser]
    });

    // Test that unauthorized user cannot execute tenant specifications
    await expect(async () => {
      await jinaga.query(AdminReport.forTenant(tenant));
    }).rejects.toThrow();
  });
});
```

### 4. Hook Testing with Pre-populated Game State

```typescript
import { renderHook } from '@testing-library/react';
import { JinagaProvider } from 'jinaga-react';

describe('useActiveGames', () => {
  it('should return games for authorized player', async () => {
    const playerUser = new User('player-123');
    const tenantOwner = new User('tenant-owner');
    const opponentUser = new User('opponent-456');
    
    // Pre-populate with complete game scenario
    const tenant = new Tenant(tenantOwner);
    const player = new Player(playerUser, tenant);
    const opponent = new Player(opponentUser, tenant);
    const playground = new Playground(tenant, 'TEST-001');
    const challenge = new Challenge(player, opponent, new Date());
    const game = new Game(challenge, true, new Date());

    const jinaga = JinagaTest.create({
      authorization: (a) => tenantAuthorization(a),
      distribution: (d) => tenantDistribution(d),
      user: playerUser,
      initialState: [
        tenantOwner, tenant, playerUser, opponentUser,
        player, opponent, playground, challenge, game
      ]
    });

    const wrapper = ({ children }) => (
      <JinagaProvider jinaga={jinaga}>
        {children}
      </JinagaProvider>
    );

    const { result } = renderHook(() => useActiveGames(player), { wrapper });
    
    expect(result.current.games).toHaveLength(1);
    expect(result.current.games[0]).toBe(game);
  });
});
```

### 5. Authorization Testing with Pre-populated State

```typescript
describe('Player Authorization', () => {
  it('should allow player to join playground in their tenant', async () => {
    const playerUser = new User('player-123');
    const tenantOwner = new User('tenant-owner');
    const tenant = new Tenant(tenantOwner);
    const player = new Player(playerUser, tenant);
    const playground = new Playground(tenant, 'TEST-001');

    const jinaga = JinagaTest.create({
      authorization: (a) => tenantAuthorization(a),
      user: playerUser,
      initialState: [tenantOwner, tenant, playerUser, player, playground]
    });

    // Test that this player can join the playground
    const join = await jinaga.fact(new Join(player, playground, new Date()));
    expect(join).toBeDefined();
  });

  it('should prevent player from accessing other tenant data', async () => {
    const playerUser = new User('player-123');
    const otherTenantOwner = new User('other-owner');
    const otherTenant = new Tenant(otherTenantOwner);
    const otherPlayground = new Playground(otherTenant, 'OTHER-001');

    const jinaga = JinagaTest.create({
      authorization: (a) => tenantAuthorization(a),
      user: playerUser,
      initialState: [otherTenantOwner, otherTenant, otherPlayground, playerUser]
    });

    // Test that this player cannot access other tenant's playground
    await expect(async () => {
      const player = new Player(playerUser, otherTenant); // Should fail
      await jinaga.fact(new Join(player, otherPlayground, new Date()));
    }).rejects.toThrow();
  });
});
```

## Best Practices

### 1. Test Isolation
- Each test gets a fresh, isolated JinagaTest instance
- No communication between JinagaTest instances
- Use `beforeEach` to set up test state

### 2. Comprehensive Initial State
- Populate `initialState` with all prerequisite facts
- Include complete fact hierarchies (User → Tenant → Player → etc.)
- Ensure facts exist before testing operations that depend on them

### 3. Authorization Testing
- Test what facts a specific user can create/modify
- Test fact creation permissions with realistic user contexts
- Verify authorization rules prevent unauthorized fact creation

### 4. Distribution Testing  
- Test what specifications a user can execute
- Verify users with proper permissions can run queries
- Test that unauthorized users cannot execute restricted specifications
- Focus on specification execution authorization, not fact sharing

### 5. Specification Testing with Realistic Data
- Use `initialState` to create realistic fact scenarios
- Test custom hooks and specifications with complete data hierarchies
- Verify specifications return expected results for authorized users

### 6. Single-User Focus
- Each test validates one user's permissions and capabilities
- Test user workflows in isolation
- Validate authorization and distribution rules from that user's perspective

## Common Issues and Solutions

### 1. Query Errors
**Issue:** `Cannot read properties of undefined (reading 'given')`
**Solution:** Ensure facts are properly created before querying

### 2. Authorization Errors
**Issue:** Facts not found due to authorization rules
**Solution:** Test with proper user context and authorization rules

### 3. Distribution Errors
**Issue:** Specification execution fails with permission errors
**Solution:** Ensure user has proper distribution permissions to execute the specification

### 4. Type Errors
**Issue:** TypeScript errors with Jinaga types
**Solution:** Use `any` type for test instances when needed

## Example Test Files

- `jinaga-example.test.ts` - Comprehensive examples
- `BackgroundServiceManager.test.ts` - Service testing
- `basic.test.ts` - Simple verification tests

## Running Tests

```bash
# Run all tests
npm run test:run

# Run specific test file
npm run test:run src/test/jinaga-example.test.ts

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## JinagaTest Capabilities and Limitations

### What JinagaTest CAN Test
- Individual user authorization (can this user create/read/modify this fact?)
- Specification execution permissions (can this user run this query?)
- Authorization rule correctness for single users
- Distribution rule correctness for single users
- Component behavior with Jinaga context and realistic data
- Custom hook behavior with pre-populated fact hierarchies
- Single-user workflows and business logic

### What JinagaTest CANNOT Test
- Real-time collaboration between multiple users
- Fact synchronization across different clients
- Network communication or replicator behavior
- Cross-instance fact sharing or communication
- Multi-user concurrent operations
- Distributed system behavior

For testing collaboration features and real-time synchronization, use integration tests with actual Jinaga Browser instances connected to a test replicator.

This testing strategy provides a comprehensive approach to testing individual user permissions and workflows in Jinaga-based applications using isolated test environments. 