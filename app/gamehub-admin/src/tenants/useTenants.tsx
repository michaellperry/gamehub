import { User } from 'jinaga';
import { useSpecification } from 'jinaga-react';
import { useState } from 'react';
import { j } from '../jinaga-config';
import { Administrator, model, Tenant } from '@model/model';
import { useUser } from '../auth/UserProvider';

export interface TenantViewModel {
    hash: string;
    publicKey: string;
}

const tenantsOfAdministrator = model.given(User).match((user) =>
    Administrator.by(user)
        .selectMany((admin) => admin.tenant.predecessor())
        .selectMany((tenant) =>
            tenant.creator.predecessor().select<TenantViewModel>((creator) => ({
                hash: j.hash(tenant),
                publicKey: creator.publicKey,
            }))
        )
);

async function createTenant(user: User) {
    await j.singleUse(async (creator) => {
        const tenant = await j.fact(new Tenant(creator));
        await j.fact(new Administrator(tenant, user, new Date()));
    });
}

export function useTenants() {
    const { user, error: userError } = useUser();
    const { data, error, loading } = useSpecification(j, tenantsOfAdministrator, user);
    const [actionError, setActionError] = useState<Error | null>(null);

    function addTenant() {
        if (user) {
            createTenant(user)
                .then(() => setActionError(null))
                .catch(setActionError);
        }
    }

    return {
        loading,
        tenants: data,
        error: userError || actionError || error,
        canAddTenant: !!user,
        addTenant,
    };
}
