import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { SERVER_PORT, CORS_ORIGIN } from './config/environment.js';
import routes from './routes/index.js';
import fs from 'fs-extra';
import path from 'path';
import { CLIENTS_DIR } from './config/environment.js';

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

// Configure routes
app.use('/', routes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({
        error: 'server_error',
        error_description: 'Internal Server Error',
    });
});

// Ensure clients directory exists
const ensureClientsDirectory = async () => {
    try {
        await fs.ensureDir(CLIENTS_DIR);
        console.log(`Clients directory ensured: ${CLIENTS_DIR}`);
    } catch (error) {
        console.error('Error ensuring clients directory:', error);
    }
};

// Start server
const startServer = async () => {
    // Ensure clients directory exists
    await ensureClientsDirectory();

    // Start server
    const server = app.listen(SERVER_PORT, () => {
        console.log(`Service Identity Provider running on port ${SERVER_PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Clients directory: ${CLIENTS_DIR}`);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('Shutting down server...');
        server.close(() => {
            console.log('Server shut down');
            process.exit(0);
        });
    });

    process.on('SIGTERM', () => {
        console.log('Shutting down server...');
        server.close(() => {
            console.log('Server shut down');
            process.exit(0);
        });
    });
};

// Start the server
startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

export default app;
