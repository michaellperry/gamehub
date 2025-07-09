import { Router, Request, Response } from 'express';
import { WebSocket } from 'ws';
import ObservabilityService from '../services/observability.service';

const router = Router();
const observabilityService = new ObservabilityService();

// Store WebSocket connections for real-time updates
const wsConnections = new Set<WebSocket>();

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
    
    // Broadcast update to WebSocket clients
    broadcastToWebSockets({
      type: 'status_update',
      data: status,
      timestamp: new Date().toISOString()
    });
    
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

/**
 * WebSocket connection handler
 */
export function handleWebSocketConnection(ws: WebSocket) {
  console.log('New WebSocket connection established');
  wsConnections.add(ws);

  // Send initial status
  observabilityService.getAggregatedStatus()
    .then(status => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'initial_status',
          data: status,
          timestamp: new Date().toISOString()
        }));
      }
    })
    .catch(error => {
      console.error('Error sending initial status:', error);
    });

  // Handle connection close
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    wsConnections.delete(ws);
  });

  // Handle connection errors
  ws.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
    wsConnections.delete(ws);
  });

  // Handle ping/pong for connection health
  ws.on('ping', () => {
    ws.pong();
  });
}

/**
 * Broadcast message to all connected WebSocket clients
 */
function broadcastToWebSockets(message: any) {
  const messageString = JSON.stringify(message);
  
  wsConnections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(messageString);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        wsConnections.delete(ws);
      }
    } else {
      wsConnections.delete(ws);
    }
  });
}

/**
 * Start periodic status updates via WebSocket
 */
export function startPeriodicUpdates(intervalMs: number = 10000) {
  setInterval(async () => {
    if (wsConnections.size === 0) {
      return; // No clients connected, skip update
    }

    try {
      const status = await observabilityService.getAggregatedStatus();
      broadcastToWebSockets({
        type: 'periodic_update',
        data: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error during periodic update:', error);
    }
  }, intervalMs);
}

export default router;