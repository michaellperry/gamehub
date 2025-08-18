import { Join, PlayerName, Playground } from '@model/model';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePlaygroundPage } from '../../hooks/usePlaygroundPage';
import { givenPlayerApp } from './givenPlayerApp';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

describe('usePlaygroundPage - Security', () => {
    it('should only list the current player in the players collection', async () => {
        givenPlayerApp((player) => {
            const playground = new Playground(player.tenant, 'TEST12');
            const playerName = new PlayerName(player, 'TestPlayer', []);
            const join = new Join(player, playground, new Date());

            return [playground, playerName, join];
        });

        const { result } = renderHook(() => usePlaygroundPage('TEST12'));

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
