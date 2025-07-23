# Product Requirements Document (PRD): Multiplayer Tic-Tac-Toe Playground

## Overview

This product is a real-time, browser-based multiplayer Tic-Tac-Toe platform. Users can create or join a playground via a shared six-letter code. Within a playground, users see each other, initiate challenges, and play multiple games concurrently. The gameplay experience should be smooth, intuitive, and engaging.

---

## Goals

* Enable lightweight multiplayer gameplay with minimal setup
* Support multiple concurrent games within the same playground
* Provide a responsive and intuitive user interface
* Ensure real-time synchronization of player presence, game state, and challenges

---

## User Roles

* **Guest Player**: A user who joins via a browser session
* **Active Player**: A guest who has joined a playground
* **Opponent**: Another player within the same playground

No login system is required; player identity is session-based and name-based.

---

## Information Architecture

### Routes

* `/` : Landing Page
* `/playground/:code` : Playground Lobby
* `/game/:gameId` : Individual Game View

### Entities

* **Playground**

  * Code (6 uppercase letters)
  * List of connected players (names, session IDs)
  * List of active games (IDs, participants, state)
  * Pending challenges (fromPlayer, toPlayer)

* **Game**

  * Unique ID
  * Player X and Player O (name, session ID)
  * Game state (board, turn, result)
  * Status (waiting, in-progress, finished)

---

## User Experience

### Landing Page (`/`)

* Two main sections:
  * **Start Playground**: Button that generates 6-letter code and redirects to `/playground/:code`
  * **Join Playground**: Input field for 6-letter code with "Join Playground" button
* The "Join Playground" button is only enabled when a valid 6-letter code is entered
* When "Join Playground" is pressed, it validates the code and redirects to `/playground/:code` if valid

### Name Entry Flow (On Landing Page)

1. Upon first visit to the landing page, user is prompted to enter their name
2. Name is required before they can start or join a playground
3. After entering a name, the user can proceed with either starting or joining a playground
4. The name is stored in session/localStorage for future visits

### Playground Lobby (`/playground/:code`)

* Display the 6-letter code prominently
* Show a live list of connected players (names)
* Each player name has a "Challenge" button (disabled if already in game or challenged)
* Incoming challenges show as pop-ups with Accept / Decline
* List of active games with status:

  * Game ID or short label
  * Player X vs Player O
  * Button to Join or Watch

### Challenge Flow

* Player A clicks "Challenge" on Player B
* Player A sees a modal asking whether they will start or allow the opponent to start
* Player A makes a selection and dismisses the modal
* Player A sees an indicator on Player B's card that the challenge was issued

* Player B sees a modal with Accept/Decline
* On Accept:

  * New game is created
  * Both players are redirected to `/game/:gameId`
* On Decline:

  * Modal closes; Player A sees that the challenge was declined

### Game View (`/game/:gameId`)

* Header with player names and roles (X vs O)
* 3x3 grid for Tic-Tac-Toe
* Turn indicator
* On-click for available cells places X or O
* Live game state updates via WebSocket or real-time backend
* End conditions:

  * Win: line of 3 X or O
  * Draw: all cells filled, no winner
* Display result with option to return to playground

---

## Game Rules

* First player to move is X (can alternate in future versions)
* Players can only click during their turn
* Only unoccupied cells are clickable
* Once game is won or drawn, the board becomes static

---

## Real-Time Interaction

* Use Jinaga as a real-time backend to:

  * Sync player lists in playground
  * Update challenge status instantly
  * Broadcast game state changes

---

## Edge Cases

* Player disconnects during a game:

  * Show "Disconnected" indicator
  * Option to return to playground
* Refresh during a game:

  * Attempt to restore game via session/localStorage and game ID
* Playground creator leaves:

  * Playground remains active

## Non-Functional Requirements

* Fast load time
* Mobile-friendly layout
* Clear, friendly error handling

---

---

##
