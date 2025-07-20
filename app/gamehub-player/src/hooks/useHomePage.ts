import { useEffect, useState } from 'react';
import { useSpecification } from 'jinaga-react';
import { Player, PlayerName, Tenant, model } from 'gamehub-model/model';
import { User } from 'jinaga';
import { j } from '../jinaga-config';
import { useUser } from '../auth/UserProvider';
import { useTenant } from '../auth/useTenant';

export interface HomePageViewModel {
    playerName: string;
    playgroundCode: string;
    showNameInput: boolean;
    canJoinPlayground: boolean;
    handleNameSubmit: (name: string) => void;
    handleStartPlayground: () => void;
    handleJoinPlayground: () => void;
    setPlaygroundCode: (code: string) => void;
    setShowNameInput: (show: boolean) => void;
}

export function useHomePage(): HomePageViewModel {
    const [playgroundCode, setPlaygroundCode] = useState<string>('');
    const [showNameInput, setShowNameInput] = useState<boolean>(true);
    const [playerName, setPlayerName] = useState<string>('');

    const { user } = useUser();
    const tenant = useTenant();

    // Create specification to find current PlayerName facts for the current user
    const playerNameSpec = model.given(User, Tenant).match((user, tenant) =>
        Player.in(tenant)
            .join(player => player.user, user)
            .selectMany(player => PlayerName.current(player))
    );

    // Use Jinaga to load the player name
    const { data: playerNames } = useSpecification(
        j,
        playerNameSpec,
        user,
        tenant
    );

    // Update player name and show name input based on Jinaga data
    useEffect(() => {
        if (playerNames !== null) {
            if (playerNames.length > 0) {
                // Found a current player name, use it
                setPlayerName(playerNames[0].name);
                setShowNameInput(false);
            } else {
                // No player name found, show the input
                setShowNameInput(true);
            }
        }
    }, [playerNames]);

    const handleNameSubmit = async (name: string) => {
        if (!user || !tenant) {
            console.error('User or tenant not available');
            return;
        }

        try {
            // Create or get the Player fact
            const player = await j.fact(new Player(user, tenant));

            // Get current player names to use as prior
            const currentNames = (playerNames as PlayerName[]) || [];

            // Create new PlayerName fact
            await j.fact(new PlayerName(player, name, currentNames));

            setPlayerName(name);
            setShowNameInput(false);
        } catch (error) {
            console.error('Error creating player name:', error);
        }
    };

    const handleStartPlayground = () => {
        // Generate a random 6-letter code
        const code = Array.from({ length: 6 }, () =>
            String.fromCharCode(65 + Math.floor(Math.random() * 26))
        ).join('');

        // Navigate to the playground
        window.location.href = `/playground/${code}`;
    };

    const handleJoinPlayground = () => {
        if (playgroundCode.length === 6) {
            window.location.href = `/playground/${playgroundCode}`;
        }
    };

    const canJoinPlayground = playgroundCode.length === 6;

    return {
        playerName,
        playgroundCode,
        showNameInput,
        canJoinPlayground,
        handleNameSubmit,
        handleStartPlayground,
        handleJoinPlayground,
        setPlaygroundCode,
        setShowNameInput,
    };
} 