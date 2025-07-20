import { Join, Player, Playground } from '@model/model';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../auth/UserProvider';
import { useTenant } from '../auth/useTenant';
import { j } from '../jinaga-config';
import { usePlayer } from './usePlayer';
import { usePlayground } from './usePlayground';

export interface PlaygroundLobbyViewModel {
    playgroundCode: string;
    canJoinPlayground: boolean;
    error: string | null;
    isLoading: boolean;
    handleStartPlayground: () => void;
    handleJoinPlayground: () => void;
    setPlaygroundCode: (code: string) => void;
    clearError: () => void;
}

export function usePlaygroundLobby(): PlaygroundLobbyViewModel {
    const [playgroundCode, setPlaygroundCode] = useState<string>('');
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const { user } = useUser();
    const tenant = useTenant();
    const navigate = useNavigate();
    const { player, error: playerError, loading: playerLoading, clearError: clearPlayerError } = usePlayer();

    // Use the new usePlayground hook for validation and creation
    const { playground, isValidCode, error: playgroundError, loading: playgroundLoading, clearError: clearPlaygroundError } = usePlayground(playgroundCode);

    const clearError = () => {
        setActionError(null);
        clearPlayerError();
        clearPlaygroundError();
    };

    const handleStartPlayground = async () => {
        if (!user || !tenant) {
            setActionError('User or tenant not available. Please try logging in again.');
            return;
        }

        setActionLoading(true);
        setActionError(null);

        try {
            if (!player) {
                setActionError('Player not available. Please try logging in again.');
                return;
            }

            // Generate a random 6-letter code
            const code = Array.from({ length: 6 }, () =>
                String.fromCharCode(65 + Math.floor(Math.random() * 26))
            ).join('');

            // Create a playground fact when starting
            const playground = await j.fact(new Playground(tenant, code));

            // Create a join fact for the current player
            await j.fact(new Join(player, playground, new Date()));

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

        if (!isValidCode) {
            setActionError('Please enter a valid 6-letter playground code.');
            return;
        }

        setActionLoading(true);
        setActionError(null);

        try {
            if (!playground) {
                setActionError('Playground not available. Please try again.');
                return;
            }

            // Use the player from usePlayer hook (it's already created)
            if (!player) {
                setActionError('Player not available. Please try logging in again.');
                return;
            }

            // Create join fact to join the playground
            await j.fact(new Join(player, playground, new Date()));

            // Navigate to the playground
            navigate(`/playground/${playgroundCode}`);
        } catch (error) {
            console.error('Error joining playground:', error);
            setActionError('Failed to join playground. Please check the code and try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const canJoinPlayground = isValidCode;

    return {
        playgroundCode,
        canJoinPlayground,
        error: actionError || playerError || playgroundError,
        isLoading: actionLoading || playerLoading || playgroundLoading,
        handleStartPlayground,
        handleJoinPlayground,
        setPlaygroundCode,
        clearError,
    };
} 