import { useState, useEffect, useCallback } from 'react';
import { ShipPlacementGrid, FleetMenu, PlacementControls, ValidationFeedback, PlacedShip } from '../molecules';
import { FleetShip, ShipType, ShipOrientation } from '../atoms';
import { PlayerInfoDisplay } from '../molecules/PlayerInfoDisplay';

interface ShipPlacementPhaseProps {
    challengerName: string | null;
    opponentName: string | null;
    challengerStarts: boolean | null;
    currentPlayerRole: 'X' | 'O' | 'observer';
    gameResult: 'won' | 'lost' | 'drawn' | 'ongoing' | 'completed';
    onLockFleet?: () => void;
    isFleetLocked?: boolean;
    disabled?: boolean;
}

// Standard Fleet Duel ships
const INITIAL_SHIPS: FleetShip[] = [
    { id: 'carrier', type: 'carrier', size: 5, isPlaced: false, orientation: 'horizontal' },
    { id: 'battleship', type: 'battleship', size: 4, isPlaced: false, orientation: 'horizontal' },
    { id: 'cruiser', type: 'cruiser', size: 3, isPlaced: false, orientation: 'horizontal' },
    { id: 'submarine', type: 'submarine', size: 3, isPlaced: false, orientation: 'horizontal' },
    { id: 'destroyer', type: 'destroyer', size: 2, isPlaced: false, orientation: 'horizontal' }
];

