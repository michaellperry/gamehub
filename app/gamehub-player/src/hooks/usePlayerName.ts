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
    handleNameSubmit: (name: string) => void;
    setShowNameInput: (show: boolean) => void;
}

// Create specification to find current PlayerName facts for the current user
const playerNameSpec = model.given(User, Tenant).match((user, tenant) =>
    Player.in(tenant)
        .join(player => player.user, user)
        .selectMany(player => PlayerName.current(player))
);

export function usePlayerName(): PlayerNameViewModel {
    const [showNameInput, setShowNameInput] = useState<boolean>(false);

    const { user } = useUser();
    const tenant = useTenant();

    // Use Jinaga to load the player name
    const { data: playerNames } = useSpecification(
        j,
        playerNameSpec,
        user,
        tenant
    );

    const handleNameSubmit = async (name: string) => {
        setShowNameInput(false);
        if (!user || !tenant) {
            console.error('User or tenant not available');
            return;
        }

        try {
            // Create or get the Player fact
            const player = await j.fact(new Player(user, tenant));

            // Get current player names to use as prior
            const currentNames = playerNames || [];

            // Create new PlayerName fact
            if (currentNames.length !== 1 || currentNames[0].name !== name) {
                await j.fact(new PlayerName(player, name, currentNames));
            }
        } catch (error) {
            console.error('Error creating player name:', error);
        }
    };

    return {
        playerName: playerNames?.[0]?.name || '',
        showNameInput: showNameInput || playerNames?.length === 0,
        handleNameSubmit,
        setShowNameInput,
    };
} 