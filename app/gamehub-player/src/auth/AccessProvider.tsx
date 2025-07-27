import { authProvider, j } from '@/jinaga-config.ts';
import { PropsWithChildren, useContext, useEffect } from 'react';
import {
    AuthContext,
    AuthProvider,
    IAuthContext,
    type TAuthConfig,
    type TRefreshTokenExpiredEvent,
} from 'react-oauth2-code-pkce';
import { getEnv } from '../utils/environment.ts';
import { UserProvider } from './UserProvider.tsx';

// Function to detect private browsing mode
const isPrivateBrowsingMode = (): boolean => {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return false;
    } catch {
        return true;
    }
};

export function AccessProvider({ children }: PropsWithChildren) {
    // Check for private browsing mode
    useEffect(() => {
        if (isPrivateBrowsingMode()) {
            console.warn(
                'Private browsing mode detected. Authentication persistence may be limited.'
            );
            // You could add a user-facing notification here if desired
        }
    }, []);

    if (import.meta.env.DEV) {
        return (
            <UserProvider j={j} authProvider={authProvider}>
                {children}
            </UserProvider>
        );
    }

    const authConfig: TAuthConfig = {
        clientId: getEnv('VITE_CLIENT_ID'),
        authorizationEndpoint: getEnv('VITE_AUTHORIZATION_ENDPOINT'),
        tokenEndpoint: getEnv('VITE_TOKEN_ENDPOINT'),
        redirectUri: getEnv('VITE_REDIRECT_URI'),
        scope: 'openid profile offline_access',
        storageKeyPrefix: 'ROCP_player_',
        onRefreshTokenExpire: (event: TRefreshTokenExpiredEvent) => {
            try {
                event.logIn(undefined, {}, 'popup');
            } catch (error) {
                console.error('Token refresh failed:', error);
            }
        },
        logoutEndpoint: getEnv('VITE_LOGOUT_ENDPOINT'),
    };

    return (
        <AuthProvider authConfig={authConfig}>
            <UserProvider j={j} authProvider={authProvider}>
                {children}
            </UserProvider>
        </AuthProvider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAccess = () => {
    const { logIn: authLogIn, logOut: authLogOut } = useContext(AuthContext as React.Context<IAuthContext>);

    if (import.meta.env.DEV) {
        return {
            logIn: async () => { },
            logOut: () => { },
        };
    }

    return {
        logIn: async () => {
            await authLogIn();
        },
        logOut: () => {
            authLogOut();
        },
    };
};
