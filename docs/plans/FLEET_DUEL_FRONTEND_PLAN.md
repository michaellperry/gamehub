# Fleet Duel Front End Implementation Plan

## Overview
This plan outlines the implementation of the Fleet Duel front end, specifically focusing on the ship placement phase. The implementation will refactor the current game page to separate Tic-tac-toe gameplay from Fleet Duel, creating a modular game interface system.

## Progress Summary
- ❌ **Phase 1: Game Page Refactoring** - PENDING
- ❌ **Phase 2: Fleet Duel Components** - PENDING
- ❌ **Phase 3: Ship Placement Interface** - PENDING
- ❌ **Phase 4: Game Type Detection** - PENDING
- ❌ **Phase 5: Testing and Integration** - PENDING

**Current Status**: Planning phase - ready to begin implementation

## Prerequisites
- [ ] Understanding of current GamePage.tsx structure
- [ ] Review of Fleet Duel PRD requirements
- [ ] Analysis of existing component library
- [ ] Identification of game type detection mechanism

## Phase 1: Game Page Refactoring 🔄

### 1.1 Extract Tic-tac-toe Components
**Location**: `app/gamehub-player/src/pages/GamePage.tsx`

**Required Steps**:
- [ ] Create `TicTacToeGame.tsx` component in `components/organisms/`
- [ ] Move `TicTacToeBoard` component to `components/molecules/`
- [ ] Move `GameStatus` component to `components/molecules/`
- [ ] Move `PlayerInfo` component to `components/molecules/`
- [ ] Update imports in GamePage.tsx

### 1.2 Create Game Interface Abstraction
**Location**: `app/gamehub-player/src/components/organisms/`

**Required Steps**:
- [ ] Create `GameInterface.tsx` base component
- [ ] Define common game interface props
- [ ] Create `TicTacToeInterface.tsx` extending base
- [ ] Create `FleetDuelInterface.tsx` extending base
- [ ] Update GamePage to use game interface abstraction

### 1.3 Refactor GamePage Structure
**Location**: `app/gamehub-player/src/pages/GamePage.tsx`

**Required Changes**:
- [ ] Remove inline component definitions
- [ ] Add game type detection logic
- [ ] Implement dynamic game interface rendering
- [ ] Maintain existing game state management
- [ ] Preserve navigation and error handling

## Phase 2: Fleet Duel Components 🔄

### 2.1 Create Fleet Duel Atoms
**Location**: `app/gamehub-player/src/components/atoms/`

**Required Components**:
- [ ] `GridCell.tsx` - Individual grid cell component
- [ ] `Ship.tsx` - Draggable ship component
- [ ] `FleetPanel.tsx` - Ship selection panel
- [ ] `GameGrid.tsx` - 10x10 grid component
- [ ] Update `index.ts` exports

### 2.2 Create Fleet Duel Molecules
**Location**: `app/gamehub-player/src/components/molecules/`

**Required Components**:
- [ ] `ShipPlacementGrid.tsx` - Interactive placement grid
- [ ] `FleetMenu.tsx` - Ship selection interface
- [ ] `PlacementControls.tsx` - Rotate/move controls
- [ ] `ValidationFeedback.tsx` - Placement validation display
- [ ] Update `index.ts` exports

### 2.3 Create Fleet Duel Organisms
**Location**: `app/gamehub-player/src/components/organisms/`

**Required Components**:
- [ ] `FleetDuelGame.tsx` - Main game container
- [ ] `ShipPlacementPhase.tsx` - Placement phase interface
- [ ] `AttackPhase.tsx` - Attack phase interface (future)
- [ ] `GameEndPhase.tsx` - End game interface (future)
- [ ] Update `index.ts` exports

## Phase 3: Ship Placement Interface 🔄

### 3.1 Implement Grid System
**Location**: `app/gamehub-player/src/components/atoms/GridCell.tsx`

**Required Features**:
- [ ] 10x10 grid layout with A-J rows and 1-10 columns
- [ ] Cell hover states and selection indicators
- [ ] Ship placement validation visual feedback
- [ ] Responsive design for desktop and tablet

### 3.2 Implement Ship Components
**Location**: `app/gamehub-player/src/components/atoms/Ship.tsx`

