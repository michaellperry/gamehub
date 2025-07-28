import React from 'react';

export interface CenteredContentProps {
    children: React.ReactNode;
    className?: string;
}

export const CenteredContent: React.FC<CenteredContentProps> = ({
    children,
    className = '',
}) => {
    return (
        <div className={`text-center ${className}`}>
            {children}
        </div>
    );
}; 