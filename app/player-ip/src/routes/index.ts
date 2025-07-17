import { Router, Request, Response } from 'express';
import authRoutes from './auth.js';
import { jinagaClient } from '../gap/jinaga-config.js';
import { User } from 'jinaga';
import fs from 'fs';
import path from 'path';

let ready = false;

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        message: 'Identity provider is running',
        timestamp: new Date().toISOString()
    });
});

router.get('/ready', (req: Request, res: Response) => {
    if (ready) {
        res.status(200).json({
            status: 'ready',
            message: 'Identity provider is ready to serve requests',
            timestamp: new Date().toISOString()
        });
    }
    else {
        res.status(503).json({
            status: 'not ready',
            message: 'Identity provider is not ready yet',
            timestamp: new Date().toISOString()
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

        // Check Service IP configuration
        const serviceIpConfigured = !!(
            process.env.SERVICE_IP_URL &&
            process.env.SERVICE_IP_CLIENT_ID &&
            process.env.SERVICE_IP_CLIENT_SECRET_FILE &&
            fs.existsSync(process.env.SERVICE_IP_CLIENT_SECRET_FILE)
        );

        // Check Tenant Public Key configuration
        const tenantPublicKeyConfigured = !!(
            process.env.TENANT_PUBLIC_KEY
        );

        const configuredGroups = {
            jwt: jwtConfigured,
            'service-ip': serviceIpConfigured,
            'tenant': tenantPublicKeyConfigured
        };

        const allConfigured = jwtConfigured && serviceIpConfigured && tenantPublicKeyConfigured;

        res.status(200).json({
            service: 'player-ip',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            configured: allConfigured,
            configuredGroups,
            ready
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
                'service-ip': false
            },
            ready: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Root endpoint
router.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        name: 'player-ip',
        description: 'GameHub Player Identity Provider - OAuth 2.0 identity provider for players',
        version: '1.0.0'
    });
});

// Public key endpoint
router.get('/public-key', async (req: Request, res: Response) => {
    try {
        // In test mode, return a mock public key
        if (process.env.NODE_ENV === 'test' || process.env.SKIP_JINAGA_SUBSCRIPTION === 'true') {
            res.status(200).json({
                publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4f5wg5l2hKsTeNem/V41\nfGnJm6gOdrj8ym3rFkEjWT2btYK2c4kv9R1dWQlUKr3FMTi2TR4xpjhqZFMEXPfH\n8Q02NtNbc6ej8cLjnsZcXLlVBuqGM5RD2J4T9EkVDH3RHPbNK9EO4TaQVnF3Q2N7\nMRTjDvlqvd6lEgBaRMhHFpFpxjO3gPlGDVrfQgnhoAoaAn7dWgyMINy6NlVYtLx2\nKCDNcjGQqkCRJRxBjHjMPZbC4xVqLbgAXfAhw1jC4Vd4RjVxVb5AaJ26r5FVnKpV\n8OXWut1WsVK6U5ZMvPC9HDUUhcKVjHAcsoKb0A1xyWY4FQAnGPfOh6RDHwSUcjFF\nzQIDAQAB\n-----END PUBLIC KEY-----'
            });
            return;
        }

        const { userFact } = await jinagaClient.login<User>();

        res.status(200).json({
            publicKey: userFact.publicKey
        });
    } catch (error) {
        console.error('Error retrieving public key:', error);
        res.status(500).json({
            error: 'Failed to retrieve public key',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Authentication routes
router.use('/', authRoutes);

function setReady() {
    ready = true;
}

export { router, setReady };
