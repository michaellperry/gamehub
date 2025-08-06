import { Ship, ShipType, ShipOrientation } from './Ship';

interface FleetShip {
    id: string;
    type: ShipType;
    size: number;
    isPlaced: boolean;
    orientation: ShipOrientation;
}

interface FleetPanelProps {
    ships: FleetShip[];
    selectedShipId?: string;
    onShipSelect?: (shipId: string) => void;
    onShipRotate?: (shipId: string) => void;
    className?: string;
}

const SHIP_DESCRIPTIONS: Record<ShipType, string> = {
    carrier: '5 units - Aircraft Carrier',
    battleship: '4 units - Battleship',
    cruiser: '3 units - Cruiser',
    submarine: '3 units - Submarine',
    destroyer: '2 units - Destroyer'
};

export function FleetPanel({
    ships,
    selectedShipId,
    onShipSelect,
    onShipRotate,
    className = ''
}: FleetPanelProps) {
    const placedShips = ships.filter(ship => ship.isPlaced);
    const unplacedShips = ships.filter(ship => !ship.isPlaced);

    const renderShipsList = (shipsList: FleetShip[], title: string, showPlacementStatus = false) => {
        if (shipsList.length === 0) return null;

        return (
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
                    {title} ({shipsList.length})
                </h3>
                <div className="space-y-2">
                    {shipsList.map(ship => (
                        <div
                            key={ship.id}
                            className="flex items-center justify-between p-2 rounded border border-gray-200 bg-gray-50"
                        >
                            <div className="flex items-center space-x-2 flex-1">
                                <Ship
                                    type={ship.type}
                                    size={ship.size}
                                    orientation={ship.orientation}
                                    isPlaced={ship.isPlaced}
                                    isSelected={selectedShipId === ship.id}
                                    onClick={() => onShipSelect?.(ship.id)}
                                    className="scale-75"
                                />
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-600">
                                    {SHIP_DESCRIPTIONS[ship.type]}
                                </div>
                                {showPlacementStatus && (
                                    <div className={`text-xs ${ship.isPlaced ? 'text-green-600' : 'text-orange-600'}`}>
                                        {ship.isPlaced ? '✓ Placed' : '⚠ Not placed'}
                                    </div>
                                )}
                                {!ship.isPlaced && (
                                    <button
                                        onClick={() => onShipRotate?.(ship.id)}
                                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                    >
                                        Rotate
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const allShipsPlaced = ships.every(ship => ship.isPlaced);
    const completionPercentage = Math.round((placedShips.length / ships.length) * 100);

    return (
        <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-4 ${className}`}>
            <div className="space-y-4">
                {/* Header */}
                <div className="text-center">
                    <h2 className="text-lg font-bold text-gray-900">🚢 Your Fleet</h2>
                    <div className="mt-2">
                        <div className="text-sm text-gray-600">
                            {placedShips.length} of {ships.length} ships placed
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    allShipsPlaced ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Unplaced Ships */}
                {renderShipsList(unplacedShips, 'Available Ships', true)}

                {/* Placed Ships */}
                {renderShipsList(placedShips, 'Deployed Ships')}

                {/* Fleet Status */}
                <div className="pt-3 border-t border-gray-200">
                    <div className={`text-center p-2 rounded ${
                        allShipsPlaced 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                    }`}>
                        {allShipsPlaced 
                            ? '✅ Fleet Ready for Battle!' 
                            : `⚠ ${unplacedShips.length} ships remaining`
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}

export type { FleetPanelProps, FleetShip };