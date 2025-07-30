import { BaseGameData } from './GameInterface';
import { FleetDuelGame, FleetDuelGameData } from './FleetDuelGame';

// Extended interface for Fleet Duel specific data
export interface FleetDuelGameInterface extends BaseGameData {
    fleetDuelState: {
        phase: 'ship-placement' | 'attack' | 'completed';
        playerFleet?: any;
        opponentFleet?: any;
        isFleetLocked?: boolean;
    };
}

interface FleetDuelInterfaceProps {
    gameData: FleetDuelGameInterface;
    isMakingMove: boolean;
    onAction: (...args: any[]) => Promise<void>;
}

export function FleetDuelInterface({
    gameData,
    isMakingMove,
    onAction
}: FleetDuelInterfaceProps) {
    return (
        <FleetDuelGame
            gameData={gameData as FleetDuelGameData}
            onAction={onAction}
            isMakingMove={isMakingMove}
        />
    );
}

export type { FleetDuelInterfaceProps };