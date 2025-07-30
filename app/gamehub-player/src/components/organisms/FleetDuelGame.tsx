import { ShipPlacementPhase } from './ShipPlacementPhase';
import { BaseGameData } from './GameInterface';

interface FleetDuelGameData extends BaseGameData {
    fleetDuelState: {
        phase: 'ship-placement' | 'attack' | 'completed';
        playerFleet?: any;
        opponentFleet?: any;
        isFleetLocked?: boolean;
    };
}

interface FleetDuelGameProps {
    gameData: FleetDuelGameData;
    onAction: (...args: any[]) => Promise<void>;
    isMakingMove: boolean;
}

export function FleetDuelGame({
    gameData,
    onAction,
    isMakingMove
}: FleetDuelGameProps) {
    const handleLockFleet = async () => {
        await onAction('lock-fleet');
    };

    const renderPhase = () => {
        switch (gameData.fleetDuelState.phase) {
            case 'ship-placement':
                return (
                    <ShipPlacementPhase
                        challengerName={gameData.challengerName}
                        opponentName={gameData.opponentName}
                        challengerStarts={gameData.challengerStarts}
                        currentPlayerRole={gameData.currentPlayerRole}
                        gameResult={gameData.gameResult}
                        onLockFleet={handleLockFleet}
                        isFleetLocked={gameData.fleetDuelState.isFleetLocked}
                        disabled={isMakingMove}
                    />
                );
            
            case 'attack':
                return (
                    <div className="space-y-8 max-w-6xl mx-auto">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900">⚔️ Battle Phase</h2>
                            <p className="text-gray-600 mt-2">Attack phase coming soon...</p>
                        </div>
                    </div>
                );
            
            case 'completed':
                return (
                    <div className="space-y-8 max-w-6xl mx-auto">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900">🏆 Battle Complete</h2>
                            <p className="text-gray-600 mt-2">Game over phase coming soon...</p>
                        </div>
                    </div>
                );
            
            default:
                return (
                    <div className="space-y-8 max-w-6xl mx-auto">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900">🚢 Fleet Duel</h2>
                            <p className="text-gray-600 mt-2">Initializing game...</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-8">
            {renderPhase()}
            
            {/* Loading indicator */}
            {isMakingMove && (
                <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <div className="text-sm text-gray-600 mt-2">
                        Processing...
                    </div>
                </div>
            )}
        </div>
    );
}

export type { FleetDuelGameProps, FleetDuelGameData };