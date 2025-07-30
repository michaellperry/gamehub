## Product Requirements Document: **Fleet Duel**

### Overview

Fleet Duel is a two-player online strategy game inspired by Battleship by Hasbro. Each player arranges a fleet of ships on a 10×10 grid and takes turns launching attacks to locate and destroy the opponent’s fleet. The game is played entirely in the browser with real-time updates and visual feedback.

---

### Ship Placement Phase

#### Interaction Flow

When the player joins a match, they are presented with a blank 10×10 grid labeled A-J (rows) and 1–10 (columns). A draggable interface allows the player to select ships from a fleet menu and place them onto the grid.

#### Fleet Composition

Each player must place the following ships:

* Carrier (5 units)
* Battleship (4 units)
* Cruiser (3 units)
* Submarine (3 units)
* Destroyer (2 units)

#### Controls

* **Place**: Drag a ship from the side panel onto the grid.
* **Rotate**: Click the ship or press 'R' while it's selected to rotate it between horizontal and vertical.
* **Move**: Drag a placed ship to a new location before locking in.

#### Validation Rules

* Ships must not overlap.
* Ships must stay entirely within the 10×10 grid.
* All five ships must be placed before the “Lock Fleet” button becomes active.
* Validation is enforced visually with red highlights for invalid placements and disabled locking if rules are violated.

#### Lock-In

Once all ships are validly placed, the player can press “Lock Fleet.” After locking, ships can no longer be moved or rotated, and the game transitions to the attack phase once both players are ready.

---

### Gameplay Phase

#### Turn Structure

* Players alternate turns.
* On their turn, a player selects one square on the opponent's hidden grid to attack.

#### Feedback

* The system immediately responds with a **Hit** or **Miss**.
* The attacking grid (upper grid) shows previous attacks marked by red (Hit) or white (Miss) pegs.
* The defending grid (lower grid) shows the player's own ships with incoming attacks overlaid as red or white indicators.

#### Rules

* Only one attack per turn.
* Players cannot re-target the same square.
* Turns are enforced sequentially; the UI disables input until it’s the player's turn.

---

### End Game

#### Victory Condition

A player wins when all of the opponent’s ship segments have been hit.

#### End Game Interface

* The screen announces “Victory” or “Defeat.”
* Option to view a summary:

  * Number of hits/misses
  * Turns taken
  * Ship survival status
* Option to **End Game and Return to Playground**.

---

### Technical Notes (Browser Experience)

* Responsive layout supports desktop and tablet.
* Clear visual design: dual-grid display, intuitive drag-and-drop, and strong color cues for feedback.
