# Challenge Flow Implementation Plan

## Overview
This plan implements the challenge flow as described in the Playground PRD, where players can issue challenges to other players in a playground, and opponents can accept (creating a Game) or reject the challenge.

**Note**: This plan was created before the recommended implementation order was established. Future plans should follow the order: Define Facts → Build UI → Define Custom Hooks → Define Specifications → Define Authorization Rules → Define Distribution Rules → Generate Policies → Write Tests.

## Progress Summary
- ✅ **Phase 1: Data Model Extension** - COMPLETED
- ✅ **Phase 2: Authorization Rules** - COMPLETED  
- ✅ **Phase 3: Distribution Rules** - COMPLETED
- ❌ **Phase 4: Custom Hooks & View Models** - PENDING
- ❌ **Phase 5: React Components** - PENDING
- ❌ **Phase 6: Integration & Testing** - PENDING

**Current Status**: Phase 3 completed - distribution rules implemented for real-time challenge flow updates. Backend data layer is complete, frontend implementation pending.

## Prerequisites
- [x] Jinaga model structure is understood and accessible
- [x] Authorization and distribution patterns are established
- [ ] React component patterns are defined for challenge flow
- [ ] Testing framework is configured for challenge-specific scenarios

## Phase 1: Data Model Extension ✅
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

## Phase 2: Authorization Rules ✅
**Location**: `app/gamehub-model/authorization/`

### 2.1 Challenge Authorization
**Required Steps**:
- [x] Create challenge authorization rules
- [x] Ensure only players in same playground can challenge each other
- [x] Prevent self-challenges
- [x] Prevent duplicate challenges between same players

### 2.2 Game Authorization
**Required Steps**:
- [x] Create game authorization rules
- [x] Ensure only challenge participants can create games
- [x] Validate game state transitions

### 2.3 Reject Authorization
**Required Steps**:
- [x] Create reject authorization rules
- [x] Ensure only challenge opponent can reject
- [x] Prevent multiple rejects for same challenge

## Phase 3: Distribution Rules ✅
**Location**: `app/gamehub-model/distribution/`

### 3.1 Challenge Distribution
**Required Steps**:
- [x] Create challenge distribution rules
- [x] Ensure challenges are shared with playground participants
- [x] Configure real-time updates for challenge status

### 3.2 Game Distribution
**Required Steps**:
- [x] Create game distribution rules
- [x] Share game state with participants
- [x] Configure game updates for spectators

### 3.3 Reject Distribution
**Required Steps**:
- [x] Create reject distribution rules
- [x] Share reject notifications with challenge participants

## Phase 4: Custom Hooks & View Models ❌
**Location**: `app/gamehub-player/src/hooks/`

### 4.1 Challenge Management Hooks
**Required Steps**:
- [ ] Create useChallenge hook for issuing challenges
  - [ ] Implement challenge creation with challengerStarts selection
  - [ ] Add error handling for invalid challenge attempts
  - [ ] Include loading states during challenge creation
  - [ ] Add validation for playground membership
- [ ] Create useChallengeStatus hook for tracking challenge state
  - [ ] Track pending, accepted, rejected, and expired challenges
  - [ ] Implement real-time status updates
  - [ ] Add challenge expiration logic
- [ ] Create usePendingChallenges hook for incoming challenges
  - [ ] Filter challenges where current player is opponent
  - [ ] Include challenge metadata (challenger name, playground, etc.)
  - [ ] Add accept/reject action handlers
- [ ] Create useOutgoingChallenges hook for sent challenges
  - [ ] Filter challenges where current player is challenger
  - [ ] Track challenge status and opponent responses
  - [ ] Add cancel challenge functionality

### 4.2 Game Management Hooks
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

### 4.3 View Model Specifications
**Required Steps**:
- [ ] Create challenge view model specifications
  - [ ] Define ChallengeViewModel interface
  - [ ] Include challenger/opponent player information
  - [ ] Add playground context and timestamps
  - [ ] Include challenge status and actions available
- [ ] Create game view model specifications
  - [ ] Define GameViewModel interface
  - [ ] Include game state, players, and current turn
  - [ ] Add game history and move tracking
  - [ ] Include game completion status
- [ ] Create playground view model specifications with challenge integration
  - [ ] Extend existing playground view models
  - [ ] Add challenge-related player status indicators
  - [ ] Include active challenges and games in playground
  - [ ] Add challenge action buttons and notifications

## Phase 5: React Components ❌
**Location**: `app/gamehub-player/src/components/`

### 5.1 Challenge UI Components
**Required Steps**:
- [ ] Create ChallengeButton component for issuing challenges
  - [ ] Add challengerStarts selection (radio buttons or toggle)
  - [ ] Include player selection dropdown
  - [ ] Add validation and error states
  - [ ] Implement loading states during challenge creation
- [ ] Create ChallengeModal component for challenge options
  - [ ] Show available opponents in playground
  - [ ] Include challengerStarts selection UI
  - [ ] Add challenge confirmation dialog
  - [ ] Include playground context information
- [ ] Create ChallengeNotification component for incoming challenges
  - [ ] Display challenger information and playground
  - [ ] Add accept/reject action buttons
  - [ ] Include challenge expiration countdown
  - [ ] Add challenge details on expand
