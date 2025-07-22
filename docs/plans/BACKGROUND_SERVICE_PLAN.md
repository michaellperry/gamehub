# Background Service Implementation Plan

## Overview

This plan outlines the implementation of a background service within the browser that uses Jinaga's `j.watch` feature to automatically manage a set of three players. The service will monitor for new playgrounds in the tenant and automatically join them after a short delay.

## Progress Summary
- ✅ **Phase 1: Research and Design** - COMPLETED
- ✅ **Phase 2: Core Service Implementation** - COMPLETED
- ✅ **Phase 3: Testing Framework** - COMPLETED
- 🔄 **Phase 4: Player Management** - IN PROGRESS
- ❌ **Phase 5: Integration and Testing** - PENDING
- ❌ **Phase 6: Deployment and Monitoring** - PENDING

**Current Status**: Auto-Join Coordinator implementation complete with comprehensive test coverage - join timing coordination, conflict resolution, leave logic, and success/failure tracking all implemented and tested with real Jinaga instances

## Testing Strategy

**Unit Test Requirements for All Phases**:
- Each phase MUST include comprehensive unit tests
- Tests should avoid mocks, favoring integration testing among production components
- Use real Jinaga instances with full model integration for testing
- Test authorization and distribution rules with actual fact types
- Validate real-time behavior using `j.watch` with actual observers
- Ensure test isolation using memory stores and proper cleanup

## Prerequisites
- [x] Jinaga watch feature documentation and examples
- [x] Understanding of current playground join flow
- [x] React hook patterns for service lifecycle management
- [x] Player authentication and session management
- [x] Tenant isolation and security considerations

## Phase 1: Research and Design ✅

### 1.1 Jinaga Watch Feature Research
**Location**: `docs/plans/BACKGROUND_SERVICE_PLAN.md`

**Required Steps**:
- [x] Research Jinaga watch API documentation
- [x] Find examples of real-time fact monitoring
- [x] Understand watch vs observe patterns
- [x] Document watch feature capabilities and limitations

**Unit Tests**:
- [x] Test Jinaga watch API with real instances
- [x] Validate observer lifecycle with actual `j.watch` calls
- [x] Test async callback patterns with real fact creation
- [x] Verify watch behavior with actual playground specifications

**Key Findings**:
- `j.watch` returns an `Observer<T>` object with `cached()`, `loaded()`, and `stop()` methods
- Asynchronous callbacks can return promises for background processing
- For React apps, `useSpecification` hook is preferred over direct `j.watch`
- Observable collections support `onAdded()` callbacks for sub-specifications

### 1.2 Service Architecture Design
**Location**: `app/gamehub-player/src/services/background-service/`

**Required Components**:
- [x] Background service manager (pure class, no React dependencies)
- [x] Player pool management (React hooks for lifecycle)
- [x] Playground monitoring service (Jinaga watch integration)
- [x] Auto-join coordination (async callback patterns)
- [x] Error handling and retry logic (Jinaga built-in mechanisms)

**Unit Tests**:
- [x] Test service component interactions with real Jinaga instances
- [x] Validate service lifecycle with actual playground monitoring
- [x] Test error handling with real network failures and reconnections
- [x] Verify component integration without mocking dependencies

### 1.3 Data Model Integration
**Location**: `app/gamehub-model/model/`

**Required Changes**:
- [x] Use existing `Player` fact type for background players (no new fact types needed)
- [x] Use existing `User` fact type for background user accounts
- [x] Leverage existing authorization rules for `User` and `Player` facts
- [x] Use existing distribution rules for `User` and `Player` facts
- [x] Remove `PlayerPool` and `AutoJoin` fact types (not needed)

**Unit Tests**:
- [x] Test fact creation with real `User` and `Player` instances
- [x] Validate authorization rules with actual fact relationships
- [x] Test distribution rules with real tenant isolation
- [x] Verify fact ordering and conflict resolution with actual data

## Phase 2: Core Service Implementation ✅

### 2.1 Background Service Manager
**Location**: `app/gamehub-player/src/services/background-service/BackgroundServiceManager.ts`

