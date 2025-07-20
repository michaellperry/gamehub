# Leave Playground Feature Implementation Plan

## Overview
Add functionality for players to leave a playground they have joined, including proper data model updates, UI changes, and real-time synchronization across all connected players.

## Progress Summary
- ❌ **Phase 1: Data Model Foundation** - PENDING
- ❌ **Phase 2: Authorization & Distribution** - PENDING  
- ❌ **Phase 3: Backend Logic** - PENDING
- ❌ **Phase 4: Frontend UI** - PENDING

**Current Status**: Planning phase - ready to begin implementation

## Prerequisites
- [ ] Jinaga model understanding (completed)
- [ ] Current playground join functionality working (completed)
- [ ] Player authentication system operational (completed)
- [ ] Real-time data synchronization working (completed)

## Phase 1: Data Model Foundation ❌
### 1.1 Create Leave Fact Type
**Location**: `app/gamehub-model/model/gamehub.ts`

**Required Steps**:
- [ ] Define new `Leave` fact class with player, playground, and leftAt properties
- [ ] Add static helper methods for querying leaves
- [ ] Update model composition to include Leave fact type
- [ ] Ensure Leave facts reference the Join fact they're leaving

### 1.2 Update Model Composition
**Location**: `app/gamehub-model/model/gamehub.ts`

**Required Changes**:
- [ ] Add Leave type to gameHubModel builder
- [ ] Define predecessor relationships for Leave facts
- [ ] Ensure proper relationship to Join facts
- [ ] Update the static helper methods in the Join fact to exclude those that have a Leave successor

## Phase 2: Authorization & Distribution ❌
### 2.1 Authorization Rules
**Location**: `app/gamehub-model/authorization/tenantAuthorization.ts`

**Required Steps**:
- [ ] Add authorization rule for Leave facts
- [ ] Ensure only the player who joined can leave

## Phase 3: Backend Logic ❌
### 3.1 Update Playground Page Hook
**Location**: `app/gamehub-player/src/hooks/usePlaygroundPage.ts`

**Required Steps**:
- [ ] Add leave playground functionality to view model
- [ ] Create specification to find active joins (excluding leaves)
- [ ] Add error handling for leave operations

### 3.2 Leave Playground Handler
**Location**: `app/gamehub-player/src/hooks/usePlaygroundPage.ts`

**Required Changes**:
- [ ] Implement handleLeavePlayground function
- [ ] Create Leave fact when player leaves
- [ ] Handle navigation after leaving

## Phase 4: Frontend UI ❌
### 4.1 Update Playground Page Component
**Location**: `app/gamehub-player/src/pages/PlaygroundPage.tsx`

**Required Steps**:
- [ ] Add "Leave Playground" button for current player
- [ ] Position button prominently in UI
- [ ] Add confirmation dialog for leave action

### 4.2 Navigation Handling
**Location**: `app/gamehub-player/src/pages/PlaygroundPage.tsx`

**Required Steps**:
- [ ] Navigate to home page after leaving
- [ ] Show success message after leaving
- [ ] Add proper error handling for leave failures

## Success Criteria
- [ ] Players can successfully leave playgrounds
- [ ] Leave events are properly synchronized across all clients
- [ ] UI updates immediately when players leave
- [ ] Authorization prevents unauthorized leave attempts
- [ ] Error handling works for edge cases
- [ ] Navigation flow is smooth and intuitive
- [ ] Real-time updates work correctly for all connected players

## Technical Considerations
- **Data Integrity**: Ensure Leave facts properly reference Join facts
- **Real-time Updates**: All connected clients must see leave events immediately
- **Authorization**: Only the player who joined can leave
- **Edge Cases**: Handle last player leaving, active games, etc.
- **Performance**: Leave operations should be fast and responsive
- **User Experience**: Clear feedback and smooth navigation

## Dependencies
- Jinaga model system (completed)
- Player authentication (completed)
- Real-time data synchronization (completed)
- Current playground join functionality (completed)

## Notes
- Leave facts should reference the Join fact they're leaving for proper audit trail
- Consider adding a "rejoin" feature in future iterations
- Monitor for potential race conditions in real-time updates
- Ensure proper cleanup of any game-related data when players leave 