- [ ] Create ChallengeStatus component for challenge indicators
  - [ ] Show challenge status on player cards
  - [ ] Include visual indicators for pending/active challenges
  - [ ] Add challenge count badges
  - [ ] Include challenge type indicators (sent/received)

### 5.2 Game UI Components
**Required Steps**:
- [ ] Create placeholder GameBoard component for tic-tac-toe grid
  - [ ] Implement 3x3 grid layout
  - [ ] Display the names of the challenger and the opponent

### 5.3 Integration Components
**Required Steps**:
- [ ] Update PlaygroundLobby to include challenge functionality
  - [ ] Add challenge buttons to player cards
  - [ ] Include challenge status indicators
  - [ ] Add challenge notifications area
  - [ ] Integrate with existing playground features
- [ ] Update PlayerCard to show challenge buttons and status
  - [ ] Add challenge action buttons
  - [ ] Include challenge status indicators
  - [ ] Show active games for player
  - [ ] Add challenge history or statistics
- [ ] Create GameView component for individual game display
  - [ ] Integrate GameBoard, GameStatus, and GameActions
  - [ ] Add game navigation and controls
  - [ ] Include player information and game context
  - [ ] Add responsive design for mobile/desktop

## Phase 6: Integration & Testing ❌
**Location**: `app/gamehub-player/src/` and `app/gamehub-player/src/test/`

### 6.1 Integration Tasks
**Required Steps**:
- [ ] Integrate challenge flow into playground lobby
  - [ ] Connect challenge buttons to Jinaga fact creation
  - [ ] Implement real-time challenge status updates
  - [ ] Add challenge notifications to UI
  - [ ] Integrate with existing player session management
- [ ] Connect challenge actions to Jinaga fact creation
  - [ ] Implement challenge creation with proper validation
  - [ ] Add accept/reject fact creation
  - [ ] Handle game creation on challenge acceptance
  - [ ] Add error handling for failed operations
- [ ] Implement real-time challenge status updates
  - [ ] Subscribe to challenge fact changes
  - [ ] Update UI based on challenge state changes
  - [ ] Handle challenge expiration and cleanup
  - [ ] Add loading states during updates
- [ ] Add game navigation from challenge acceptance
  - [ ] Navigate to game view on challenge acceptance
  - [ ] Pass game context and state
  - [ ] Handle game initialization
  - [ ] Add back navigation to playground

### 6.2 Testing Implementation
**Required Steps**:
- [ ] Create unit tests for challenge hooks
  - [ ] Test useChallenge hook functionality
  - [ ] Test useChallengeStatus hook state management
  - [ ] Test usePendingChallenges and useOutgoingChallenges
  - [ ] Test error handling and edge cases
- [ ] Create integration tests for challenge flow
  - [ ] Test complete challenge creation workflow
  - [ ] Test challenge acceptance and game creation
  - [ ] Test challenge rejection flow
  - [ ] Test real-time updates across sessions
- [ ] Create component tests for challenge UI
  - [ ] Test ChallengeButton component interactions
  - [ ] Test ChallengeModal component functionality
  - [ ] Test ChallengeNotification component states
  - [ ] Test GameBoard component game logic
- [ ] Create end-to-end tests for complete challenge workflow
  - [ ] Test full challenge flow from creation to game completion
  - [ ] Test multiple concurrent challenges
  - [ ] Test challenge expiration scenarios
  - [ ] Test error recovery and edge cases

### 6.3 Performance and Accessibility Testing
**Required Steps**:
- [ ] Performance testing
  - [ ] Test challenge flow with multiple concurrent users
  - [ ] Measure real-time update performance
  - [ ] Test memory usage with active challenges
  - [ ] Validate responsive design performance
- [ ] Accessibility testing
  - [ ] Ensure keyboard navigation for challenge flow
  - [ ] Test screen reader compatibility
  - [ ] Validate color contrast and visual indicators
  - [ ] Test challenge flow with assistive technologies

## Success Criteria
- [ ] Players can issue challenges to other players in playground
- [ ] Challenge modal allows selection of who starts the game
- [ ] Opponents receive challenge notifications with accept/reject options
- [ ] Accepting challenge creates new game and navigates to game view
- [ ] Rejecting challenge closes notification and updates status
- [ ] Challenge status indicators show on player cards
- [ ] Real-time updates work across multiple browser sessions
- [ ] All authorization rules are properly enforced
- [ ] All distribution rules ensure proper data sharing
- [ ] Challenge flow is accessible and responsive
- [ ] Error handling provides clear user feedback
- [ ] Performance remains acceptable with concurrent challenges

## Dependencies
- ✅ Jinaga model structure is stable and accessible
- ✅ Authorization patterns are established and tested
- ✅ Distribution patterns ensure proper data sharing
- [ ] React component patterns need definition for challenge flow
- [ ] Testing framework needs challenge-specific configuration
- [ ] Error handling patterns need definition for challenge scenarios
- [ ] Performance monitoring needs setup for real-time updates

## Notes
- Challenge flow should integrate seamlessly with existing playground functionality
- Real-time updates are critical for good user experience
- Authorization rules must prevent invalid challenge states
- Game creation should be atomic with challenge acceptance
- UI should provide clear feedback for all challenge states
- Error handling should guide users to correct actions
- Performance considerations for multiple concurrent challenges
- Accessibility requirements for challenge flow interactions 