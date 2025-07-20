import { Join, Playground } from '@model/model';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../auth/UserProvider';
import { useTenant } from '../auth/useTenant';
import { j } from '../jinaga-config';
import { usePlayer } from './usePlayer';

export interface PlaygroundViewModel {
    playgroundCode: string;
    canJoinPlayground: boolean;
    error: string | null;
    isLoading: boolean;
    handleStartPlayground: () => void;
    handleJoinPlayground: () => void;
    setPlaygroundCode: (code: string) => void;
    clearError: () => void;
}

export function usePlayground(): PlaygroundViewModel {
    const [playgroundCode, setPlaygroundCode] = useState<string>('');
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const { user } = useUser();
    const tenant = useTenant();
    const navigate = useNavigate();
    const { player, error: playerError, loading: playerLoading, clearError: clearPlayerError } = usePlayer();

    const clearError = () => {
        setActionError(null);
        clearPlayerError();
    };

    const handleStartPlayground = async () => {
        if (!user || !tenant) {
            setActionError('User or tenant not available. Please try logging in again.');
            return;
        }

        setActionLoading(true);
        setActionError(null);

        try {
            // Generate a random 6-letter code
            const code = Array.from({ length: 6 }, () =>
                String.fromCharCode(65 + Math.floor(Math.random() * 26))
            ).join('');

            // Create a playground fact when starting
            await j.fact(new Playground(tenant, code));

            // Navigate to the playground
            navigate(`/playground/${code}`);
        } catch (error) {
            console.error('Error creating playground fact:', error);
            setActionError('Failed to create playground. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoinPlayground = async () => {
        if (!user || !tenant) {
            setActionError('User or tenant not available. Please try logging in again.');
            return;
        }

        if (playgroundCode.length !== 6) {
            setActionError('Please enter a valid 6-letter playground code.');
            return;
        }

        setActionLoading(true);
        setActionError(null);

        try {
            // Create the playground fact if it doesn't exist
            const playgroundFact = new Playground(tenant, playgroundCode);
            await j.fact(playgroundFact);

            // Use the player from usePlayer hook (it's already created)
            if (!player) {
                setActionError('Player not available. Please try logging in again.');
                return;
            }

            // Create join fact to join the playground
            await j.fact(new Join(player, playgroundFact, new Date()));

            // Navigate to the playground
            navigate(`/playground/${playgroundCode}`);
        } catch (error) {
            console.error('Error joining playground:', error);
            setActionError('Failed to join playground. Please check the code and try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const canJoinPlayground = playgroundCode.length === 6;

    return {
        playgroundCode,
        canJoinPlayground,
        error: actionError || playerError,
        isLoading: actionLoading || playerLoading,
        handleStartPlayground,
        handleJoinPlayground,
        setPlaygroundCode,
        clearError,
    };
} 