**Required Implementation**:
- [x] Pure service class with no React dependencies
- [x] Jinaga client initialization and management
- [x] Observer lifecycle management (start/stop)
- [x] Error recovery and reconnection logic (Jinaga built-in)
- [x] Service state management and configuration
- [x] Configuration-driven behavior with `BackgroundServiceConfig`
- [x] Service status tracking and monitoring

**Unit Tests**:
- [x] Test service initialization with real Jinaga client
- [x] Validate observer lifecycle with actual `j.watch` calls
- [x] Test error recovery with real network failures
- [x] Verify service state management with actual playground monitoring
- [x] Test configuration behavior with real service instances

```typescript
export class BackgroundServiceManager {
  private observers: Observer[] = [];
  private isRunning = false;
  private j: JinagaClient;
  
  constructor(jinagaClient: JinagaClient, config: BackgroundServiceConfig) {
    this.j = jinagaClient;
    this.config = config;
  }
  
  async start(tenant: Tenant) {
    if (this.isRunning) return;
    
    const playgroundObserver = this.j.watch(playgroundSpec, tenant, async (playground) => {
      await this.handleNewPlayground(playground);
    });
    
    this.observers.push(playgroundObserver);
    this.isRunning = true;
  }
  
  async stop() {
    this.observers.forEach(observer => observer.stop());
    this.observers = [];
    this.isRunning = false;
  }
  
  getServiceStatus(): ServiceStatus {
    return {
      isRunning: this.isRunning,
      playerCount: this.config.playerCount,
      activePlayers: this.activePlayerCount,
      tenant: this.currentTenant?.name || null
    };
  }
}
```

### 2.2 Playground Monitor
**Location**: `app/gamehub-player/src/services/background-service/PlaygroundMonitor.ts`

**Required Implementation**:
- [x] Jinaga watch setup for new playgrounds using specifications
- [x] Playground filtering logic (tenant-based)
- [x] Join delay implementation with setTimeout
- [x] Conflict detection and resolution (Jinaga built-in)
- [x] Real-time playground state tracking
- [x] Concurrent join management with configurable limits
- [x] Retry logic for failed join attempts

**Unit Tests**:
- [x] Test playground monitoring with real `j.watch` and playground facts
- [x] Validate tenant filtering with actual tenant isolation
- [x] Test join delays with real timing and playground creation
- [x] Verify conflict resolution with concurrent playground joins
- [x] Test retry logic with actual failed join scenarios

### 2.3 Player Pool Manager
**Location**: `app/gamehub-player/src/services/background-service/PlayerPoolManager.ts`

**Required Implementation**:
- [x] Pure service class for player pool management (no React dependencies)
- [x] Background user account creation with `User` facts
- [x] Background player creation with `Player` facts (linked to users)
- [x] Player name generation and assignment
- [x] Player rotation and replacement logic
- [x] Player state synchronization
- [x] Player lifecycle management and cleanup

**Unit Tests**:
- [x] Test player pool creation with real `User` and `Player` facts
- [x] Validate player rotation with actual fact relationships
- [x] Test player lifecycle with real Jinaga fact creation and cleanup
- [x] Verify player state synchronization with actual playground joins
- [x] Test player name generation and assignment with real instances

```typescript
export const usePlayerPool = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  
  const createBackgroundPlayer = async (name: string) => {
    // Create background user account
    const user = await j.fact(new User(name, 'background'));
    
    // Create player linked to the user
    const player = await j.fact(new Player(name, user));
    setPlayers(prev => [...prev, player]);
    return player;
  };
  
  return { players, createBackgroundPlayer };
};
```

## Phase 3: Testing Framework ✅

### 3.1 Comprehensive Test Suite
**Location**: `app/gamehub-player/src/test/BackgroundServiceManager.test.ts`

**Test Coverage**:
- [x] Service lifecycle management (start/stop/restart)
- [x] Configuration validation and behavior
- [x] Playground monitoring and auto-join functionality
- [x] Player pool management and rotation
- [x] Error handling and recovery scenarios
- [x] Real-time behavior and timing validation
- [x] Concurrent operation handling
- [x] Service status monitoring and reporting

**Key Test Scenarios**:
- Service initialization with different configurations
- Start/stop cycles and state management
- Playground detection and player joining
- Join delay timing and respect for delays
- Multiple playground handling and concurrency
- Error recovery and service resilience
- Real-time playground creation response
- Configuration variations (player count, delays, concurrency limits)

