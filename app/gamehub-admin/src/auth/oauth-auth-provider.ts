import { AuthenticationProvider, HttpHeaders } from "jinaga";
import { IAuthContext } from "react-oauth2-code-pkce";

export class OAuth2AuthenticationProvider implements AuthenticationProvider {
  constructor(private authContext: IAuthContext) {}

  async getHeaders(): Promise<HttpHeaders> {
    const { token } = this.authContext;
    
    if (!token) {
      return {};
    }
    
    return {
      "Authorization": `Bearer ${token}`
    };
  }

  async reauthenticate(): Promise<boolean> {
    const { token, logIn } = this.authContext;
    
    // If we have a token, try to refresh it
    if (token) {
      try {
        // The react-oauth2-code-pkce library will handle token refresh
        await logIn();
        return true; // Indicate that we successfully refreshed the token
      } catch (error) {
        console.error("Failed to refresh token:", error);
        return false; // Indicate that we failed to refresh the token
      }
    }
    
    // If we don't have a token, we need to redirect to login
    return false;
  }
}
