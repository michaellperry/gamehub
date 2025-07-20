import { Player, PlayerName, Tenant, model } from 'gamehub-model/model';
import { User } from 'jinaga';
import { useSpecification } from 'jinaga-react';
import { useState } from 'react';
import { useUser } from '../auth/UserProvider';
import { useTenant } from '../auth/useTenant';
import { j } from '../jinaga-config';

export interface PlayerNameViewModel {
    playerName: string;
    showNameInput: boolean;
    allowCancel: boolean;
    error: string | null;
    loading: boolean;
    handleNameSubmit: (name: string) => void;
    handleCancel: () => void;
    setShowNameInput: (show: boolean) => void;
    clearError: () => void;
}

// Create specification to find current PlayerName facts for the current user
const playerNameSpec = model.given(User, Tenant).match((user, tenant) =>
    Player.in(tenant)
        .join(player => player.user, user)
        .selectMany(player => PlayerName.current(player))
);

export function usePlayerName(): PlayerNameViewModel {
    const [showNameInput, setShowNameInput] = useState<boolean>(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const { user } = useUser();
    const tenant = useTenant();

    // Use Jinaga to load the player name
    const { data: playerNames, error: specificationError, loading } = useSpecification(
        j,
        playerNameSpec,
        user,
        tenant
    );

    const clearError = () => {
        setActionError(null);
    };

    const handleNameSubmit = async (name: string) => {
        if (!user || !tenant) {
            setActionError('User or tenant not available. Please try logging in again.');
            return;
        }

        if (!name.trim()) {
            setActionError('Please enter a valid name.');
            return;
        }

        setActionError(null);

        try {
            // Create or get the Player fact
            const player = await j.fact(new Player(user, tenant));

            // Get current player names to use as prior
            const currentNames = playerNames || [];

            // Create new PlayerName fact
            if (currentNames.length !== 1 || currentNames[0].name !== name.trim()) {
                await j.fact(new PlayerName(player, name.trim(), currentNames));
            }

            setShowNameInput(false);
        } catch (error) {
            console.error('Error creating player name:', error);
            setActionError('Failed to save player name. Please try again.');
        }
    };

    const handleCancel = () => {
        setShowNameInput(false);
        setActionError(null);
    };

    // Combine specification error with action error
    const combinedError = actionError || (specificationError ? specificationError.message : null);

    return {
        playerName: playerNames?.[0]?.name || '',
        showNameInput: showNameInput || playerNames?.length === 0,
        allowCancel: playerNames?.length !== 0,
        error: combinedError,
        loading,
        handleNameSubmit,
        handleCancel,
        setShowNameInput,
        clearError,
    };
} 