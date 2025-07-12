import { TAuthConfig, TRefreshTokenExpiredEvent } from "react-oauth2-code-pkce";

export const authConfig: TAuthConfig = {
  clientId: import.meta.env.VITE_CLIENT_ID,
  authorizationEndpoint: import.meta.env.VITE_AUTHORIZATION_ENDPOINT,
  tokenEndpoint: import.meta.env.VITE_TOKEN_ENDPOINT,
  redirectUri: import.meta.env.VITE_REDIRECT_URI,
  scope: 'openid profile offline_access',
  storageKeyPrefix: 'ROCP_admin_',
  onRefreshTokenExpire: (event: TRefreshTokenExpiredEvent) => event.logIn(undefined, undefined, "popup"),
  logoutEndpoint: import.meta.env.VITE_LOGOUT_ENDPOINT,
};
