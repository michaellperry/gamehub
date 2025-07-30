// Game type enumeration
export type GameType = 'tic-tac-toe' | 'fleet-duel' | 'unknown';

// Game type detection hook
export function useGameType(gameData: any): GameType {
    if (!gameData) {
        return 'unknown';
    }

    // Check for TicTacToe specific properties
    if (gameData.ticTacToeState && gameData.ticTacToeState.board) {
        return 'tic-tac-toe';
    }

    // Check for Fleet Duel specific properties
    if (gameData.fleetDuelState) {
        return 'fleet-duel';
    }

    // Default to tic-tac-toe for backward compatibility
    // This assumes existing games without explicit type are tic-tac-toe
    if (gameData.currentPlayerRole && gameData.gameResult !== undefined) {
        return 'tic-tac-toe';
    }

    return 'unknown';
}

export type { GameType };