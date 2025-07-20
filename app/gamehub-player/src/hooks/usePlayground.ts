import { useState } from 'react';

export interface PlaygroundViewModel {
    playgroundCode: string;
    canJoinPlayground: boolean;
    handleStartPlayground: () => void;
    handleJoinPlayground: () => void;
    setPlaygroundCode: (code: string) => void;
}

export function usePlayground(): PlaygroundViewModel {
    const [playgroundCode, setPlaygroundCode] = useState<string>('');

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
        playgroundCode,
        canJoinPlayground,
        handleStartPlayground,
        handleJoinPlayground,
        setPlaygroundCode,
    };
} 