import { Player, Tenant } from '@model/model';
import { renderHook, waitFor } from '@testing-library/react';
import { User } from 'jinaga';
import { describe, expect, it } from 'vitest';
import { usePlayerName } from '../../hooks/usePlayerName';
import { givenPlayerApp } from './givenPlayerApp';

describe('usePlayerName', () => {
    it('should show name input when player has no PlayerName facts', async () => {
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

        const { result } = renderHook(() => usePlayerName());

        await waitFor(() => {
            expect(result.current.error).toBeNull();
            expect(result.current.data).not.toBeNull();
        });

        const data = result.current.data!;

        expect(data.showNameInput).toBe(true);
        expect(data.playerName).toBe('');
        expect(data.allowCancel).toBe(false);
        expect(result.current.loading).toBe(false);
    });
});

