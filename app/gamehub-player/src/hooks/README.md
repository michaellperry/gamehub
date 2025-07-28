# GameHub Player Hooks

This directory contains custom React hooks for the GameHub player application.

## useGame Hook

The `useGame` hook retrieves a specific game by its hash ID within a playground.

### Usage

```typescript
import { useGame } from './hooks/useGame';
import { usePlayground } from './hooks/usePlayground';

function GamePage() {
    const { code } = useParams<{ code: string }>();
    const { gameId } = useParams<{ gameId: string }>();
    
    const playground = usePlayground(code);
    const game = useGame(playground.playground, gameId);
    
    if (game.isLoading) {
        return <div>Loading game...</div>;
    }
    
    if (game.error) {
        return <div>Error: {game.error}</div>;
    }
    
    if (!game.game) {
        return <div>Game not found</div>;
    }
    
    return (
        <div>
            <h1>{game.challengerName} vs {game.opponentName}</h1>
            <p>Game ID: {game.gameId}</p>
            <p>Challenger starts: {game.challengerStarts ? 'Yes' : 'No'}</p>
        </div>
    );
}
```

### Interface

```typescript
interface GameViewModel {
    game: Game | null;           // The Game fact if found
    gameId: string | null;       // The hash ID of the game
    challengerName: string | null; // Name of the challenger player
    opponentName: string | null;   // Name of the opponent player
    challengerStarts: boolean | null; // Whether challenger starts first
    createdAt: Date | null;      // When the game was created
    isLoading: boolean;          // Loading state
    error: string | null;        // Error message if any
}
```

### Parameters

- `playground: Playground | null` - The playground fact to search in
- `gameId: string | null` - The hash ID of the game to find

### Behavior

- Returns null data when playground or gameId is null
- Shows loading state while fetching data
- Returns error message if game is not found
- Uses Jinaga specification to efficiently query games in the playground
- Projects player names using the PlayerName.current() helper

### Implementation Details

The hook uses a Jinaga specification that:
1. Gets all games in the playground using `Game.in(playground)`
2. Projects the game hash ID using `j.hash(game)`
3. Retrieves player names using `PlayerName.current()`
4. Includes challenge metadata like `challengerStarts` and `createdAt`

The specification efficiently handles the fact relationships and provides all necessary data for the game view model. 