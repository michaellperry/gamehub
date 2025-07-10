import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import config from './config/environment';
import relayRoutes from './routes/relay.routes';

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    if (config.logLevel === 'debug' || logLevel === 'error') {
      console.log(`[${logLevel.toUpperCase()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  
  next();
});

// Routes
app.use('/', relayRoutes);

// Error handling middleware
app.use((error: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Unhandled promise rejection handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in production, just log the error
  if (config.nodeEnv === 'development') {
    process.exit(1);
  }
});

// Uncaught exception handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
server.listen(config.port, () => {
  console.log(`🚀 Relay Service started successfully`);
  console.log(`📡 Server running on port ${config.port}`);
  console.log(`🌐 Environment: ${config.nodeEnv}`);
  console.log(`📊 Log level: ${config.logLevel}`);
  console.log(`🔄 Cache timeout: ${config.cacheTimeout}ms`);
  
  // Log configured services
  const serviceCount = Object.keys(config.relayConfig.services).length;
  console.log(`🔍 Monitoring ${serviceCount} services:`);
  Object.entries(config.relayConfig.services).forEach(([id, service]) => {
    console.log(`  - ${service.name} (${id})`);
  });
  
});

export default app;