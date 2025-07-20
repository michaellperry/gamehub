import { Player } from '@model/model';
import { useEffect, useMemo, useState } from 'react';
import { useUser } from '../auth/UserProvider';
import { useTenant } from '../auth/useTenant';
import { j } from '../jinaga-config';

export interface PlayerViewModel {
    player: Player | null;
    playerId: string | null;
    error: string | null;
    loading: boolean;
    clearError: () => void;
}

export function usePlayer(): PlayerViewModel {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { user } = useUser();
    const tenant = useTenant();

    // Create player fact if user and tenant are available
    const player = useMemo(() =>
        user && tenant ? new Player(user, tenant) : null,
        [user, tenant]
    );

    // Create player fact if it doesn't exist
    useEffect(() => {
        if (player) {
            setLoading(true);
            setError(null);

            j.fact(player)
                .then(() => {
                    setLoading(false);
                })
                .catch((error) => {
                    console.error('Error creating player:', error);
                    setError('Failed to load player. Please try logging in again.');
                    setLoading(false);
                });
        }
    }, [player]);

    const clearError = () => {
        setError(null);
    };

    const playerId = player ? j.hash(player) : null;

    return {
        player,
        playerId,
        error,
        loading,
        clearError,
    };
} 