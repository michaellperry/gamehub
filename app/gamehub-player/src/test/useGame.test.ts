import { Challenge, Draw, Game, Join, model, Move, Player, PlayerName, Playground, Tenant, Win } from '@model/model';
import { renderHook, waitFor } from '@testing-library/react';
import { Jinaga, User } from 'jinaga';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { computePlayerRole, useGame } from '../hooks/useGame';
import { JinagaTestUtils, TestScenarios } from './jinaga-test-utils';

// Mock the configuration to control test behavior
vi.mock('../config/background-service', () => ({
    playerSessionConfig: {
        enabled: true,
        minDelay: 100,
        maxDelay: 200,
    },
}));

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
    console.log = vi.fn();
    console.error = vi.fn();
});

afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
});

// Test constants
const TEST_CONSTANTS = {
    PLAYGROUND_CODE: 'ABCDEF',
    PLAYER_NAMES: {
        CHALLENGER: 'ChallengerPlayer',
        OPPONENT: 'OpponentPlayer',
        OBSERVER: 'ObserverPlayer'
    },
    USER_KEYS: {
        CHALLENGER: 'challenger-user-key',
        OPPONENT: 'opponent-user-key',
        OBSERVER: 'observer-user-key'
    }
} as const;

const createSpecificTestUsers = (): { challenger: User; opponent: User } => {
    return {
        challenger: new User(TEST_CONSTANTS.USER_KEYS.CHALLENGER),
        opponent: new User(TEST_CONSTANTS.USER_KEYS.OPPONENT)
    };
};

const createThreeTestUsers = (): { challenger: User; opponent: User; observer: User } => {
    return {
        challenger: new User(TEST_CONSTANTS.USER_KEYS.CHALLENGER),
        opponent: new User(TEST_CONSTANTS.USER_KEYS.OPPONENT),
        observer: new User(TEST_CONSTANTS.USER_KEYS.OBSERVER)
    };
};

const createTwoTestUsers = (): { challenger: User; opponent: User } => {
    return {
        challenger: new User(TEST_CONSTANTS.USER_KEYS.CHALLENGER),
        opponent: new User(TEST_CONSTANTS.USER_KEYS.OPPONENT)
    };
};

// Type definitions for setup functions
type GameSetup = {
    jinaga: Jinaga;
    tenant: Tenant;
    playground: Playground;
    game: Game;
    challengerPlayer: Player;
    opponentPlayer: Player;
    challengerJoin: Join;
    opponentJoin: Join;
    challenge: Challenge;
    gameId: string;
};

type ObserverSetup = {
    jinaga: Jinaga;
    tenant: Tenant;
    playground: Playground;
    game: Game;
    challengerPlayer: Player;
    opponentPlayer: Player;
    observerPlayer: Player;
    challengerJoin: Join;
    opponentJoin: Join;
    observerJoin: Join;
    challenge: Challenge;
    gameId: string;
};

// Common test setup functions
const createGameSetup = async (users: User[], challengerStarts: boolean = true): Promise<GameSetup> => {
    const { jinaga, tenant } = await TestScenarios.multipleUsersInTenant(users);

    // Create players
    const challengerPlayer = await jinaga.fact(new Player(users[0], tenant));
    const opponentPlayer = await jinaga.fact(new Player(users[1], tenant));

    // Create player names
    await jinaga.fact(new PlayerName(challengerPlayer, TEST_CONSTANTS.PLAYER_NAMES.CHALLENGER, []));
    await jinaga.fact(new PlayerName(opponentPlayer, TEST_CONSTANTS.PLAYER_NAMES.OPPONENT, []));

    // Create playground
    const playground: Playground = await jinaga.fact(new Playground(tenant, TEST_CONSTANTS.PLAYGROUND_CODE));

    // Create joins
    const challengerJoin = await jinaga.fact(new Join(challengerPlayer, playground, new Date()));
    const opponentJoin = await jinaga.fact(new Join(opponentPlayer, playground, new Date()));

    // Create challenge
    const challenge = await jinaga.fact(new Challenge(
        challengerJoin,
        opponentJoin,
        challengerStarts,
        new Date()
    ));

    // Create game
    const game: Game = await jinaga.fact(new Game(challenge));
    const gameId: string = jinaga.hash(game);

    return {
        jinaga,
        tenant,
        playground,
        game,
        challengerPlayer,
        opponentPlayer,
        challengerJoin,
        opponentJoin,
        challenge,
        gameId
    };
};

