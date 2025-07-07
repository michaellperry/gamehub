#!/usr/bin/env ts-node

/**
 * FusionAuth Automation Script for GameHub
 * 
 * This script automates the setup of FusionAuth for the GameHub application.
 * It creates and configures a FusionAuth application, sets up OAuth and CORS,
 * and generates the necessary configuration files.
 * 
 * Usage:
 *   ts-node setup-fusionauth.ts --api-key <your-api-key>
 * 
 * For more options:
 *   ts-node setup-fusionauth.ts --help
 */

// Import and execute the main script
import './src/index';