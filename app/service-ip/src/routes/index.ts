/**
 * Route exports
 */

import { Router, Request, Response } from 'express';
import tokenRoutes from './token.js';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'service-ip'
  });
});

// Mount routes
router.use(tokenRoutes);

export default router;
