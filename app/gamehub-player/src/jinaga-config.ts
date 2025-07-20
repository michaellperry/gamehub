import { authorization } from 'gamehub-model';
import { Player, PlayerName, Tenant } from 'gamehub-model/model';
import { JinagaBrowser, Trace, Tracer, User } from 'jinaga';
import { AuthProvider } from './auth/AuthProvider';
import { getEnv } from './utils/environment';

export const authProvider = new AuthProvider();

export const j = JinagaBrowser.create({
    indexedDb: import.meta.env.DEV ? undefined : 'jinaga-gamehub-player',
    httpEndpoint: import.meta.env.DEV ? undefined : getEnv('VITE_REPLICATOR_URL'),
    httpAuthenticationProvider: import.meta.env.DEV ? undefined : authProvider
});

async function setupTestData() {
    const tenantCreator = await j.fact(new User('-----TENANT USER-----'));
    const tenant = await j.fact(new Tenant(tenantCreator));

    const playerUser = await j.fact(new User('-----PLAYER USER-----'));
    const player = await j.fact(new Player(playerUser, tenant));

    await j.fact(new PlayerName(player, 'Leroy Jenkins', []));
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

// Be quiet about info, metrics, and counters.
class ErrorConsoleTracer implements Tracer {
    info(_message: string): void {
    }
    warn(message: string): void {
        console.warn(message);
    }
    error(error: any): void {
        console.error(error);
    }
    dependency<T>(_name: string, _data: string, operation: () => Promise<T>): Promise<T> {
        return operation();
    }
    metric(_message: string, _measurements: { [key: string]: number; }): void {
    }
    counter(_name: string, _value: number): void {
    }
}

Trace.configure(new ErrorConsoleTracer());

// Export authorization rules for the replicator
export const authorizationRules = authorization;
