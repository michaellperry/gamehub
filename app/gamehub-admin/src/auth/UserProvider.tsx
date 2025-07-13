import { Jinaga, User } from "jinaga";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { AuthContext } from "react-oauth2-code-pkce";
import { BearerAuthenticationProvider } from "./BearerAuthenticationProvider";

interface UserContextValue {
    user: User | null;
    error: Error | null;
}

const UserContext = createContext<UserContextValue>({
    user: null,
    error: null,
});

export const useUser = () => useContext(UserContext);

interface UserProviderProps {
    j: Jinaga;
    authProvider: BearerAuthenticationProvider;
}

export function UserProvider({ j, authProvider, children }: PropsWithChildren<UserProviderProps>) {
    const { token } = useContext(AuthContext);
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (token) {
            authProvider.setToken(token);
            j.login<User>()
                .then(({userFact}) => setUser(userFact))
                .catch(error => setError(error));
        }
        else {
            setUser(null);
            setError(null);
        }

        return () => {
            // Don't flash the user fact when the token is removed
            // setUser(null);
            setError(null);
        }
    }, [token, j, authProvider]);

    return (
        <UserContext.Provider value={{ user, error }}>
            {children}
        </UserContext.Provider>
    );
}
