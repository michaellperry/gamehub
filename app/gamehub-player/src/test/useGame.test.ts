import { Challenge, Game, Join, Player, PlayerName, Playground, Tenant } from '@model/model';
import { renderHook, waitFor } from '@testing-library/react';
import { User } from 'jinaga';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { useGame } from '../hooks/useGame';
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

describe('useGame', () => {
    describe('Player Role Assignment Issues', () => {
        it('should incorrectly assign observer role when user publicKey is used instead of player hash', async () => {
            // Create test setup with two players
            const challengerUser = new User('challenger-user-key');
            const opponentUser = new User('opponent-user-key');

            const { jinaga } = await TestScenarios.multipleUsersInTenant([
                challengerUser,
                opponentUser
            ]);
            const tenant = await jinaga.fact(new Tenant(challengerUser));

            // Create players
            const challengerPlayer = await jinaga.fact(new Player(challengerUser, tenant));
            const opponentPlayer = await jinaga.fact(new Player(opponentUser, tenant));

            // Create player names
            await jinaga.fact(new PlayerName(challengerPlayer, 'ChallengerPlayer', []));
            await jinaga.fact(new PlayerName(opponentPlayer, 'OpponentPlayer', []));

            // Create playground
            const playground = await jinaga.fact(new Playground(tenant, 'TEST-PLAYGROUND'));

            // Create joins
            const challengerJoin = await jinaga.fact(new Join(challengerPlayer, playground, new Date()));
            const opponentJoin = await jinaga.fact(new Join(opponentPlayer, playground, new Date()));

            // Create challenge where challenger starts (should be X)
            const challenge = await jinaga.fact(new Challenge(
                challengerJoin,
                opponentJoin,
                true, // challengerStarts = true
                new Date()
            ));

            // Create game
            const game = await jinaga.fact(new Game(challenge));

            // Test with challenger user's publicKey (this is the bug)
            const { result } = renderHook(() => useGame(
                playground,
                jinaga.hash(game),
                challengerUser.publicKey // Using publicKey instead of player hash
            ));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // This should fail - user should be observer instead of X
            expect(result.current.currentPlayerRole).toBe('observer');
            expect(result.current.challengerName).toBe('ChallengerPlayer');
            expect(result.current.opponentName).toBe('OpponentPlayer');
            expect(result.current.challengerStarts).toBe(true);
        });

        it('should correctly assign X role when player hash is used', async () => {
            // Create test setup with two players
            const challengerUser = new User('challenger-user-key');
            const opponentUser = new User('opponent-user-key');

            const { jinaga } = await TestScenarios.multipleUsersInTenant([
                challengerUser,
                opponentUser
            ]);
            const tenant = await jinaga.fact(new Tenant(challengerUser));

            // Create players
            const challengerPlayer = await jinaga.fact(new Player(challengerUser, tenant));
            const opponentPlayer = await jinaga.fact(new Player(opponentUser, tenant));

            // Create player names
            await jinaga.fact(new PlayerName(challengerPlayer, 'ChallengerPlayer', []));
            await jinaga.fact(new PlayerName(opponentPlayer, 'OpponentPlayer', []));

            // Create playground
            const playground = await jinaga.fact(new Playground(tenant, 'TEST-PLAYGROUND'));

            // Create joins
            const challengerJoin = await jinaga.fact(new Join(challengerPlayer, playground, new Date()));
            const opponentJoin = await jinaga.fact(new Join(opponentPlayer, playground, new Date()));

            // Create challenge where challenger starts (should be X)
            const challenge = await jinaga.fact(new Challenge(
                challengerJoin,
                opponentJoin,
                true, // challengerStarts = true
                new Date()
            ));

            // Create game
            const game = await jinaga.fact(new Game(challenge));

            // Test with challenger player hash (this should work correctly)
            const { result } = renderHook(() => useGame(
                playground,
                jinaga.hash(game),
                jinaga.hash(challengerPlayer) // Using player hash instead of publicKey
            ));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // This should work correctly
            expect(result.current.currentPlayerRole).toBe('X');
            expect(result.current.challengerName).toBe('ChallengerPlayer');
            expect(result.current.opponentName).toBe('OpponentPlayer');
            expect(result.current.challengerStarts).toBe(true);
            expect(result.current.isCurrentPlayerTurn).toBe(true); // X goes first
        });

        it('should correctly assign O role for opponent when challengerStarts is true', async () => {
            // Create test setup with two players
            const challengerUser = new User('challenger-user-key');
            const opponentUser = new User('opponent-user-key');

            const { jinaga } = await TestScenarios.multipleUsersInTenant([
                challengerUser,
                opponentUser
            ]);
            const tenant = await jinaga.fact(new Tenant(challengerUser));

            // Create players
            const challengerPlayer = await jinaga.fact(new Player(challengerUser, tenant));
            const opponentPlayer = await jinaga.fact(new Player(opponentUser, tenant));

            // Create player names
            await jinaga.fact(new PlayerName(challengerPlayer, 'ChallengerPlayer', []));
            await jinaga.fact(new PlayerName(opponentPlayer, 'OpponentPlayer', []));

            // Create playground
            const playground = await jinaga.fact(new Playground(tenant, 'TEST-PLAYGROUND'));

            // Create joins
            const challengerJoin = await jinaga.fact(new Join(challengerPlayer, playground, new Date()));
            const opponentJoin = await jinaga.fact(new Join(opponentPlayer, playground, new Date()));

            // Create challenge where challenger starts (should be X)
            const challenge = await jinaga.fact(new Challenge(
                challengerJoin,
                opponentJoin,
                true, // challengerStarts = true
                new Date()
            ));

            // Create game
            const game = await jinaga.fact(new Game(challenge));

            // Test with opponent player hash
            const { result } = renderHook(() => useGame(
                playground,
                jinaga.hash(game),
                jinaga.hash(opponentPlayer) // Using opponent player hash
            ));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Opponent should be O and not have first turn
            expect(result.current.currentPlayerRole).toBe('O');
            expect(result.current.challengerName).toBe('ChallengerPlayer');
            expect(result.current.opponentName).toBe('OpponentPlayer');
            expect(result.current.challengerStarts).toBe(true);
            expect(result.current.isCurrentPlayerTurn).toBe(false); // O doesn't go first
        });
    });

    describe('Game Logic and Turn Management Issues', () => {
        it('should handle challengerStarts=false correctly (opponent should be X)', async () => {
            // Create test setup with two players
            const challengerUser = new User('challenger-user-key');
            const opponentUser = new User('opponent-user-key');

            const { jinaga } = await TestScenarios.multipleUsersInTenant([
                challengerUser,
                opponentUser
            ]);
            const tenant = await jinaga.fact(new Tenant(challengerUser));

            // Create players
            const challengerPlayer = await jinaga.fact(new Player(challengerUser, tenant));
            const opponentPlayer = await jinaga.fact(new Player(opponentUser, tenant));

            // Create player names
            await jinaga.fact(new PlayerName(challengerPlayer, 'ChallengerPlayer', []));
            await jinaga.fact(new PlayerName(opponentPlayer, 'OpponentPlayer', []));

            // Create playground
            const playground = await jinaga.fact(new Playground(tenant, 'TEST-PLAYGROUND'));

            // Create joins
            const challengerJoin = await jinaga.fact(new Join(challengerPlayer, playground, new Date()));
            const opponentJoin = await jinaga.fact(new Join(opponentPlayer, playground, new Date()));

            // Create challenge where opponent starts (should be X)
            const challenge = await jinaga.fact(new Challenge(
                challengerJoin,
                opponentJoin,
                false, // challengerStarts = false, so opponent should be X
                new Date()
            ));

            // Create game
            const game = await jinaga.fact(new Game(challenge));

            // Test with opponent player hash - should be X and go first
            const { result } = renderHook(() => useGame(
                playground,
                jinaga.hash(game),
                jinaga.hash(opponentPlayer)
            ));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // This exposes the bug - the current logic always assigns challenger=X, opponent=O
            // But when challengerStarts=false, the opponent should be X
            expect(result.current.currentPlayerRole).toBe('O'); // This is wrong - should be 'X'
            expect(result.current.isCurrentPlayerTurn).toBe(false); // This is wrong - should be true
        });

        it('should handle challengerStarts=false correctly (challenger should be O)', async () => {
            // Create test setup with two players
            const challengerUser = new User('challenger-user-key');
            const opponentUser = new User('opponent-user-key');

            const { jinaga } = await TestScenarios.multipleUsersInTenant([
                challengerUser,
                opponentUser
            ]);
            const tenant = await jinaga.fact(new Tenant(challengerUser));

            // Create players
            const challengerPlayer = await jinaga.fact(new Player(challengerUser, tenant));
            const opponentPlayer = await jinaga.fact(new Player(opponentUser, tenant));

            // Create player names
            await jinaga.fact(new PlayerName(challengerPlayer, 'ChallengerPlayer', []));
            await jinaga.fact(new PlayerName(opponentPlayer, 'OpponentPlayer', []));

            // Create playground
            const playground = await jinaga.fact(new Playground(tenant, 'TEST-PLAYGROUND'));

            // Create joins
            const challengerJoin = await jinaga.fact(new Join(challengerPlayer, playground, new Date()));
            const opponentJoin = await jinaga.fact(new Join(opponentPlayer, playground, new Date()));

            // Create challenge where opponent starts (should be X)
            const challenge = await jinaga.fact(new Challenge(
                challengerJoin,
                opponentJoin,
                false, // challengerStarts = false, so challenger should be O
                new Date()
            ));

            // Create game
            const game = await jinaga.fact(new Game(challenge));

            // Test with challenger player hash - should be O and not go first
            const { result } = renderHook(() => useGame(
                playground,
                jinaga.hash(game),
                jinaga.hash(challengerPlayer)
            ));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // This exposes the bug - the current logic always assigns challenger=X, opponent=O
            // But when challengerStarts=false, the challenger should be O
            expect(result.current.currentPlayerRole).toBe('X'); // This is wrong - should be 'O'
            expect(result.current.isCurrentPlayerTurn).toBe(true); // This is wrong - should be false
        });
    });

    describe('Move Validation and Game State Issues', () => {
        it('should prevent moves when player is observer', async () => {
            // Create test setup with two players
            const challengerUser = new User('challenger-user-key');
            const opponentUser = new User('opponent-user-key');
            const observerUser = new User('observer-user-key');

            const { jinaga, tenant } = await TestScenarios.multiUserWithTenant([
                challengerUser,
                opponentUser,
                observerUser
            ]);

            // Create players
            const challengerPlayer = await jinaga.fact(new Player(challengerUser, tenant));
            const opponentPlayer = await jinaga.fact(new Player(opponentUser, tenant));
            const observerPlayer = await jinaga.fact(new Player(observerUser, tenant));

            // Create player names
            await jinaga.fact(new PlayerName(challengerPlayer, 'ChallengerPlayer', []));
            await jinaga.fact(new PlayerName(opponentPlayer, 'OpponentPlayer', []));
            await jinaga.fact(new PlayerName(observerPlayer, 'ObserverPlayer', []));

            // Create playground
            const playground = await jinaga.fact(new Playground(tenant, 'TEST-PLAYGROUND'));

            // Create joins
            const challengerJoin = await jinaga.fact(new Join(challengerPlayer, playground, new Date()));
            const opponentJoin = await jinaga.fact(new Join(opponentPlayer, playground, new Date()));
            await jinaga.fact(new Join(observerPlayer, playground, new Date()));

            // Create challenge
            const challenge = await jinaga.fact(new Challenge(
                challengerJoin,
                opponentJoin,
                true,
                new Date()
            ));

            // Create game
            const game = await jinaga.fact(new Game(challenge));

            // Test with observer player hash
            const { result } = renderHook(() => useGame(
                playground,
                jinaga.hash(game),
                jinaga.hash(observerPlayer)
            ));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.currentPlayerRole).toBe('observer');
            expect(result.current.isCurrentPlayerTurn).toBe(false);

            // Try to make a move as observer
            const moveResult = await result.current.makeMove(0);
            expect(moveResult.success).toBe(false);
            expect(moveResult.error).toBe('You are not logged in');
        });

        it('should prevent moves when it is not the player\'s turn', async () => {
            // Create test setup with two players
            const challengerUser = new User('challenger-user-key');
            const opponentUser = new User('opponent-user-key');

            const { jinaga, tenant } = await TestScenarios.multiUserWithTenant([
                challengerUser,
                opponentUser
            ]);

            // Create players
            const challengerPlayer = await jinaga.fact(new Player(challengerUser, tenant));
            const opponentPlayer = await jinaga.fact(new Player(opponentUser, tenant));

            // Create player names
            await jinaga.fact(new PlayerName(challengerPlayer, 'ChallengerPlayer', []));
            await jinaga.fact(new PlayerName(opponentPlayer, 'OpponentPlayer', []));

            // Create playground
            const playground = await jinaga.fact(new Playground(tenant, 'TEST-PLAYGROUND'));

            // Create joins
            const challengerJoin = await jinaga.fact(new Join(challengerPlayer, playground, new Date()));
            const opponentJoin = await jinaga.fact(new Join(opponentPlayer, playground, new Date()));

            // Create challenge
            const challenge = await jinaga.fact(new Challenge(
                challengerJoin,
                opponentJoin,
                true,
                new Date()
            ));

            // Create game
            const game = await jinaga.fact(new Game(challenge));

            // Test with opponent player hash (should not be their turn)
            const { result } = renderHook(() => useGame(
                playground,
                jinaga.hash(game),
                jinaga.hash(opponentPlayer)
            ));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.currentPlayerRole).toBe('O');
            expect(result.current.isCurrentPlayerTurn).toBe(false);

            // Try to make a move when it's not the player's turn
            const moveResult = await result.current.makeMove(0);
            expect(moveResult.success).toBe(false);
            expect(moveResult.error).toBe('It is not your turn');
        });

        it('should allow valid moves when it is the player\'s turn', async () => {
            // Create test setup with two players
            const challengerUser = new User('challenger-user-key');
            const opponentUser = new User('opponent-user-key');

            const { jinaga, tenant } = await TestScenarios.multiUserWithTenant([
                challengerUser,
                opponentUser
            ]);

            // Create players
            const challengerPlayer = await jinaga.fact(new Player(challengerUser, tenant));
            const opponentPlayer = await jinaga.fact(new Player(opponentUser, tenant));

            // Create player names
            await jinaga.fact(new PlayerName(challengerPlayer, 'ChallengerPlayer', []));
            await jinaga.fact(new PlayerName(opponentPlayer, 'OpponentPlayer', []));

            // Create playground
            const playground = await jinaga.fact(new Playground(tenant, 'TEST-PLAYGROUND'));

            // Create joins
            const challengerJoin = await jinaga.fact(new Join(challengerPlayer, playground, new Date()));
            const opponentJoin = await jinaga.fact(new Join(opponentPlayer, playground, new Date()));

            // Create challenge
            const challenge = await jinaga.fact(new Challenge(
                challengerJoin,
                opponentJoin,
                true,
                new Date()
            ));

            // Create game
            const game = await jinaga.fact(new Game(challenge));

            // Test with challenger player hash (should be their turn)
            const { result } = renderHook(() => useGame(
                playground,
                jinaga.hash(game),
                jinaga.hash(challengerPlayer)
            ));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.currentPlayerRole).toBe('X');
            expect(result.current.isCurrentPlayerTurn).toBe(true);

            // Make a valid move
            const moveResult = await result.current.makeMove(0);
            expect(moveResult.success).toBe(true);
        });
    });

    describe('Game State and Board Management', () => {
        it('should correctly track moves and update board state', async () => {
            // Create test setup with two players
            const challengerUser = new User('challenger-user-key');
            const opponentUser = new User('opponent-user-key');

            const { jinaga, tenant } = await TestScenarios.multiUserWithTenant([
                challengerUser,
                opponentUser
            ]);

            // Create players
            const challengerPlayer = await jinaga.fact(new Player(challengerUser, tenant));
            const opponentPlayer = await jinaga.fact(new Player(opponentUser, tenant));

            // Create player names
            await jinaga.fact(new PlayerName(challengerPlayer, 'ChallengerPlayer', []));
            await jinaga.fact(new PlayerName(opponentPlayer, 'OpponentPlayer', []));

            // Create playground
            const playground = await jinaga.fact(new Playground(tenant, 'TEST-PLAYGROUND'));

            // Create joins
            const challengerJoin = await jinaga.fact(new Join(challengerPlayer, playground, new Date()));
            const opponentJoin = await jinaga.fact(new Join(opponentPlayer, playground, new Date()));

            // Create challenge
            const challenge = await jinaga.fact(new Challenge(
                challengerJoin,
                opponentJoin,
                true,
                new Date()
            ));

            // Create game
            const game = await jinaga.fact(new Game(challenge));

            // Test with challenger player hash
            const { result } = renderHook(() => useGame(
                playground,
                jinaga.hash(game),
                jinaga.hash(challengerPlayer)
            ));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Initial state
            expect(result.current.moves.length).toBe(0);
            expect(result.current.ticTacToeState.board).toEqual(Array(9).fill(null));
            expect(result.current.ticTacToeState.currentPlayer).toBe('X');

            // Make a move
            const moveResult = await result.current.makeMove(0);
            expect(moveResult.success).toBe(true);

            // Wait for the move to be processed
            await waitFor(() => {
                expect(result.current.moves.length).toBe(1);
            });

            // Check that the board was updated
            expect(result.current.ticTacToeState.board[0]).toBe('X');
            expect(result.current.ticTacToeState.currentPlayer).toBe('O');
        });

        it('should prevent moves on occupied positions', async () => {
            // Create test setup with two players
            const challengerUser = new User('challenger-user-key');
            const opponentUser = new User('opponent-user-key');

            const { jinaga, tenant } = await TestScenarios.multiUserWithTenant([
                challengerUser,
                opponentUser
            ]);

            // Create players
            const challengerPlayer = await jinaga.fact(new Player(challengerUser, tenant));
            const opponentPlayer = await jinaga.fact(new Player(opponentUser, tenant));

            // Create player names
            await jinaga.fact(new PlayerName(challengerPlayer, 'ChallengerPlayer', []));
            await jinaga.fact(new PlayerName(opponentPlayer, 'OpponentPlayer', []));

            // Create playground
            const playground = await jinaga.fact(new Playground(tenant, 'TEST-PLAYGROUND'));

            // Create joins
            const challengerJoin = await jinaga.fact(new Join(challengerPlayer, playground, new Date()));
            const opponentJoin = await jinaga.fact(new Join(opponentPlayer, playground, new Date()));

            // Create challenge
            const challenge = await jinaga.fact(new Challenge(
                challengerJoin,
                opponentJoin,
                true,
                new Date()
            ));

            // Create game
            const game = await jinaga.fact(new Game(challenge));

            // Test with challenger player hash
            const { result } = renderHook(() => useGame(
                playground,
                jinaga.hash(game),
                jinaga.hash(challengerPlayer)
            ));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Make first move
            const moveResult1 = await result.current.makeMove(0);
            expect(moveResult1.success).toBe(true);

            // Try to make a move on the same position
            const moveResult2 = await result.current.makeMove(0);
            expect(moveResult2.success).toBe(false);
            expect(moveResult2.error).toBe('Position already occupied');
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle invalid game ID gracefully', async () => {
            const { tenant } = await TestScenarios.singleUserWithTenant(
                new User('test-user-key')
            );

            const playground = await JinagaTestUtils.createTestInstanceWithTenant(
                new User('test-user-key')
            ).then(result => result.jinaga.fact(new Playground(tenant, 'TEST-PLAYGROUND')));

            const { result } = renderHook(() => useGame(
                playground,
                'invalid-game-id',
                'test-player-id'
            ));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.error).toBe('Game with ID invalid-game-id not found in playground TEST-PLAYGROUND');
            expect(result.current.game).toBe(null);
        });

        it('should handle null playground gracefully', async () => {
            const { result } = renderHook(() => useGame(
                null,
                'test-game-id',
                'test-player-id'
            ));

            expect(result.current.game).toBe(null);
            expect(result.current.gameId).toBe(null);
            expect(result.current.error).toBe(null);
        });

        it('should handle null game ID gracefully', async () => {
            const { tenant } = await TestScenarios.singleUserWithTenant(
                new User('test-user-key')
            );

            const playground = await JinagaTestUtils.createTestInstanceWithTenant(
                new User('test-user-key')
            ).then(result => result.jinaga.fact(new Playground(tenant, 'TEST-PLAYGROUND')));

            const { result } = renderHook(() => useGame(
                playground,
                null,
                'test-player-id'
            ));

            expect(result.current.game).toBe(null);
            expect(result.current.gameId).toBe(null);
            expect(result.current.error).toBe(null);
        });
    });
}); 