export function ShipPlacementPhase({
    challengerName,
    opponentName,
    challengerStarts,
    currentPlayerRole,
    gameResult,
    onLockFleet,
    isFleetLocked = false,
    disabled = false
}: ShipPlacementPhaseProps) {
    const [ships, setShips] = useState<FleetShip[]>(INITIAL_SHIPS);
    const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
    const [selectedShipId, setSelectedShipId] = useState<string | undefined>();
    const [validationErrors, setValidationErrors] = useState<any[]>([]);
    const [validationWarnings, setValidationWarnings] = useState<any[]>([]);

    const selectedShip = ships.find(ship => ship.id === selectedShipId);
    const allShipsPlaced = ships.every(ship => ship.isPlaced);

    // Auto-select first unplaced ship
    useEffect(() => {
        if (!selectedShipId || ships.find(ship => ship.id === selectedShipId)?.isPlaced) {
            const firstUnplaced = ships.find(ship => !ship.isPlaced);
            setSelectedShipId(firstUnplaced?.id);
        }
    }, [ships, selectedShipId]);

    // Validation
    useEffect(() => {
        const errors: any[] = [];
        const warnings: any[] = [];

        // Add validation logic here
        if (!allShipsPlaced) {
            const unplacedCount = ships.filter(ship => !ship.isPlaced).length;
            warnings.push({
                type: 'missing-ships',
                message: `${unplacedCount} ships still need to be placed`
            });
        }

        setValidationErrors(errors);
        setValidationWarnings(warnings);
    }, [ships, placedShips, allShipsPlaced]);

    const handleShipPlace = useCallback((ship: FleetShip, row: number, col: number) => {
        // Update ship as placed
        setShips(prevShips => 
            prevShips.map(s => 
                s.id === ship.id ? { ...s, isPlaced: true } : s
            )
        );

        // Add to placed ships
        const placedShip: PlacedShip = {
            ...ship,
            isPlaced: true,
            position: { row, col }
        };
        
        setPlacedShips(prev => [...prev, placedShip]);

        // Clear selection to auto-select next ship
        setSelectedShipId(undefined);
    }, []);

    const handleShipSelect = useCallback((shipId: string) => {
        setSelectedShipId(shipId);
    }, []);

    const handleShipRotate = useCallback((shipId: string) => {
        setShips(prevShips => 
            prevShips.map(ship => 
                ship.id === shipId 
                    ? { ...ship, orientation: ship.orientation === 'horizontal' ? 'vertical' : 'horizontal' }
                    : ship
            )
        );
    }, []);

    const handleRotateSelected = useCallback(() => {
        if (selectedShipId) {
            handleShipRotate(selectedShipId);
        }
    }, [selectedShipId, handleShipRotate]);

    const handleRandomPlacement = useCallback(() => {
        // Simple random placement logic (placeholder)
        const unplacedShips = ships.filter(ship => !ship.isPlaced);
        const newPlacedShips: PlacedShip[] = [];
        const updatedShips = [...ships];

        unplacedShips.forEach(ship => {
            // Try to find a random valid position
            for (let attempts = 0; attempts < 100; attempts++) {
                const row = Math.floor(Math.random() * 10);
                const col = Math.floor(Math.random() * 10);
                const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';

                // Check if placement is valid (simplified check)
                const maxRow = orientation === 'vertical' ? row + ship.size - 1 : row;
                const maxCol = orientation === 'horizontal' ? col + ship.size - 1 : col;

                if (maxRow < 10 && maxCol < 10) {
                    const placedShip: PlacedShip = {
                        ...ship,
                        isPlaced: true,
                        orientation,
                        position: { row, col }
                    };
                    
                    newPlacedShips.push(placedShip);
                    
                    // Update ships array
                    const shipIndex = updatedShips.findIndex(s => s.id === ship.id);
                    if (shipIndex !== -1) {
                        updatedShips[shipIndex] = { ...ship, isPlaced: true, orientation };
                    }
                    break;
                }
            }
        });

        setShips(updatedShips);
        setPlacedShips(prev => [...prev, ...newPlacedShips]);
        setSelectedShipId(undefined);
    }, [ships]);

    const handleClearAll = useCallback(() => {
        setShips(INITIAL_SHIPS);
        setPlacedShips([]);
        setSelectedShipId(INITIAL_SHIPS[0].id);
    }, []);

    const handleLockFleet = useCallback(() => {
        if (allShipsPlaced && onLockFleet) {
            onLockFleet();
        }
    }, [allShipsPlaced, onLockFleet]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (disabled || isFleetLocked) return;

            switch (event.key.toLowerCase()) {
                case 'r':
                    event.preventDefault();
                    handleRotateSelected();
                    break;
                case ' ':
                    event.preventDefault();
                    handleRandomPlacement();
                    break;
                case 'delete':
                case 'backspace':
                    event.preventDefault();
                    handleClearAll();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [disabled, isFleetLocked, handleRotateSelected, handleRandomPlacement, handleClearAll]);

    if (isFleetLocked) {
        return (
            <div className="space-y-8 max-w-6xl mx-auto">
                {/* Player Information */}
                <PlayerInfoDisplay
                    challengerName={challengerName}
                    opponentName={opponentName}
                    challengerStarts={challengerStarts}
                    currentPlayerRole={currentPlayerRole}
                    gameResult={gameResult}
                />

                {/* Fleet Locked Message */}
                <div className="text-center">
                    <div className="bg-green-100 border border-green-300 rounded-lg p-6">
                        <div className="text-2xl font-bold text-green-800 mb-2">🔒 Fleet Deployed!</div>
                        <div className="text-green-700">Your ships are locked and ready for battle.</div>
                        <div className="text-sm text-green-600 mt-2">Waiting for opponent to deploy their fleet...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Player Information */}
            <PlayerInfoDisplay
                challengerName={challengerName}
                opponentName={opponentName}
                challengerStarts={challengerStarts}
                currentPlayerRole={currentPlayerRole}
                gameResult={gameResult}
            />

            {/* Phase Title */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">🚢 Deploy Your Fleet</h2>
                <p className="text-gray-600">Place your ships on the grid to prepare for battle</p>
            </div>

            {/* Main Placement Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Fleet Menu */}
                <div className="lg:col-span-1">
                    <FleetMenu
                        ships={ships}
                        selectedShipId={selectedShipId}
                        onShipSelect={handleShipSelect}
                        onShipRotate={handleShipRotate}
                        onClearAll={handleClearAll}
                        onRandomPlacement={handleRandomPlacement}
                        disabled={disabled}
                    />
                </div>

                {/* Grid */}
                <div className="lg:col-span-1 flex justify-center">
                    <ShipPlacementGrid
                        placedShips={placedShips}
                        selectedShip={selectedShip}
                        onShipPlace={handleShipPlace}
                        onShipSelect={handleShipSelect}
                        disabled={disabled}
                    />
                </div>

                {/* Controls */}
                <div className="lg:col-span-1">
                    <PlacementControls
                        selectedShip={selectedShip}
                        allShipsPlaced={allShipsPlaced}
                        onRotateSelected={handleRotateSelected}
                        onLockFleet={handleLockFleet}
                        onRandomPlacement={handleRandomPlacement}
                        onClearAll={handleClearAll}
                        isLocked={isFleetLocked}
                        disabled={disabled}
                    />
                </div>
            </div>

            {/* Validation Feedback */}
            <ValidationFeedback
                errors={validationErrors}
                warnings={validationWarnings}
                isValid={validationErrors.length === 0}
                allShipsPlaced={allShipsPlaced}
            />
        </div>
    );
}

export type { ShipPlacementPhaseProps };