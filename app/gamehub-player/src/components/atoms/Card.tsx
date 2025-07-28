import React from 'react';

export interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'game' | 'player' | 'chat' | 'leaderboard';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    interactive?: boolean;
    selected?: boolean;
    className?: string;
    onClick?: () => void;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    image?: string;
    imageAlt?: string;
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    size = 'md',
    interactive = false,
    selected = false,
    className = '',
    onClick,
    header,
    footer,
    image,
    imageAlt,
}) => {
    const baseClasses = 'bg-white rounded-lg border transition-all duration-200';

    const variantClasses = {
        default: 'border-gray-200 shadow-sm hover:shadow-md',
        game: 'border-gray-200 shadow-lg hover:shadow-xl border-2 hover:border-primary-300',
        player: 'border-gray-200 shadow-md hover:shadow-lg',
        chat: 'border-gray-200 shadow-sm',
        leaderboard: 'border-gray-200 shadow-md',
    };

    const sizeClasses = {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
    };

    const interactiveClasses = interactive ? 'cursor-pointer' : '';
    const selectedClasses = selected ? 'ring-2 ring-primary-500 border-primary-500' : '';

    const classes = [
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        interactiveClasses,
        selectedClasses,
        className,
    ].filter(Boolean).join(' ');

    const handleClick = () => {
        if (interactive && onClick) {
            onClick();
        }
    };

    return (
        <div
            className={classes}
            onClick={handleClick}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
        >
            {image && (
                <div className="relative">
                    <img
                        src={image}
                        alt={imageAlt || ''}
                        className="w-full h-32 object-cover rounded-t-lg"
                    />
                </div>
            )}

            {header && (
                <div className="border-b border-gray-200 pb-3 mb-3">
                    {header}
                </div>
            )}

            <div className="flex-1">
                {children}
            </div>

            {footer && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                    {footer}
                </div>
            )}
        </div>
    );
}; 