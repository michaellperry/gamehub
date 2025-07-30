import { useState, useCallback, useEffect } from 'react';
import { FleetShip, ShipType, ShipOrientation } from '../components/atoms';

interface PlacedShip extends FleetShip {
    position: { row: number; col: number };
}

interface UseShipPlacementProps {
    onFleetComplete?: (fleet: PlacedShip[]) => void;
    onShipPlaced?: (ship: PlacedShip) => void;
    onShipRemoved?: (shipId: string) => void;
}

// Standard Fleet Duel ships
const STANDARD_FLEET: FleetShip[] = [
    { id: 'carrier', type: 'carrier', size: 5, isPlaced: false, orientation: 'horizontal' },
    { id: 'battleship', type: 'battleship', size: 4, isPlaced: false, orientation: 'horizontal' },
    { id: 'cruiser', type: 'cruiser', size: 3, isPlaced: false, orientation: 'horizontal' },
    { id: 'submarine', type: 'submarine', size: 3, isPlaced: false, orientation: 'horizontal' },
    { id: 'destroyer', type: 'destroyer', size: 2, isPlaced: false, orientation: 'horizontal' }
];

export function useShipPlacement({
    onFleetComplete,
    onShipPlaced,
    onShipRemoved
}: UseShipPlacementProps = {}) {
    const [ships, setShips] = useState<FleetShip[]>(STANDARD_FLEET);
    const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
    const [selectedShipId, setSelectedShipId] = useState<string | undefined>();

    const allShipsPlaced = ships.every(ship => ship.isPlaced);
    const selectedShip = ships.find(ship => ship.id === selectedShipId);

    // Auto-select first unplaced ship
    useEffect(() => {
        if (!selectedShipId || ships.find(ship => ship.id === selectedShipId)?.isPlaced) {
            const firstUnplaced = ships.find(ship => !ship.isPlaced);
            setSelectedShipId(firstUnplaced?.id);
        }
    }, [ships, selectedShipId]);

    // Call onFleetComplete when all ships are placed
    useEffect(() => {
        if (allShipsPlaced && onFleetComplete) {
            onFleetComplete(placedShips);
        }
    }, [allShipsPlaced, placedShips, onFleetComplete]);

    const isValidPlacement = useCallback((
        row: number, 
        col: number, 
        size: number, 
        orientation: ShipOrientation,
        excludeShipId?: string
    ): boolean => {
        // Calculate ship cells
        const shipCells = [];
        for (let i = 0; i < size; i++) {
            const cellRow = orientation === 'vertical' ? row + i : row;
            const cellCol = orientation === 'horizontal' ? col + i : col;
            shipCells.push({ row: cellRow, col: cellCol });
        }

        // Check bounds
        const outOfBounds = shipCells.some(cell => 
            cell.row < 0 || cell.row >= 10 || cell.col < 0 || cell.col >= 10
        );
        if (outOfBounds) return false;

        // Check overlap with other ships
        const otherShips = placedShips.filter(ship => ship.id !== excludeShipId);
        for (const otherShip of otherShips) {
            const otherCells = [];
            for (let i = 0; i < otherShip.size; i++) {
                const cellRow = otherShip.orientation === 'vertical' ? otherShip.position.row + i : otherShip.position.row;
                const cellCol = otherShip.orientation === 'horizontal' ? otherShip.position.col + i : otherShip.position.col;
                otherCells.push({ row: cellRow, col: cellCol });
            }

            // Check for overlap
            const overlaps = shipCells.some(cell => 
                otherCells.some(otherCell => 
                    cell.row === otherCell.row && cell.col === otherCell.col
                )
            );
            if (overlaps) return false;
        }

        return true;
    }, [placedShips]);

    const placeShip = useCallback((ship: FleetShip, row: number, col: number): boolean => {
        if (!isValidPlacement(row, col, ship.size, ship.orientation)) {
            return false;
        }

        // Remove existing placement if ship was already placed
        if (ship.isPlaced) {
            setPlacedShips(prev => prev.filter(s => s.id !== ship.id));
        }

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
        
        setPlacedShips(prev => [...prev.filter(s => s.id !== ship.id), placedShip]);
        onShipPlaced?.(placedShip);

        return true;
    }, [isValidPlacement, onShipPlaced]);

    const removeShip = useCallback((shipId: string) => {
        setShips(prevShips => 
            prevShips.map(ship => 
                ship.id === shipId ? { ...ship, isPlaced: false } : ship
            )
        );
        
        setPlacedShips(prev => prev.filter(ship => ship.id !== shipId));
        onShipRemoved?.(shipId);
    }, [onShipRemoved]);

    const rotateShip = useCallback((shipId: string) => {
        setShips(prevShips => 
            prevShips.map(ship => 
                ship.id === shipId 
                    ? { ...ship, orientation: ship.orientation === 'horizontal' ? 'vertical' : 'horizontal' }
                    : ship
            )
        );

        // If ship is placed, check if rotation is still valid
        const placedShip = placedShips.find(ship => ship.id === shipId);
        if (placedShip) {
            const newOrientation = placedShip.orientation === 'horizontal' ? 'vertical' : 'horizontal';
            if (!isValidPlacement(placedShip.position.row, placedShip.position.col, placedShip.size, newOrientation, shipId)) {
                // Remove ship if rotation makes it invalid
                removeShip(shipId);
            } else {
                // Update placed ship orientation
                setPlacedShips(prev => 
                    prev.map(ship => 
                        ship.id === shipId 
                            ? { ...ship, orientation: newOrientation }
                            : ship
                    )
                );
            }
        }
    }, [placedShips, isValidPlacement, removeShip]);

    const moveShip = useCallback((shipId: string, newRow: number, newCol: number): boolean => {
        const ship = ships.find(s => s.id === shipId);
        if (!ship) return false;

        return placeShip(ship, newRow, newCol);
    }, [ships, placeShip]);

    const clearAllShips = useCallback(() => {
        setShips(STANDARD_FLEET);
        setPlacedShips([]);
        setSelectedShipId(STANDARD_FLEET[0].id);
    }, []);

    const randomPlacement = useCallback(() => {
        const unplacedShips = ships.filter(ship => !ship.isPlaced);
        let attempts = 0;
        const maxAttempts = 1000;

        for (const ship of unplacedShips) {
            let placed = false;
            
            while (!placed && attempts < maxAttempts) {
                const row = Math.floor(Math.random() * 10);
                const col = Math.floor(Math.random() * 10);
                const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
                
                // Update ship orientation
                setShips(prev => 
                    prev.map(s => 
                        s.id === ship.id ? { ...s, orientation } : s
                    )
                );

                if (isValidPlacement(row, col, ship.size, orientation)) {
                    placeShip({ ...ship, orientation }, row, col);
                    placed = true;
                }
                
                attempts++;
            }
        }
    }, [ships, isValidPlacement, placeShip]);

    const selectShip = useCallback((shipId: string) => {
        setSelectedShipId(shipId);
    }, []);

    const getFleetConfiguration = useCallback((): PlacedShip[] => {
        return placedShips;
    }, [placedShips]);

    return {
        ships,
        placedShips,
        selectedShipId,
        selectedShip,
        allShipsPlaced,
        placeShip,
        removeShip,
        rotateShip,
        moveShip,
        selectShip,
        clearAllShips,
        randomPlacement,
        isValidPlacement,
        getFleetConfiguration
    };
}

export type { UseShipPlacementProps, PlacedShip };