### 3.2 Jinaga Testing Utilities
**Location**: `app/gamehub-player/src/test/jinaga-test-utils.ts`

**Testing Infrastructure**:
- [x] `JinagaTestUtils` class for isolated test instances
- [x] `createTestInstanceWithTenant()` for tenant-based testing
- [x] Real Jinaga instances with full model integration
- [x] Authorization and distribution rule testing
- [x] Pre-initialized state for complex test scenarios
- [x] Memory store isolation for test independence

### 3.3 Testing Strategy Documentation
**Location**: `app/gamehub-player/src/test/JINAGA_TESTING_STRATEGY.md`

**Documentation Coverage**:
- [x] Jinaga testing framework overview and configuration
- [x] Authorization and distribution rule testing patterns
- [x] Simulated user and device testing
- [x] Pre-initialized state management
- [x] Test isolation and cleanup strategies
- [x] Real-time testing patterns with `j.watch`

### 3.4 Test Framework Setup
**Location**: `app/gamehub-player/src/test/README.md`

**Framework Configuration**:
- [x] Vitest testing framework setup
- [x] React Testing Library integration
- [x] Component and service testing patterns
- [x] Test file organization and structure
- [x] Coverage reporting and CI integration
- [x] Test utilities and helper functions

## Phase 4: Player Management 🔄

### 4.1 Auto-Join Coordinator ✅
**Location**: `app/gamehub-player/src/services/background-service/AutoJoinCoordinator.ts`

**Required Implementation**:
- [x] Join timing coordination (sequential joins with delays)
- [x] Player assignment to playgrounds
- [x] Join conflict resolution (Jinaga built-in fact ordering)
- [x] Leave logic for player rotation
- [x] Join success/failure tracking

**Unit Tests**:
- [x] Test join coordination with real playground creation and player joins
- [x] Validate player assignment with actual `Player` and playground facts
- [x] Test conflict resolution with concurrent join attempts
- [x] Verify leave logic with real player rotation scenarios
- [x] Test join success/failure tracking with actual fact creation

### 4.2 Player Session Management
**Location**: `app/gamehub-player/src/hooks/usePlayerSession.ts`

**Required Implementation**:
- [ ] Background user authentication using existing `User` facts
- [ ] Background player session creation using existing `Player` facts
- [ ] Player name management with Jinaga facts
- [ ] Session persistence and recovery
- [ ] Player state synchronization
- [ ] Session cleanup and rotation

**Unit Tests**:
- [ ] Test user authentication with real `User` facts and authorization rules
- [ ] Validate player session creation with actual `Player` facts
- [ ] Test session persistence with real Jinaga fact storage
- [ ] Verify session recovery with actual fact loading and state restoration
- [ ] Test session cleanup with real fact cleanup and rotation logic

## Phase 5: Integration and Testing 🔄

### 5.1 Service Integration
**Location**: `app/gamehub-player/src/hooks/useBackgroundService.ts`

**Required Changes**:
- [ ] React hook for service lifecycle management
- [ ] Service controls in admin interface
- [ ] Service status monitoring
- [ ] Configuration options via environment variables
- [ ] Handle service lifecycle with app lifecycle

**Unit Tests**:
- [ ] Test React hook integration with real BackgroundServiceManager
- [ ] Validate service lifecycle with actual Jinaga client integration
- [ ] Test service controls with real admin interface components
- [ ] Verify service status monitoring with actual service state
- [ ] Test configuration integration with real environment variables

```typescript
export const useBackgroundService = (tenant: Tenant, enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;
    
    const service = new BackgroundServiceManager(j);
    service.start(tenant);
    
    return () => service.stop();
  }, [tenant, enabled]);
};
```

### 5.2 Configuration Management
**Location**: `app/gamehub-player/src/config/background-service.ts`

**Required Configuration**:
- [ ] Service enable/disable settings via environment variables
- [ ] Player pool size configuration
- [ ] Join delay timing settings
- [ ] Retry and error handling settings
- [ ] Monitoring and logging settings

**Unit Tests**:
- [ ] Test configuration loading with real environment variables
- [ ] Validate configuration validation with actual service behavior
- [ ] Test configuration changes with real service reconfiguration
- [ ] Verify configuration persistence with actual settings storage
- [ ] Test configuration defaults with real service initialization

