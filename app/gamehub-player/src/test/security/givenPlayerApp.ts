import { authorization, distribution } from '@model';
import { Tenant, model } from '@model/model';
import { Fact, JinagaTest, User } from 'jinaga';
import { vi } from 'vitest';
import * as UserProviderModule from '../../auth/UserProvider';
import * as UseTenantModule from '../../auth/useTenant';
import * as JinagaConfigModule from '../../jinaga-config';

export function givenPlayerApp(initialState: readonly Fact[], playerUser: User, tenant: Tenant) {
    const jinaga = JinagaTest.create({
        model,
        authorization,
        distribution,
        user: playerUser,
        initialState: [...initialState]
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
    return jinaga;
}

