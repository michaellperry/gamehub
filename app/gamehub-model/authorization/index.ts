import { AuthorizationRules } from "jinaga";
import { gameSessionAuthorization } from "./gameSessionAuthorization.js";
import { tenantAuthorization } from "./tenantAuthorization.js";

export const authorization = (a: AuthorizationRules) => a
  .with(tenantAuthorization)
  .with(gameSessionAuthorization)
  ;