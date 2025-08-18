import { Challenge, Game, Join, PlayerName, Playground, Player, model } from '@model/model';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { User } from 'jinaga';
import { useActiveGames } from '../../hooks/useActiveGames';
import { givenPlayerApp } from './givenPlayerApp';

describe('useActiveGames - Security', () => {
    it('should only show games where the current player is a participant', async () => {
        let playground: Playground | undefined;
        givenPlayerApp((currentPlayer) => {
            // Create another player with a unique user in the same tenant
            const otherUser = new User('other-player-456');
            const otherPlayer = new Player(otherUser, currentPlayer.tenant);

            // Create playground
            const testPlayground = new Playground(currentPlayer.tenant, 'TEST12');
            playground = testPlayground;

            // Create player names
            const currentPlayerName = new PlayerName(currentPlayer, 'CurrentPlayer', []);
            const otherPlayerName = new PlayerName(otherPlayer, 'OtherPlayer', []);

            // Create joins
            const currentPlayerJoin = new Join(currentPlayer, testPlayground, new Date());
            const otherPlayerJoin = new Join(otherPlayer, testPlayground, new Date());

            // Create challenge and game where current player is challenger
            const challenge = new Challenge(
                currentPlayerJoin,
                otherPlayerJoin,
                true,
                new Date()
            );
            const game = new Game(challenge);

            return [
                otherUser,
                otherPlayer,
                testPlayground,
                currentPlayerName,
                otherPlayerName,
                currentPlayerJoin,
                otherPlayerJoin,
                challenge,
                game
            ];
        });

        const { result } = renderHook(() => useActiveGames(
            playground,
            'player-123' // This should match the user key from givenPlayerApp
        ));

        await waitFor(() => {
            // First check for any errors to get better diagnostic information
            expect(result.current.error).toBeNull();
            expect(result.current.data).not.toBeNull();
        });

        // Verify the hook returns data
        const data = result.current.data!;
        expect(data.games).toHaveLength(1);
        expect(data.gameCount).toBe(1);
        expect(data.hasGames).toBe(true);

        // Verify the game shows the current player as active
        const game = data.games[0];
        expect(game.isActivePlayer).toBe(true);
    });

    it('should not show games where the current player is not a participant', async () => {
        const { jinaga } = givenPlayerApp((currentPlayer) => {
            // Create two other players with unique users in the same tenant
            const otherUser1 = new User('other-player-1-789');
            const otherUser2 = new User('other-player-2-012');
            const otherPlayer1 = new Player(otherUser1, currentPlayer.tenant);
            const otherPlayer2 = new Player(otherUser2, currentPlayer.tenant);

            // Create playground
            const playground = new Playground(currentPlayer.tenant, 'TEST12');

            // Create player names
            const otherPlayer1Name = new PlayerName(otherPlayer1, 'OtherPlayer1', []);
            const otherPlayer2Name = new PlayerName(otherPlayer2, 'OtherPlayer2', []);

            // Create joins
            const otherPlayer1Join = new Join(otherPlayer1, playground, new Date());
            const otherPlayer2Join = new Join(otherPlayer2, playground, new Date());

            // Create challenge and game where current player is NOT involved
            const challenge = new Challenge(
                otherPlayer1Join,
                otherPlayer2Join,
                true,
                new Date()
            );
            const game = new Game(challenge);

            return [
                otherUser1,
                otherUser2,
                otherPlayer1,
                otherPlayer2,
                playground,
                otherPlayer1Name,
                otherPlayer2Name,
                otherPlayer1Join,
                otherPlayer2Join,
                challenge,
                game
            ];
        });

        // Get the actual playground fact from the Jinaga instance
        const playgroundSpec = model.given(Playground).match(playground => playground);
        const playgrounds = await jinaga.query(playgroundSpec);
        const testPlayground = playgrounds[0];

        const { result } = renderHook(() => useActiveGames(
            testPlayground,
            'player-123'
        ));

        await waitFor(() => {
            expect(result.current.error).toBeNull();
            expect(result.current.data).not.toBeNull();
        });

        // Verify the hook returns no games for the current player
        const data = result.current.data!;
        expect(data.games).toHaveLength(0);
        expect(data.gameCount).toBe(0);
        expect(data.hasGames).toBe(false);
    });

    it('should handle null playground gracefully', () => {
        givenPlayerApp((currentPlayer) => {
            return [];
        });

        const { result } = renderHook(() => useActiveGames(
            null,
            'player-123'
        ));

        // Should return null data when playground is null
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('should handle null currentPlayerId gracefully', async () => {
        const { jinaga } = givenPlayerApp((currentPlayer) => {
            // Create another player with a unique user in the same tenant
            const otherUser = new User('other-player-456');
            const otherPlayer = new Player(otherUser, currentPlayer.tenant);

            // Create playground
            const playground = new Playground(currentPlayer.tenant, 'TEST12');

            // Create player names
            const currentPlayerName = new PlayerName(currentPlayer, 'CurrentPlayer', []);
            const otherPlayerName = new PlayerName(otherPlayer, 'OtherPlayer', []);

            // Create joins
            const currentPlayerJoin = new Join(currentPlayer, playground, new Date());
            const otherPlayerJoin = new Join(otherPlayer, playground, new Date());

            // Create challenge and game
            const challenge = new Challenge(
                currentPlayerJoin,
                otherPlayerJoin,
                true,
                new Date()
            );
            const game = new Game(challenge);

            return [
                otherUser,
                otherPlayer,
                playground,
                currentPlayerName,
                otherPlayerName,
                currentPlayerJoin,
                otherPlayerJoin,
                challenge,
                game
            ];
        });

        const { result } = renderHook(() => useActiveGames(
            testPlayground,
            null
        ));

        await waitFor(() => {
            expect(result.current.error).toBeNull();
            expect(result.current.data).not.toBeNull();
        });

        // Verify the hook returns data but no player is marked as active
        const data = result.current.data!;
        expect(data.games).toHaveLength(1);
        expect(data.gameCount).toBe(1);
        expect(data.hasGames).toBe(true);

        // Verify no player is marked as active when currentPlayerId is null
        const game = data.games[0];
        expect(game.isActivePlayer).toBe(false);
    });
});