const createObserverSetup = async (): Promise<ObserverSetup> => {
    const { challenger, opponent, observer } = createThreeTestUsers();
    const { jinaga, tenant } = await TestScenarios.multipleUsersInTenant([
        challenger,
        opponent,
        observer
    ]);

    // Create players including observer
    const challengerPlayer: Player = await jinaga.fact(new Player(challenger, tenant));
    const opponentPlayer: Player = await jinaga.fact(new Player(opponent, tenant));
    const observerPlayer: Player = await jinaga.fact(new Player(observer, tenant));

    // Create player names
    await jinaga.fact(new PlayerName(challengerPlayer, TEST_CONSTANTS.PLAYER_NAMES.CHALLENGER, []));
    await jinaga.fact(new PlayerName(opponentPlayer, TEST_CONSTANTS.PLAYER_NAMES.OPPONENT, []));
    await jinaga.fact(new PlayerName(observerPlayer, TEST_CONSTANTS.PLAYER_NAMES.OBSERVER, []));

    // Create playground
    const playground: Playground = await jinaga.fact(new Playground(tenant, TEST_CONSTANTS.PLAYGROUND_CODE));

    // Create joins
    const challengerJoin: Join = await jinaga.fact(new Join(challengerPlayer, playground, new Date()));
    const opponentJoin: Join = await jinaga.fact(new Join(opponentPlayer, playground, new Date()));
    const observerJoin: Join = await jinaga.fact(new Join(observerPlayer, playground, new Date()));

    // Create challenge
    const challenge: Challenge = await jinaga.fact(new Challenge(
        challengerJoin,
        opponentJoin,
        true,
        new Date()
    ));

    // Create game
    const game: Game = await jinaga.fact(new Game(challenge));
    const gameId: string = jinaga.hash(game);

    return {
        jinaga,
        tenant,
        playground,
        game,
        challengerPlayer,
        opponentPlayer,
        observerPlayer,
        challengerJoin,
        opponentJoin,
        observerJoin,
        challenge,
        gameId
    };
};

// Helper function to render useGame hook with common setup
const renderUseGame = async (
    setup: GameSetup,
    playerHash: string
) => {
    const { result } = renderHook(() => useGame(
        setup.jinaga,
        setup.playground,
        setup.gameId,
        playerHash
    ));

    await waitFor(() => {
        expect(result.current.data).not.toBeNull();
    });

    return result;
};

