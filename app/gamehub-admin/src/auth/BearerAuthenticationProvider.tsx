import { AuthenticationProvider, HttpHeaders } from 'jinaga';

export class BearerAuthenticationProvider implements AuthenticationProvider {
    private accessToken: string | null = null;

    setToken(token: string) {
        this.accessToken = token;
    }

    getHeaders(): Promise<HttpHeaders> {
        if (this.accessToken) {
            return Promise.resolve({
                Authorization: `Bearer ${this.accessToken}`,
            });
        } else {
            return Promise.resolve({});
        }
    }

    reauthenticate(): Promise<boolean> {
        return Promise.resolve(false);
    }
}
