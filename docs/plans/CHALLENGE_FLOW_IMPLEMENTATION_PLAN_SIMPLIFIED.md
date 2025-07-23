# Challenge Flow Implementation Plan (Simplified)

## Overview
This plan implements the challenge flow as described in the Playground PRD, where players can issue challenges to other players in a playground, and opponents can accept (creating a Game) or reject the challenge.

## Progress Summary
- ✅ **Phase 1: Define Facts** - COMPLETED
- 🔄 **Phase 2: Build User Interface** - PARTIALLY COMPLETED
- ❌ **Phase 3: Define Custom Hooks & View Models** - PENDING
- ❌ **Phase 4: Define Specifications** - PENDING
- ✅ **Phase 5: Define Authorization Rules** - COMPLETED
- ✅ **Phase 6: Define Distribution Rules** - COMPLETED
- ✅ **Phase 7: Generate Policies** - COMPLETED
- ❌ **Phase 8: Write Tests** - PENDING

**Current Status**: Phase 2 partially completed - basic challenge button UI exists but challenge functionality is not implemented. Backend data layer (facts, authorization, distribution, policies) is complete.

## Prerequisites
- [x] Jinaga model structure is understood and accessible
- [x] React component patterns are established
- [x] Testing framework is configured
- [x] Authorization and distribution patterns are understood

## Phase 1: Define Facts ✅
**Location**: `app/gamehub-model/model/gamehub.ts`

### 1.1 Challenge Fact Definition
**Required Steps**:
- [x] Define Challenge fact class with challengerStarts boolean field
- [x] Add Challenge to model builder configuration
- [x] Create Challenge predecessor relationships to Join facts
- [x] Add Challenge to model exports
- [x] Add helper methods for challenger/opponent identification

### 1.2 Game Fact Definition  
**Required Steps**:
- [x] Define Game fact class with game state fields
- [x] Add Game to model builder configuration
- [x] Create Game predecessor relationship to Challenge fact
- [x] Add Game to model exports
- [x] Add helper methods for participant identification

### 1.3 Reject Fact Definition
**Required Steps**:
- [x] Define Reject fact class
- [x] Add Reject to model builder configuration
- [x] Create Reject predecessor relationship to Challenge fact
- [x] Add Reject to model exports
- [x] Add helper methods for participant identification

## Phase 2: Build User Interface 🔄
**Location**: `app/gamehub-player/src/components/`

### 2.1 Challenge UI Components
**Required Steps**:
- [x] Create ChallengeButton component for issuing challenges
  - [x] Add challengerStarts selection (radio buttons or toggle)
  - [x] Include player selection dropdown
  - [x] Add validation and error states
  - [x] Implement loading states during challenge creation
- [ ] Create ChallengeModal component for challenge options
  - [ ] Show available opponents in playground
  - [ ] Include challengerStarts selection UI
  - [ ] Add challenge confirmation dialog
- [ ] Create ChallengeNotification component for incoming challenges
  - [ ] Display challenger information and playground
  - [ ] Add accept/reject action buttons
- [ ] Create ChallengeStatus component for challenge indicators
  - [ ] Show challenge status on player cards
  - [ ] Include visual indicators for pending/active challenges

### 2.2 Game UI Components
**Required Steps**:
- [ ] Create placeholder GameBoard component for tic-tac-toe grid
  - [ ] Implement 3x3 grid layout
  - [ ] Display the names of the challenger and the opponent

### 2.3 Integration Components
**Required Steps**:
- [x] Update PlaygroundLobby to include challenge functionality
  - [x] Add challenge buttons to player cards
  - [ ] Include challenge status indicators
  - [ ] Add challenge notifications area
  - [ ] Integrate with existing playground features
- [ ] Update PlayerCard to show challenge buttons and status
  - [x] Add challenge action buttons
  - [ ] Include challenge status indicators
  - [ ] Show active games for player
- [ ] Create GameView component for individual game display
  - [ ] Integrate GameBoard, GameStatus, and GameActions
  - [ ] Add game navigation and controls
  - [ ] Include player information and game context

## Phase 3: Define Custom Hooks & View Models ❌
**Location**: `app/gamehub-player/src/hooks/`

### 3.1 Challenge Management Hooks
**Required Steps**:
- [ ] Create useChallenge hook for issuing challenges
  - [ ] Implement challenge creation with challengerStarts selection
  - [ ] Add error handling for invalid challenge attempts
  - [ ] Include loading states during challenge creation
  - [ ] Add validation for playground membership
- [ ] Create useChallengeStatus hook for tracking challenge state
  - [ ] Track pending, accepted, and rejected challenges
  - [ ] Implement real-time status updates
