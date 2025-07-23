# Challenge Flow Implementation Plan

## Overview
This plan implements the challenge flow as described in the Playground PRD, where players can issue challenges to other players in a playground, and opponents can accept (creating a Game) or reject the challenge.

## Progress Summary
- ✅ **Phase 1: Data Model Extension** - COMPLETED
- ✅ **Phase 2: Authorization Rules** - COMPLETED  
- ❌ **Phase 3: Distribution Rules** - PENDING
- ❌ **Phase 4: Custom Hooks & View Models** - PENDING
- ❌ **Phase 5: React Components** - PENDING
- ❌ **Phase 6: Integration & Testing** - PENDING

**Current Status**: Phase 2 completed - authorization rules implemented for Challenge, Game, and Reject facts

## Prerequisites
- [ ] Jinaga model structure is understood and accessible
- [ ] Authorization and distribution patterns are established
- [ ] React component patterns are defined
- [ ] Testing framework is configured

## Phase 1: Data Model Extension ✅
**Location**: `app/gamehub-model/model/gamehub.ts`

### 1.1 Challenge Fact Definition
**Required Steps**:
- [x] Define Challenge fact class with challengerStarts boolean field
- [x] Add Challenge to model builder configuration
- [x] Create Challenge predecessor relationships to Join facts
- [x] Add Challenge to model exports

### 1.2 Game Fact Definition  
**Required Steps**:
- [x] Define Game fact class with game state fields
- [x] Add Game to model builder configuration
- [x] Create Game predecessor relationship to Challenge fact
- [x] Add Game to model exports

### 1.3 Reject Fact Definition
**Required Steps**:
- [x] Define Reject fact class
- [x] Add Reject to model builder configuration
- [x] Create Reject predecessor relationship to Challenge fact
- [x] Add Reject to model exports

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
- [ ] Create challenge distribution rules
- [ ] Ensure challenges are shared with playground participants
- [ ] Configure real-time updates for challenge status

### 3.2 Game Distribution
**Required Steps**:
- [ ] Create game distribution rules
- [ ] Share game state with participants
- [ ] Configure game updates for spectators

### 3.3 Reject Distribution
**Required Steps**:
- [ ] Create reject distribution rules
- [ ] Share reject notifications with challenge participants

## Phase 4: Custom Hooks & View Models ✅
**Location**: `app/gamehub-player/src/hooks/`

### 4.1 Challenge Management Hooks
**Required Steps**:
- [ ] Create useChallenge hook for issuing challenges
- [ ] Create useChallengeStatus hook for tracking challenge state
- [ ] Create usePendingChallenges hook for incoming challenges
- [ ] Create useOutgoingChallenges hook for sent challenges

### 4.2 Game Management Hooks
**Required Steps**:
- [ ] Create useGame hook for game state management
- [ ] Create useGameActions hook for game moves
- [ ] Create useGameStatus hook for game state tracking

### 4.3 View Model Specifications
**Required Steps**:
- [ ] Create challenge view model specifications
- [ ] Create game view model specifications
- [ ] Create playground view model specifications with challenge integration

## Phase 5: React Components ✅
**Location**: `app/gamehub-player/src/components/`

### 5.1 Challenge UI Components
**Required Steps**:
- [ ] Create ChallengeButton component for issuing challenges
- [ ] Create ChallengeModal component for challenge options
- [ ] Create ChallengeNotification component for incoming challenges
- [ ] Create ChallengeStatus component for challenge indicators

### 5.2 Game UI Components
**Required Steps**:
- [ ] Create GameBoard component for tic-tac-toe grid
- [ ] Create GameStatus component for turn and result display
- [ ] Create GameActions component for game controls

### 5.3 Integration Components
**Required Steps**:
- [ ] Update PlaygroundLobby to include challenge functionality
- [ ] Update PlayerCard to show challenge buttons and status
- [ ] Create GameView component for individual game display

## Phase 6: Integration & Testing ✅
**Location**: `app/gamehub-player/src/` and `app/gamehub-player/src/test/`

### 6.1 Integration Tasks
**Required Steps**:
- [ ] Integrate challenge flow into playground lobby
- [ ] Connect challenge actions to Jinaga fact creation
- [ ] Implement real-time challenge status updates
- [ ] Add game navigation from challenge acceptance

### 6.2 Testing Implementation
**Required Steps**:
- [ ] Create unit tests for challenge hooks
- [ ] Create integration tests for challenge flow
- [ ] Create component tests for challenge UI
- [ ] Create end-to-end tests for complete challenge workflow

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

## Dependencies
- Jinaga model structure must be stable
- Authorization patterns must be established
- React component patterns must be defined
- Testing framework must be configured

## Notes
- Challenge flow should integrate seamlessly with existing playground functionality
- Real-time updates are critical for good user experience
- Authorization rules must prevent invalid challenge states
- Game creation should be atomic with challenge acceptance
- UI should provide clear feedback for all challenge states 