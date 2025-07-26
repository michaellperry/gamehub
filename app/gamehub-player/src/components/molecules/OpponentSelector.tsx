import React from 'react';
import { Typography, SelectableCard } from '../atoms';
import { PlaygroundPlayer } from '../../hooks/usePlaygroundPage';

export interface OpponentSelectorProps {
    availableOpponents: PlaygroundPlayer[];
    selectedOpponent: PlaygroundPlayer | null;
    onOpponentSelect: (opponent: PlaygroundPlayer) => void;
}

export const OpponentSelector: React.FC<OpponentSelectorProps> = ({
    availableOpponents,
    selectedOpponent,
    onOpponentSelect,
}) => {
    if (availableOpponents.length === 0) {
        return (
            <div className="text-center py-4">
                <Typography variant="body" className="text-gray-500">
                    No available opponents in this playground.
                </Typography>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {availableOpponents.map((opponent) => (
                <SelectableCard
                    key={opponent.playerId}
                    isSelected={selectedOpponent?.playerId === opponent.playerId}
                    onClick={() => onOpponentSelect(opponent)}
                    icon="profile"
                    title={opponent.name}
                    subtitle={`Joined ${opponent.joinedAt.toLocaleDateString()}`}
                />
            ))}
        </div>
    );
}; 