import { j } from '@/jinaga-config';
import { Game, Move, model, PlayerName, Playground } from '@model/model';
import { useSpecification } from 'jinaga-react';
import { Jinaga } from 'jinaga';
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
export type GameResult = 'won' | 'lost' | 'drawn' | 'ongoing' | 'completed';

export interface GameData {
    game: Game;
    gameId: string;
    challengerName: string | null;
    opponentName: string | null;
    challengerStarts: boolean;
    currentPlayerRole: PlayerRole;
    isCurrentPlayerTurn: boolean;
    gameResult: GameResult;
    createdAt: Date;
    moves: Move[];
    ticTacToeState: TicTacToeState;
    makeMove: (position: number) => Promise<{ success: boolean; error?: string }>;
}

export interface GameViewModel {
    data: GameData | null;
    isLoading: boolean;
    error: string | null;
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
    return {
        data: null,
        isLoading: false,
        error,
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
        return 'completed';
    }

    // Check if current player won
    if (ticTacToeState.winner === currentPlayerRole) {
        return 'won';
    }

    // Current player lost
    return 'lost';
}

// Helper function to compute player role
export function computePlayerRole(
    currentPlayerId: string | null,
    challengerPlayerId: string,
    opponentPlayerId: string,
    challengerStarts: boolean
): PlayerRole {
    if (!currentPlayerId) return 'observer';

    // Determine who plays X and who plays O based on challengerStarts
    const xPlayerId = challengerStarts ? challengerPlayerId : opponentPlayerId;
    const oPlayerId = challengerStarts ? opponentPlayerId : challengerPlayerId;

    if (currentPlayerId === xPlayerId) return 'X';
    if (currentPlayerId === oPlayerId) return 'O';
    return 'observer';
}

// Helper function to compute if it's the current player's turn
function computeIsCurrentPlayerTurn(
    currentPlayerId: string | null,
    challengerPlayerId: string,
    opponentPlayerId: string,
    movesLength: number,
    challengerStarts: boolean
): boolean {
    if (!currentPlayerId) return false;

    // Determine who plays X and who plays O based on challengerStarts
    const xPlayerId = challengerStarts ? challengerPlayerId : opponentPlayerId;
    const oPlayerId = challengerStarts ? opponentPlayerId : challengerPlayerId;

    // X always goes first, so even moves (0, 2, 4...) are X's turns
    const isXTurn = movesLength % 2 === 0;
    const isCurrentPlayerX = currentPlayerId === xPlayerId;
    const isCurrentPlayerO = currentPlayerId === oPlayerId;

    return (isXTurn && isCurrentPlayerX) || (!isXTurn && isCurrentPlayerO);
}

// Helper function to create move validation and execution
function createMakeMoveFunction(
    currentPlayerId: string | null,
    gameProjection: GameProjection,
    moves: Move[],
    ticTacToeState: TicTacToeState,
    jinaga: Jinaga
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
        const xPlayerId = gameProjection.challengerStarts ? gameProjection.challengerPlayerId : gameProjection.opponentPlayerId;
        const oPlayerId = gameProjection.challengerStarts ? gameProjection.opponentPlayerId : gameProjection.challengerPlayerId;

        const isXTurn = moves.length % 2 === 0; // X always goes first
        const isCurrentPlayerX = currentPlayerId === xPlayerId;
        const isCurrentPlayerO = currentPlayerId === oPlayerId;
        const isCurrentPlayerTurn = (isXTurn && isCurrentPlayerX) || (!isXTurn && isCurrentPlayerO);

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
            await jinaga.fact(new Move(
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
 * @param jinaga - The Jinaga instance to use for queries and mutations
 * @param playground - The playground fact
 * @param gameId - The hash ID of the game to find
 * @param currentPlayerId - The ID of the current player viewing the game
 * @returns GameViewModel with game details and loading state
 */
export function useGame(
    jinaga: Jinaga,
    playground: Playground | null,
    gameId: string | null,
    currentPlayerId: string | null
): GameViewModel {
    const { data: gameProjections, loading: gameLoading, error: gameError } = useSpecification(jinaga, gameSpec, playground);

    // Find the specific game by ID
    const gameProjection = gameProjections?.find(projection => projection.gameId === gameId);

    // Get moves for the specific game if found
    const { data: movesProjections, loading: movesLoading, error: movesError } = useSpecification(jinaga, movesSpec, gameProjection?.game || null);

    // Early returns for error states
    if (!playground || !gameId) {
        return createDefaultGameState();
    }

    const isLoading = gameLoading || movesLoading;
    const error = gameError || movesError;

    if (isLoading) {
        return {
            data: null,
            isLoading: true,
            error: null,
        };
    }

    if (error) {
        return createDefaultGameState(error.message);
    }

    if (!gameProjection) {
        const errorMessage = `Game with ID ${gameId} not found in playground ${playground.code}. Available game IDs: ${gameProjections?.map(p => p.gameId).join(', ') || 'none'}`;
        return createDefaultGameState(errorMessage);
    }

    // Extract moves from the moves projections
    const moves = movesProjections?.map(projection => projection.move) || [];

    const ticTacToeState = computeTicTacToeState(
        moves,
        gameProjection.challengerPlayerId,
        gameProjection.opponentPlayerId,
        gameProjection.challengerStarts
    );

    const currentPlayerRole = computePlayerRole(
        currentPlayerId,
        gameProjection.challengerPlayerId,
        gameProjection.opponentPlayerId,
        gameProjection.challengerStarts
    );

    const isCurrentPlayerTurn = computeIsCurrentPlayerTurn(
        currentPlayerId,
        gameProjection.challengerPlayerId,
        gameProjection.opponentPlayerId,
        moves.length,
        gameProjection.challengerStarts
    );

    const makeMove = createMakeMoveFunction(
        currentPlayerId,
        gameProjection,
        moves,
        ticTacToeState,
        jinaga
    );

    return {
        data: {
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
            makeMove,
        },
        isLoading: false,
        error: null,
    };
} 