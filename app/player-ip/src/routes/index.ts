import { Router, Request, Response } from 'express';
import authRoutes from './auth';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Identity provider is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'player-ip',
    description: 'GameHub Player Identity Provider - OAuth 2.0 identity provider for players',
    version: '1.0.0'
  });
});

// Authentication routes
router.use('/', authRoutes);

export default router;
