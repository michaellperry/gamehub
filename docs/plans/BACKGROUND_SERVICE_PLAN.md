# Background Service Implementation Plan

## Overview

This plan outlines the implementation of a background service within the browser that uses Jinaga's `j.watch` feature to automatically manage a set of three players. The service will monitor for new playgrounds in the tenant and automatically join them after a short delay.

## Progress Summary
- ✅ **Phase 1: Research and Design** - COMPLETED
- ❌ **Phase 2: Core Service Implementation** - PENDING  
- ❌ **Phase 3: Player Management** - PENDING
- ❌ **Phase 4: Integration and Testing** - PENDING
- ❌ **Phase 5: Deployment and Monitoring** - PENDING

**Current Status**: Architecture redesigned based on Jinaga watch research - implementing hybrid React-integrated service pattern

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

### 1.3 Data Model Integration
**Location**: `app/gamehub-model/model/`

**Required Changes**:
- [x] Use existing `Player` fact type for background players (no new fact types needed)
- [x] Use existing `User` fact type for background user accounts
- [x] Leverage existing authorization rules for `User` and `Player` facts
- [x] Use existing distribution rules for `User` and `Player` facts
- [x] Remove `PlayerPool` and `AutoJoin` fact types (not needed)

## Phase 2: Core Service Implementation 🔄

### 2.1 Background Service Manager
**Location**: `app/gamehub-player/src/services/background-service/BackgroundServiceManager.ts`

**Required Implementation**:
- [ ] Pure service class with no React dependencies
- [ ] Jinaga client initialization and management
- [ ] Observer lifecycle management (start/stop)
- [ ] Error recovery and reconnection logic (Jinaga built-in)
- [ ] Service state management and configuration

```typescript
export class BackgroundServiceManager {
  private observers: Observer[] = [];
  private isRunning = false;
  private j: JinagaClient;
  
  constructor(jinagaClient: JinagaClient) {
    this.j = jinagaClient;
  }
  
  start(tenant: Tenant) {
    if (this.isRunning) return;
    
    const playgroundObserver = this.j.watch(playgroundSpec, tenant, async (playground) => {
      await this.handleNewPlayground(playground);
    });
    
    this.observers.push(playgroundObserver);
    this.isRunning = true;
  }
  
  stop() {
    this.observers.forEach(observer => observer.stop());
    this.observers = [];
    this.isRunning = false;
  }
}
```

### 2.2 Playground Monitor
**Location**: `app/gamehub-player/src/services/background-service/PlaygroundMonitor.ts`

**Required Implementation**:
- [ ] Jinaga watch setup for new playgrounds using specifications
- [ ] Playground filtering logic (tenant-based)
- [ ] Join delay implementation with setTimeout
- [ ] Conflict detection and resolution (Jinaga built-in)
- [ ] Real-time playground state tracking

### 2.3 Player Pool Manager
**Location**: `app/gamehub-player/src/hooks/usePlayerPool.ts`

**Required Implementation**:
- [ ] React hook for player pool management
- [ ] Background user account creation with `User` facts
- [ ] Background player creation with `Player` facts (linked to users)
- [ ] Player name generation and assignment
- [ ] Player rotation and replacement logic
- [ ] Player state synchronization

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

## Phase 3: Player Management 🔄

### 3.1 Auto-Join Coordinator
**Location**: `app/gamehub-player/src/services/background-service/AutoJoinCoordinator.ts`

**Required Implementation**:
- [ ] Join timing coordination (sequential joins with delays)
- [ ] Player assignment to playgrounds
- [ ] Join conflict resolution (Jinaga built-in fact ordering)
- [ ] Leave logic for player rotation
- [ ] Join success/failure tracking

### 3.2 Player Session Management
**Location**: `app/gamehub-player/src/hooks/usePlayerSession.ts`

**Required Implementation**:
- [ ] Background user authentication using existing `User` facts
- [ ] Background player session creation using existing `Player` facts
- [ ] Player name management with Jinaga facts
- [ ] Session persistence and recovery
- [ ] Player state synchronization
- [ ] Session cleanup and rotation

## Phase 4: Integration and Testing 🔄

### 4.1 Service Integration
**Location**: `app/gamehub-player/src/hooks/useBackgroundService.ts`

**Required Changes**:
- [ ] React hook for service lifecycle management
- [ ] Service controls in admin interface
- [ ] Service status monitoring
- [ ] Configuration options via environment variables
- [ ] Handle service lifecycle with app lifecycle

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

### 4.2 Configuration Management
**Location**: `app/gamehub-player/src/config/background-service.ts`

**Required Configuration**:
- [ ] Service enable/disable settings via environment variables
- [ ] Player pool size configuration
- [ ] Join delay timing settings
- [ ] Retry and error handling settings
- [ ] Monitoring and logging settings

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
- [ ] Background service successfully monitors for new playgrounds using `j.watch`
- [ ] Three background players (using existing `User` and `Player` facts) automatically join playgrounds after configurable delay
- [ ] Service handles concurrent playground creation without conflicts (Jinaga built-in)
- [ ] Background players rotate and maintain active sessions
- [ ] Service recovers from errors and network issues (Jinaga built-in)
- [ ] Performance impact on main application is minimal
- [ ] Service can be enabled/disabled via environment variables
- [ ] Comprehensive monitoring and logging is in place

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

### Integration Points
- **Main App**: Service integrates via React hooks for lifecycle management
- **Admin Interface**: Add controls for managing background service configuration
- **Monitoring**: Integrate with existing status dashboard
- **Configuration**: Use environment variable patterns for service settings
- **Data Model**: Leverage existing `User` and `Player` fact types for background players

### Future Enhancements
- **Dynamic Pool Sizing**: Allow runtime configuration of player pool size
- **Smart Join Timing**: Implement more sophisticated join timing algorithms
- **Player Behavior Simulation**: Add realistic player behavior patterns
- **Multi-tenant Support**: Extend to support multiple tenants simultaneously 