- [ ] Create usePendingChallenges hook for incoming challenges
  - [ ] Filter challenges where current player is opponent
  - [ ] Include challenge metadata (challenger name, playground, etc.)
  - [ ] Add accept/reject action handlers
- [ ] Create useOutgoingChallenges hook for sent challenges
  - [ ] Filter challenges where current player is challenger
  - [ ] Track challenge status and opponent responses

### 3.2 Game Management Hooks
**Required Steps**:
- [ ] Create useGame hook for game state management
  - [ ] Load game state from accepted challenges
  - [ ] Implement game initialization logic
  - [ ] Add game state persistence
- [ ] Create useGameActions hook for game moves
  - [ ] Implement turn-based game logic
  - [ ] Add move validation
  - [ ] Handle game completion states
- [ ] Create useGameStatus hook for game state tracking
  - [ ] Track active games for current player
  - [ ] Monitor game progress and results
  - [ ] Handle game navigation

### 3.3 View Model Specifications
**Required Steps**:
- [ ] Create challenge view model specifications
  - [ ] Define ChallengeViewModel interface
  - [ ] Include challenger/opponent player information
  - [ ] Add playground context and timestamps
  - [ ] Include challenge status and actions available
- [ ] Create game view model specifications
  - [ ] Define GameViewModel interface
  - [ ] Include game state, players, and current turn
  - [ ] Include game completion status
- [ ] Create playground view model specifications with challenge integration
  - [ ] Extend existing playground view models
  - [ ] Add challenge-related player status indicators
  - [ ] Include active challenges and games in playground

## Phase 4: Define Specifications ❌
**Location**: `app/gamehub-model/specifications/`

### 4.1 Challenge Specifications
**Required Steps**:
- [ ] Create challenge query specifications
  - [ ] Define specifications for pending challenges
  - [ ] Add specifications for challenge status tracking
  - [ ] Include specifications for challenge metadata
- [ ] Create challenge-related player specifications
  - [ ] Define specifications for challenge participants
  - [ ] Create specifications for challenge notifications

### 4.2 Game Specifications
**Required Steps**:
- [ ] Create game state specifications
  - [ ] Define specifications for active games
  - [ ] Add specifications for game participants
  - [ ] Include specifications for game moves
- [ ] Create game-related playground specifications
  - [ ] Define specifications for games in playground
  - [ ] Add specifications for game status updates

### 4.3 Integration Specifications
**Required Steps**:
- [ ] Create playground challenge specifications
  - [ ] Define specifications for playground challenges
  - [ ] Create specifications for challenge notifications
- [ ] Create player challenge specifications
  - [ ] Create specifications for player challenge status
  - [ ] Add specifications for player game participation

## Phase 5: Define Authorization Rules ✅
**Location**: `app/gamehub-model/authorization/`

### 5.1 Challenge Authorization
**Required Steps**:
- [x] Create challenge authorization rules
  - [x] Ensure only players in same playground can challenge each other
  - [x] Prevent self-challenges
  - [x] Prevent duplicate challenges between same players
  - [x] Add validation for challenge parameters

### 5.2 Game Authorization
**Required Steps**:
- [x] Create game authorization rules
  - [x] Ensure only challenge participants can create games
  - [x] Validate game state transitions
  - [x] Add authorization for game moves
  - [x] Include authorization for game completion

### 5.3 Reject Authorization
**Required Steps**:
- [x] Create reject authorization rules
  - [x] Ensure only challenge opponent can reject
  - [x] Prevent multiple rejects for same challenge
  - [x] Add validation for reject timing
  - [x] Include authorization for reject notifications

## Phase 6: Define Distribution Rules ✅
**Location**: `app/gamehub-model/distribution/`

### 6.1 Challenge Distribution
**Required Steps**:
- [x] Create challenge distribution rules
  - [x] Ensure challenges are shared with playground participants
  - [x] Configure real-time updates for challenge status
  - [x] Add distribution for challenge notifications
  - [x] Include distribution for challenge history

### 6.2 Game Distribution
**Required Steps**:
- [x] Create game distribution rules
  - [x] Share game state with participants
  - [x] Configure game updates for spectators
  - [x] Add distribution for game moves
  - [x] Include distribution for game completion

### 6.3 Reject Distribution
**Required Steps**:
- [x] Create reject distribution rules
  - [x] Share reject notifications with challenge participants
  - [x] Add distribution for reject history
  - [x] Include distribution for reject status updates

## Phase 7: Generate Policies ✅
**Location**: `mesh/replicator/policies/`

