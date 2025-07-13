import { AuthorizationRules } from "jinaga";
import { bookkeepingAuthorization } from "./bookkeepingAuthorization.js";
import { gameSessionAuthorization } from "./gameSessionAuthorization.js";
import { tenantAuthorization } from "./tenantAuthorization.js";

export const authorization = (a: AuthorizationRules) => a
    .with(tenantAuthorization)
    .with(gameSessionAuthorization)
    .with(bookkeepingAuthorization)
    ;