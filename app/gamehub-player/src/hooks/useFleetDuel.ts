import { useState, useCallback } from 'react';
import { FleetShip } from '../components/atoms';

export interface FleetDuelState {
    phase: 'ship-placement' | 'attack' | 'completed';
    playerFleet: FleetShip[];
    opponentFleet: FleetShip[];
    isFleetLocked: boolean;
    currentTurn: 'player' | 'opponent';
    playerHits: string[];
    playerMisses: string[];
    opponentHits: string[];
    opponentMisses: string[];
}

interface UseFleetDuelProps {
    initialState?: Partial<FleetDuelState>;
    onStateChange?: (state: FleetDuelState) => void;
}

export function useFleetDuel({ 
    initialState = {}, 
    onStateChange 
}: UseFleetDuelProps = {}) {
    const [state, setState] = useState<FleetDuelState>({
        phase: 'ship-placement',
        playerFleet: [],
        opponentFleet: [],
        isFleetLocked: false,
        currentTurn: 'player',
        playerHits: [],
        playerMisses: [],
        opponentHits: [],
        opponentMisses: [],
        ...initialState
    });

    const updateState = useCallback((updates: Partial<FleetDuelState>) => {
        setState(prevState => {
            const newState = { ...prevState, ...updates };
            onStateChange?.(newState);
            return newState;
        });
    }, [onStateChange]);

    const deployFleet = useCallback((fleet: FleetShip[]) => {
        updateState({ 
            playerFleet: fleet,
            isFleetLocked: true 
        });
    }, [updateState]);

    const startBattle = useCallback(() => {
        updateState({ 
            phase: 'attack',
            currentTurn: 'player' 
        });
    }, [updateState]);

    const makeAttack = useCallback((row: number, col: number): boolean => {
        // This would integrate with the game logic
        // For now, return a random hit/miss
        const isHit = Math.random() > 0.7; // 30% hit chance
        const coordinate = `${row}-${col}`;

        if (isHit) {
            updateState({
                playerHits: [...state.playerHits, coordinate],
                currentTurn: 'opponent'
            });
        } else {
            updateState({
                playerMisses: [...state.playerMisses, coordinate],
                currentTurn: 'opponent'
            });
        }

        return isHit;
    }, [state, updateState]);

    const receiveAttack = useCallback((row: number, col: number): boolean => {
        // This would check if any of player's ships are hit
        const coordinate = `${row}-${col}`;
        const isHit = Math.random() > 0.7; // Placeholder logic

        if (isHit) {
            updateState({
                opponentHits: [...state.opponentHits, coordinate],
                currentTurn: 'player'
            });
        } else {
            updateState({
                opponentMisses: [...state.opponentMisses, coordinate],
                currentTurn: 'player'
            });
        }

        return isHit;
    }, [state, updateState]);

    const endGame = useCallback((winner: 'player' | 'opponent' | 'draw') => {
        updateState({ 
            phase: 'completed' 
        });
    }, [updateState]);

    const resetGame = useCallback(() => {
        setState({
            phase: 'ship-placement',
            playerFleet: [],
            opponentFleet: [],
            isFleetLocked: false,
            currentTurn: 'player',
            playerHits: [],
            playerMisses: [],
            opponentHits: [],
            opponentMisses: []
        });
    }, []);

    return {
        state,
        deployFleet,
        startBattle,
        makeAttack,
        receiveAttack,
        endGame,
        resetGame,
        updateState
    };
}

export type { UseFleetDuelProps };