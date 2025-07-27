import React from 'react';
import { Icon, type IconName } from './Icon';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'game-event';

export interface AlertProps {
    children: React.ReactNode;
    variant?: AlertVariant;
    title?: string;
    icon?: string;
    dismissible?: boolean;
    onDismiss?: () => void;
    className?: string;
    autoDismiss?: boolean;
    autoDismissDelay?: number;
}

const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    'game-event': 'bg-purple-50 border-purple-200 text-purple-800',
};

const variantIcons = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'error',
    'game-event': 'active',
};

export const Alert: React.FC<AlertProps> = ({
    children,
    variant = 'info',
    title,
    icon,
    dismissible = false,
    onDismiss,
    className = '',
    autoDismiss = false,
    autoDismissDelay = 5000,
}) => {
    const [isVisible, setIsVisible] = React.useState(true);

    React.useEffect(() => {
        if (autoDismiss && autoDismissDelay > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                onDismiss?.();
            }, autoDismissDelay);

            return () => clearTimeout(timer);
        }
    }, [autoDismiss, autoDismissDelay, onDismiss]);

    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss?.();
    };

    if (!isVisible) {
        return null;
    }

    const alertIcon = icon || variantIcons[variant];

    return (
        <div className={`border rounded-lg p-4 ${variantClasses[variant]} ${className}`}>
            <div className="flex items-start">
                {alertIcon && (
                    <div className="flex-shrink-0 mr-3">
                        <Icon
                            name={alertIcon as IconName}
                            size="md"
                            className="mt-0.5"
                        />
                    </div>
                )}

                <div className="flex-1">
                    {title && (
                        <h3 className="text-sm font-medium mb-1">
                            {title}
                        </h3>
                    )}

                    <div className="text-sm">
                        {children}
                    </div>
                </div>

                {dismissible && (
                    <div className="flex-shrink-0 ml-3">
                        <button
                            onClick={handleDismiss}
                            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                            <Icon name="close" size="sm" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}; 