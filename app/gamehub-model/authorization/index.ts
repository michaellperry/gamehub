import { AuthorizationRules } from "jinaga";
import { bookkeepingAuthorization } from "./bookkeepingAuthorization.js";
import { gameSessionAuthorization } from "./gameSessionAuthorization.js";
import { tenantAuthorization } from "./tenantAuthorization.js";
import { userAuthorization } from "./userAuthorization.js";

export const authorization = (a: AuthorizationRules) => a
    .with(userAuthorization)
    .with(tenantAuthorization)
    .with(gameSessionAuthorization)
    .with(bookkeepingAuthorization)
    ;