import React from 'react';

export interface LoadingIndicatorProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'spinner' | 'dots' | 'pulse';
    text?: string;
    className?: string;
    fullWidth?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
    size = 'md',
    variant = 'spinner',
    text,
    className = '',
    fullWidth = false,
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12',
    };

    const containerClasses = [
        'flex items-center justify-center',
        fullWidth ? 'w-full' : '',
        className,
    ].filter(Boolean).join(' ');

    const renderSpinner = () => (
        <svg
            className={`animate-spin ${sizeClasses[size]}`}
            fill="none"
            viewBox="0 0 24 24"
            aria-label="Loading"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );

    const renderDots = () => (
        <div className={`flex space-x-1 ${sizeClasses[size]}`}>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
    );

    const renderPulse = () => (
        <div className={`${sizeClasses[size]} bg-current rounded-full animate-pulse`} />
    );

    const renderLoadingElement = () => {
        switch (variant) {
            case 'dots':
                return renderDots();
            case 'pulse':
                return renderPulse();
            case 'spinner':
            default:
                return renderSpinner();
        }
    };

    return (
        <div className={containerClasses}>
            <div className="flex flex-col items-center space-y-2">
                {renderLoadingElement()}
                {text && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {text}
                    </span>
                )}
            </div>
        </div>
    );
}; 