import { ConsoleTracer, Trace, User } from 'jinaga';
import { model } from 'gamehub-model';
import { GameAccessPathConfigured, GameAccessPath, Tenant } from 'gamehub-model/model';

// Type definitions for Node.js
declare global {
    namespace NodeJS {
        interface Timeout {}
    }
}
import { OpenAccessPolicy } from '../models/index.js';
import { createOpenAccessPath } from '../repository/index.js';
import { jinagaClient } from './jinaga-config.js';

// Subscription state management
export enum SubscriptionState {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    RETRYING = 'retrying',
    FAILED = 'failed',
}

interface SubscriptionStatus {
    state: SubscriptionState;
    lastError?: Error;
    retryCount: number;
    lastRetryAt?: Date;
    connectedAt?: Date;
}

// Global subscription status
let subscriptionStatus: SubscriptionStatus = {
    state: SubscriptionState.DISCONNECTED,
    retryCount: 0,
};

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
};

// Calculate exponential backoff delay
function calculateRetryDelay(retryCount: number): number {
    const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount);
    return Math.min(delay, RETRY_CONFIG.maxDelay);
}

// Check if error is transient (network-related) vs permanent (auth-related)
function isTransientError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';

    // Network-related errors that can be retried
    const transientPatterns = [
        'network',
        'timeout',
        'connection',
        'econnrefused',
        'enotfound',
        'etimedout',
        'socket',
        'fetch failed',
        'service unavailable',
        'bad gateway',
        'gateway timeout',
    ];

    return transientPatterns.some(
        (pattern) => errorMessage.includes(pattern) || errorCode.includes(pattern)
    );
}

// Get current subscription status
export function getSubscriptionStatus(): SubscriptionStatus {
    return { ...subscriptionStatus };
}

const accessPathsToConfigure = model
    .given(Tenant)
    .match((tenant) =>
        GameAccessPath.in(tenant).notExists((accessPath) =>
            GameAccessPathConfigured.for(accessPath)
        )
    );

