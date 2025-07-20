import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../atoms';

export interface NameInputProps {
    value: string;
    onSubmit: (name: string) => void;
    onCancel?: () => void;
    allowCancel?: boolean;
    className?: string;
}

export const NameInput: React.FC<NameInputProps> = ({
    value,
    onSubmit,
    onCancel,
    allowCancel = false,
    className = '',
}) => {
    const [name, setName] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(value);
    }, [value]);

    useEffect(() => {
        // Select the text when component mounts or when allowCancel becomes true
        if (inputRef.current && allowCancel) {
            inputRef.current.select();
        }
    }, [allowCancel]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSubmit(name.trim());
        }
    };

    const handleCancel = () => {
        setName(value);
        onCancel?.();
    };

    return (
        <div className={`w-full max-w-md mx-auto ${className}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="player-name" className="block text-sm font-medium text-gray-700 mb-2">
                        Enter your name to start playing
                    </label>
                    <input
                        ref={inputRef}
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
                {allowCancel ? (
                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="flex-1"
                            disabled={!name.trim()}
                        >
                            OK
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="lg"
                            className="flex-1"
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                    </div>
                ) : (
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        disabled={!name.trim()}
                    >
                        Continue
                    </Button>
                )}
            </form>
        </div>
    );
}; 