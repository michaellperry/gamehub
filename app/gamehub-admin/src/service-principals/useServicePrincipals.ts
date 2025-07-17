import { model, ServicePrincipal, Tenant } from '@model/model';
import { User } from 'jinaga';
import { useSpecification } from 'jinaga-react';
import { useMemo, useState } from 'react';
import { j } from '../jinaga-config';
import { useTenant } from '../tenants/useTenant';
import { useKnownServices } from "./useKnownServices";

const servicePrincipalsInTenant = model
    .given(Tenant)
    .match((tenant) => ServicePrincipal.of(tenant));

// Types for enhanced functionality
export interface RawService {
    serviceName: string;
    publicKey: string;
    lastChecked: string;
    responseTime: number;
}

export interface KnownService extends RawService {
    alreadyExists: boolean;
}

export interface BulkProvisioningResult {
    success: string[];
    failed: { serviceName: string; error: string }[];
}

async function createServicePrincipal(tenant: Tenant, publicKey: string) {
    await j.fact(new ServicePrincipal(new User(publicKey), tenant, new Date()));
}

export function useServicePrincipals() {
    const tenant = useTenant();
    const { data, error, loading } = useSpecification(j, servicePrincipalsInTenant, tenant);
    const [actionError, setActionError] = useState<Error | null>(null);
    const [bulkProvisioningLoading, setBulkProvisioningLoading] = useState(false);

    // Helper function to validate public key format
    const validatePublicKey = (publicKey: string): boolean => {
        const lines = publicKey.split('\n').map((line) => line.trim());
        return (
            lines[0] === '-----BEGIN PUBLIC KEY-----' &&
            lines[lines.length - 1] === '' &&
            lines[lines.length - 2] === '-----END PUBLIC KEY-----' &&
            lines.slice(1, -2).every((line) => /^[A-Za-z0-9+/=]{1,64}$/.test(line))
        );
    };

    // Helper function to format public key
    const formatPublicKey = (publicKey: string): string => {
        const lines = publicKey.split('\n').map((line) => line.trim());
        return lines.join('\r\n');
    };

    // Get existing service principals as a set of public keys for quick lookup
    const existingPublicKeys = useMemo(() => new Set(
        data?.map((sp) => sp.user.publicKey) || []
    ), [data]);

    // Fetch known services from the relay service
    const {
        data: rawServices,
        loading: knownServicesLoading,
        error: knownServicesError
    } = useKnownServices();

    // Combine raw services with alreadyExists status
    const knownServices = useMemo((): KnownService[] => {
        return rawServices.map((service) => {
            const formattedKey = formatPublicKey(service.publicKey);
            const alreadyExists = existingPublicKeys.has(formattedKey);

            return {
                ...service,
                alreadyExists,
            };
        });
    }, [rawServices, existingPublicKeys]);


    const addServicePrincipal = (publicKey: string) => {
        if (tenant) {
            if (!validatePublicKey(publicKey)) {
                setActionError(new Error('Invalid public key format'));
                return;
            }

            const formattedPublicKey = formatPublicKey(publicKey);

            createServicePrincipal(tenant, formattedPublicKey)
                .then(() => {
                    setActionError(null);
                    // The alreadyExists status will be automatically updated via useMemo
                    // when the service principals data changes
                })
                .catch(setActionError);
        }
    };

    // Bulk provision selected services
    const bulkProvisionServices = async (serviceNames: string[]): Promise<BulkProvisioningResult> => {
        if (!tenant) {
            throw new Error('No tenant configured');
        }

        setBulkProvisioningLoading(true);
        const result: BulkProvisioningResult = {
            success: [],
            failed: [],
        };

        try {
            // Filter services to only include selected ones that don't already exist
            const servicesToProvision = knownServices.filter(
                (service) => serviceNames.includes(service.serviceName) && !service.alreadyExists
            );

            // Process each service
            for (const service of servicesToProvision) {
                try {
                    if (!validatePublicKey(service.publicKey)) {
                        result.failed.push({
                            serviceName: service.serviceName,
                            error: 'Invalid public key format',
                        });
                        continue;
                    }

                    const formattedPublicKey = formatPublicKey(service.publicKey);
                    await createServicePrincipal(tenant, formattedPublicKey);
                    result.success.push(service.serviceName);
                } catch (error) {
                    result.failed.push({
                        serviceName: service.serviceName,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            }

            // The alreadyExists status will be automatically updated via useMemo
            // when the service principals data changes
        } finally {
            setBulkProvisioningLoading(false);
        }

        return result;
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

        // New functionality for known services
        knownServices,
        knownServicesLoading,
        knownServicesError,

        // Bulk provisioning functionality
        bulkProvisionServices,
        bulkProvisioningLoading,
    };
}
