import React from 'react';
import { Icon } from './index';
import { IconName } from './Icon';

export interface IconButtonProps {
    icon: IconName;
    onClick: () => void;
    variant?: 'ghost' | 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
    'aria-label'?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
    icon,
    onClick,
    variant = 'ghost',
    size = 'md',
    disabled = false,
    className = '',
    'aria-label': ariaLabel,
}) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200';

    const variantClasses = {
        ghost: 'text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700',
        primary: 'text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20',
        secondary: 'text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700',
        danger: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20',
    };

    const sizeClasses = {
        sm: 'p-1',
        md: 'p-2',
        lg: 'p-3',
    };

    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

    const classes = [
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabledClasses,
        className,
    ].filter(Boolean).join(' ');

    const handleClick = () => {
        if (!disabled && onClick) {
            onClick();
        }
    };

    return (
        <button
            type="button"
            className={classes}
            onClick={handleClick}
            disabled={disabled}
            aria-label={ariaLabel}
        >
            <Icon name={icon} size={size} />
        </button>
    );
}; 