// Robust subscription function with retry logic
async function attemptSubscription(retryCount: number = 0): Promise<() => void> {
    subscriptionStatus.state = SubscriptionState.CONNECTING;
    subscriptionStatus.retryCount = retryCount;

    console.log('=== SUBSCRIPTION ATTEMPT ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Retry count:', retryCount);

    try {
        const { userFact } = await jinagaClient.login<User>();
        console.log('Jinaga login successful');

        Trace.info(`Attendee service principal public key:\n${userFact.publicKey}`);

        const tenant = new Tenant(new User(process.env.TENANT_PUBLIC_KEY!));
        console.log('Creating subscription observer...');

        // Wrap the subscription call in try-catch for robust error handling
        let observer;
        try {
            observer = jinagaClient.subscribe(
                accessPathsToConfigure,
                tenant,
                async (accessPath) => {
                    try {
                        const typedAccessPath = accessPath as GameAccessPath;
                        Trace.info(
                            `Configuring access path ${typedAccessPath.id} for event ${typedAccessPath.session.id}.`
                        );
                        await createOpenAccessPath(
                            typedAccessPath.id,
                            OpenAccessPolicy.COOKIE_BASED,
                            typedAccessPath.session.id
                        );
                        await jinagaClient.fact(
                            new GameAccessPathConfigured(typedAccessPath, new Date())
                        );
                        Trace.info(
                            `Successfully configured access path ${typedAccessPath.id} for event ${typedAccessPath.session.id}.`
                        );
                    } catch (error) {
                        console.error('=== SUBSCRIPTION CALLBACK ERROR ===');
                        console.error('Timestamp:', new Date().toISOString());
                        console.error('Error in subscription callback:', error);
                        if (error instanceof Error) {
                            console.error('Stack trace:', error.stack);
                        }
                        console.error('=== END CALLBACK ERROR ===');
                        Trace.error(error);
                    }
                }
            );
        } catch (subscriptionError) {
            console.error('=== SUBSCRIPTION CREATION ERROR ===');
            console.error('Timestamp:', new Date().toISOString());
            console.error('Error creating subscription:', subscriptionError);
            throw subscriptionError;
        }

        console.log('Subscription observer created successfully');

        let retryTimeoutId: any = null;

        const initializeCache = async () => {
            try {
                console.log('Initializing subscription cache...');
                const cacheReady = await observer.cached();
                if (cacheReady) {
                    console.log('Subscription cache is ready');
                    subscriptionStatus.state = SubscriptionState.CONNECTED;
                    subscriptionStatus.connectedAt = new Date();
                    subscriptionStatus.lastError = undefined;
                    Trace.info('Subscription is cached.');
                } else {
                    console.log('Subscription cache loading...');
                    Trace.info('Subscription is loading.');
                    await observer.loaded();
                    console.log('Subscription loaded successfully');
                    subscriptionStatus.state = SubscriptionState.CONNECTED;
                    subscriptionStatus.connectedAt = new Date();
                    subscriptionStatus.lastError = undefined;
                    Trace.info('Subscription loaded successfully.');
                }
            } catch (error) {
                console.error('=== CACHE INITIALIZATION ERROR ===');
                console.error('Timestamp:', new Date().toISOString());
                console.error('Error initializing cache:', error);
                if (error instanceof Error) {
                    console.error('Stack trace:', error.stack);
                }
                console.error('Retrying cache initialization in 5 seconds...');
                console.error('=== END CACHE ERROR ===');
                Trace.error(error);
                // Retry cache initialization in 5 seconds
                retryTimeoutId = setTimeout(() => {
                    initializeCache();
                }, 5000);
            }
        };

        // Start cache initialization
        initializeCache();

        console.log('=== SUBSCRIPTION ATTEMPT SUCCESSFUL ===');

        return () => {
            console.log('=== STOPPING SUBSCRIPTION ===');
            console.log('Timestamp:', new Date().toISOString());
            subscriptionStatus.state = SubscriptionState.DISCONNECTED;
            observer.stop();
            if (retryTimeoutId) {
                clearTimeout(retryTimeoutId);
            }
            console.log('Subscription stopped successfully');
            Trace.info('Subscription stopped.');
        };
    } catch (error) {
        console.error('=== SUBSCRIPTION ATTEMPT ERROR ===');
        console.error('Timestamp:', new Date().toISOString());
        console.error('Error during subscription attempt:', error);
        if (error instanceof Error) {
            console.error('Stack trace:', error.stack);
        }
        console.error('=== END ATTEMPT ERROR ===');

        subscriptionStatus.lastError = error instanceof Error ? error : new Error(String(error));
        subscriptionStatus.lastRetryAt = new Date();

        // Check if this is a transient error and we haven't exceeded retry limit
        if (isTransientError(error) && retryCount < RETRY_CONFIG.maxRetries) {
            const delay = calculateRetryDelay(retryCount);
            subscriptionStatus.state = SubscriptionState.RETRYING;

            console.log(`=== SCHEDULING RETRY ${retryCount + 1}/${RETRY_CONFIG.maxRetries} ===`);
            console.log('Delay:', delay, 'ms');
            console.log('Next retry at:', new Date(Date.now() + delay).toISOString());

            return new Promise((resolve) => {
                setTimeout(async () => {
                    try {
                        const stopFunction = await attemptSubscription(retryCount + 1);
                        resolve(stopFunction);
                    } catch (retryError) {
                        // If retry also fails, return a no-op function to prevent service shutdown
                        console.error('Retry failed, returning no-op stop function');
                        resolve(() => {
                            console.log('No-op subscription stop called');
                        });
                    }
                }, delay);
            });
        } else {
            // Permanent failure or max retries exceeded
            subscriptionStatus.state = SubscriptionState.FAILED;
            console.error('=== SUBSCRIPTION PERMANENTLY FAILED ===');
            console.error(
                'Reason:',
                !isTransientError(error) ? 'Non-transient error' : 'Max retries exceeded'
            );

            // Return a no-op function instead of throwing to prevent service shutdown
            return () => {
                console.log('No-op subscription stop called (subscription failed)');
            };
        }
    }
}

export async function startSubscription(): Promise<() => void> {
    if (
        !process.env.TENANT_PUBLIC_KEY ||
        !process.env.TENANT_PUBLIC_KEY.startsWith('-----BEGIN PUBLIC KEY-----')
    ) {
        throw new Error(
            'Set the TENANT_PUBLIC_KEY environment variable to the public key of the tenant creator'
        );
    }

    Trace.configure(new ConsoleTracer());

    console.log('=== SUBSCRIPTION STARTUP ===');
    console.log('Timestamp:', new Date().toISOString());

    try {
        return await attemptSubscription();
    } catch (error) {
        console.error('=== SUBSCRIPTION STARTUP FAILED ===');
        console.error('Returning no-op stop function to prevent service shutdown');

        // Return a no-op function instead of throwing to prevent service shutdown
        return () => {
            console.log('No-op subscription stop called (startup failed)');
        };
    }
}
