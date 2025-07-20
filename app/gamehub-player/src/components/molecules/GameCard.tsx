import React from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { Icon } from '../atoms/Icon';
import { Avatar } from '../atoms/Avatar';

export interface GameCardProps {
    id: string;
    title: string;
    description?: string;
    image?: string;
    players: {
        id: string;
        name: string;
        avatar?: string;
        status: 'online' | 'offline' | 'away' | 'busy' | 'in-game' | 'ready' | 'spectating';
    }[];
    maxPlayers: number;
    gameStatus: 'waiting' | 'active' | 'finished' | 'lobby';
    gameType?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    estimatedDuration?: string;
    tags?: string[];
    onClick?: () => void;
    className?: string;
}

const statusColors = {
    waiting: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    finished: 'bg-gray-100 text-gray-800',
    lobby: 'bg-blue-100 text-blue-800',
};

const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
};

export const GameCard: React.FC<GameCardProps> = ({
    id,
    title,
    description,
    image,
    players,
    maxPlayers,
    gameStatus,
    gameType,
    difficulty,
    estimatedDuration,
    tags,
    onClick,
    className = '',
}) => {
    const playerCount = players.length;
    const isFull = playerCount >= maxPlayers;
    const canJoin = gameStatus === 'waiting' || gameStatus === 'lobby';

    return (
        <Card
            variant="game"
            interactive={canJoin && !isFull}
            onClick={onClick}
            className={className}
            header={
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {title}
                    </h3>
                    <Badge
                        variant={gameStatus === 'active' ? 'success' : 'default'}
                        icon={gameStatus}
                    >
                        {gameStatus}
                    </Badge>
                </div>
            }
            image={image}
            imageAlt={title}
            footer={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Icon name="friends" size="sm" className="text-gray-500" />
                        <span className="text-sm text-gray-600">
                            {playerCount}/{maxPlayers} players
                        </span>
                    </div>

                    {canJoin && !isFull && (
                        <Badge variant="primary" icon="join">
                            Join
                        </Badge>
                    )}

                    {isFull && (
                        <Badge variant="warning" icon="close">
                            Full
                        </Badge>
                    )}
                </div>
            }
        >
            <div className="space-y-3">
                {description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                        {description}
                    </p>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {gameType && (
                            <Badge variant="info" size="sm">
                                {gameType}
                            </Badge>
                        )}

                        {difficulty && (
                            <Badge variant="default" size="sm">
                                {difficulty}
                            </Badge>
                        )}

                        {estimatedDuration && (
                            <div className="flex items-center text-xs text-gray-500">
                                <Icon name="clock" size="xs" className="mr-1" />
                                {estimatedDuration}
                            </div>
                        )}
                    </div>
                </div>

                {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="default" size="sm">
                                {tag}
                            </Badge>
                        ))}
                        {tags.length > 3 && (
                            <Badge variant="default" size="sm">
                                +{tags.length - 3}
                            </Badge>
                        )}
                    </div>
                )}

                <div className="flex items-center space-x-2">
                    <div className="flex -space-x-2">
                        {players.slice(0, 4).map((player, index) => (
                            <Avatar
                                key={player.id}
                                src={player.avatar}
                                playerName={player.name}
                                status={player.status}
                                size="sm"
                                className="border-2 border-white"
                            />
                        ))}
                        {players.length > 4 && (
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs text-gray-600 border-2 border-white">
                                +{players.length - 4}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-right">
                        <span className="text-xs text-gray-500">
                            {playerCount} of {maxPlayers} players
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    );
}; 