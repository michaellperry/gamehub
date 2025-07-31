# Fleet Duel Front End Implementation Plan

## Overview
This plan outlines the implementation of the Fleet Duel front end, specifically focusing on the ship placement phase. The implementation will refactor the current game page to separate Tic-tac-toe gameplay from Fleet Duel, creating a modular game interface system.

## Progress Summary
- ✅ **Phase 1: Game Page Refactoring** - COMPLETED
- ✅ **Phase 2: Fleet Duel Components** - COMPLETED
- ✅ **Phase 3: Ship Placement Interface** - COMPLETED
- ✅ **Phase 4: Game Type Detection** - COMPLETED
- ✅ **Phase 5: Testing and Integration** - COMPLETED

**Current Status**: All phases completed successfully. Test suite is fully functional with 134 tests passing.

## Prerequisites
- [x] Understanding of current GamePage.tsx structure
- [x] Review of Fleet Duel PRD requirements
- [x] Analysis of existing component library
- [x] Identification of game type detection mechanism
- [x] Test suite configuration and setup

## Phase 1: Game Page Refactoring ✅

### 1.1 Extract Tic-tac-toe Components
**Location**: `app/gamehub-player/src/pages/GamePage.tsx`

**Required Steps**:
- [x] Create `TicTacToeGame.tsx` component in `components/organisms/`
- [x] Move `TicTacToeBoard` component to `components/molecules/`
- [x] Move `GameStatus` component to `components/molecules/`
- [x] Move `PlayerInfo` component to `components/molecules/`
- [x] Update imports in GamePage.tsx

### 1.2 Create Game Interface Abstraction
**Location**: `app/gamehub-player/src/components/organisms/`

**Required Steps**:
- [x] Create `GameInterface.tsx` base component
- [x] Define common game interface props
- [x] Create `TicTacToeInterface.tsx` extending base
- [x] Create `FleetDuelInterface.tsx` extending base
- [x] Update GamePage to use game interface abstraction

### 1.3 Refactor GamePage Structure
**Location**: `app/gamehub-player/src/pages/GamePage.tsx`

**Required Changes**:
- [x] Remove inline component definitions
- [x] Add game type detection logic
- [x] Implement dynamic game interface rendering
- [x] Maintain existing game state management
- [x] Preserve navigation and error handling

## Phase 2: Fleet Duel Components ✅

### 2.1 Create Fleet Duel Atoms
**Location**: `app/gamehub-player/src/components/atoms/`

**Required Components**:
- [x] `GridCell.tsx` - Individual grid cell component
- [x] `Ship.tsx` - Draggable ship component
- [x] `FleetPanel.tsx` - Ship selection panel
- [x] `GameGrid.tsx` - 10x10 grid component
- [x] Update `index.ts` exports

### 2.2 Create Fleet Duel Molecules
**Location**: `app/gamehub-player/src/components/molecules/`

**Required Components**:
- [x] `ShipPlacementGrid.tsx` - Interactive placement grid
- [x] `FleetMenu.tsx` - Ship selection interface
- [x] `PlacementControls.tsx` - Rotate/move controls
- [x] `ValidationFeedback.tsx` - Placement validation display
- [x] Update `index.ts` exports

### 2.3 Create Fleet Duel Organisms
**Location**: `app/gamehub-player/src/components/organisms/`

**Required Components**:
- [x] `FleetDuelGame.tsx` - Main game container
- [x] `ShipPlacementPhase.tsx` - Placement phase interface
- [ ] `AttackPhase.tsx` - Attack phase interface (future)
- [ ] `GameEndPhase.tsx` - End game interface (future)
- [x] Update `index.ts` exports

## Phase 3: Ship Placement Interface ✅

### 3.1 Implement Grid System
**Location**: `app/gamehub-player/src/components/atoms/GridCell.tsx`

**Required Features**:
- [x] 10x10 grid layout with A-J rows and 1-10 columns
- [x] Cell hover states and selection indicators
- [x] Ship placement validation visual feedback
- [x] Responsive design for desktop and tablet

### 3.2 Implement Ship Components
**Location**: `app/gamehub-player/src/components/atoms/Ship.tsx`

**Required Features**:
- [x] Draggable ship components (Carrier, Battleship, Cruiser, Submarine, Destroyer)
- [x] Ship size representation (2-5 units)
- [x] Rotation between horizontal and vertical
- [x] Visual feedback for valid/invalid placement
- [x] Drag and drop functionality

### 3.3 Implement Fleet Menu
**Location**: `app/gamehub-player/src/components/molecules/FleetMenu.tsx`

**Required Features**:
- [x] Ship selection panel with all 5 ship types
- [x] Visual indicators for placed/unplaced ships
- [x] Ship count tracking
- [x] Drag source functionality
- [x] Responsive layout

### 3.4 Implement Placement Controls
**Location**: `app/gamehub-player/src/components/molecules/PlacementControls.tsx`

**Required Features**:
- [x] Rotate button ('R' key support)
- [x] Move placed ships functionality
- [x] "Lock Fleet" button (enabled only when all ships placed)
- [x] Validation status display
- [x] Keyboard shortcuts support

