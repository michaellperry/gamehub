import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { startSubscription } from "./gap/index.js";
import { CORS_ORIGIN, SERVER_PORT } from './config/environment';
import routes from './routes/index.js';
// Import database to ensure it's initialized
import './config/database.js';

// Initialize express app
const app = express();

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

// Configure routes
app.use('/', routes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

async function run() {
  let stopSubscription: () => void;
  
  // Skip Jinaga subscription during testing
  if (process.env.SKIP_JINAGA_SUBSCRIPTION === 'true') {
    console.log('Skipping Jinaga subscription for testing');
    stopSubscription = () => {};
  } else {
    try {
      stopSubscription = await startSubscription();
    }
    catch (error) {
      console.error('Error starting subscription:', error);
      console.error('Waiting for SIGINT or SIGTERM to shut down...');
      stopSubscription = () => {};
    }
  }

  // Start server
  const server = app.listen(SERVER_PORT, () => {
    console.log(`Server running on port ${SERVER_PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('Server shut down');
      stopSubscription();
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('Server shut down');
      stopSubscription();
      process.exit(0);
    });
  });
}

run();

export default app;
