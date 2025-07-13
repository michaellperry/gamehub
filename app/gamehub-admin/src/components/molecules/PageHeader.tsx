import React from 'react';

export interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

function PageHeader({ title, description, action, className = '' }: PageHeaderProps) {
    return (
        <div className={`sm:flex sm:items-center sm:justify-between mb-8 ${className}`}>
            <div>
                <h1 className="heading-1">{title}</h1>
                {description && <p className="mt-2 text-body">{description}</p>}
            </div>
            {action}
        </div>
    );
}

export default PageHeader;
