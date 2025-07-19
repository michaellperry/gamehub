import { AuthenticationProvider, HttpHeaders, Trace } from 'jinaga';
import { getServiceToken } from '../utils/index.js';

export class ServiceAuthenticationProvider implements AuthenticationProvider {
    private cachedToken: string | null = null;

    async getHeaders(): Promise<HttpHeaders> {
        if (!this.cachedToken) {
            this.cachedToken = await getServiceToken();
        }
        return {
            Authorization: `Bearer ${this.cachedToken}`,
        };
    }

    async reauthenticate(): Promise<boolean> {
        this.cachedToken = await getServiceToken();
        return true;
    }
}
