import React from 'react';
import { Card, Icon } from '../atoms';
import type { IconName } from '../atoms';

export interface EmptyStateProps {
    iconName: IconName;
    title: string;
    description: string;
    action?: React.ReactNode;
    className?: string;
}

function EmptyState({ iconName, title, description, action, className = '' }: EmptyStateProps) {
    return (
        <Card.Body className={`py-12 ${className}`}>
            <div className="text-center">
                <Icon name={iconName} size={48} className="mx-auto text-gray-400" />
                <h3 className="mt-2 heading-3">{title}</h3>
                <p className="mt-1 text-body">{description}</p>
                {action && <div className="mt-6">{action}</div>}
            </div>
        </Card.Body>
    );
}

export default EmptyState;
