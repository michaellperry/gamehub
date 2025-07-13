import { model, ServicePrincipal, Tenant } from '@model/model';
import { User } from 'jinaga';
import { useSpecification } from 'jinaga-react';
import { useState } from 'react';
import { j } from '../jinaga-config';
import { useTenant } from '../tenants/useTenant';

const servicePrincipalsInTenant = model
    .given(Tenant)
    .match((tenant) => ServicePrincipal.of(tenant));

async function createServicePrincipal(tenant: Tenant, publicKey: string) {
    await j.fact(new ServicePrincipal(new User(publicKey), tenant, new Date()));
}

export function useServicePrincipals() {
    const tenant = useTenant();
    const { data, error, loading } = useSpecification(j, servicePrincipalsInTenant, tenant);
    const [actionError, setActionError] = useState<Error | null>(null);

    const addServicePrincipal = (publicKey: string) => {
        if (tenant) {
            const lines = publicKey.split('\n').map((line) => line.trim());
            const isValidPublicKey =
                lines[0] === '-----BEGIN PUBLIC KEY-----' &&
                lines[lines.length - 1] === '-----END PUBLIC KEY-----' &&
                lines.slice(1, -1).every((line) => /^[A-Za-z0-9+/=]{1,64}$/.test(line));

            if (!isValidPublicKey) {
                setActionError(new Error('Invalid public key format'));
                return;
            }

            const formattedPublicKey = lines.join('\r\n') + '\r\n';

            createServicePrincipal(tenant, formattedPublicKey)
                .then(() => setActionError(null))
                .catch(setActionError);
        }
    };

    return {
        isConfigured: !!tenant,
        servicePrincipals:
            data?.map((sp) => ({
                id: j.hash(sp),
                createdAt: sp.createdAt,
                publicKey: sp.user.publicKey,
            })) || null,
        error: actionError || error,
        loading: loading,
        canAddServicePrincipal: !!tenant,
        addServicePrincipal: addServicePrincipal,
    };
}
