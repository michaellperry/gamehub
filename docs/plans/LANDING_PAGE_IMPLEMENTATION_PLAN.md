# Landing Page Implementation Plan

## Overview
Implement the landing page for the multiplayer Tic-Tac-Toe playground application according to the PRD specifications. The landing page will serve as the entry point where users can start or join playgrounds with a name-based session system.

## Progress Summary
- ❌ **Phase 1: Foundation & Routing** - PENDING
- ❌ **Phase 2: Name Entry System** - PENDING  
- ❌ **Phase 3: Playground Code Generation** - PENDING
- ❌ **Phase 4: Join Playground Validation** - PENDING
- ❌ **Phase 5: UI/UX Polish** - PENDING

**Current Status**: Planning phase - ready to begin implementation

## Prerequisites
- [x] GameHub player application structure exists
- [x] React 18 + TypeScript + TailwindCSS setup
- [x] React Router DOM configured
- [x] Jinaga integration available
- [ ] Playground data model defined in gamehub-model
- [ ] Playground service endpoints available

## Phase 1: Foundation & Routing ✅
**Location**: `app/gamehub-player/src/`

### 1.1 Update App Routing
**Files**: `app/gamehub-player/src/App.tsx`

**Required Changes**:
- [ ] Add route for `/playground/:code`
- [ ] Add route for `/game/:gameId`
- [ ] Update existing routes to match PRD structure
- [ ] Ensure proper route parameter handling

### 1.2 Create Landing Page Component
**Files**: `app/gamehub-player/src/pages/LandingPage.tsx`

**Required Steps**:
- [ ] Create new LandingPage component
- [ ] Implement two main sections: "Start Playground" and "Join Playground"
- [ ] Add playground code input field with validation
- [ ] Implement responsive design with TailwindCSS
- [ ] Add proper TypeScript interfaces

### 1.3 Update HomePage Integration
**Files**: `app/gamehub-player/src/pages/HomePage.tsx`

**Required Changes**:
- [ ] Replace existing HomePage with LandingPage
- [ ] Remove login-related content
- [ ] Ensure proper navigation flow

## Phase 2: Name Entry System 🔄
**Location**: `app/gamehub-player/src/components/` and `app/gamehub-player/src/hooks/`

### 2.1 Create Name Entry Modal
**Files**: `app/gamehub-player/src/components/NameEntryModal.tsx`

**Required Steps**:
- [ ] Create modal component for name entry
- [ ] Implement form validation (required field, minimum length)
- [ ] Add proper focus management and accessibility
- [ ] Include "Continue" and "Cancel" actions
- [ ] Style with TailwindCSS following design system

### 2.2 Create Session Storage Hook
**Files**: `app/gamehub-player/src/hooks/usePlayerSession.ts`

**Required Steps**:
- [ ] Create custom hook for player session management
- [ ] Implement localStorage/sessionStorage for name persistence
- [ ] Add methods for getting/setting player name
- [ ] Include session ID generation
- [ ] Add TypeScript interfaces for session data

### 2.3 Integrate Name Entry Flow
**Files**: `app/gamehub-player/src/pages/LandingPage.tsx`

**Required Changes**:
- [ ] Add name entry modal trigger on first visit
- [ ] Implement name validation before playground actions
- [ ] Show current player name in UI
- [ ] Handle name editing functionality

## Phase 3: Playground Code Generation 🔄
**Location**: `app/gamehub-player/src/services/` and `app/gamehub-player/src/utils/`

### 3.1 Create Playground Service
**Files**: `app/gamehub-player/src/services/playgroundService.ts`

**Required Steps**:
- [ ] Create service for playground operations
- [ ] Implement playground creation endpoint
- [ ] Add playground validation endpoint
- [ ] Include proper error handling
- [ ] Add TypeScript interfaces for playground data

### 3.2 Create Code Generation Utility
**Files**: `app/gamehub-player/src/utils/codeGenerator.ts`

**Required Steps**:
- [ ] Implement 6-letter uppercase code generation
- [ ] Add code validation logic
- [ ] Ensure unique code generation
- [ ] Include proper error handling

### 3.3 Implement Start Playground Flow
**Files**: `app/gamehub-player/src/pages/LandingPage.tsx`

