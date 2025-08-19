import { Challenge, Game, Join, Player, PlayerName, Playground, Tenant } from '@model/model';
import { renderHook, waitFor } from '@testing-library/react';
import { User } from 'jinaga';
import { describe, expect, it } from 'vitest';
import { useActiveGames } from '../../hooks/useActiveGames';
import { givenPlayerApp } from './givenPlayerApp';

describe('useActiveGames - Security', () => {
    it('should show games where the current player is a participant', async () => {
        const playerUser = new User('player-123');
        const tenantOwner = new User('tenant-owner');
        const tenant = new Tenant(tenantOwner);
        const currentPlayer = new Player(playerUser, tenant);

        // Create another player with a unique user in the same tenant
        const otherUser = new User('other-player-456');
        const otherPlayer = new Player(otherUser, currentPlayer.tenant);

        // Create playground
        const testPlayground = new Playground(currentPlayer.tenant, 'TEST12');

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

        const jinaga = givenPlayerApp([
            playerUser,
            tenantOwner,
            tenant,
            currentPlayer,
            otherUser,
            otherPlayer,
            testPlayground,
            currentPlayerName,
            otherPlayerName,
            currentPlayerJoin,
            otherPlayerJoin,
            challenge,
            game
        ], playerUser, tenant);

        const currentPlayerHash = jinaga.hash(currentPlayer);

        const { result } = renderHook(() => useActiveGames(
            testPlayground,
            currentPlayerHash
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
        expect(data.games[0].isActivePlayer).toBe(true);
    });

    it('should show games where the current player is not a participant but is in the same playground', async () => {
        const playerUser = new User('player-123');
        const tenantOwner = new User('tenant-owner');
        const tenant = new Tenant(tenantOwner);
        const currentPlayer = new Player(playerUser, tenant);

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
        const currentPlayerJoin = new Join(currentPlayer, playground, new Date());
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

        const jinaga = givenPlayerApp([
            playerUser,
            tenantOwner,
            tenant,
            currentPlayer,
            otherUser1,
            otherUser2,
            otherPlayer1,
            otherPlayer2,
            playground,
            otherPlayer1Name,
            otherPlayer2Name,
            currentPlayerJoin,
            otherPlayer1Join,
            otherPlayer2Join,
            challenge,
            game
        ], playerUser, tenant);

        const currentPlayerHash = jinaga.hash(currentPlayer);
        const { result } = renderHook(() => useActiveGames(
            playground,
            currentPlayerHash
        ));

        await waitFor(() => {
            expect(result.current.error).toBeNull();
            expect(result.current.data).not.toBeNull();
        });

        // Verify the hook returns data
        const data = result.current.data!;
        expect(data.games).toHaveLength(1);
        expect(data.gameCount).toBe(1);
        expect(data.hasGames).toBe(true);

        // Verify the game shows the current player as not active
        expect(data.games[0].isActivePlayer).toBe(false);
    });

    it('should handle null playground gracefully', () => {
        const playerUser = new User('player-123');
        const tenantOwner = new User('tenant-owner');
        const tenant = new Tenant(tenantOwner);
        const currentPlayer = new Player(playerUser, tenant);

        givenPlayerApp([
            playerUser,
            tenantOwner,
            tenant,
            currentPlayer
        ], playerUser, tenant);

        const { result } = renderHook(() => useActiveGames(
            null,
            'player-123'
        ));

        // Should return null data when playground is null
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('should handle null currentPlayerId gracefully', async () => {
        const playerUser = new User('player-123');
        const tenantOwner = new User('tenant-owner');
        const tenant = new Tenant(tenantOwner);
        const currentPlayer = new Player(playerUser, tenant);

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

        givenPlayerApp([
            playerUser,
            tenantOwner,
            tenant,
            currentPlayer,
            otherUser,
            otherPlayer,
            playground,
            currentPlayerName,
            otherPlayerName,
            currentPlayerJoin,
            otherPlayerJoin,
            challenge,
            game
        ], playerUser, tenant);

        const { result } = renderHook(() => useActiveGames(
            playground,
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
        const gameData = data.games[0];
        expect(gameData.isActivePlayer).toBe(false);
    });
});
