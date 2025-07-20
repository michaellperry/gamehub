import React from 'react';
import { Card, Icon } from '../atoms';
import { Typography } from '../atoms/Typography';

export interface FeatureCardProps {
    icon: string;
    title: string;
    description: string;
    className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
    icon,
    title,
    description,
    className = '',
}) => {
    return (
        <Card variant="player" size="md" className={`text-center ${className}`}>
            <Icon
                name={icon as any}
                size="lg"
                className="text-primary-600 mx-auto mb-2"
            />
            <Typography variant="h4" className="mb-2">
                {title}
            </Typography>
            <Typography variant="body-sm">
                {description}
            </Typography>
        </Card>
    );
}; 