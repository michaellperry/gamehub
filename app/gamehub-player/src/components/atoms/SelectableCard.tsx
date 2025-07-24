import React from 'react';
import { Icon, Typography } from './index';
import { IconName } from './Icon';

export interface SelectableCardProps {
    isSelected: boolean;
    onClick: () => void;
    icon: IconName;
    title: string;
    subtitle?: string;
    disabled?: boolean;
}

export const SelectableCard: React.FC<SelectableCardProps> = ({
    isSelected,
    onClick,
    icon,
    title,
    subtitle,
    disabled = false,
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${isSelected
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <div className="flex items-center space-x-3">
                <Icon name={icon} size="sm" className="text-gray-500" />
                <div>
                    <Typography variant="body" className="font-medium">
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body-sm">
                            {subtitle}
                        </Typography>
                    )}
                </div>
            </div>
        </button>
    );
}; 