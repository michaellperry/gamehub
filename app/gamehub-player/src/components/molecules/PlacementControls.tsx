import { Button } from '../atoms/Button';

interface PlacementControlsProps {
    selectedShip?: { id: string; type: string; orientation: 'horizontal' | 'vertical' };
    allShipsPlaced: boolean;
    onRotateSelected?: () => void;
    onLockFleet?: () => void;
    onRandomPlacement?: () => void;
    onClearAll?: () => void;
    isLocked?: boolean;
    disabled?: boolean;
}

export function PlacementControls({
    selectedShip,
    allShipsPlaced,
    onRotateSelected,
    onLockFleet,
    onRandomPlacement,
    onClearAll,
    isLocked = false,
    disabled = false
}: PlacementControlsProps) {
    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">⚙️ Fleet Controls</h3>
            
            <div className="space-y-4">
                {/* Selected Ship Info */}
                {selectedShip && !isLocked && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-900 mb-2">
                            Selected: {selectedShip.type.charAt(0).toUpperCase() + selectedShip.type.slice(1)}
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-blue-700">
                                Orientation: {selectedShip.orientation}
                            </span>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onRotateSelected}
                                disabled={disabled}
                            >
                                🔄 Rotate (R)
                            </Button>
                        </div>
                    </div>
                )}

                {/* Placement Actions */}
                {!isLocked && (
                    <div className="space-y-2">
                        <Button
                            variant="secondary"
                            onClick={onRandomPlacement}
                            disabled={disabled || allShipsPlaced}
                            className="w-full"
                        >
                            🎲 Auto-Place Remaining Ships
                        </Button>
                        
                        <Button
                            variant="secondary"
                            onClick={onClearAll}
                            disabled={disabled}
                            className="w-full"
                        >
                            🗑️ Clear All Ships
                        </Button>
                    </div>
                )}

                {/* Fleet Status & Lock Button */}
                <div className="pt-4 border-t border-gray-200">
                    <div className={`text-center p-3 rounded-lg mb-3 ${
                        allShipsPlaced 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                    }`}>
                        {allShipsPlaced 
                            ? '✅ All ships placed!' 
                            : '⚠️ Place all ships to continue'
                        }
                    </div>

                    {!isLocked ? (
                        <Button
                            variant="primary"
                            onClick={onLockFleet}
                            disabled={!allShipsPlaced || disabled}
                            className="w-full"
                        >
                            {allShipsPlaced ? '🔒 Lock Fleet & Start Battle' : '🔒 Fleet Not Ready'}
                        </Button>
                    ) : (
                        <div className="text-center p-3 bg-gray-100 rounded-lg">
                            <div className="text-green-700 font-medium">🔒 Fleet Locked</div>
                            <div className="text-xs text-gray-600 mt-1">Waiting for opponent...</div>
                        </div>
                    )}
                </div>

                {/* Keyboard Shortcuts */}
                <div className="text-xs text-gray-500 text-center p-2 bg-gray-50 rounded border">
                    <div className="font-medium mb-1">Keyboard Shortcuts:</div>
                    <div>R - Rotate selected ship</div>
                    <div>Space - Auto-place remaining</div>
                    <div>Delete - Clear all ships</div>
                </div>
            </div>
        </div>
    );
}

export type { PlacementControlsProps };