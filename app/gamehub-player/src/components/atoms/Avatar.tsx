import React from 'react';
import { Icon, type IconName } from './Icon';

export type PlayerStatus = 'online' | 'offline' | 'away' | 'busy' | 'in-game' | 'ready' | 'spectating';

export interface AvatarProps {
    src?: string;
    alt?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    status?: PlayerStatus;
    showStatus?: boolean;
    className?: string;
    onClick?: () => void;
    interactive?: boolean;
    playerName?: string;
    level?: number;
    rank?: string;
}

const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    'in-game': 'bg-blue-500',
    ready: 'bg-green-500',
    spectating: 'bg-purple-500',
};

const statusIcons = {
    online: 'online',
    offline: 'offline',
    away: 'away',
    busy: 'busy',
    'in-game': 'active',
    ready: 'ready',
    spectating: 'spectate',
};

const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
};

const statusSizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
};

export const Avatar: React.FC<AvatarProps> = ({
    src,
    alt = 'Player avatar',
    size = 'md',
    status = 'offline',
    showStatus = true,
    className = '',
    onClick,
    interactive = false,
    playerName,
    level,
    rank,
}) => {
    const avatarClasses = [
        sizeClasses[size],
        'rounded-full object-cover border-2 border-gray-200',
        interactive ? 'cursor-pointer hover:scale-105 transition-transform duration-200' : '',
        className,
    ].filter(Boolean).join(' ');

    const statusClasses = [
        statusSizeClasses[size],
        'rounded-full border-2 border-white absolute bottom-0 right-0',
        statusColors[status],
    ].filter(Boolean).join(' ');

    const handleClick = () => {
        if (interactive && onClick) {
            onClick();
        }
    };

    return (
        <div className="relative inline-block">
            <div
                className="relative"
                onClick={handleClick}
                role={interactive ? 'button' : undefined}
                tabIndex={interactive ? 0 : undefined}
            >
                {src ? (
                    <img
                        src={src}
                        alt={alt}
                        className={avatarClasses}
                    />
                ) : (
                    <div className={`${avatarClasses} bg-gray-300 flex items-center justify-center text-gray-600 font-medium`}>
                        {playerName ? playerName.charAt(0).toUpperCase() : '?'}
                    </div>
                )}

                {showStatus && (
                    <div className={statusClasses}>
                        <Icon
                            name={statusIcons[status] as IconName}
                            size="xs"
                            className="text-white"
                        />
                    </div>
                )}

                {level && (
                    <div className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {level}
                    </div>
                )}

                {rank && (
                    <div className="absolute -bottom-1 -left-1 bg-yellow-500 text-white text-xs rounded-full px-1 py-0.5 font-bold">
                        {rank}
                    </div>
                )}
            </div>
        </div>
    );
}; 