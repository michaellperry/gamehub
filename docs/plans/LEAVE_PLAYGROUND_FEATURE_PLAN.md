# Leave Playground Feature Implementation Plan

## Overview
Add functionality for players to leave a playground they have joined, including proper data model updates, UI changes, and real-time synchronization across all connected players.

## Progress Summary
- ✅ **Phase 1: Data Model Foundation** - COMPLETED
- ✅ **Phase 2: Authorization & Distribution** - COMPLETED  
- ✅ **Phase 3: Backend Logic** - COMPLETED
- ✅ **Phase 4: Frontend UI** - COMPLETED

**Current Status**: Implementation completed - ready for testing

## Prerequisites
- [x] Jinaga model understanding (completed)
- [x] Current playground join functionality working (completed)
- [x] Player authentication system operational (completed)
- [x] Real-time data synchronization working (completed)

## Phase 1: Data Model Foundation ✅
### 1.1 Create Leave Fact Type
**Location**: `app/gamehub-model/model/gamehub.ts`

**Required Steps**:
- [x] Define new `Leave` fact class with player, playground, and leftAt properties
- [x] Add static helper methods for querying leaves
- [x] Update model composition to include Leave fact type
- [x] Ensure Leave facts reference the Join fact they're leaving

### 1.2 Update Model Composition
**Location**: `app/gamehub-model/model/gamehub.ts`

**Required Changes**:
- [x] Add Leave type to gameHubModel builder
- [x] Define predecessor relationships for Leave facts
- [x] Ensure proper relationship to Join facts
- [x] Update the static helper methods in the Join fact to exclude those that have a Leave successor

## Phase 2: Authorization & Distribution ✅
### 2.1 Authorization Rules
**Location**: `app/gamehub-model/authorization/tenantAuthorization.ts`

**Required Steps**:
- [x] Add authorization rule for Leave facts
- [x] Ensure only the player who joined can leave

## Phase 3: Backend Logic ✅
### 3.1 Update Playground Page Hook
**Location**: `app/gamehub-player/src/hooks/usePlaygroundPage.ts`

**Required Steps**:
- [x] Add leave playground functionality to view model
- [x] Create specification to find active joins (excluding leaves)
- [x] Add error handling for leave operations

### 3.2 Leave Playground Handler
**Location**: `app/gamehub-player/src/hooks/usePlaygroundPage.ts`

**Required Changes**:
- [x] Implement handleLeavePlayground function
- [x] Create Leave fact when player leaves
- [x] Handle navigation after leaving

## Phase 4: Frontend UI ✅
### 4.1 Update Playground Page Component
**Location**: `app/gamehub-player/src/pages/PlaygroundPage.tsx`

**Required Steps**:
- [x] Add "Leave Playground" button for current player
- [x] Position button prominently in UI
- [x] Add confirmation dialog for leave action

### 4.2 Navigation Handling
**Location**: `app/gamehub-player/src/pages/PlaygroundPage.tsx`

**Required Steps**:
- [x] Navigate to home page after leaving
- [x] Show success message after leaving
- [x] Add proper error handling for leave failures

## Success Criteria
- [x] Players can successfully leave playgrounds
- [x] Leave events are properly synchronized across all clients
- [x] UI updates immediately when players leave
- [x] Authorization prevents unauthorized leave attempts
- [x] Error handling works for edge cases
- [x] Navigation flow is smooth and intuitive
- [x] Real-time updates work correctly for all connected players

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

## Implementation Notes
- **Data Model**: Successfully added Leave fact type with proper relationships to Join facts
- **Authorization**: Added rule ensuring only the player who joined can leave
- **Backend Logic**: Implemented handleLeavePlayground function with proper error handling
- **Frontend UI**: Added prominent "Leave Playground" button with confirmation dialog
- **Navigation**: Players are redirected to home page after successfully leaving
- **Real-time Updates**: The specification now excludes players who have left (using notExists)
- **User Experience**: Clear visual feedback with loading states and error handling 