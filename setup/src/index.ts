#!/usr/bin/env node

import dotenv from 'dotenv';
import { CLI } from './cli';
import { logger } from './utils/logger';

// Load environment variables from .env file
dotenv.config();

/**
 * Main entry point for the FusionAuth setup script
 */
async function main() {
  try {
    // Create CLI instance
    const cli = new CLI();
    
    // Parse command line arguments
    const inputs = cli.parseArguments();
    
    // Run the script
    const result = await cli.run(inputs);
    
    // Display result
    if (result.success) {
      logger.info(result.message, {
        clientId: result.clientId
      });
      
      // Display next steps
      if (result.nextSteps) {
        console.log('\nNext steps:');
        result.nextSteps.forEach((step, index) => {
          console.log(`${step}`);
        });
      }
      
      process.exit(0);
    } else {
      logger.error(result.message, {
        error: result.error
      });
      
      process.exit(1);
    }
  } catch (error) {
    logger.error('Script execution failed', { error });
    process.exit(1);
  }
}

// Execute the main function
main();