import React from 'react';
import { PlaygroundPlayer } from '../../hooks/usePlaygroundPage';
import { Card, Typography } from '../atoms';
import { PlayerCard } from '../molecules';

export interface PlaygroundPlayersListProps {
    players: PlaygroundPlayer[];
    onChallengeClick: (player: PlaygroundPlayer) => void;
    onChallengeStatusClick: (player: PlaygroundPlayer) => void;
}

export const PlaygroundPlayersList: React.FC<PlaygroundPlayersListProps> = ({
    players,
    onChallengeClick,
    onChallengeStatusClick,
}) => {
    return (
        <Card variant="game" size="lg">
            <div className="space-y-4">
                <div className="text-center">
                    <Typography variant="h2" className="text-xl font-semibold text-gray-900">
                        Players ({players.length})
                    </Typography>
                </div>

                {players.length === 0 ? (
                    <div className="text-center py-8">
                        <Typography variant="body" className="text-gray-600">
                            No players have joined yet. Share the code to invite friends!
                        </Typography>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {players.map(player => (
                            <PlayerCard
                                key={player.playerId}
                                player={player}
                                isCurrentPlayer={player.isCurrentPlayer}
                                onChallengeClick={onChallengeClick}
                                onChallengeStatusClick={() => onChallengeStatusClick(player)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}; 