## Phase 4: Game Type Detection ✅

### 4.1 Create Game Type Detection
**Location**: `app/gamehub-player/src/hooks/useGameType.ts`

**Required Features**:
- [x] Detect game type from game data
- [x] Support for Tic-tac-toe and Fleet Duel
- [x] Extensible for future game types
- [x] Type-safe game interface selection

### 4.2 Update Game Hooks
**Location**: `app/gamehub-player/src/hooks/useGame.ts`

**Required Changes**:
- [x] Add game type information to game data
- [x] Maintain backward compatibility with Tic-tac-toe
- [x] Support Fleet Duel game state structure
- [x] Preserve existing game logic

### 4.3 Create Fleet Duel Hooks
**Location**: `app/gamehub-player/src/hooks/`

**Required Hooks**:
- [x] `useFleetDuel.ts` - Fleet Duel specific game logic
- [x] `useShipPlacement.ts` - Ship placement state management
- [x] `useFleetValidation.ts` - Placement validation logic
- [x] `useFleetDuelGameState.ts` - Game state management

## Phase 5: Testing and Integration ✅

### 5.1 Component Testing
**Location**: `app/gamehub-player/src/test/components/`

**Required Tests**:
- [x] `FleetDuelGame.test.tsx` - Main game component tests
- [x] `ShipPlacementPhase.test.tsx` - Placement phase tests
- [x] `GridCell.test.tsx` - Grid cell interaction tests
- [x] `Ship.test.tsx` - Ship component tests
- [x] `Button.test.tsx` - Button component tests
- [x] `PlayerCard.test.tsx` - Player card tests
- [x] `ChallengeStatus.test.tsx` - Challenge status tests
- [x] `ActiveGames.test.tsx` - Active games tests

### 5.2 Hook Testing
**Location**: `app/gamehub-player/src/test/`

**Required Tests**:
- [x] `useFleetDuel.test.ts` - Fleet Duel hook tests
- [x] `useShipPlacement.test.ts` - Placement hook tests
- [x] `useFleetValidation.test.ts` - Validation hook tests
- [x] `useGameType.test.ts` - Game type detection tests
- [x] `useGame.test.ts` - Game hook tests
- [x] `usePlayerSession.test.ts` - Player session tests
- [x] `usePlayerSessions.test.ts` - Player sessions tests

### 5.3 Integration Testing
**Location**: `app/gamehub-player/src/test/`

**Required Tests**:
- [x] `GamePage.test.tsx` - Updated game page tests
- [x] `FleetDuelIntegration.test.tsx` - End-to-end Fleet Duel tests
- [x] `GameTypeSwitching.test.tsx` - Game type switching tests

### 5.4 Test Suite Fixes
**Issues Resolved**:
- [x] Fixed Jest vs Vitest syntax issues (replaced `jest.fn()` with `vi.fn()`)
- [x] Added missing icon components ("user" and "info" icons)
- [x] Fixed Ship component test structure to match actual component
- [x] Updated test selectors to use proper element queries
- [x] Fixed mock configurations for integration tests
- [x] Resolved all test failures (134 tests now passing)

### 5.5 Visual Testing
**Required Steps**:
- [x] Test responsive design on different screen sizes
- [x] Verify drag and drop functionality
- [x] Test keyboard shortcuts
- [x] Validate visual feedback for all states
- [x] Test accessibility features

## Success Criteria
- [x] Tic-tac-toe game functionality preserved and separated
- [x] Fleet Duel ship placement phase fully functional
- [x] Responsive design works on desktop and tablet
- [x] All drag and drop interactions work smoothly
- [x] Validation feedback is clear and immediate
- [x] Game type detection works reliably
- [x] All tests pass (134/134 tests passing)
- [x] No regression in existing functionality

## Technical Notes

### Component Architecture
- Use atomic design principles (atoms → molecules → organisms)
- Maintain separation of concerns between game logic and UI
- Ensure reusable components for future game types
- Follow existing component patterns and styling

### State Management
- Use React hooks for local state management
- Maintain game state consistency with existing patterns
- Ensure real-time updates work with Jinaga
- Handle loading and error states appropriately

### Performance Considerations
- Optimize drag and drop performance
- Minimize re-renders during ship placement
- Use React.memo for expensive components
- Implement proper cleanup for event listeners

### Accessibility
- Ensure keyboard navigation works
- Provide screen reader support
- Maintain color contrast requirements
- Support assistive technologies

### Testing Infrastructure
- All tests use Vitest instead of Jest
- Proper mock configurations for all components
- Integration tests cover end-to-end scenarios
- Component tests verify all interactive features
- Hook tests validate state management logic

## Notes
- This plan focuses only on the front end implementation
- No changes to Jinaga model are included
- Ship placement phase is the primary focus
- Attack phase and end game are noted for future implementation
- All existing Tic-tac-toe functionality must be preserved
- The plan assumes game type detection will be implemented in the backend
- Test suite is now fully functional with all 134 tests passing 