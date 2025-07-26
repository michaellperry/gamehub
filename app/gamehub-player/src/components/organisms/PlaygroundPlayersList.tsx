import React from 'react';
import { PlaygroundPlayer } from '../../hooks/usePlaygroundPage';
import { Card, Typography, CenteredContent } from '../atoms';
import { PlayerCard } from '../molecules';

export interface PlaygroundPlayersListProps {
    players: PlaygroundPlayer[];
    onChallengeClick: (player: PlaygroundPlayer) => void;
}

export const PlaygroundPlayersList: React.FC<PlaygroundPlayersListProps> = ({
    players,
    onChallengeClick,
}) => {
    return (
        <Card variant="game" size="lg">
            <div className="space-y-4">
                <CenteredContent>
                    <Typography variant="h2" className="text-xl font-semibold text-gray-900">
                        Players ({players.length})
                    </Typography>
                </CenteredContent>

                {players.length === 0 ? (
                    <CenteredContent className="py-8">
                        <Typography variant="body" className="text-gray-600">
                            No players have joined yet. Share the code to invite friends!
                        </Typography>
                    </CenteredContent>
                ) : (
                    <div className="space-y-2">
                        {players.map(player => (
                            <PlayerCard
                                key={player.playerId}
                                player={player}
                                isCurrentPlayer={player.isCurrentPlayer}
                                onChallengeClick={onChallengeClick}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}; 