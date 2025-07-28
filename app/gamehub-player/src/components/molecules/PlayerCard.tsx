import React from 'react';
import { PlaygroundPlayer } from '../../hooks/usePlaygroundPage';
import { Button, Icon, Typography } from '../atoms';
import { ChallengeStatus } from './ChallengeStatus';

export interface PlayerCardProps {
    player: PlaygroundPlayer;
    isCurrentPlayer: boolean;
    onChallengeClick?: (player: PlaygroundPlayer) => void;
    className?: string;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
    player,
    isCurrentPlayer,
    onChallengeClick,
    className = '',
}) => {
    const handleChallengeClick = () => {
        if (onChallengeClick && !isCurrentPlayer) {
            onChallengeClick(player);
        }
    };

    return (
        <div className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ${className}`}>
            <div className="flex items-center space-x-3">
                <Icon name="profile" size="sm" className="text-gray-500" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                        <Typography variant="body" className="font-medium truncate">
                            {player.name}
                        </Typography>
                        {isCurrentPlayer && (
                            <Typography variant="body-sm" className="text-primary-600 font-medium">
                                (That's you!)
                            </Typography>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                {/* Challenge Status Indicator */}
                {player.isChallengePending && (
                    <ChallengeStatus
                        type="pending"
                        size="sm"
                        pulse={true}
                    />
                )}

                {/* Challenge Button */}
                {!isCurrentPlayer && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleChallengeClick}
                        disabled={player.isChallengePending}
                    >
                        Challenge
                    </Button>
                )}
            </div>
        </div>
    );
}; 