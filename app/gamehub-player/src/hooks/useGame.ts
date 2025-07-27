import { j } from '@/jinaga-config';
import { Game, Move, model, PlayerName, Playground } from '@model/model';
import { useSpecification } from 'jinaga-react';
import { computeTicTacToeState, TicTacToeState } from '@/utils/ticTacToe';

// Type for the game projection returned by gameSpec
type GameProjection = {
    gameId: string;
    game: Game;
    opponentPlayerId: string;
    opponentNames: string[];
    challengerPlayerId: string;
    challengerNames: string[];
    challengerStarts: boolean;
};

export type PlayerRole = 'X' | 'O' | 'observer';
export type GameResult = 'won' | 'lost' | 'drawn' | 'ongoing';

export interface GameViewModel {
    game: Game | null;
    gameId: string | null;
    challengerName: string | null;
    opponentName: string | null;
    challengerStarts: boolean | null;
    currentPlayerRole: PlayerRole;
    isCurrentPlayerTurn: boolean;
    gameResult: GameResult;
    createdAt: Date | null;
    moves: Move[];
    ticTacToeState: TicTacToeState;
    isLoading: boolean;
    error: string | null;
    makeMove: (position: number) => Promise<{ success: boolean; error?: string }>;
}

const gameSpec = model.given(Playground).match((playground) => Game.in(playground)
    .selectMany(game => game.challenge.predecessor()
        .selectMany(challenge => challenge.opponentJoin.player.predecessor()
            .selectMany(opponentPlayer => challenge.challengerJoin.player.predecessor()
                .select(challengerPlayer => ({
                    gameId: j.hash(game),
                    game,
                    opponentPlayerId: j.hash(opponentPlayer),
                    opponentNames: PlayerName.current(opponentPlayer).select(name => name.name),
                    challengerPlayerId: j.hash(challengerPlayer),
                    challengerNames: PlayerName.current(challengerPlayer).select(name => name.name),
                    challengerStarts: challenge.challengerStarts,
                }))
            ))
    )
);

const movesSpec = model.given(Game).match((game) => Move.in(game)
    .select(move => ({
        moveId: j.hash(move),
        index: move.index,
        position: move.position,
        move,
    }))
);

// Helper function to create default game state
function createDefaultGameState(error: string | null = null): GameViewModel {
    const defaultTicTacToeState: TicTacToeState = {
        board: Array(9).fill(null),
        currentPlayer: 'X',
        currentPlayerId: null,
        challengerPlayerId: null,
        opponentPlayerId: null,
        winner: null,
        winnerPlayerId: null,
        isGameOver: false,
    };

    return {
        game: null,
        gameId: null,
        challengerName: null,
        opponentName: null,
        challengerStarts: null,
        currentPlayerRole: 'observer',
        isCurrentPlayerTurn: false,
        gameResult: 'ongoing',
        createdAt: null,
        moves: [],
        ticTacToeState: defaultTicTacToeState,
        isLoading: false,
        error,
        makeMove: async () => ({ success: false, error: error || 'Game not available' }),
    };
}

// Helper function to compute game result from current player's perspective
function computeGameResult(
    currentPlayerRole: PlayerRole,
    ticTacToeState: TicTacToeState
): GameResult {
    if (!ticTacToeState.isGameOver) {
        return 'ongoing';
    }

    if (ticTacToeState.winner === 'draw') {
        return 'drawn';
    }

    if (currentPlayerRole === 'observer') {
        return 'ongoing'; // Observers don't have a result
    }

    // Check if current player won
    if (ticTacToeState.winner === currentPlayerRole) {
        return 'won';
    }

    // Current player lost
    return 'lost';
}

// Helper function to compute player role
function computePlayerRole(currentPlayerId: string | null, challengerPlayerId: string, opponentPlayerId: string): PlayerRole {
    if (!currentPlayerId) return 'observer';

    if (currentPlayerId === challengerPlayerId) return 'X';
    if (currentPlayerId === opponentPlayerId) return 'O';
    return 'observer';
}

// Helper function to compute if it's the current player's turn
function computeIsCurrentPlayerTurn(
    currentPlayerId: string | null,
    challengerPlayerId: string,
    opponentPlayerId: string,
    movesLength: number
): boolean {
    if (!currentPlayerId) return false;

    const isChallengerTurn = movesLength % 2 === 0; // Even moves = challenger (X), odd moves = opponent (O)
    const isCurrentPlayerChallenger = currentPlayerId === challengerPlayerId;
    const isCurrentPlayerOpponent = currentPlayerId === opponentPlayerId;

    return (isChallengerTurn && isCurrentPlayerChallenger) || (!isChallengerTurn && isCurrentPlayerOpponent);
}

