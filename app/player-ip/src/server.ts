import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
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

    console.error('Service continuing despite unhandled rejection');
    console.error('=== END UNHANDLED REJECTION ===');

    // Don't exit - allow service to continue operating
});

process.on('uncaughtException', (error) => {
    console.error('=== UNCAUGHT EXCEPTION ===');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Error:', error);
    console.error('Stack trace:', error.stack);

    console.error('=== END UNCAUGHT EXCEPTION ===');

    // Exit for critical errors
    process.exit(1);
});

// Initialize express app
const app = express();

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    cors({
        origin: CORS_ORIGIN,
        credentials: true,
    })
);

// General health endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            http: 'healthy',
        },
    });
});

// Configure routes
app.use('/', router);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
    });
});

async function run() {
    // Mark service as ready
    setReady();

    // Start HTTP server
    const server = app.listen(SERVER_PORT, () => {
        console.log(`=== HTTP SERVER STARTED ===`);
        console.log(`Server running on port ${SERVER_PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Service status: OPERATIONAL`);
        console.log(`Health check available at: http://localhost:${SERVER_PORT}/health`);
    });

    // Handle graceful shutdown
    const gracefulShutdown = (signal: string) => {
        console.log(`=== GRACEFUL SHUTDOWN (${signal}) ===`);

        server.close(() => {
            console.log('HTTP server closed');
            process.exit(0);
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
            console.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Start the server
run().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

export default app;
