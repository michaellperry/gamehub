import { Join, Player, PlayerName, Playground, Tenant } from '@model/model';
import { renderHook, waitFor } from '@testing-library/react';
import { User } from 'jinaga';
import { describe, expect, it, vi } from 'vitest';
import { usePlaygroundPage } from '../../hooks/usePlaygroundPage';
import { givenPlayerApp } from './givenPlayerApp';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

describe('usePlaygroundPage - Security', () => {
    it('should only list the current player in the players collection', async () => {
        const playerUser = new User('player-123');
        const tenantOwner = new User('tenant-owner');
        const tenant = new Tenant(tenantOwner);
        const currentPlayer = new Player(playerUser, tenant);

        const playground = new Playground(tenant, 'TESTAB');
        const playerName = new PlayerName(currentPlayer, 'TestPlayer', []);
        const join = new Join(currentPlayer, playground, new Date());

        givenPlayerApp([
            playerUser,
            tenantOwner,
            tenant,
            currentPlayer,
            playground,
            playerName,
            join
        ], playerUser, tenant);

        const { result } = renderHook(() => usePlaygroundPage('TESTAB'));

        await waitFor(() => {
            expect(result.current.error).toBeNull();
            expect(result.current.data).not.toBeNull();
        });

        // Verify only the current player is listed
        const data = result.current.data!;
        expect(data.players).toHaveLength(1);
        expect(data.players[0].isCurrentPlayer).toBe(true);
        expect(data.players[0].name).toBe('TestPlayer');
    });
});