### 7.1 Policy Generation
**Required Steps**:
- [x] Generate authorization policies
  - [x] Compile challenge authorization rules
  - [x] Compile game authorization rules
  - [x] Compile reject authorization rules
  - [x] Validate policy compilation
- [x] Generate distribution policies
  - [x] Compile challenge distribution rules
  - [x] Compile game distribution rules
  - [x] Compile reject distribution rules
  - [x] Validate distribution enablement

### 7.2 Policy Validation
**Required Steps**:
- [x] Test authorization policies
  - [x] Validate challenge creation permissions
  - [x] Validate game creation permissions
  - [x] Validate reject creation permissions
  - [x] Test edge cases and error scenarios
- [x] Test distribution policies
  - [x] Validate challenge data sharing
  - [x] Validate game data sharing
  - [x] Validate reject data sharing
  - [x] Test real-time update scenarios

## Phase 8: Write Tests ❌
**Location**: `app/gamehub-player/src/test/`

### 8.1 Hook Testing
**Required Steps**:
- [ ] Create unit tests for challenge hooks
  - [ ] Test useChallenge hook functionality
  - [ ] Test useChallengeStatus hook state management
  - [ ] Test usePendingChallenges and useOutgoingChallenges
  - [ ] Test error handling and edge cases
- [ ] Create unit tests for game hooks
  - [ ] Test useGame hook functionality
  - [ ] Test useGameActions hook game logic
  - [ ] Test useGameStatus hook state tracking
  - [ ] Test game completion scenarios

### 8.2 Integration Testing
**Required Steps**:
- [ ] Create integration tests for challenge flow
  - [ ] Test complete challenge creation workflow
  - [ ] Test challenge acceptance and game creation
  - [ ] Test challenge rejection flow
  - [ ] Test real-time updates across sessions
- [ ] Create integration tests for game flow
  - [ ] Test game initialization from challenge
  - [ ] Test turn-based game logic
  - [ ] Test game completion and results
  - [ ] Test game navigation and state persistence

### 8.3 Component Testing
**Required Steps**:
- [ ] Create component tests for challenge UI
  - [ ] Test ChallengeButton component interactions
  - [ ] Test ChallengeModal component functionality
  - [ ] Test ChallengeNotification component states
  - [ ] Test ChallengeStatus component indicators
- [ ] Create component tests for game UI
  - [ ] Test GameBoard component game logic
  - [ ] Test GameView component integration
  - [ ] Test game navigation and controls
  - [ ] Test responsive design and accessibility

### 8.4 End-to-End Testing
**Required Steps**:
- [ ] Create end-to-end tests for complete challenge workflow
  - [ ] Test full challenge flow from creation to game completion
  - [ ] Test multiple concurrent challenges
  - [ ] Test error recovery and edge cases
- [ ] Create performance and accessibility tests
  - [ ] Test challenge flow with multiple concurrent users
  - [ ] Test real-time update performance
  - [ ] Test accessibility compliance

## Success Criteria
- [x] Players can issue challenges to other players in playground
- [ ] Challenge modal allows selection of who starts the game
- [ ] Opponents receive challenge notifications with accept/reject options
- [ ] Accepting challenge creates new game and navigates to game view
- [ ] Rejecting challenge closes notification and updates status
- [ ] Challenge status indicators show on player cards
- [ ] Real-time updates work across multiple browser sessions
- [x] All authorization rules are properly enforced
- [x] All distribution rules ensure proper data sharing
- [ ] Challenge flow is accessible and responsive
- [ ] Error handling provides clear user feedback
- [ ] Performance remains acceptable with concurrent challenges

## Dependencies
- ✅ Jinaga model structure is stable and accessible
- ✅ React component patterns are established
- ✅ Testing framework is configured
- ✅ Authorization and distribution patterns are understood
- ✅ Challenge-specific UI patterns need definition
- ✅ Game-specific UI patterns need definition
- [ ] Error handling patterns need definition for challenge scenarios
- [ ] Performance monitoring needs setup for real-time updates

## Notes
- This plan follows the recommended Jinaga implementation order to ensure each step builds upon the previous
- UI design will reveal the exact data requirements for the challenge flow
- Custom hooks will identify the specific queries and commands needed
- Authorization and distribution rules will be based on actual user workflows
- Testing will validate that the entire system works together
- Real-time updates are critical for good user experience
- Game creation should be atomic with challenge acceptance
- UI should provide clear feedback for all challenge states
- Error handling should guide users to correct actions
- Performance considerations for multiple concurrent challenges
- Accessibility requirements for challenge flow interactions 