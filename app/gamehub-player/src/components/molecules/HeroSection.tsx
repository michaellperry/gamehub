import React from 'react';
import { Icon } from '../atoms';
import { Typography } from '../atoms/Typography';

export interface HeroSectionProps {
    icon?: string;
    title: string;
    subtitle?: string;
    className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
    icon,
    title,
    subtitle,
    className = '',
}) => {
    return (
        <div className={`text-center mb-8 ${className}`}>
            {icon && (
                <Icon
                    name={icon as any}
                    size="xl"
                    className="text-primary-600 mx-auto mb-4"
                />
            )}
            <Typography variant="h1" className="mb-4">
                {title}
            </Typography>
            {subtitle && (
                <Typography variant="body" className="text-xl">
                    {subtitle}
                </Typography>
            )}
        </div>
    );
}; 