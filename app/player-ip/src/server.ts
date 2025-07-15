import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { startSubscription, getSubscriptionStatus, SubscriptionState } from './gap/subscription.js';
import { CORS_ORIGIN, SERVER_PORT } from './config/environment.js';
import { router, setReady } from './routes/index.js';
// Import database to ensure it's initialized
import './config/database.js';

// Enhanced global error handlers for robust service continuation
process.on('unhandledRejection', (reason, promise) => {
    console.error('=== UNHANDLED PROMISE REJECTION ===');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Promise:', promise);
    console.error('Reason:', reason);
    if (reason instanceof Error) {
        console.error('Stack trace:', reason.stack);
    }

    // Check if this is a subscription-related error
    const subscriptionStatus = getSubscriptionStatus();
    if (subscriptionStatus.state === SubscriptionState.RETRYING ||
        subscriptionStatus.state === SubscriptionState.CONNECTING) {
        console.error('Subscription-related rejection detected - service will continue');
    }

    console.error('Service continuing despite unhandled rejection');
    console.error('=== END UNHANDLED REJECTION ===');

    // Don't exit - allow service to continue operating
});

process.on('uncaughtException', (error) => {
    console.error('=== UNCAUGHT EXCEPTION ===');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Error:', error);
    console.error('Stack trace:', error.stack);

    // Check if this might be subscription-related
    const errorMessage = error.message?.toLowerCase() || '';
    const isSubscriptionRelated = errorMessage.includes('subscription') ||
        errorMessage.includes('jinaga') ||
        errorMessage.includes('observer');

    if (isSubscriptionRelated) {
        console.error('Subscription-related exception detected');
        console.error('Attempting to continue service operation');
        console.error('=== END UNCAUGHT EXCEPTION (CONTINUING) ===');
        return; // Don't exit for subscription-related errors
    }

    console.error('=== END UNCAUGHT EXCEPTION ===');

    // Only exit for non-subscription critical errors
    process.exit(1);
});

// Initialize express app
const app = express();

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true
}));

// Health status endpoint for subscription monitoring
app.get('/health/subscription', (req: Request, res: Response) => {
    const status = getSubscriptionStatus();
    const isHealthy = status.state === SubscriptionState.CONNECTED;

    res.status(isHealthy ? 200 : 503).json({
        status: status.state,
        healthy: isHealthy,
        retryCount: status.retryCount,
        lastError: status.lastError?.message,
        lastRetryAt: status.lastRetryAt,
        connectedAt: status.connectedAt,
        timestamp: new Date().toISOString()
    });
});

// General health endpoint
app.get('/health', (req: Request, res: Response) => {
    const subscriptionStatus = getSubscriptionStatus();
    const isSubscriptionHealthy = subscriptionStatus.state === SubscriptionState.CONNECTED;

    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            http: 'healthy',
            subscription: {
                status: subscriptionStatus.state,
                healthy: isSubscriptionHealthy,
                degraded: !isSubscriptionHealthy
            }
        }
    });
});

// Configure routes
app.use('/', router);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

async function run() {
    let stopSubscription: () => void;

    // Skip Jinaga subscription during testing
    if (process.env.SKIP_JINAGA_SUBSCRIPTION === 'true') {
        console.log('Skipping Jinaga subscription for testing');
        stopSubscription = () => {};
    } else {
        console.log('=== STARTING SUBSCRIPTION WITH ROBUST ERROR HANDLING ===');
        try {
            stopSubscription = await startSubscription();

            // Check subscription status after startup
            const status = getSubscriptionStatus();
            if (status.state === SubscriptionState.CONNECTED) {
                console.log('Subscription started successfully - service fully operational');
                setReady();
            } else if (status.state === SubscriptionState.RETRYING) {
                console.log('Subscription is retrying - service operating in degraded mode');
                setReady(); // Still mark as ready to serve HTTP requests
            } else {
                console.log('Subscription failed - service operating in degraded mode');
                setReady(); // Still mark as ready to serve HTTP requests
            }
        }
        catch (error) {
            console.error('=== SUBSCRIPTION STARTUP ERROR (NON-FATAL) ===');
            console.error('Error starting subscription:', error);
            console.error('Service will continue in degraded mode');
            console.error('HTTP endpoints will remain functional');
            console.error('=== CONTINUING SERVICE STARTUP ===');

            // Provide a no-op stop function
            stopSubscription = () => {
                console.log('No-op subscription stop called (subscription never started)');
            };
        }
    }

    // Start HTTP server regardless of subscription status
    const server = app.listen(SERVER_PORT, () => {
        console.log(`=== HTTP SERVER STARTED ===`);
        console.log(`Server running on port ${SERVER_PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

        const status = getSubscriptionStatus();
        if (status.state === SubscriptionState.CONNECTED) {
            console.log('Service status: FULLY OPERATIONAL');
        } else {
            console.log('Service status: DEGRADED MODE (HTTP functional, subscription unavailable)');
            console.log(`Subscription state: ${status.state}`);
        }
        console.log(`Health check available at: http://localhost:${SERVER_PORT}/health`);
        console.log(`Subscription health: http://localhost:${SERVER_PORT}/health/subscription`);
    });

    // Periodic subscription status logging
    const statusInterval = setInterval(() => {
        const status = getSubscriptionStatus();
        if (status.state !== SubscriptionState.CONNECTED) {
            console.log(`=== SUBSCRIPTION STATUS UPDATE ===`);
            console.log(`State: ${status.state}`);
            console.log(`Retry count: ${status.retryCount}`);
            if (status.lastError) {
                console.log(`Last error: ${status.lastError.message}`);
            }
            if (status.lastRetryAt) {
                console.log(`Last retry: ${status.lastRetryAt.toISOString()}`);
            }
        }
    }, 30000); // Log every 30 seconds if not connected

    // Handle graceful shutdown
    const gracefulShutdown = (signal: string) => {
        console.log(`=== GRACEFUL SHUTDOWN (${signal}) ===`);
        clearInterval(statusInterval);

        server.close(() => {
            console.log('HTTP server shut down');
            stopSubscription();
            console.log('Subscription stopped');
            console.log('=== SHUTDOWN COMPLETE ===');
            process.exit(0);
        });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

run();

export default app;
