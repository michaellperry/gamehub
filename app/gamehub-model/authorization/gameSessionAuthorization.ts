import { AuthorizationRules } from "jinaga";
import { Administrator, GameAccessPath, GameSession, GameSessionDate, GameSessionName, SessionState } from "../model/index.js";

export const gameSessionAuthorization = (a: AuthorizationRules) => a
  // Administrators can create game sessions for their tenants
  .type(GameSession, session => Administrator.usersOf(session.tenant))
  
  // Administrators can update session names
  .type(GameSessionName, name => Administrator.usersOf(name.session.tenant))
  
  // Administrators can update session dates
  .type(GameSessionDate, date => Administrator.usersOf(date.session.tenant))

  // Administrators can create participant access paths for sessions
  .type(GameAccessPath, accessPath => Administrator.usersOf(accessPath.session.tenant))
  
  // Administrators can create session state changes
  .type(SessionState, state => Administrator.usersOf(state.session.tenant))
  ;