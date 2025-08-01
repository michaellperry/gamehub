import { useContext, useEffect, useState } from 'react';
import { AuthContext, IAuthContext } from 'react-oauth2-code-pkce';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../hooks/usePlayer';

/**
 * Callback component for handling the OAuth callback
 *
 * This component extracts the authorization code from the URL query parameters
 * and exchanges it for an access token.
 */
export function Callback() {
    const navigate = useNavigate();
    const { token, loginInProgress } = useContext(AuthContext as React.Context<IAuthContext>);
    const { player, error: playerError, loading: playerLoading } = usePlayer();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // If we already have a token, redirect to home page
    useEffect(() => {
        if (token) {
            // The usePlayer hook will handle creating the player fact
            // We just need to wait for it to be ready
            if (player && !playerLoading) {
                navigate('/');
            }
        } else if (!loginInProgress) {
            // If no token is available, we can assume the authentication failed
            setError('Authentication failed. Please scan the QR code again.');
            setLoading(false);
        }
    }, [token, navigate, player, playerLoading, loginInProgress]);

    // Combine loading states
    const isLoading = loading || playerLoading;
    const combinedError = error || playerError;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Processing authentication...
                </h1>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (combinedError) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <h1 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-4">
                    Authentication Error
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{combinedError}</p>
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
                Authentication successful!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">You will be redirected shortly.</p>
        </div>
    );
}

export default Callback;
