import { useState, useCallback, useEffect } from 'react';
import { useFleetDuel, FleetDuelState } from './useFleetDuel';
import { useShipPlacement, PlacedShip } from './useShipPlacement';
import { useFleetValidation } from './useFleetValidation';

interface UseFleetDuelGameStateProps {
    onPhaseChange?: (phase: FleetDuelState['phase']) => void;
    onFleetLocked?: (fleet: PlacedShip[]) => void;
    onGameEnd?: (result: 'won' | 'lost' | 'drawn') => void;
}

export function useFleetDuelGameState({
    onPhaseChange,
    onFleetLocked,
    onGameEnd
}: UseFleetDuelGameStateProps = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fleet Duel state management
    const fleetDuel = useFleetDuel({
        onStateChange: (state) => {
            onPhaseChange?.(state.phase);
        }
    });

    // Ship placement management
    const shipPlacement = useShipPlacement({
        onFleetComplete: (fleet) => {
            fleetDuel.deployFleet(fleet.map(ship => ({
                id: ship.id,
                type: ship.type,
                size: ship.size,
                isPlaced: ship.isPlaced,
                orientation: ship.orientation
            })));
        }
    });

    // Fleet validation
    const validation = useFleetValidation({
        ships: shipPlacement.ships,
        placedShips: shipPlacement.placedShips
    });

    // Lock fleet and proceed to battle
    const lockFleet = useCallback(async () => {
        if (!validation.isComplete) {
            setError('Cannot lock fleet: not all ships are placed or there are validation errors');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const fleet = shipPlacement.getFleetConfiguration();
            onFleetLocked?.(fleet);
            fleetDuel.startBattle();
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to lock fleet');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [validation.isComplete, shipPlacement, fleetDuel, onFleetLocked]);

    // Make an attack
    const makeAttack = useCallback(async (row: number, col: number) => {
        if (fleetDuel.state.phase !== 'attack' || fleetDuel.state.currentTurn !== 'player') {
            return false;
        }

        setIsLoading(true);
        try {
            const isHit = fleetDuel.makeAttack(row, col);
            return isHit;
        } finally {
            setIsLoading(false);
        }
    }, [fleetDuel]);

    // Handle incoming attack
    const receiveAttack = useCallback((row: number, col: number) => {
        return fleetDuel.receiveAttack(row, col);
    }, [fleetDuel]);

    // Reset game
    const resetGame = useCallback(() => {
        fleetDuel.resetGame();
        shipPlacement.clearAllShips();
        setError(null);
    }, [fleetDuel, shipPlacement]);

    // Get current game state for UI
    const getGameState = useCallback(() => {
        return {
            phase: fleetDuel.state.phase,
            isFleetLocked: fleetDuel.state.isFleetLocked,
            currentTurn: fleetDuel.state.currentTurn,
            ships: shipPlacement.ships,
            placedShips: shipPlacement.placedShips,
            selectedShipId: shipPlacement.selectedShipId,
            validation,
            isLoading,
            error
        };
    }, [fleetDuel.state, shipPlacement, validation, isLoading, error]);

    // Clear error after some time
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    return {
        // Game state
        gameState: getGameState(),
        
        // Ship placement actions
        placeShip: shipPlacement.placeShip,
        removeShip: shipPlacement.removeShip,
        rotateShip: shipPlacement.rotateShip,
        moveShip: shipPlacement.moveShip,
        selectShip: shipPlacement.selectShip,
        clearAllShips: shipPlacement.clearAllShips,
        randomPlacement: shipPlacement.randomPlacement,
        
        // Game actions
        lockFleet,
        makeAttack,
        receiveAttack,
        resetGame,
        
        // Validation
        isValidPlacement: validation.isValidPlacement,
        
        // State queries
        fleetDuelState: fleetDuel.state,
        shipPlacementState: shipPlacement,
        validationState: validation
    };
}

export type { UseFleetDuelGameStateProps };