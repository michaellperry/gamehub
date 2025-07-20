import { useEffect, useState } from 'react';

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
    const [playerName, setPlayerName] = useState<string>('');
    const [playgroundCode, setPlaygroundCode] = useState<string>('');
    const [showNameInput, setShowNameInput] = useState<boolean>(true);

    // Load player name from localStorage on component mount
    useEffect(() => {
        const savedName = localStorage.getItem('gamehub-player-name');
        if (savedName) {
            setPlayerName(savedName);
            setShowNameInput(false);
        }
    }, []);

    const handleNameSubmit = (name: string) => {
        setPlayerName(name);
        localStorage.setItem('gamehub-player-name', name);
        setShowNameInput(false);
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