// Helper function to create move validation and execution
function createMakeMoveFunction(
    currentPlayerId: string | null,
    gameProjection: GameProjection,
    moves: Move[],
    ticTacToeState: TicTacToeState
) {
    return async (position: number) => {
        if (!currentPlayerId) {
            return { success: false, error: 'You are not logged in' };
        }

        if (!gameProjection?.game) {
            return { success: false, error: 'Game not found' };
        }

        // Validate position
        if (position < 0 || position > 8) {
            return { success: false, error: 'Invalid position. Must be between 0 and 8' };
        }

        // Check if it's the current player's turn
        const isChallengerTurn = moves.length % 2 === 0;
        const isCurrentPlayerChallenger = currentPlayerId === gameProjection.challengerPlayerId;
        const isCurrentPlayerOpponent = currentPlayerId === gameProjection.opponentPlayerId;
        const isCurrentPlayerTurn = (isChallengerTurn && isCurrentPlayerChallenger) || (!isChallengerTurn && isCurrentPlayerOpponent);

        if (!isCurrentPlayerTurn) {
            return { success: false, error: 'It is not your turn' };
        }

        // Check if game is over
        if (ticTacToeState.isGameOver) {
            return { success: false, error: 'Game is already over' };
        }

        // Check if position is empty
        if (ticTacToeState.board[position] !== null) {
            return { success: false, error: 'Position already occupied' };
        }

        try {
            // Create the Move fact
            await j.fact(new Move(
                gameProjection.game,
                moves.length, // index
                position
            ));
            return { success: true };
        } catch (e) {
            console.error('Error making move:', e);
            return { success: false, error: 'Failed to make move' };
        }
    };
}

/**
 * Hook for retrieving a specific game by ID within a playground
 * @param playground - The playground fact
 * @param gameId - The hash ID of the game to find
 * @param currentPlayerId - The ID of the current player viewing the game
 * @returns GameViewModel with game details and loading state
 */
export function useGame(playground: Playground | null, gameId: string | null, currentPlayerId: string | null): GameViewModel {
    const { data: gameProjections, loading: gameLoading, error: gameError } = useSpecification(j, gameSpec, playground);

    // Find the specific game by ID
    const gameProjection = gameProjections?.find(projection => projection.gameId === gameId);

    // Get moves for the specific game if found
    const { data: movesProjections, loading: movesLoading, error: movesError } = useSpecification(j, movesSpec, gameProjection?.game || null);

    // Early returns for error states
    if (!playground || !gameId) {
        return createDefaultGameState();
    }

    const isLoading = gameLoading || movesLoading;
    const error = gameError || movesError;

    if (isLoading) {
        const loadingState = createDefaultGameState();
        loadingState.isLoading = true;
        loadingState.makeMove = async () => ({ success: false, error: 'Loading game' });
        return loadingState;
    }

    if (error) {
        return createDefaultGameState(error.message);
    }

    if (!gameProjection) {
        const errorMessage = `Game with ID ${gameId} not found in playground ${playground.code}`;
        return createDefaultGameState(errorMessage);
    }

    // Extract moves from the moves projections
    const moves = movesProjections?.map(projection => projection.move) || [];

    const ticTacToeState = computeTicTacToeState(
        moves,
        gameProjection.challengerPlayerId,
        gameProjection.opponentPlayerId,
        currentPlayerId
    );

    const currentPlayerRole = computePlayerRole(
        currentPlayerId,
        gameProjection.challengerPlayerId,
        gameProjection.opponentPlayerId
    );

    const isCurrentPlayerTurn = computeIsCurrentPlayerTurn(
        currentPlayerId,
        gameProjection.challengerPlayerId,
        gameProjection.opponentPlayerId,
        moves.length
    );

    const makeMove = createMakeMoveFunction(
        currentPlayerId,
        gameProjection,
        moves,
        ticTacToeState
    );

    return {
        game: gameProjection.game,
        gameId: gameProjection.gameId,
        challengerName: gameProjection.challengerNames[0] || null,
        opponentName: gameProjection.opponentNames[0] || null,
        challengerStarts: gameProjection.challengerStarts,
        currentPlayerRole,
        isCurrentPlayerTurn,
        gameResult: computeGameResult(currentPlayerRole, ticTacToeState),
        createdAt: typeof gameProjection.game.challenge.createdAt === 'string'
            ? new Date(gameProjection.game.challenge.createdAt)
            : gameProjection.game.challenge.createdAt,
        moves,
        ticTacToeState,
        isLoading: false,
        error: null,
        makeMove,
    };
} 