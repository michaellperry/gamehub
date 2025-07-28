import React from 'react';
import { Icon, type IconName } from './Icon';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'achievement' | 'rank';

export interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    size?: 'sm' | 'md' | 'lg';
    icon?: string;
    iconPosition?: 'left' | 'right';
    className?: string;
    onClick?: () => void;
    interactive?: boolean;
    pulse?: boolean;
    glow?: boolean;
}

const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    primary: 'bg-primary-100 text-primary-800',
    achievement: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
    rank: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
};

const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
};

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'md',
    icon,
    iconPosition = 'left',
    className = '',
    onClick,
    interactive = false,
    pulse = false,
    glow = false,
}) => {
    const baseClasses = 'inline-flex items-center font-medium rounded-full';

    const interactiveClasses = interactive ? 'cursor-pointer hover:scale-105 transition-transform duration-200' : '';
    const pulseClasses = pulse ? 'animate-pulse' : '';
    const glowClasses = glow ? 'shadow-lg' : '';

    const classes = [
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        interactiveClasses,
        pulseClasses,
        glowClasses,
        className,
    ].filter(Boolean).join(' ');

    const handleClick = () => {
        if (interactive && onClick) {
            onClick();
        }
    };

    return (
        <span
            className={classes}
            onClick={handleClick}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
        >
            {icon && iconPosition === 'left' && (
                <Icon name={icon as IconName} size="xs" className="mr-1" />
            )}

            {children}

            {icon && iconPosition === 'right' && (
                <Icon name={icon as IconName} size="xs" className="ml-1" />
            )}
        </span>
    );
}; 