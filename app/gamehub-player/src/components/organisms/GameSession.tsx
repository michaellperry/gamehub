import React from 'react';
import { GameStatus, GameStatusType } from '../molecules/GameStatus';
import { PlayerAvatar } from '../molecules/PlayerAvatar';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Alert } from '../atoms/Alert';

export interface Player {
    id: string;
    name: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away' | 'busy' | 'in-game' | 'ready' | 'spectating';
    level?: number;
    rank?: string;
    isHost: boolean;
    isReady: boolean;
    isSpectating: boolean;
    score?: number;
}

export interface GameSessionProps {
    id: string;
    title: string;
    status: GameStatusType;
    players: Player[];
    maxPlayers: number;
    gameTime?: number;
    roundNumber?: number;
    totalRounds?: number;
    isHost: boolean;
    currentPlayerId: string;
    onReady?: () => void;
    onLeave?: () => void;
    onStart?: () => void;
    onKickPlayer?: (playerId: string) => void;
    className?: string;
}

export const GameSession: React.FC<GameSessionProps> = ({
    id,
    title,
    status,
    players,
    maxPlayers,
    gameTime,
    roundNumber,
    totalRounds,
    isHost,
    currentPlayerId,
    onReady,
    onLeave,
    onStart,
    onKickPlayer,
    className = '',
}) => {
    const currentPlayer = players.find(p => p.id === currentPlayerId);
    const readyPlayers = players.filter(p => p.isReady).length;
    const canStart = isHost && readyPlayers >= maxPlayers && status === 'waiting';

    return (
        <div className={`bg-gray-50 min-h-screen ${className}`}>
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                            <p className="text-gray-600">Game Session #{id}</p>
                        </div>

                        <div className="flex items-center space-x-3">
                            {currentPlayer && !currentPlayer.isReady && status === 'waiting' && (
                                <Button
                                    variant="success"
                                    icon="ready"
                                    onClick={onReady}
                                >
                                    Ready
                                </Button>
                            )}

                            {isHost && canStart && (
                                <Button
                                    variant="primary"
                                    icon="play"
                                    onClick={onStart}
                                >
                                    Start Game
                                </Button>
                            )}

                            <Button
                                variant="danger"
                                icon="leave"
                                onClick={onLeave}
                            >
                                Leave
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Game Status */}
                    <div className="lg:col-span-2">
                        <GameStatus
                            status={status}
                            players={players.map(p => ({
                                id: p.id,
                                name: p.name,
                                ready: p.isReady,
                                connected: p.status !== 'offline',
                            }))}
                            maxPlayers={maxPlayers}
                            gameTime={gameTime}
                            roundNumber={roundNumber}
                            totalRounds={totalRounds}
                        />
                    </div>

                    {/* Player List */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Players</h2>
                            <span className="text-sm text-gray-500">
                                {players.length}/{maxPlayers}
                            </span>
                        </div>

                        <div className="space-y-2">
                            {players.map((player) => (
                                <div key={player.id} className="relative">
                                    <PlayerAvatar
                                        id={player.id}
                                        name={player.name}
                                        avatar={player.avatar}
                                        status={player.status}
                                        level={player.level}
                                        rank={player.rank}
                                        isHost={player.isHost}
                                        isReady={player.isReady}
                                        isSpectating={player.isSpectating}
                                        score={player.score}
                                        interactive={player.id !== currentPlayerId}
                                        onClick={() => {
                                            // Handle player click (e.g., show profile)
                                        }}
                                    />

                                    {isHost && player.id !== currentPlayerId && (
                                        <button
                                            onClick={() => onKickPlayer?.(player.id)}
                                            className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors duration-200"
                                            title="Kick player"
                                        >
                                            <Icon name="kick" size="xs" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {players.length < maxPlayers && (
                            <div className="mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-center">
                                <Icon name="plus" size="md" className="text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">
                                    Waiting for {maxPlayers - players.length} more players
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Game Controls */}
                {status === 'active' && (
                    <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Controls</h3>
                        <div className="flex items-center space-x-4">
                            <Button variant="primary" icon="pause">
                                Pause
                            </Button>
                            <Button variant="secondary" icon="settings">
                                Settings
                            </Button>
                            <Button variant="danger" icon="stop">
                                End Game
                            </Button>
                        </div>
                    </div>
                )}

                {/* Alerts */}
                {status === 'waiting' && readyPlayers < maxPlayers && (
                    <div className="mt-6">
                        <Alert
                            variant="warning"
                            title="Waiting for Players"
                            autoDismiss={false}
                        >
                            {maxPlayers - readyPlayers} more players need to be ready before the game can start.
                        </Alert>
                    </div>
                )}

                {status === 'active' && (
                    <div className="mt-6">
                        <Alert
                            variant="success"
                            title="Game Active"
                            autoDismiss={false}
                        >
                            The game is now in progress. Good luck!
                        </Alert>
                    </div>
                )}
            </div>
        </div>
    );
}; 