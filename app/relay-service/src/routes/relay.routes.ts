import { Router, Request, Response } from 'express';
import ObservabilityService from '../services/observability.service';

const router = Router();
const observabilityService = new ObservabilityService();

/**
 * GET /relay
 * Returns the current status of all configured services
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const status = await observabilityService.getAggregatedStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting aggregated status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /relay/health
 * Health check endpoint for the relay service itself
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    service: 'relay-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cache: observabilityService.getCacheStats()
  });
});

/**
 * POST /relay/refresh
 * Force refresh of cached status (clears cache)
 */
router.post('/refresh', async (_req: Request, res: Response) => {
  try {
    observabilityService.clearCache();
    const status = await observabilityService.getAggregatedStatus();
    
    res.json({
      message: 'Cache cleared and status refreshed',
      status
    });
  } catch (error) {
    console.error('Error refreshing status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /relay/cache/stats
 * Get cache statistics for debugging
 */
router.get('/cache/stats', (_req: Request, res: Response) => {
  const stats = observabilityService.getCacheStats();
  res.json({
    cache: stats,
    timestamp: new Date().toISOString()
  });
});

export default router;