# Product Requirements Document (PRD): Simplified Player Session Hook

## Overview
A simplified version of `usePlayerSession` that uses Jinaga's `j.watch` to automatically detect new playgrounds and simulate player joins with minimal state management.

## Goals
- Automatically detect new playgrounds in the tenant
- Simulate player joins with random delays
- Generate random player names
- Maintain minimal state and complexity
- Use Jinaga's reactive data model instead of manual state management
- Only active during development mode

## User Roles
- **Developer**: Uses the hook to enable automatic player simulation
- **System**: Automatically creates simulated players when playgrounds appear

## Information Architecture

### Routes
- No specific routes - this is a hook used within components

### Entities
- **Playground**: The playground entity that triggers player simulation
- **User**: The simulated user entity
- **Player**: The player entity associated with the user
- **Join**: The join fact that connects a player to a playground
- **PlayerName**: The player name fact with the generated name

## User Experience

### Automatic Player Simulation
- Hook observes playgrounds in the tenant using `j.watch`
- When a new playground appears, sets a random timeout (1-5 seconds)
- After timeout, automatically creates:
  1. User fact
  2. Player fact (associated with user)
  3. Join fact (connects player to playground)
  4. PlayerName fact (with randomly generated name)
- No manual intervention required
- No tracking of used names - each name is generated independently
- **Development Only**: Simulation is only active when `import.meta.env.DEV` is true

### Hook Interface
```typescript
interface SimplifiedPlayerSessionViewModel {
  isEnabled: boolean;
  playgroundCount: number;
  simulatedPlayersCount: number;
  enableSimulation: () => void;
  disableSimulation: () => void;
}
```

## Non-Functional Requirements
- **Performance**: Minimal overhead - only watches for playgrounds
- **Reliability**: Graceful handling of Jinaga connection issues
- **Simplicity**: No complex state management or service coordination
- **Randomness**: Truly random delays and names for realistic simulation

## Success Criteria
- [ ] Hook automatically detects new playgrounds
- [ ] Simulated players are created with random delays
- [ ] Player names are randomly generated
- [ ] No duplicate state management or service instances
- [ ] Clean integration with Jinaga's reactive model
- [ ] Minimal memory footprint and complexity

## Technical Specifications

### Hook Implementation
```typescript
export function useSimplifiedPlayerSession(tenant: Tenant | null): SimplifiedPlayerSessionViewModel
```

### Key Functions
1. **Playground Observer**: `j.watch(playgroundsInTenant(tenant))`
2. **Random Delay**: `setTimeout(() => createSimulatedPlayer(playground), randomDelay(1000, 5000))`
3. **Player Creation**: Creates User → Player → Join → PlayerName facts in sequence
4. **Name Generation**: Uses existing `gamingNames.ts` utility for random names

### State Management
- Only tracks basic counts (playgrounds, simulated players)
- No complex service state or player tracking
- Relies on Jinaga's reactive data model for updates

### Error Handling
- Graceful handling of Jinaga connection issues
- No retry logic - relies on Jinaga's built-in reliability
- Simple error state for debugging

## Implementation Notes
- Replaces complex `SimulatedPlayerService` with simple Jinaga watcher
- Eliminates global service state management
- Uses existing `gamingNames.ts` utility for name generation
- Integrates with existing Jinaga configuration and authorization rules
- Maintains compatibility with existing playground and player models
- **Environment Check**: Only activates simulation when `import.meta.env.DEV` is true 