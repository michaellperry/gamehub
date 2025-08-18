import { authorization, distribution } from '@model';
import { Player, Tenant, model } from '@model/model';
import { Fact, JinagaTest, User } from 'jinaga';
import { vi } from 'vitest';
import * as UserProviderModule from '../../auth/UserProvider';
import * as UseTenantModule from '../../auth/useTenant';
import * as JinagaConfigModule from '../../jinaga-config';

export function givenPlayerApp<T extends readonly Fact[]>(
    createInitialState: (player: Player) => T
): { jinaga: JinagaTest; initialState: readonly [User, Tenant, User, Player, ...T] } {
    const playerUser = new User('player-123');
    const tenantOwner = new User('tenant-owner');
    const tenant = new Tenant(tenantOwner);
    const player = new Player(playerUser, tenant);
    const initialState = createInitialState(player);

    const fullInitialState = [tenantOwner, tenant, playerUser, player, ...initialState] as const;

    const jinaga = JinagaTest.create({
        model,
        authorization,
        distribution,
        user: playerUser,
        initialState: [...fullInitialState]
    });

    // Mock the global j export from jinaga-config
    vi.spyOn(JinagaConfigModule, 'j', 'get').mockReturnValue(jinaga);

    // Mock the useUser hook to return our test user
    vi.spyOn(UserProviderModule, 'useUser').mockReturnValue({
        user: playerUser,
        error: null
    });

    // Mock the useTenant hook to return our test tenant
    vi.spyOn(UseTenantModule, 'useTenant').mockReturnValue(tenant);

    return { jinaga, initialState: fullInitialState };
}
