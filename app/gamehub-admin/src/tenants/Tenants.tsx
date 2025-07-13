import { useState } from 'react';
import { Alert, Button, Icon } from '../components/atoms';
import { ConfirmModal, ListItem, PageHeader } from '../components/molecules';
import { ResourceList } from '../components/organisms';
import { TenantViewModel, useTenants } from './useTenants';

function Tenants() {
    const { tenants, loading, error, addTenant, canAddTenant } = useTenants();
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleAddTenant = () => {
        addTenant();
        setIsModalOpen(false);
    };

    const addTenantButton = (
        <Button
            onClick={() => setIsModalOpen(true)}
            disabled={!canAddTenant}
            icon="add"
            variant="primary"
            size="md"
        >
            Add Tenant
        </Button>
    );

    const renderTenantItem = (tenant: TenantViewModel) => (
        <ListItem
            key={tenant.hash}
            action={
                <Button
                    onClick={() => copyToClipboard(JSON.stringify(tenant.publicKey), tenant.hash)}
                    variant="secondary"
                    size="sm"
                    icon={copiedId === tenant.hash ? undefined : 'edit'}
                >
                    {copiedId === tenant.hash ? (
                        <>
                            <Icon name="info" className="text-green-500 mr-2" size={16} />
                            Copied
                        </>
                    ) : (
                        'Copy Key'
                    )}
                </Button>
            }
        >
            <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Tenant ID:{' '}
                    <span className="font-mono">
                        {tenant.hash ? tenant.hash.substring(0, 7) : ''}
                    </span>
                </div>
                <div className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                    Created by:{' '}
                    <span className="font-mono">
                        {tenant.publicKey ? tenant.publicKey.substring(28, 48) : ''}...
                    </span>
                </div>
            </div>
        </ListItem>
    );

    return (
        <div>
            <PageHeader
                title="Tenants"
                description="Manage tenants in your GameHub instance"
                action={addTenantButton}
            />

            {error && <Alert variant="error" title="Error" message={error.message} />}

            <ResourceList
                items={tenants}
                isError={!!error}
                isLoading={loading}
                emptyState={{
                    iconName: 'info',
                    title: 'No tenants found',
                    description: 'Create a tenant to get started with GameHub.',
                    action: (
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            disabled={!canAddTenant}
                            variant="primary"
                        >
                            Create tenant
                        </Button>
                    ),
                }}
                renderItem={renderTenantItem}
                keyExtractor={(tenant) => tenant.hash}
            />

            <ConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleAddTenant}
                title="Create New Tenant"
                confirmText="Create Tenant"
                cancelText="Cancel"
            >
                <p className="text-sm text-gray-500">
                    Are you sure you want to create a new tenant? This will create a new isolated
                    environment within your GameHub instance.
                </p>
            </ConfirmModal>
        </div>
    );
}

export default Tenants;
