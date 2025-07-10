/**
 * Route exports
 */

import { Router, Request, Response } from 'express';
import tokenRoutes from './token.js';
import fs from 'fs';
import path from 'path';
import { CLIENTS_DIR } from '../config/environment.js';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'service-ip'
  });
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

    // Check clients configuration - list configured clients in CLIENTS_DIR
    let clientsConfigured = false;
    let configuredClients: string[] = [];
    
    try {
      if (fs.existsSync(CLIENTS_DIR)) {
        const clientFiles = fs.readdirSync(CLIENTS_DIR);
        configuredClients = clientFiles.filter(file => {
          const filePath = path.join(CLIENTS_DIR, file);
          return fs.statSync(filePath).isFile() && file.length > 0;
        });
        clientsConfigured = configuredClients.length > 0;
      }
    } catch (error) {
      console.error('Error reading clients directory:', error);
      clientsConfigured = false;
    }

    const configuredGroups = {
      jwt: jwtConfigured,
      clients: configuredClients
    };

    const allConfigured = jwtConfigured && clientsConfigured;

    res.status(200).json({
      service: 'service-ip',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      configured: allConfigured,
      configuredGroups,
      ready: allConfigured // Service is ready when configured
    });
  } catch (error) {
    console.error('Error checking configuration:', error);
    res.status(500).json({
      service: 'service-ip',
      status: 'error',
      timestamp: new Date().toISOString(),
      configured: false,
      configuredGroups: {
        jwt: false,
        clients: []
      },
      ready: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Readiness check endpoint
router.get('/ready', (req: Request, res: Response) => {
  try {
    // Check JWT configuration
    const jwtConfigured = !!(
      process.env.JWT_SECRET &&
      process.env.JWT_EXPIRES_IN &&
      process.env.JWT_ISSUER &&
      process.env.JWT_AUDIENCE &&
      process.env.JWT_KEY_ID
    );

    // Check clients configuration
    let clientsConfigured = false;
    try {
      if (fs.existsSync(CLIENTS_DIR)) {
        const clientFiles = fs.readdirSync(CLIENTS_DIR);
        const validClients = clientFiles.filter(file => {
          const filePath = path.join(CLIENTS_DIR, file);
          return fs.statSync(filePath).isFile() && file.length > 0;
        });
        clientsConfigured = validClients.length > 0;
      }
    } catch (error) {
      console.error('Error reading clients directory:', error);
      clientsConfigured = false;
    }

    const ready = jwtConfigured && clientsConfigured;

    if (ready) {
      res.status(200).json({
        status: 'ready',
        message: 'Service identity provider is ready to serve requests',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        message: 'Service identity provider is not ready yet',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error checking readiness:', error);
    res.status(503).json({
      status: 'not ready',
      message: 'Error checking readiness',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mount routes
router.use(tokenRoutes);

export default router;