describe('useGame', () => {
    describe('Player Role Assignment', () => {


        it('should correctly assign X role when player hash is used', async () => {
            // Create test setup with two players
            const { challenger, opponent } = createSpecificTestUsers();
            const setup = await createGameSetup([challenger, opponent], true);

            // Test with challenger player hash
            const result = await renderUseGame(setup, setup.jinaga.hash(setup.challengerPlayer));

            // When challengerStarts=true, challenger plays X and goes first
            expect(result.current.data?.currentPlayerRole).toBe('X');
            expect(result.current.data?.challengerName).toBe(TEST_CONSTANTS.PLAYER_NAMES.CHALLENGER);
            expect(result.current.data?.opponentName).toBe(TEST_CONSTANTS.PLAYER_NAMES.OPPONENT);
            expect(result.current.data?.challengerStarts).toBe(true);
            expect(result.current.data?.isCurrentPlayerTurn).toBe(true); // X goes first
        });



        it('should test individual role assignment functions', async () => {
            // Create test setup
            const { challenger, opponent } = createSpecificTestUsers();
            const setup = await createGameSetup([challenger, opponent], true);

            const challengerPlayerId = setup.jinaga.hash(setup.challengerPlayer);
            const opponentPlayerId = setup.jinaga.hash(setup.opponentPlayer);

            // Test role assignment when challengerStarts is true
            const challengerRole = computePlayerRole(challengerPlayerId, challengerPlayerId, opponentPlayerId, true);
            const opponentRole = computePlayerRole(opponentPlayerId, challengerPlayerId, opponentPlayerId, true);

            expect(challengerRole).toBe('X');
            expect(opponentRole).toBe('O');

            // Test role assignment when challengerStarts is false
            const challengerRole2 = computePlayerRole(challengerPlayerId, challengerPlayerId, opponentPlayerId, false);
            const opponentRole2 = computePlayerRole(opponentPlayerId, challengerPlayerId, opponentPlayerId, false);

            expect(challengerRole2).toBe('O');
            expect(opponentRole2).toBe('X');
        });

        it('should correctly assign O role for opponent when challengerStarts is true', async () => {
            // Create test setup with two players
            const { challenger, opponent } = createSpecificTestUsers();
            const setup = await createGameSetup([challenger, opponent], true);

            // Test with opponent player hash
            const result = await renderUseGame(setup, setup.jinaga.hash(setup.opponentPlayer));

            // When challengerStarts=true, opponent plays O and doesn't go first
            expect(result.current.data?.currentPlayerRole).toBe('O');
            expect(result.current.data?.challengerName).toBe(TEST_CONSTANTS.PLAYER_NAMES.CHALLENGER);
            expect(result.current.data?.opponentName).toBe(TEST_CONSTANTS.PLAYER_NAMES.OPPONENT);
            expect(result.current.data?.challengerStarts).toBe(true);
            expect(result.current.data?.isCurrentPlayerTurn).toBe(false); // O doesn't go first
        });
    });

    describe('Game Logic and Turn Management', () => {
        it('should handle challengerStarts=false correctly (opponent should be X)', async () => {
            // Create test setup with two players
            const { challenger, opponent } = createSpecificTestUsers();
            const setup = await createGameSetup([challenger, opponent], false);

            // Test with opponent player hash - should be X and go first
            const result = await renderUseGame(setup, setup.jinaga.hash(setup.opponentPlayer));

            // When challengerStarts=false, opponent plays X and goes first
            expect(result.current.data?.currentPlayerRole).toBe('X');
            expect(result.current.data?.isCurrentPlayerTurn).toBe(true);
            expect(result.current.data?.challengerStarts).toBe(false);
        });

        it('should handle challengerStarts=false correctly (challenger should be O)', async () => {
            // Create test setup with two players
            const { challenger, opponent } = createSpecificTestUsers();
            const setup = await createGameSetup([challenger, opponent], false);

            // Test with challenger player hash - should be O and not go first
            const result = await renderUseGame(setup, setup.jinaga.hash(setup.challengerPlayer));

            // When challengerStarts=false, challenger plays O and doesn't go first
            expect(result.current.data?.currentPlayerRole).toBe('O');
            expect(result.current.data?.isCurrentPlayerTurn).toBe(false);
            expect(result.current.data?.challengerStarts).toBe(false);
        });
    });

    describe('Move Validation and Game State', () => {
        it('should prevent moves when player is observer', async () => {
            // Create test setup with observer
            const setup = await createObserverSetup();

            // Test with observer player hash
            const result = await renderUseGame(setup, setup.jinaga.hash(setup.observerPlayer));

            expect(result.current.data?.currentPlayerRole).toBe('observer');
            expect(result.current.data?.isCurrentPlayerTurn).toBe(false);

            // Try to make a move as observer
            const moveResult = await result.current.data?.makeMove(0);
            expect(moveResult?.success).toBe(false);
            expect(moveResult?.error).toBe('It is not your turn');
        });

        it('should prevent moves when it is not the player\'s turn', async () => {
            // Create test setup with two players
            const { challenger, opponent } = createSpecificTestUsers();
            const setup = await createGameSetup([challenger, opponent], true);

            // Test with opponent player hash (should not be their turn)
            const result = await renderUseGame(setup, setup.jinaga.hash(setup.opponentPlayer));

            expect(result.current.data?.currentPlayerRole).toBe('O');
            expect(result.current.data?.isCurrentPlayerTurn).toBe(false);

            // Try to make a move when it's not the player's turn
            const moveResult = await result.current.data?.makeMove(0);
            expect(moveResult?.success).toBe(false);
            expect(moveResult?.error).toBe('It is not your turn');
        });

        it('should allow valid moves when it is the player\'s turn', async () => {
            // Create test setup with two players
            const { challenger, opponent } = createSpecificTestUsers();
            const setup = await createGameSetup([challenger, opponent], true);

            // Test with challenger player hash (should be their turn)
            const result = await renderUseGame(setup, setup.jinaga.hash(setup.challengerPlayer));

            expect(result.current.data?.currentPlayerRole).toBe('X');
            expect(result.current.data?.isCurrentPlayerTurn).toBe(true);

            // Make a valid move
            const moveResult = await result.current.data?.makeMove(0);
            expect(moveResult?.error).toBeUndefined();
            expect(moveResult?.success).toBe(true);
        });
    });

    describe('Game State and Board Management', () => {
        it('should correctly track moves and update board state', async () => {
            // Create test setup with two players
            const { challenger, opponent } = createSpecificTestUsers();
            const setup = await createGameSetup([challenger, opponent], true);

            // Test with challenger player hash
            const result = await renderUseGame(setup, setup.jinaga.hash(setup.challengerPlayer));

            // Initial state
            expect(result.current.data?.moves.length).toBe(0);
            expect(result.current.data?.ticTacToeState.board).toEqual(Array(9).fill(null));
            expect(result.current.data?.ticTacToeState.nextPlayer).toBe('X');

            // Make a move
            const moveResult = await result.current.data?.makeMove(0);
            expect(moveResult?.error).toBeUndefined();
            expect(moveResult?.success).toBe(true);

            // Wait for the move to be processed
            await waitFor(() => {
                expect(result.current.data?.moves.length).toBe(1);
            });

            // Check that the board was updated
            expect(result.current.data?.ticTacToeState.board[0]).toBe('X');
            expect(result.current.data?.ticTacToeState.nextPlayer).toBe('O');
        });

        it('should prevent moves on occupied positions', async () => {
            // Create test setup with two players
            const { challenger, opponent } = createSpecificTestUsers();
            const setup = await createGameSetup([challenger, opponent], true);

            // Test with challenger player hash
            const result = await renderUseGame(setup, setup.jinaga.hash(setup.challengerPlayer));

            // Make first move
            const moveResult1 = await result.current.data?.makeMove(0);
            expect(moveResult1?.error).toBeUndefined();
            expect(moveResult1?.success).toBe(true);

            // Wait for the move to be processed and state to update
            await waitFor(() => {
                expect(result.current.data?.moves.length).toBe(1);
            });

            // Switch to opponent's turn and try to make a move on the same position
            const opponentResult = await renderUseGame(setup, setup.jinaga.hash(setup.opponentPlayer));

            // Wait for the opponent's view to load
            await waitFor(() => {
                expect(opponentResult.current.data).not.toBeNull();
            });

            // Try to make a move on the same position as opponent
            const moveResult2 = await opponentResult.current.data?.makeMove(0);
            expect(moveResult2?.success).toBe(false);
            expect(moveResult2?.error).toBe('Position already occupied');
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle invalid game ID gracefully', async () => {
            const { tenant } = await TestScenarios.singleUserWithTenant(
                new User('test-user-key')
            );

            const playground = await JinagaTestUtils.createTestInstanceWithTenant(
                new User('test-user-key')
            ).then(result => result.jinaga.fact(new Playground(tenant, TEST_CONSTANTS.PLAYGROUND_CODE)));

            const jinagaInstance = await JinagaTestUtils.createTestInstanceWithTenant(
                new User('test-user-key')
            ).then(result => result.jinaga);

            const { result } = renderHook(() => useGame(
                jinagaInstance,
                playground,
                'invalid-game-id',
                'test-player-id'
            ));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.error).toBe(`Game with ID invalid-game-id not found in playground ${TEST_CONSTANTS.PLAYGROUND_CODE}. Available game IDs: none`);
            expect(result.current.data).toBe(null);
        });

        it('should handle null playground gracefully', async () => {
            const jinagaInstance = await JinagaTestUtils.createTestInstanceWithTenant(
                new User('test-user-key')
            ).then(result => result.jinaga);

            const { result } = renderHook(() => useGame(
                jinagaInstance,
                null,
                'test-game-id',
                'test-player-id'
            ));

            expect(result.current.data).toBe(null);
            expect(result.current.error).toBe(null);
        });

        it('should handle null game ID gracefully', async () => {
            const { tenant } = await TestScenarios.singleUserWithTenant(
                new User('test-user-key')
            );

            const playground = await JinagaTestUtils.createTestInstanceWithTenant(
                new User('test-user-key')
            ).then(result => result.jinaga.fact(new Playground(tenant, TEST_CONSTANTS.PLAYGROUND_CODE)));

            const jinagaInstance = await JinagaTestUtils.createTestInstanceWithTenant(
                new User('test-user-key')
            ).then(result => result.jinaga);

            const { result } = renderHook(() => useGame(
                jinagaInstance,
                playground,
                null,
                'test-player-id'
            ));

            expect(result.current.data).toBe(null);
            expect(result.current.error).toBe(null);
        });
    });
});

