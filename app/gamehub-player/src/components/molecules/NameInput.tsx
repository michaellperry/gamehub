import React, { useState } from 'react';
import { Button } from '../atoms';

export interface NameInputProps {
    onSubmit: (name: string) => void;
    className?: string;
}

export const NameInput: React.FC<NameInputProps> = ({
    onSubmit,
    className = '',
}) => {
    const [name, setName] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            setIsSubmitted(true);
            onSubmit(name.trim());
        }
    };

    if (isSubmitted) {
        return null;
    }

    return (
        <div className={`w-full max-w-md mx-auto ${className}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="player-name" className="block text-sm font-medium text-gray-700 mb-2">
                        Enter your name to start playing
                    </label>
                    <input
                        id="player-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                        autoComplete="off"
                        autoFocus
                        required
                        minLength={1}
                        maxLength={20}
                    />
                </div>
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={!name.trim()}
                >
                    Continue
                </Button>
            </form>
        </div>
    );
}; 