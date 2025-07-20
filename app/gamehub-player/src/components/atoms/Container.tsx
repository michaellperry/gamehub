import React from 'react';

export interface ContainerProps {
    children: React.ReactNode;
    variant?: 'default' | 'hero' | 'content' | 'narrow';
    className?: string;
}

export const Container: React.FC<ContainerProps> = ({
    children,
    variant = 'default',
    className = '',
}) => {
    const baseClasses = 'mx-auto px-4 sm:px-6 lg:px-8';

    const variantClasses = {
        default: 'max-w-7xl',
        hero: 'max-w-7xl py-12',
        content: 'max-w-4xl py-8',
        narrow: 'max-w-2xl py-6',
    };

    const classes = [
        baseClasses,
        variantClasses[variant],
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classes}>
            {children}
        </div>
    );
}; 