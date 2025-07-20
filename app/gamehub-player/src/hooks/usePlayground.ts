import { Playground } from 'gamehub-model/model';
import { useState } from 'react';
import { useUser } from '../auth/UserProvider';
import { useTenant } from '../auth/useTenant';
import { j } from '../jinaga-config';

export interface PlaygroundViewModel {
    playgroundCode: string;
    canJoinPlayground: boolean;
    handleStartPlayground: () => void;
    handleJoinPlayground: () => void;
    setPlaygroundCode: (code: string) => void;
}

export function usePlayground(): PlaygroundViewModel {
    const [playgroundCode, setPlaygroundCode] = useState<string>('');
    const { user } = useUser();
    const tenant = useTenant();

    const handleStartPlayground = async () => {
        // Generate a random 6-letter code
        const code = Array.from({ length: 6 }, () =>
            String.fromCharCode(65 + Math.floor(Math.random() * 26))
        ).join('');

        if (user && tenant) {
            try {
                // Create a playground fact when starting
                await j.fact(new Playground(tenant, code));
            } catch (error) {
                console.error('Error creating playground fact:', error);
            }
        }

        // Navigate to the playground
        window.location.href = `/playground/${code}`;
    };

    const handleJoinPlayground = async () => {
        if (playgroundCode.length === 6 && user && tenant) {
            try {
                // Create a playground fact when joining
                await j.fact(new Playground(tenant, playgroundCode));

                // Navigate to the playground
                window.location.href = `/playground/${playgroundCode}`;
            } catch (error) {
                console.error('Error creating playground fact:', error);
                // Still navigate even if fact creation fails
                window.location.href = `/playground/${playgroundCode}`;
            }
        }
    };

    const canJoinPlayground = playgroundCode.length === 6;

    return {
        playgroundCode,
        canJoinPlayground,
        handleStartPlayground,
        handleJoinPlayground,
        setPlaygroundCode,
    };
} 