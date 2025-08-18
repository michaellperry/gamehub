import { Challenge, Game, Join, PlayerName, Playground, Player, Tenant } from '@model/model';
import { describe, expect, it } from 'vitest';
import { User } from 'jinaga';
import { givenPlayerApp } from './givenPlayerApp';

describe('givenPlayerApp - Usage Examples', () => {
    it('demonstrates strongly-typed tuple access in a realistic scenario', () => {
        // This shows how to use the strongly-typed tuple in practice
        const result = givenPlayerApp((currentPlayer) => {
            // Create test data
            const playground = new Playground(currentPlayer.tenant, 'TEST12');
            const playerName = new PlayerName(currentPlayer, 'TestPlayer', []);
            const join = new Join(currentPlayer, playground, new Date());

            // Return as const tuple for strong typing
            return [playground, playerName, join] as const;
        });

        // Destructure with full type safety
        const [tenantOwner, tenant, playerUser, player, playground, playerName, join] = result;

        // TypeScript knows the exact types - no casting needed!
        expect(tenantOwner).toBeInstanceOf(User);
        expect(tenant).toBeInstanceOf(Tenant);
        expect(playerUser).toBeInstanceOf(User);
        expect(player).toBeInstanceOf(Player);
        expect(playground).toBeInstanceOf(Playground);
        expect(playerName).toBeInstanceOf(PlayerName);
        expect(join).toBeInstanceOf(Join);

        // Verify relationships
        expect(player.user).toBe(playerUser);
        expect(player.tenant).toBe(tenant);
        expect(tenant.creator).toBe(tenantOwner);
        expect(playerName.player).toBe(player);
        expect(join.player).toBe(player);
        expect(join.playground).toBe(playground);

        // The tuple has exactly the expected length
        expect(result).toHaveLength(7);
    });

    it('works with complex game scenarios', () => {
        const result = givenPlayerApp((currentPlayer) => {
            // Create a complete game scenario
            const otherUser = new User('other-player');
            const otherPlayer = new Player(otherUser, currentPlayer.tenant);
            const playground = new Playground(currentPlayer.tenant, 'GAME01');

            const currentPlayerName = new PlayerName(currentPlayer, 'Player1', []);
            const otherPlayerName = new PlayerName(otherPlayer, 'Player2', []);

            const currentPlayerJoin = new Join(currentPlayer, playground, new Date());
            const otherPlayerJoin = new Join(otherPlayer, playground, new Date());

            const challenge = new Challenge(currentPlayerJoin, otherPlayerJoin, true, new Date());
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
            ] as const;
        });

        // Access specific elements by index with full type safety
        const game = result[12]; // TypeScript knows this is a Game
        const challenge = result[11]; // TypeScript knows this is a Challenge
        const playground = result[6]; // TypeScript knows this is a Playground

        expect(game).toBeInstanceOf(Game);
        expect(challenge).toBeInstanceOf(Challenge);
        expect(playground).toBeInstanceOf(Playground);

        // Verify game relationships
        expect(game.challenge).toBe(challenge);
        expect(challenge.challengerJoin.playground).toBe(playground);
        expect(challenge.opponentJoin.playground).toBe(playground);
    });

    it('provides type safety even with empty initial state', () => {
        const result = givenPlayerApp(() => []);

        // Even with empty initial state, we get the 4 prepended items
        const [tenantOwner, tenant, playerUser, player] = result;

        expect(result).toHaveLength(4);
        expect(tenantOwner).toBeInstanceOf(User);
        expect(tenant).toBeInstanceOf(Tenant);
        expect(playerUser).toBeInstanceOf(User);
        expect(player).toBeInstanceOf(Player);
    });
});