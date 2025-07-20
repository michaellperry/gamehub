import React, { useState, useRef, useEffect } from 'react';

export interface CodeInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

export const CodeInput: React.FC<CodeInputProps> = ({
    value,
    onChange,
    disabled = false,
    className = '',
}) => {
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const boxRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Ensure value is always uppercase and letters only
    const sanitizedValue = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);

    useEffect(() => {
        if (sanitizedValue !== value) {
            onChange(sanitizedValue);
        }
    }, [value, sanitizedValue, onChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
        onChange(input.slice(0, 6));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && sanitizedValue.length === 0) {
            e.preventDefault();
        }
    };

    const handleBoxClick = (index: number) => {
        setFocusedIndex(index);
        inputRef.current?.focus();
    };

    const handleInputFocus = () => {
        const nextEmptyIndex = sanitizedValue.length;
        setFocusedIndex(Math.min(nextEmptyIndex, 5));
    };

    const handleInputBlur = () => {
        setFocusedIndex(-1);
    };

    const getBoxContent = (index: number) => {
        if (index < sanitizedValue.length) {
            return sanitizedValue[index];
        }
        return '';
    };

    const isBoxFocused = (index: number) => {
        return focusedIndex === index || (focusedIndex === -1 && index === sanitizedValue.length);
    };

    return (
        <div className={`flex flex-col items-center space-y-4 ${className}`}>
            <div className="flex space-x-2">
                {Array.from({ length: 6 }, (_, index) => (
                    <div
                        key={index}
                        ref={(el) => {
                            boxRefs.current[index] = el;
                        }}
                        onClick={() => handleBoxClick(index)}
                        className={`
                            w-12 h-12 border-2 rounded-lg flex items-center justify-center text-xl font-bold
                            transition-all duration-200 cursor-pointer select-none
                            ${isBoxFocused(index)
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : sanitizedValue[index]
                                    ? 'border-gray-300 bg-white text-gray-900'
                                    : 'border-gray-300 bg-gray-50 text-gray-400'
                            }
                            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-400'}
                        `}
                    >
                        {getBoxContent(index)}
                    </div>
                ))}
            </div>

            <input
                ref={inputRef}
                type="text"
                value={sanitizedValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                disabled={disabled}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck="false"
                inputMode="text"
                className="sr-only"
                maxLength={6}
            />
        </div>
    );
}; 