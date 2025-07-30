import { useState, useCallback } from 'react';
import { GameGrid, GridState } from '../atoms/GameGrid';
import { FleetShip, ShipType, ShipOrientation } from '../atoms';

interface PlacedShip extends FleetShip {
    position: { row: number; col: number };
}

interface ShipPlacementGridProps {
    placedShips: PlacedShip[];
    selectedShip?: FleetShip;
    onShipPlace?: (ship: FleetShip, row: number, col: number) => void;
    onShipMove?: (shipId: string, newRow: number, newCol: number) => void;
    onShipSelect?: (shipId: string) => void;
    disabled?: boolean;
}

export function ShipPlacementGrid({
    placedShips,
    selectedShip,
    onShipPlace,
    onShipMove,
    onShipSelect,
    disabled = false
}: ShipPlacementGridProps) {
    const [hoveredCells, setHoveredCells] = useState<string[]>([]);
    const [isValidPlacement, setIsValidPlacement] = useState(true);

    // Convert placed ships to grid state
    const getGridState = useCallback((): GridState => {
        const gridState: GridState = {};
        
        placedShips.forEach(ship => {
            const shipCells = getShipCells(ship.position.row, ship.position.col, ship.size, ship.orientation);
            shipCells.forEach(({ row, col }) => {
                const key = `${row}-${col}`;
                gridState[key] = {
                    isOccupied: true,
                    hasShipPart: true,
                    shipId: ship.id
                };
            });
        });

        return gridState;
    }, [placedShips]);

    // Calculate ship cells based on position, size, and orientation
    const getShipCells = (startRow: number, startCol: number, size: number, orientation: ShipOrientation) => {
        const cells = [];
        for (let i = 0; i < size; i++) {
            const row = orientation === 'vertical' ? startRow + i : startRow;
            const col = orientation === 'horizontal' ? startCol + i : startCol;
            cells.push({ row, col });
        }
        return cells;
    };

    // Check if ship placement is valid
    const isValidShipPlacement = (row: number, col: number, size: number, orientation: ShipOrientation): boolean => {
        const shipCells = getShipCells(row, col, size, orientation);
        
        // Check if ship goes out of bounds
        const outOfBounds = shipCells.some(cell => 
            cell.row < 0 || cell.row >= 10 || cell.col < 0 || cell.col >= 10
        );
        
        if (outOfBounds) return false;

        // Check if ship overlaps with existing ships
        const gridState = getGridState();
        const overlaps = shipCells.some(cell => {
            const key = `${cell.row}-${cell.col}`;
            return gridState[key]?.hasShipPart;
        });

        return !overlaps;
    };

    // Handle cell hover for ship preview
    const handleCellHover = (row: number, col: number) => {
        if (!selectedShip || disabled) {
            setHoveredCells([]);
            return;
        }

        const shipCells = getShipCells(row, col, selectedShip.size, selectedShip.orientation);
        const cellKeys = shipCells.map(cell => `${cell.row}-${cell.col}`);
        const valid = isValidShipPlacement(row, col, selectedShip.size, selectedShip.orientation);
        
        setHoveredCells(cellKeys);
        setIsValidPlacement(valid);
    };

    // Handle cell click for ship placement
    const handleCellClick = (row: number, col: number) => {
        if (disabled) return;

        const gridState = getGridState();
        const cellKey = `${row}-${col}`;
        
        // Check if clicking on an existing ship
        if (gridState[cellKey]?.hasShipPart) {
            const shipId = gridState[cellKey].shipId;
            if (shipId && onShipSelect) {
                onShipSelect(shipId);
            }
            return;
        }

        // Try to place selected ship
        if (selectedShip && onShipPlace) {
            const valid = isValidShipPlacement(row, col, selectedShip.size, selectedShip.orientation);
            if (valid) {
                onShipPlace(selectedShip, row, col);
                setHoveredCells([]);
            }
        }
    };

    const handleCellLeave = () => {
        setHoveredCells([]);
    };

    return (
        <div className="inline-block">
            <GameGrid
                gridState={getGridState()}
                hoveredCells={hoveredCells}
                isValid={isValidPlacement}
                onCellClick={handleCellClick}
                onCellHover={handleCellHover}
                onCellLeave={handleCellLeave}
                disabled={disabled}
                showLabels={true}
            />
            
            {/* Placement hint */}
            {selectedShip && !disabled && (
                <div className="mt-4 text-center">
                    <div className="text-sm text-gray-600">
                        Click on the grid to place your <strong>{selectedShip.type}</strong>
                    </div>
                    <div className="text-xs text-gray-500">
                        Double-click the ship to rotate • Click placed ships to select them
                    </div>
                </div>
            )}
        </div>
    );
}

export type { ShipPlacementGridProps, PlacedShip };