import { ReactNode, useContext, useEffect } from 'react';
import { AuthContext } from 'react-oauth2-code-pkce';
import { useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { token, logIn } = useContext(AuthContext);
    const location = useLocation();

    useEffect(() => {
        if (import.meta.env.DEV) {
            // In development, we can skip the authentication provider
            return;
        }
        if (!token) {
            // Store the current URL in session storage for redirect after login
            sessionStorage.setItem('redirectUrl', location.pathname + location.search);
            logIn();
        }
    }, [token, location, logIn]);

    // If we have a token, render the protected content
    if (import.meta.env.DEV || token) {
        return <>{children}</>;
    }

    // While the login process is happening, show a loading state
    return (
        <div className="flex flex-col items-center justify-center">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Authenticating...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">You will be redirected to login.</p>
        </div>
    );
}
