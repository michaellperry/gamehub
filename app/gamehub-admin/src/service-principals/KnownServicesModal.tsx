import React, { useState, useEffect } from 'react';
import { Alert, Button, LoadingIndicator } from '../components/atoms';
import { Modal } from '../components/molecules';
import { KnownService, BulkProvisioningResult } from './useServicePrincipals';

export interface KnownServicesModalProps {
    isOpen: boolean;
    onClose: () => void;
    knownServices: KnownService[];
    knownServicesLoading: boolean;
    knownServicesError: Error | null;
    bulkProvisioningLoading: boolean;
    onProvisionServices: (serviceNames: string[]) => Promise<BulkProvisioningResult>;
}

interface ServiceItemProps {
    service: KnownService;
    isSelected: boolean;
    onToggle: (serviceName: string) => void;
}

const ServiceItem: React.FC<ServiceItemProps> = ({ service, isSelected, onToggle }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatPublicKey = (publicKey: string) => {
        const lines = publicKey.split('\n');
        return lines.join('\n');
    };

    const truncatePublicKey = (key: string) => {
        if (!key) return '';
        const lines = key.split('\n');
        if (lines.length <= 2) return key;
        return `${lines[0]}\n${lines[1]}...${lines[lines.length - 2]}`;
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3">
            <div className="flex items-start space-x-3">
                <div className="flex items-center h-5">
                    <input
                        id={`service-${service.serviceName}`}
                        type="checkbox"
                        checked={isSelected}
                        disabled={service.alreadyExists}
                        onChange={() => onToggle(service.serviceName)}
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <label
                                htmlFor={`service-${service.serviceName}`}
                                className={`text-sm font-medium ${
                                    service.alreadyExists
                                        ? 'text-gray-400 dark:text-gray-500'
                                        : 'text-gray-900 dark:text-gray-100'
                                } ${service.alreadyExists ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                {service.serviceName}
                            </label>
                            {service.alreadyExists && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                                    Already exists
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 focus:outline-none"
                        >
                            {isExpanded ? 'Hide' : 'Show'} public key
                        </button>
                    </div>

                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Last checked: {new Date(service.lastChecked).toLocaleString()}
                        <span className="ml-2">Response time: {service.responseTime}ms</span>
                    </div>

                    {!isExpanded && (
                        <div className="mt-2 text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                            {truncatePublicKey(service.publicKey)}
                        </div>
                    )}

                    {isExpanded && (
                        <div className="mt-2">
                            <div className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded border max-h-40 overflow-y-auto">
                                <pre className="whitespace-pre-wrap break-all">
                                    {formatPublicKey(service.publicKey)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const KnownServicesModal: React.FC<KnownServicesModalProps> = ({
    isOpen,
    onClose,
    knownServices,
    knownServicesLoading,
    knownServicesError,
    bulkProvisioningLoading,
    onProvisionServices,
}) => {
    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
    const [provisioningResult, setProvisioningResult] = useState<BulkProvisioningResult | null>(
        null
    );

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setSelectedServices(new Set());
            setProvisioningResult(null);
        }
    }, [isOpen]);

    const availableServices = knownServices.filter((service) => !service.alreadyExists);
    const existingServices = knownServices.filter((service) => service.alreadyExists);

    const handleToggleService = (serviceName: string) => {
        const newSelected = new Set(selectedServices);
        if (newSelected.has(serviceName)) {
            newSelected.delete(serviceName);
        } else {
            newSelected.add(serviceName);
        }
        setSelectedServices(newSelected);
    };

    const handleSelectAll = () => {
        const allAvailable = new Set(availableServices.map((s) => s.serviceName));
        setSelectedServices(allAvailable);
    };

    const handleDeselectAll = () => {
        setSelectedServices(new Set());
    };

    const handleProvision = async () => {
        if (selectedServices.size === 0) return;

        try {
            const result = await onProvisionServices(Array.from(selectedServices));
            setProvisioningResult(result);

            // If all succeeded, close modal after a brief delay
            if (result.failed.length === 0) {
                setTimeout(() => {
                    onClose();
                }, 1500);
            }
        } catch (error) {
            console.error('Error provisioning services:', error);
        }
    };

    const handleClose = () => {
        setSelectedServices(new Set());
        setProvisioningResult(null);
        onClose();
    };

    const renderContent = () => {
        if (knownServicesLoading) {
            return <LoadingIndicator />;
        }

        if (knownServicesError) {
            return (
                <Alert
                    variant="error"
                    title="Error Loading Services"
                    message={knownServicesError.message}
                />
            );
        }

        if (knownServices.length === 0) {
            return (
                <Alert
                    variant="info"
                    title="No Services Found"
                    message="No known services are available from the relay service."
                />
            );
        }

        if (availableServices.length === 0) {
            return (
                <Alert
                    variant="info"
                    title="All Services Already Exist"
                    message="All known services have already been provisioned as service principals."
                />
            );
        }

        return (
            <div className="space-y-4">
                {/* Bulk selection controls */}
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedServices.size} of {availableServices.length} services selected
                    </div>
                    <div className="space-x-2">
                        <Button
                            variant="text"
                            size="sm"
                            onClick={handleSelectAll}
                            disabled={selectedServices.size === availableServices.length}
                        >
                            Select All
                        </Button>
                        <Button
                            variant="text"
                            size="sm"
                            onClick={handleDeselectAll}
                            disabled={selectedServices.size === 0}
                        >
                            Deselect All
                        </Button>
                    </div>
                </div>

                {/* Available services */}
                {availableServices.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                            Available Services ({availableServices.length})
                        </h4>
                        {availableServices.map((service) => (
                            <ServiceItem
                                key={service.serviceName}
                                service={service}
                                isSelected={selectedServices.has(service.serviceName)}
                                onToggle={handleToggleService}
                            />
                        ))}
                    </div>
                )}

                {/* Existing services */}
                {existingServices.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                            Already Provisioned ({existingServices.length})
                        </h4>
                        {existingServices.map((service) => (
                            <ServiceItem
                                key={service.serviceName}
                                service={service}
                                isSelected={false}
                                onToggle={() => {}} // No-op for existing services
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Provision Known Services"
            size="lg"
            footer={
                !knownServicesLoading &&
                !knownServicesError &&
                availableServices.length > 0 && (
                    <div className="sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <Button
                            variant="primary"
                            onClick={handleProvision}
                            disabled={selectedServices.size === 0 || bulkProvisioningLoading}
                            isLoading={bulkProvisioningLoading}
                            className="sm:col-start-2"
                        >
                            {bulkProvisioningLoading
                                ? 'Provisioning...'
                                : `Provision ${selectedServices.size} Service${selectedServices.size !== 1 ? 's' : ''}`}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleClose}
                            className="mt-3 sm:mt-0 sm:col-start-1"
                            disabled={bulkProvisioningLoading}
                        >
                            Cancel
                        </Button>
                    </div>
                )
            }
        >
            <div className="mt-4">
                {/* Provisioning result */}
                {provisioningResult && (
                    <div className="mb-4 space-y-2">
                        {provisioningResult.success.length > 0 && (
                            <Alert
                                variant="success"
                                title="Successfully Provisioned"
                                message={`${provisioningResult.success.length} service${provisioningResult.success.length !== 1 ? 's' : ''} provisioned: ${provisioningResult.success.join(', ')}`}
                            />
                        )}
                        {provisioningResult.failed.length > 0 && (
                            <Alert
                                variant="error"
                                title="Provisioning Failed"
                                message={
                                    <div>
                                        <p className="mb-2">
                                            Failed to provision {provisioningResult.failed.length}{' '}
                                            service
                                            {provisioningResult.failed.length !== 1 ? 's' : ''}:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1">
                                            {provisioningResult.failed.map((failure, index) => (
                                                <li key={index} className="text-sm">
                                                    <strong>{failure.serviceName}:</strong>{' '}
                                                    {failure.error}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                }
                            />
                        )}
                    </div>
                )}

                {renderContent()}
            </div>
        </Modal>
    );
};

export default KnownServicesModal;
