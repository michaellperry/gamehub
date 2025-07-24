import React from 'react';
import { SelectableCard } from '../atoms';
import { PlaygroundPlayer } from '../../hooks/usePlaygroundPage';

export interface GameStarterSelectorProps {
    challengerName: string;
    selectedOpponent: PlaygroundPlayer;
    challengerStarts: boolean;
    onStarterChange: (challengerStarts: boolean) => void;
}

export const GameStarterSelector: React.FC<GameStarterSelectorProps> = ({
    challengerName,
    selectedOpponent,
    challengerStarts,
    onStarterChange,
}) => {
    return (
        <div className="space-y-2">
            <SelectableCard
                isSelected={challengerStarts}
                onClick={() => onStarterChange(true)}
                icon="play"
                title={`I start (${challengerName})`}
                subtitle="You'll make the first move"
            />
            <SelectableCard
                isSelected={!challengerStarts}
                onClick={() => onStarterChange(false)}
                icon="play"
                title={`${selectedOpponent.name} starts`}
                subtitle="They'll make the first move"
            />
        </div>
    );
}; 