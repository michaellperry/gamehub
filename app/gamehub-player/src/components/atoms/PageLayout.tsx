import React from 'react';

export interface PageLayoutProps {
    children: React.ReactNode;
    variant?: 'default' | 'hero' | 'minimal';
    className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
    children,
    variant = 'default',
    className = '',
}) => {
    const baseClasses = 'min-h-screen';

    const variantClasses = {
        default: 'bg-gray-50',
        hero: 'bg-gradient-to-br from-gray-50 to-gray-100',
        minimal: 'bg-white',
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