**Required Changes**:
- [ ] Add "Start Playground" button functionality
- [ ] Implement code generation and playground creation
- [ ] Add loading states during creation
- [ ] Handle navigation to playground lobby
- [ ] Include error handling for failed creation

## Phase 4: Join Playground Validation 🔄
**Location**: `app/gamehub-player/src/components/` and `app/gamehub-player/src/pages/`

### 4.1 Create Code Input Component
**Files**: `app/gamehub-player/src/components/PlaygroundCodeInput.tsx`

**Required Steps**:
- [ ] Create input component for 6-letter codes
- [ ] Implement real-time validation
- [ ] Add proper input formatting (uppercase, no spaces)
- [ ] Include visual feedback for valid/invalid codes
- [ ] Add accessibility features

### 4.2 Implement Join Validation
**Files**: `app/gamehub-player/src/pages/LandingPage.tsx`

**Required Changes**:
- [ ] Add playground existence validation
- [ ] Implement "Join Playground" button logic
- [ ] Add loading states during validation
- [ ] Handle navigation to existing playground
- [ ] Include error handling for invalid codes

### 4.3 Add Error Handling
**Files**: `app/gamehub-player/src/components/ErrorAlert.tsx`

**Required Steps**:
- [ ] Create error alert component
- [ ] Implement different error message types
- [ ] Add dismissible error notifications
- [ ] Style with TailwindCSS

## Phase 5: UI/UX Polish 🔄
**Location**: `app/gamehub-player/src/components/` and `app/gamehub-player/src/styles/`

### 5.1 Create Loading States
**Files**: `app/gamehub-player/src/components/LoadingSpinner.tsx`

**Required Steps**:
- [ ] Create loading spinner component
- [ ] Implement different loading states
- [ ] Add proper accessibility attributes
- [ ] Style with TailwindCSS

### 5.2 Enhance Visual Design
**Files**: `app/gamehub-player/src/pages/LandingPage.tsx`

**Required Changes**:
- [ ] Add hero section with game description
- [ ] Implement card-based layout for actions
- [ ] Add proper spacing and typography
- [ ] Include responsive design improvements
- [ ] Add subtle animations and transitions

### 5.3 Add Accessibility Features
**Files**: Multiple component files

**Required Steps**:
- [ ] Add proper ARIA labels and roles
- [ ] Implement keyboard navigation
- [ ] Add focus management
- [ ] Include screen reader support
- [ ] Test with accessibility tools

## Success Criteria
- [ ] Users can enter their name and have it persist across sessions
- [ ] Users can generate a 6-letter playground code and start a new playground
- [ ] Users can enter a valid 6-letter code and join an existing playground
- [ ] The interface is responsive and works on mobile devices
- [ ] All form validations work correctly with proper error messages
- [ ] Loading states provide clear feedback during operations
- [ ] The design follows GameHub's design system and is accessible

## Technical Requirements

### Data Models
```typescript
interface PlayerSession {
  name: string;
  sessionId: string;
  createdAt: Date;
}

interface Playground {
  code: string;
  players: PlayerSession[];
  games: Game[];
  challenges: Challenge[];
}

interface PlaygroundCodeInput {
  value: string;
  isValid: boolean;
  isChecking: boolean;
}
```

### API Endpoints
- `POST /api/playgrounds` - Create new playground
- `GET /api/playgrounds/:code` - Validate playground exists
- `POST /api/playgrounds/:code/join` - Join existing playground

### Component Structure
```
LandingPage/
├── NameEntryModal/
├── PlaygroundCodeInput/
├── ErrorAlert/
├── LoadingSpinner/
└── usePlayerSession (hook)
```

## Notes

1. **Session Management**: Player names will be stored in localStorage for persistence across browser sessions.

2. **Code Generation**: Playground codes will be 6 uppercase letters, generated server-side to ensure uniqueness.

3. **Validation**: Real-time validation will check playground code format and existence.

4. **Navigation**: Successful playground creation/joining will redirect to `/playground/:code`.

5. **Error Handling**: Clear error messages will be shown for invalid codes, network errors, and other issues.

6. **Accessibility**: All components will follow WCAG guidelines and include proper ARIA attributes.

7. **Responsive Design**: The landing page will work seamlessly on desktop, tablet, and mobile devices.

## Dependencies
- React Router DOM for navigation
- Jinaga for real-time data (future playground features)
- TailwindCSS for styling
- TypeScript for type safety
- Local storage for session persistence 