**Required Features**:
- [ ] Draggable ship components (Carrier, Battleship, Cruiser, Submarine, Destroyer)
- [ ] Ship size representation (2-5 units)
- [ ] Rotation between horizontal and vertical
- [ ] Visual feedback for valid/invalid placement
- [ ] Drag and drop functionality

### 3.3 Implement Fleet Menu
**Location**: `app/gamehub-player/src/components/molecules/FleetMenu.tsx`

**Required Features**:
- [ ] Ship selection panel with all 5 ship types
- [ ] Visual indicators for placed/unplaced ships
- [ ] Ship count tracking
- [ ] Drag source functionality
- [ ] Responsive layout

### 3.4 Implement Placement Controls
**Location**: `app/gamehub-player/src/components/molecules/PlacementControls.tsx`

**Required Features**:
- [ ] Rotate button ('R' key support)
- [ ] Move placed ships functionality
- [ ] "Lock Fleet" button (enabled only when all ships placed)
- [ ] Validation status display
- [ ] Keyboard shortcuts support

## Phase 4: Game Type Detection 🔄

### 4.1 Create Game Type Detection
**Location**: `app/gamehub-player/src/hooks/useGameType.ts`

**Required Features**:
- [ ] Detect game type from game data
- [ ] Support for Tic-tac-toe and Fleet Duel
- [ ] Extensible for future game types
- [ ] Type-safe game interface selection

### 4.2 Update Game Hooks
**Location**: `app/gamehub-player/src/hooks/useGame.ts`

**Required Changes**:
- [ ] Add game type information to game data
- [ ] Maintain backward compatibility with Tic-tac-toe
- [ ] Support Fleet Duel game state structure
- [ ] Preserve existing game logic

### 4.3 Create Fleet Duel Hooks
**Location**: `app/gamehub-player/src/hooks/`

**Required Hooks**:
- [ ] `useFleetDuel.ts` - Fleet Duel specific game logic
- [ ] `useShipPlacement.ts` - Ship placement state management
- [ ] `useFleetValidation.ts` - Placement validation logic
- [ ] `useFleetDuelGameState.ts` - Game state management

## Phase 5: Testing and Integration 🔄

### 5.1 Component Testing
**Location**: `app/gamehub-player/src/test/components/`

**Required Tests**:
- [ ] `FleetDuelGame.test.tsx` - Main game component tests
- [ ] `ShipPlacementPhase.test.tsx` - Placement phase tests
- [ ] `GridCell.test.tsx` - Grid cell interaction tests
- [ ] `Ship.test.tsx` - Ship component tests
- [ ] `FleetMenu.test.tsx` - Fleet menu tests

### 5.2 Hook Testing
**Location**: `app/gamehub-player/src/test/`

**Required Tests**:
- [ ] `useFleetDuel.test.ts` - Fleet Duel hook tests
- [ ] `useShipPlacement.test.ts` - Placement hook tests
- [ ] `useFleetValidation.test.ts` - Validation hook tests
- [ ] `useGameType.test.ts` - Game type detection tests

### 5.3 Integration Testing
**Location**: `app/gamehub-player/src/test/`

**Required Tests**:
- [ ] `GamePage.test.tsx` - Updated game page tests
- [ ] `FleetDuelIntegration.test.tsx` - End-to-end Fleet Duel tests
- [ ] `GameTypeSwitching.test.tsx` - Game type switching tests

### 5.4 Visual Testing
**Required Steps**:
- [ ] Test responsive design on different screen sizes
- [ ] Verify drag and drop functionality
- [ ] Test keyboard shortcuts
- [ ] Validate visual feedback for all states
- [ ] Test accessibility features

## Success Criteria
- [ ] Tic-tac-toe game functionality preserved and separated
- [ ] Fleet Duel ship placement phase fully functional
- [ ] Responsive design works on desktop and tablet
- [ ] All drag and drop interactions work smoothly
- [ ] Validation feedback is clear and immediate
- [ ] Game type detection works reliably
- [ ] All tests pass
- [ ] No regression in existing functionality

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

## Notes
- This plan focuses only on the front end implementation
- No changes to Jinaga model are included
- Ship placement phase is the primary focus
- Attack phase and end game are noted for future implementation
- All existing Tic-tac-toe functionality must be preserved
- The plan assumes game type detection will be implemented in the backend 