import { authorization, distribution } from '@model';
import { Player, Tenant, model } from '@model/model';
import { renderHook } from '@testing-library/react';
import { JinagaTest, User } from 'jinaga';
import { describe, expect, it, vi } from 'vitest';
import { usePlayerName } from '../hooks/usePlayerName';
import * as UserProviderModule from '../auth/UserProvider';
import * as UseTenantModule from '../auth/useTenant';
import * as JinagaConfigModule from '../jinaga-config';

describe('usePlayerName', () => {
    it('should show name input when player has no PlayerName facts', async () => {
        const playerUser = new User('player-123');
        const tenantOwner = new User('tenant-owner');
        const tenant = new Tenant(tenantOwner);
        const player = new Player(playerUser, tenant);

        const mockJinaga = JinagaTest.create({
            model,
            authorization,
            distribution,
            user: playerUser,
            initialState: [tenantOwner, tenant, playerUser, player]
        });

        // Mock the global j export from jinaga-config
        vi.spyOn(JinagaConfigModule, 'j', 'get').mockReturnValue(mockJinaga);

        // Mock the useUser hook to return our test user
        vi.spyOn(UserProviderModule, 'useUser').mockReturnValue({
            user: playerUser,
            error: null
        });

        // Mock the useTenant hook to return our test tenant
        vi.spyOn(UseTenantModule, 'useTenant').mockReturnValue(tenant);

        const { result } = renderHook(() => usePlayerName());

        // Wait for the specification to complete and data to be populated
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(result.current.showNameInput).toBe(true);
        expect(result.current.playerName).toBe('');
        expect(result.current.allowCancel).toBe(false);
    });
});