import React from 'react';
import { Badge } from '../atoms/Badge';
import { Icon } from '../atoms/Icon';

export type GameStatusType = 'waiting' | 'active' | 'finished' | 'lobby' | 'paused' | 'loading';

export interface GameStatusProps {
    status: GameStatusType;
    players: {
        id: string;
        name: string;
        ready: boolean;
        connected: boolean;
    }[];
    maxPlayers: number;
    gameTime?: number; // in seconds
    roundNumber?: number;
    totalRounds?: number;
    className?: string;
}

const statusConfig = {
    waiting: {
        color: 'warning',
        icon: 'waiting',
        text: 'Waiting for players',
    },
    active: {
        color: 'success',
        icon: 'active',
        text: 'Game in progress',
    },
    finished: {
        color: 'default',
        icon: 'finished',
        text: 'Game finished',
    },
    lobby: {
        color: 'info',
        icon: 'waiting',
        text: 'In lobby',
    },
    paused: {
        color: 'warning',
        icon: 'pause',
        text: 'Game paused',
    },
    loading: {
        color: 'info',
        icon: 'loading',
        text: 'Loading game',
    },
};

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const GameStatus: React.FC<GameStatusProps> = ({
    status,
    players,
    maxPlayers,
    gameTime,
    roundNumber,
    totalRounds,
    className = '',
}) => {
    const config = statusConfig[status];
    const readyPlayers = players.filter(p => p.ready).length;
    const connectedPlayers = players.filter(p => p.connected).length;

    return (
        <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <Icon name={config.icon as any} size="md" className="text-gray-600" />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {config.text}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {connectedPlayers} of {maxPlayers} players connected
                        </p>
                    </div>
                </div>

                <Badge variant={config.color as any} icon={config.icon}>
                    {status}
                </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Ready Players:</span>
                        <span className="text-sm font-medium text-gray-900">
                            {readyPlayers}/{maxPlayers}
                        </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(readyPlayers / maxPlayers) * 100}%` }}
                        />
                    </div>
                </div>

                {gameTime !== undefined && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Game Time:</span>
                            <span className="text-sm font-medium text-gray-900">
                                {formatTime(gameTime)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {roundNumber && totalRounds && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Round:</span>
                        <span className="text-sm font-medium text-gray-900">
                            {roundNumber} of {totalRounds}
                        </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(roundNumber / totalRounds) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {status === 'waiting' && readyPlayers < maxPlayers && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center space-x-2">
                        <Icon name="warning" size="sm" className="text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                            Waiting for {maxPlayers - readyPlayers} more players to be ready
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}; 