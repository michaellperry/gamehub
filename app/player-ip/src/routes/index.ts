import { Router, Request, Response } from 'express';
import authRoutes from './auth.js';
import fs from 'fs';
import path from 'path';

let ready = false;

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        message: 'Identity provider is running',
        timestamp: new Date().toISOString(),
    });
});

router.get('/ready', (req: Request, res: Response) => {
    if (ready) {
        res.status(200).json({
            status: 'ready',
            message: 'Identity provider is ready to serve requests',
            timestamp: new Date().toISOString(),
        });
    } else {
        res.status(503).json({
            status: 'not ready',
            message: 'Identity provider is not ready yet',
            timestamp: new Date().toISOString(),
        });
    }
});

// Configuration status endpoint
router.get('/configured', (req: Request, res: Response) => {
    try {
        // Check JWT configuration
        const jwtConfigured = !!(
            process.env.JWT_SECRET &&
            process.env.JWT_EXPIRES_IN &&
            process.env.JWT_ISSUER &&
            process.env.JWT_AUDIENCE &&
            process.env.JWT_KEY_ID
        );

        const configuredGroups = {
            jwt: jwtConfigured,
        };

        const allConfigured = jwtConfigured;

        res.status(200).json({
            service: 'player-ip',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            configured: allConfigured,
            configuredGroups,
            ready,
        });
    } catch (error) {
        console.error('Error checking configuration:', error);
        res.status(500).json({
            service: 'player-ip',
            status: 'error',
            timestamp: new Date().toISOString(),
            configured: false,
            configuredGroups: {
                jwt: false,
            },
            ready: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// Root endpoint
router.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        name: 'player-ip',
        description: 'GameHub Player Identity Provider - OAuth 2.0 identity provider for players',
        version: '1.0.0',
    });
});

// Authentication routes
router.use('/', authRoutes);

function setReady() {
    ready = true;
}

export { router, setReady };