describe('useGame - endGame function', () => {
    it('should create Draw fact when game ends in draw', async () => {
        const { challenger, opponent } = createTwoTestUsers();
        const { jinaga, game, gameId, playground } = await createGameSetup([challenger, opponent], true);

        // Make moves to create a draw scenario
        const moves = [
            { index: 0, position: 0 }, // X in top-left
            { index: 1, position: 1 }, // O in top-center
            { index: 2, position: 2 }, // X in top-right
            { index: 3, position: 4 }, // O in center
            { index: 4, position: 8 }, // X in bottom-right
            { index: 5, position: 6 }, // O in bottom-left
            { index: 6, position: 3 }, // X in middle-left
            { index: 7, position: 5 }, // O in middle-right
            { index: 8, position: 7 }, // X in bottom-center (draw)
        ];

        // Create all moves
        for (const move of moves) {
            await jinaga.fact(new Move(game, move.index, move.position));
        }

        // Use the hook
        const { result } = renderHook(() => useGame(jinaga, playground, gameId, challenger.publicKey));

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.data).toBeTruthy();
            expect(result.current.data?.ticTacToeState.isGameOver).toBe(true);
            expect(result.current.data?.ticTacToeState.winner).toBe('draw');
        });

        // Call endGame
        const endGameResult = await result.current.data!.endGame();
        expect(endGameResult.success).toBe(true);

        // Verify Draw fact was created
        const drawSpec = model.given(Game).match(game =>
            game.successors(Draw, draw => draw.game)
        );
        const draws = await jinaga.query(drawSpec, game);
        expect(draws).toHaveLength(1);
    });

    it('should create Win fact when X wins', async () => {
        const { challenger, opponent } = createTwoTestUsers();
        const { jinaga, game, gameId, playground } = await createGameSetup([challenger, opponent], true);

        // Make moves to create a win for X (challenger starts, so challenger is X)
        const moves = [
            { index: 0, position: 0 }, // X in top-left
            { index: 1, position: 1 }, // O in top-center
            { index: 2, position: 3 }, // X in middle-left
            { index: 3, position: 4 }, // O in center
            { index: 4, position: 6 }, // X in bottom-left (wins)
        ];

        // Create all moves
        for (const move of moves) {
            await jinaga.fact(new Move(game, move.index, move.position));
        }

        // Use the hook
        const { result } = renderHook(() => useGame(jinaga, playground, gameId, challenger.publicKey));

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.data).toBeTruthy();
            expect(result.current.data?.ticTacToeState.isGameOver).toBe(true);
            expect(result.current.data?.ticTacToeState.winner).toBe('X');
        });

        // Call endGame
        const endGameResult = await result.current.data!.endGame();
        expect(endGameResult.success).toBe(true);

        // Verify Win fact was created with challenger as winner
        const winSpec = model.given(Game).match(game =>
            game.successors(Win, win => win.game)
        );
        const wins = await jinaga.query(winSpec, game);
        expect(wins).toHaveLength(1);
        expect(wins[0].winner.user.publicKey).toBe(challenger.publicKey);
    });

    it('should create Win fact when O wins', async () => {
        const { challenger, opponent } = createTwoTestUsers();
        const { jinaga, game, gameId, playground } = await createGameSetup([challenger, opponent], false);

        // Make moves to create a win for O (challenger does not start, so opponent is X, challenger is O)
        const moves = [
            { index: 0, position: 0 }, // X in top-left
            { index: 1, position: 1 }, // O in top-center
            { index: 2, position: 3 }, // X in middle-left
            { index: 3, position: 4 }, // O in center
            { index: 4, position: 2 }, // X in top-right
            { index: 5, position: 7 }, // O in bottom-center (wins)
        ];

        // Create all moves
        for (const move of moves) {
            await jinaga.fact(new Move(game, move.index, move.position));
        }

        // Use the hook
        const { result } = renderHook(() => useGame(jinaga, playground, gameId, challenger.publicKey));

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.data).toBeTruthy();
            expect(result.current.data?.ticTacToeState.isGameOver).toBe(true);
            expect(result.current.data?.ticTacToeState.winner).toBe('O');
        });

        // Call endGame
        const endGameResult = await result.current.data!.endGame();
        expect(endGameResult.success).toBe(true);

        // Verify Win fact was created with challenger as winner (since challenger is O)
        const winSpec = model.given(Game).match(game =>
            game.successors(Win, win => win.game)
        );
        const wins = await jinaga.query(winSpec, game);
        expect(wins).toHaveLength(1);
        expect(wins[0].winner.user.publicKey).toBe(challenger.publicKey);
    });

    it('should return error when game is not over', async () => {
        const { challenger, opponent } = createTwoTestUsers();
        const { jinaga, game, gameId, playground } = await createGameSetup([challenger, opponent], true);

        // Make only one move (game not over)
        await jinaga.fact(new Move(game, 0, 0));

        // Use the hook
        const { result } = renderHook(() => useGame(jinaga, playground, gameId, challenger.publicKey));

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.data).toBeTruthy();
            expect(result.current.data?.ticTacToeState.isGameOver).toBe(false);
        });

        // Call endGame
        const endGameResult = await result.current.data!.endGame();
        expect(endGameResult.success).toBe(false);
        expect(endGameResult.error).toBe('Game is not over yet');
    });
}); 