import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccess } from "./AccessProvider";

/**
 * Access component for handling AAP-based login
 * 
 * This component extracts the AAP ID from the URL path parameters
 * and uses the react-oauth2-code-pkce library to initiate the OAuth flow.
 */
export function Access() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { logIn } = useAccess();

    useEffect(() => {
        const initiateAuth = async () => {
            try {
                await logIn();
            } catch (err) {
                console.error('Authentication error:', err);
                setError('Authentication failed. Please try again.');
                setLoading(false);
            }
        };

        initiateAuth();
    }, [logIn, navigate]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Authenticating...
                </h1>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <h1 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-4">
                    Authentication Error
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                    Return to Home
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Authentication in progress...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
                You will be redirected shortly.
            </p>
        </div>
    );
}

export default Access;