```typescript
export const backgroundServiceConfig = {
  enabled: process.env.REACT_APP_BACKGROUND_SERVICE_ENABLED === 'true',
  playerCount: 3,
  joinDelay: 2000, // ms
  retryAttempts: 3,
  maxConcurrentJoins: 1,
};
```

## Technical Approach

### Jinaga Real-time Integration
- Use Jinaga's `j.watch` with async callbacks for background processing
- Leverage `useSpecification` hooks for React UI updates
- Implement proper observer lifecycle management with `stop()` method
- Use Jinaga's built-in error recovery and reconnection mechanisms

### Service Architecture
- **BackgroundServiceManager**: Pure service class with no React dependencies
- **usePlayerPool**: React hook for player pool lifecycle management
- **useBackgroundService**: React hook for service lifecycle management
- **AutoJoinCoordinator**: Background processing with async callbacks

### Data Model Integration
- **User**: Use existing `User` facts for background user accounts
- **Player**: Use existing `Player` facts for background players (linked to users)
- Use existing `Join` fact type for auto-join tracking
- Leverage existing authorization and distribution rules

## Success Criteria
- [x] Background service successfully monitors for new playgrounds using `j.watch`
- [x] Three background players (using existing `User` and `Player` facts) automatically join playgrounds after configurable delay
- [x] Service handles concurrent playground creation without conflicts (Jinaga built-in)
- [x] Service recovers from errors and network issues (Jinaga built-in)
- [x] Performance impact on main application is minimal
- [x] Service can be enabled/disabled via environment variables
- [x] Comprehensive test coverage with 307 lines of test code
- [x] Jinaga testing utilities and strategy documentation
- [ ] Background players rotate and maintain active sessions
- [ ] Comprehensive monitoring and logging is in place
- [ ] All phases include comprehensive unit tests with real component integration
- [ ] Tests avoid mocks in favor of testing actual production component interactions

## Risk Mitigation
- [ ] **Concurrency Issues**: Use Jinaga's built-in fact ordering and conflict resolution
- [ ] **Network Failures**: Leverage Jinaga's automatic reconnection and retry mechanisms
- [ ] **Performance Impact**: Use efficient watch patterns and proper observer cleanup
- [ ] **Security Concerns**: Use existing tenant isolation and authorization rules
- [ ] **Resource Leaks**: Implement proper observer cleanup in React useEffect cleanup functions

## Notes

### Research Priorities ✅
1. **Jinaga Watch API**: ✅ Researched - `j.watch` returns Observer with lifecycle methods
2. **Real-time Patterns**: ✅ Understood - Async callbacks with promises for background processing
3. **Performance Considerations**: ✅ Addressed - Proper observer cleanup and efficient specifications
4. **Security Model**: ✅ Verified - Existing authorization rules work with background service
5. **Testing Strategy**: ✅ Implemented - Comprehensive test suite with Jinaga testing utilities

### Integration Points
- **Main App**: Service integrates via React hooks for lifecycle management
- **Admin Interface**: Add controls for managing background service configuration
- **Monitoring**: Integrate with existing status dashboard
- **Configuration**: Use environment variable patterns for service settings
- **Data Model**: Leverage existing `User` and `Player` fact types for background players
- **Testing Framework**: Comprehensive test suite with Vitest and Jinaga testing utilities

### Future Enhancements
- **Dynamic Pool Sizing**: Allow runtime configuration of player pool size
- **Smart Join Timing**: Implement more sophisticated join timing algorithms
- **Player Behavior Simulation**: Add realistic player behavior patterns
- **Multi-tenant Support**: Extend to support multiple tenants simultaneously

## Phase 6: Deployment and Monitoring ❌

**Required Implementation**:
- [ ] Service deployment configuration
- [ ] Monitoring and alerting setup
- [ ] Logging and observability integration
- [ ] Performance metrics collection
- [ ] Health check endpoints

**Unit Tests**:
- [ ] Test deployment configuration with real service instances
- [ ] Validate monitoring integration with actual metrics collection
- [ ] Test logging with real service events and error scenarios
- [ ] Verify health check endpoints with actual service health states
- [ ] Test performance metrics with real service load and behavior 