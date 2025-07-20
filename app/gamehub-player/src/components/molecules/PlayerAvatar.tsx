import React from 'react';
import { Avatar, AvatarProps, PlayerStatus } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { Icon } from '../atoms/Icon';

export interface PlayerAvatarProps {
    id: string;
    name: string;
    avatar?: string;
    status: PlayerStatus;
    level?: number;
    rank?: string;
    isHost?: boolean;
    isReady?: boolean;
    isSpectating?: boolean;
    score?: number;
    className?: string;
    onClick?: () => void;
    interactive?: boolean;
    showDetails?: boolean;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
    id,
    name,
    avatar,
    status,
    level,
    rank,
    isHost = false,
    isReady = false,
    isSpectating = false,
    score,
    className = '',
    onClick,
    interactive = false,
    showDetails = true,
}) => {
    return (
        <div className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 ${className}`}>
            <div className="relative">
                <Avatar
                    src={avatar}
                    playerName={name}
                    status={status}
                    size="md"
                    interactive={interactive}
                    onClick={onClick}
                    level={level}
                    rank={rank}
                />

                {isHost && (
                    <div className="absolute -top-1 -left-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        <Icon name="crown" size="xs" />
                    </div>
                )}

                {isReady && (
                    <div className="absolute -bottom-1 -left-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        <Icon name="check" size="xs" />
                    </div>
                )}

                {isSpectating && (
                    <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        <Icon name="spectate" size="xs" />
                    </div>
                )}
            </div>

            {showDetails && (
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                            {name}
                        </h4>

                        {isHost && (
                            <Badge variant="warning" size="sm" icon="crown">
                                Host
                            </Badge>
                        )}

                        {isReady && (
                            <Badge variant="success" size="sm" icon="check">
                                Ready
                            </Badge>
                        )}

                        {isSpectating && (
                            <Badge variant="info" size="sm" icon="spectate">
                                Spectating
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-2">
                            {level && (
                                <span className="text-xs text-gray-500">
                                    Level {level}
                                </span>
                            )}

                            {rank && (
                                <Badge variant="rank" size="sm">
                                    {rank}
                                </Badge>
                            )}
                        </div>

                        {score !== undefined && (
                            <span className="text-sm font-medium text-gray-900">
                                {score} pts
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}; 