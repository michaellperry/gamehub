import { authorization } from 'gamehub-model';
import { Tenant } from 'gamehub-model/model';
import { JinagaBrowser, User } from 'jinaga';
import { AuthProvider } from './auth/AuthProvider';
import { getEnv } from './utils/environment';

export const authProvider = new AuthProvider();

export const j = JinagaBrowser.create({
    httpEndpoint: import.meta.env.DEV ? undefined : getEnv('VITE_REPLICATOR_URL'),
    httpAuthenticationProvider: import.meta.env.DEV ? undefined : authProvider,
    feedRefreshIntervalSeconds: 10, // Quick fix for the inaugural event
});

async function setupTestData() {
    const f3 = await j.fact(new User('-----TENANT USER-----'));

    await j.fact(new Tenant(f3));
}

if (import.meta.env.DEV) {
    setupTestData()
        .then(() => {
            console.log('Test data setup complete');
        })
        .catch((error) => {
            console.error('Error setting up test data:', error);
        });
}

// Export authorization rules for the replicator
export const authorizationRules = authorization;
