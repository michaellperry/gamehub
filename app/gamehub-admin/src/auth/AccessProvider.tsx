import React from "react";
import { UserProvider } from "./UserProvider";
import { AuthProvider } from "react-oauth2-code-pkce";
import { authConfig } from "./auth-config";
import { authProvider, j } from "../jinaga-config";

export default function AccessProvider({ children }: React.PropsWithChildren<{}>) {
    if (import.meta.env.DEV) {
        // In development, we can skip the authentication provider
        return (
            <UserProvider j={j} authProvider={authProvider}>
                {children}
            </UserProvider>
        )
    }

    return (
        <AuthProvider authConfig={authConfig}>
            <UserProvider j={j} authProvider={authProvider}>
                {children}
            </UserProvider>
        </AuthProvider>
    )
}