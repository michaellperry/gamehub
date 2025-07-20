import { Playground } from '@model/model';
import { useEffect, useMemo, useState } from 'react';
import { useTenant } from '../auth/useTenant';
import { j } from '../jinaga-config';

export interface PlaygroundViewModel {
    playground: Playground | null;
    isValidCode: boolean;
    error: string | null;
    loading: boolean;
    clearError: () => void;
}

/**
 * Hook for playground validation and creation
 * @param code - The playground code to validate and create
 * @returns PlaygroundViewModel with validation state and playground instance
 */
export function usePlayground(code: string | undefined): PlaygroundViewModel {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const tenant = useTenant();

    // Validate playground code format (6 uppercase letters)
    const isValidCode = Boolean(code && /^[A-Z]{6}$/.test(code));

    // Create playground fact if code and tenant are available and code is valid (memoized to prevent infinite updates)
    const playground = useMemo(() =>
        code && tenant && isValidCode ? new Playground(tenant, code) : null,
        [code, tenant, isValidCode]
    );

    // Create the playground fact if it doesn't exist
    useEffect(() => {
        if (playground) {
            setLoading(true);
            setError(null);

            j.fact(playground)
                .then(() => {
                    setLoading(false);
                })
                .catch((error) => {
                    console.error('Error creating playground:', error);
                    setError('Failed to load playground. Please check the code and try again.');
                    setLoading(false);
                });
        }
    }, [playground]);

    const clearError = () => {
        setError(null);
    };

    return {
        playground,
        isValidCode,
        error,
        loading,
        clearError,
    };
} 