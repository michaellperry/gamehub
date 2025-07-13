import { authorization } from "@model";
import { JinagaBrowser } from "jinaga";
import { BearerAuthenticationProvider } from "./auth/BearerAuthenticationProvider";

export const authProvider = new BearerAuthenticationProvider();

export const j = JinagaBrowser.create({
    indexedDb: "jinaga-launchkings-admin",
    httpEndpoint: import.meta.env.VITE_REPLICATOR_URL,
    httpAuthenticationProvider: authProvider
});

// Export authorization rules for the replicator
export const authorizationRules = authorization;
