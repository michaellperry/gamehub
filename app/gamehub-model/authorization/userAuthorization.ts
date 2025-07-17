import { AuthorizationRules, User } from "jinaga";

export const userAuthorization = (a: AuthorizationRules) => a
  // Anybody can create user facts
  .any(User)
  ;
