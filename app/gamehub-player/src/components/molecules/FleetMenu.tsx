import { FleetPanel, FleetShip } from '../atoms/FleetPanel';

interface FleetMenuProps {
    ships: FleetShip[];
    selectedShipId?: string;
    onShipSelect?: (shipId: string) => void;
    onShipRotate?: (shipId: string) => void;
    onClearAll?: () => void;
    onRandomPlacement?: () => void;
    disabled?: boolean;
    className?: string;
}

export function FleetMenu({
    ships,
    selectedShipId,
    onShipSelect,
    onShipRotate,
    onClearAll,
    onRandomPlacement,
    disabled = false,
    className = ''
}: FleetMenuProps) {
    const allShipsPlaced = ships.every(ship => ship.isPlaced);
    const hasPlacedShips = ships.some(ship => ship.isPlaced);

    return (
        <div className={className}>
            <FleetPanel
                ships={ships}
                selectedShipId={selectedShipId}
                onShipSelect={onShipSelect}
                onShipRotate={onShipRotate}
            />
            
            {/* Action Buttons */}
            <div className="mt-4 space-y-2">
                {/* Random Placement Button */}
                <button
                    onClick={onRandomPlacement}
                    disabled={disabled || allShipsPlaced}
                    className={`w-full py-2 px-4 rounded-lg border font-medium transition-all duration-200 ${
                        disabled || allShipsPlaced
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                    }`}
                >
                    🎲 Random Placement
                </button>

                {/* Clear All Button */}
                {hasPlacedShips && (
                    <button
                        onClick={onClearAll}
                        disabled={disabled}
                        className={`w-full py-2 px-4 rounded-lg border font-medium transition-all duration-200 ${
                            disabled
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300'
                        }`}
                    >
                        🗑️ Clear All Ships
                    </button>
                )}

                {/* Instructions */}
                <div className="text-xs text-gray-500 text-center p-2 bg-gray-50 rounded border">
                    <div className="font-medium mb-1">How to place ships:</div>
                    <div>1. Select a ship from the list above</div>
                    <div>2. Click on the grid to place it</div>
                    <div>3. Double-click ship to rotate</div>
                    <div>4. Click placed ships to move them</div>
                </div>
            </div>
        </div>
    );
}

export type { FleetMenuProps };