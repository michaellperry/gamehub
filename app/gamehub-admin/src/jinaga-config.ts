import { authorization } from "@model";
import { JinagaBrowser } from "jinaga";
import { BearerAuthenticationProvider } from "./auth/BearerAuthenticationProvider";

export const authProvider = new BearerAuthenticationProvider();

export const j = JinagaBrowser.create({
    indexedDb: import.meta.env.DEV ? undefined : "jinaga-gamehub-admin",
    httpEndpoint: import.meta.env.DEV ? undefined : import.meta.env.VITE_REPLICATOR_URL,
    httpAuthenticationProvider: import.meta.env.DEV ? undefined : authProvider
});

// Export authorization rules for the replicator
export const authorizationRules = authorization;
