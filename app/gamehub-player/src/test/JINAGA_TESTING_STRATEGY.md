# Jinaga Testing Strategy

This document describes the testing strategy for Jinaga-based applications using the built-in `JinagaTest` utilities.

## Overview

Jinaga provides a comprehensive testing framework through `JinagaTest.create()` that allows you to create isolated test instances with full control over:

- **Authorization Rules** - Test with specific authorization policies
- **Distribution Rules** - Test with distribution and sharing policies  
- **Simulated Users** - Test as specific logged-in users
- **Pre-initialized State** - Start tests with existing facts
- **Memory Store** - Isolated, in-memory fact storage
- **Observable Source** - Real-time fact observation

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

Test with distribution and sharing policies:

```typescript
import { tenantDistribution } from 'gamehub-model/distribution/tenantDistribution';

const jinaga = JinagaTest.create({
  distribution: (d) => tenantDistribution(d)
});
```

**Available Distribution Options:**
- `tenantDistribution` - GameHub tenant-based distribution
- `bookkeepingDistribution` - Bookkeeping distribution
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

### 1. Basic Service Testing

```typescript
describe('MyService', () => {
  let jinaga: any;
  let service: MyService;

  beforeEach(async () => {
    jinaga = JinagaTestUtils.createBasicTestInstance(new User('test-user-key'));
    service = new MyService(jinaga);
  });

  it('should perform operation', async () => {
    const result = await service.doSomething();
    expect(result).toBeDefined();
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

### 3. Hook Testing with Jinaga

```typescript
import { renderHook } from '@testing-library/react';
import { JinagaProvider } from 'jinaga-react';

describe('useMyHook', () => {
  it('should work with Jinaga', () => {
    const jinaga = JinagaTestUtils.createBasicTestInstance(new User('test-user-key'));

    const wrapper = ({ children }) => (
      <JinagaProvider jinaga={jinaga}>
        {children}
      </JinagaProvider>
    );

    const { result } = renderHook(() => useMyHook(), { wrapper });
    expect(result.current).toBeDefined();
  });
});
```

### 4. Complex Scenario Testing

```typescript
describe('Complex Scenario', () => {
  it('should handle multi-user tenant', async () => {
    const { jinaga, tenant, users } = await TestScenarios.multipleUsersInTenant([
      new User('admin'),
      new User('player1'),
      new User('player2')
    ]);

    // Test complex interactions
    const playground = await jinaga.fact(new Playground(tenant, 'TEST-PLAY'));
    
    for (const user of users.slice(1)) { // Skip admin
      const player = await jinaga.fact(new Player(user, tenant));
      await jinaga.fact(new Join(player, playground, new Date()));
    }

    // Verify results
    const joins = await jinaga.query(Join);
    expect(joins).toHaveLength(2);
  });
});
```

## Best Practices

### 1. Test Isolation
- Each test gets a fresh Jinaga instance
- No shared state between tests
- Use `beforeEach` to set up test state

### 2. Fact Creation
- Create facts using `jinaga.fact()`
- Use proper fact constructors
- Include all required predecessor facts

### 3. Query Testing
- Test queries with `jinaga.query()`
- Verify expected fact counts and properties
- Test complex query patterns

### 4. Authorization Testing
- Test with different user contexts
- Verify authorization rules work correctly
- Test unauthorized access scenarios

### 5. Distribution Testing
- Test with distribution rules enabled
- Verify facts are distributed correctly
- Test sharing and access patterns

### 6. Real-time Testing
- Use `jinaga.watch()` for real-time updates
- Test observable patterns
- Verify fact propagation

## Common Issues and Solutions

### 1. Query Errors
**Issue:** `Cannot read properties of undefined (reading 'given')`
**Solution:** Ensure facts are properly created before querying

### 2. Authorization Errors
**Issue:** Facts not found due to authorization rules
**Solution:** Test with proper user context and authorization rules

### 3. Distribution Errors
**Issue:** Facts not distributed as expected
**Solution:** Enable distribution rules and test sharing patterns

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

This testing strategy provides a comprehensive approach to testing Jinaga-based applications with full control over the testing environment and realistic scenarios. 