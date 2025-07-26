import { createContext, useContext, type ReactNode } from 'react';
import { PlayerSessionViewModel, usePlayerSession } from '../hooks/usePlayerSession';
import { useTenant } from './useTenant';

const PlayerSessionsContext = createContext<PlayerSessionViewModel | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const usePlayerSessionsContext = () => {
    const context = useContext(PlayerSessionsContext);
    if (!context) {
        throw new Error('usePlayerSessionsContext must be used within a PlayerSessionsProvider');
    }
    return context;
};

export function PlayerSessionsProvider({ children }: { children: ReactNode }) {
    const tenant = useTenant();
    const playerSessions = usePlayerSession(tenant);

    return (
        <PlayerSessionsContext.Provider value={playerSessions}>
            {children}
        </PlayerSessionsContext.Provider>
    );
} 