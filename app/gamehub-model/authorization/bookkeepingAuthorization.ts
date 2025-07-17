import { AuthorizationRules } from "jinaga";
import { Administrator, ServicePrincipal } from "../model/index.js";

export const bookkeepingAuthorization = (a: AuthorizationRules) => a
    .type(ServicePrincipal, servicePrincipal => Administrator.usersOf(servicePrincipal.tenant))
    ;