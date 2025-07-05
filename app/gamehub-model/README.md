# GameHub Model

This package contains the shared domain model for the GameHub application, built using Jinaga for distributed data management.

## Overview

The GameHub model defines the core domain concepts for managing game sessions, players, and participants in a multi-tenant gaming platform.

## Key Domain Transformations

This model was migrated from the LaunchKings model with the following domain concept transformations:

- **Event** → **GameSession**: Core gaming events are now called game sessions
- **Competitor** → **Player**: Entities competing in games are now players  
- **Attendee** → **Participant**: People participating in sessions are now participants
- **VoteAllocation** → **GameAction**: Actions taken during gameplay
- **EventState** → **SessionState**: State management for game sessions
- **Finalist** → **Winner**: Final results and winners

## Architecture

The model maintains the same architectural patterns as the source:

- **Dual build system**: Supports both ESM and CommonJS modules
- **TypeScript configuration**: Full TypeScript support with proper type definitions
- **Authorization rules**: Tenant-based access control with administrator permissions
- **Distribution rules**: Multi-tenant data distribution for scalability
- **Policy generation**: Automated generation of authorization and distribution policies

## Core Models

### GameHub Core (`model/gamehub.ts`)
- `Tenant`: Multi-tenant organization structure
- `Administrator`: Tenant administrators with management permissions
- `Player`: Game players/competitors
- `GameSession`: Individual gaming sessions/events
- `Participant`: Session participants
- `Winner`: Session winners and results

### Gameplay (`model/gameplay.ts`)
- `SessionState`: Game session state management
- `GameRound`: Individual rounds within sessions
- `GameAction`: Actions taken by participants
- `HeadToHeadWinners`: Round-based winner tracking
- `Champion`: Overall session champions

### Supporting Models
- **Bookkeeping** (`model/bookkeeping.ts`): Audit trails and service principals
- **Invitation** (`model/invitation.ts`): Invitation and approval workflows

## Usage

```typescript
import { model, authorization, distribution } from 'gamehub-model';

// Use the model in your Jinaga application
const j = JinagaBrowser.create({
  model,
  authorization,
  distribution
});
```

## Building

```bash
npm run build          # Build all formats
npm run build:esm      # Build ES modules
npm run build:cjs      # Build CommonJS modules
npm run build:types    # Build TypeScript definitions
```

## Policy Generation

```bash
npm run generate-policies
```

This generates authorization and distribution policies that can be used by Jinaga replicators.