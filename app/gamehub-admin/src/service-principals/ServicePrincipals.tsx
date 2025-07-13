import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button } from '../components/atoms';
import { ListItem, Modal, ModalFooter, PageHeader } from '../components/molecules';
import { ResourceList } from '../components/organisms';
import { useServicePrincipals } from './useServicePrincipals';

function ServicePrincipals() {
    const { isConfigured, servicePrincipals, error, canAddServicePrincipal, addServicePrincipal } =
        useServicePrincipals();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [publicKey, setPublicKey] = useState('');

    const handleAddServicePrincipal = () => {
        if (publicKey.trim()) {
            addServicePrincipal(publicKey);
            setIsModalOpen(false);
            setPublicKey('');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setPublicKey('');
    };

    const addServicePrincipalButton = (
        <Button
            onClick={() => setIsModalOpen(true)}
            disabled={!canAddServicePrincipal}
            icon="add"
            variant="primary"
        >
            Add Service Principal
        </Button>
    );

    // Function to truncate the public key for display
    const truncatePublicKey = (key: string) => {
        if (!key) return '';
        const lines = key.split('\n');
        if (lines.length <= 2) return key;

        // Return first line, ellipsis, and last line
        return `${lines[0]}${lines[1]}...${lines[lines.length - 2]}`;
    };

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
        });
    };

    const renderServicePrincipalItem = (servicePrincipal: {
        id: string;
        publicKey: string;
        createdAt: string | Date;
    }) => (
        <ListItem key={servicePrincipal.id}>
            <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {truncatePublicKey(servicePrincipal.publicKey)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    Created: {formatDate(servicePrincipal.createdAt)}
                </div>
            </div>
        </ListItem>
    );

    return (
        <>
            <PageHeader
                title="Service Principals"
                description="Manage service principals for your application"
                action={addServicePrincipalButton}
            />

            {error && <Alert variant="error" title="Error" message={error.message} />}

            {!isConfigured && (
                <Alert
                    variant="warning"
                    title="Configuration Required"
                    message={
                        <div>
                            You need to set the VITE_TENANT_PUBLIC_KEY to a valid public key. Go to{' '}
                            <Link
                                to="/tenants"
                                className="font-medium text-yellow-800 underline hover:text-yellow-900"
                            >
                                Tenants
                            </Link>{' '}
                            to get started.
                        </div>
                    }
                />
            )}

            <ResourceList
                items={servicePrincipals}
                isError={!!error}
                isLoading={!servicePrincipals}
                emptyState={{
                    iconName: 'user',
                    title: 'No service principals found',
                    description: 'Get started by adding your first service principal.',
                    action: (
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            disabled={!canAddServicePrincipal}
                            variant="primary"
                        >
                            Add Service Principal
                        </Button>
                    ),
                }}
                renderItem={renderServicePrincipalItem}
                keyExtractor={(servicePrincipal) => servicePrincipal.id}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title="Add Service Principal"
                size="md"
                footer={
                    <ModalFooter
                        onConfirm={handleAddServicePrincipal}
                        onCancel={closeModal}
                        confirmText="Save"
                        cancelText="Cancel"
                        isConfirmDisabled={!publicKey.trim()}
                    />
                }
            >
                <div className="mt-4">
                    <label htmlFor="public-key" className="block text-sm font-medium text-gray-700">
                        Public Key
                    </label>
                    <div className="mt-1">
                        <textarea
                            id="public-key"
                            name="public-key"
                            value={publicKey}
                            onChange={(e) => setPublicKey(e.target.value)}
                            placeholder="Paste the service principal public key here"
                            rows={8}
                            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
}

export default ServicePrincipals;
