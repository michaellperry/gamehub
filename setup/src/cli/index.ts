import { Command } from 'commander';
import { ScriptInputs, ScriptResult } from '../models';
import { logger } from '../utils/logger';
import { validateInputs } from '../utils/validation';
import { FusionAuthService } from '../services/fusionAuth';
import { FileGenerator } from '../services/fileGenerator';
import { updateTenantKey } from './updateTenantKey';

// Export the updateTenantKey function for direct use
export { updateTenantKey };

/**
 * CLI class for handling command line arguments and executing the script
 */
export class CLI {
  private program: Command;
  
  /**
   * Creates a new CLI instance
   */
  constructor() {
    this.program = new Command();
    this.configureProgram();
  }
  
  /**
   * Configures the command line program
   */
  private configureProgram(): void {
    this.program
      .name('setup-fusionauth')
      .description('Automates FusionAuth setup for GameHub')
      .version('1.0.0')
      .requiredOption('-k, --api-key <key>', 'FusionAuth API key')
      .option('-u, --fusion-auth-url <url>', 'FusionAuth URL', 'http://localhost/auth')
      .option('-n, --app-name <name>', 'Application name', 'GameHub')
      .option('-a, --admin-redirect-uri <uri>', 'Admin redirect URI', 'http://localhost/admin/callback')
      .option('-p, --player-redirect-uri <uri>', 'Player redirect URI', 'http://localhost/player/callback')
      .option('-c, --content-store-url <url>', 'Content store URL', 'http://localhost/content')
      .option('-r, --replicator-url <url>', 'Replicator URL', 'http://localhost/replicator/jinaga')
      .option('-i, --player-ip-url <url>', 'Player IP URL', 'http://localhost/player-ip')
      .option('-s, --jwt-secret <secret>', 'JWT secret', 'development-secret-key')
      .option('-j, --jwt-issuer <issuer>', 'JWT issuer', 'player-ip')
      .option('-d, --jwt-audience <audience>', 'JWT audience', 'gamehub-player')
      .option('-l, --player-app-url <url>', 'Player app URL', 'http://localhost/player')
      .option('-f, --force', 'Force overwrite of existing files', false)
      .option('-v, --verbose', 'Enable verbose logging', false);
  }
  
  /**
   * Parses command line arguments
   * @returns Parsed inputs
   */
  parseArguments(): ScriptInputs {
    this.program.parse(process.argv);
    const options = this.program.opts();
    
    // Set log level based on verbose flag
    if (options.verbose) {
      process.env.LOG_LEVEL = 'debug';
    }
    
    // Map CLI options to script inputs
    const inputs: Partial<ScriptInputs> = {
      API_KEY: options.apiKey,
      FUSION_AUTH_URL: options.fusionAuthUrl,
      APP_NAME: options.appName,
      ADMIN_REDIRECT_URI: options.adminRedirectUri,
      PLAYER_REDIRECT_URI: options.playerRedirectUri,
      CONTENT_STORE_URL: options.contentStoreUrl,
      REPLICATOR_URL: options.replicatorUrl,
      PLAYER_IP_URL: options.playerIpUrl,
      JWT_SECRET: options.jwtSecret,
      JWT_ISSUER: options.jwtIssuer,
      JWT_AUDIENCE: options.jwtAudience,
      PLAYER_APP_URL: options.playerAppUrl
    };
    
    // Validate inputs
    return validateInputs(inputs);
  }
  
  /**
   * Displays help information
   */
  displayHelp(): void {
    this.program.help();
  }
  
  /**
   * Displays version information
   */
  displayVersion(): void {
    console.log(this.program.opts().version);
  }
  
  /**
   * Runs the script with the provided inputs
   * @param inputs Script inputs
   * @returns Script result
   */
  async run(inputs: ScriptInputs): Promise<ScriptResult> {
    try {
      logger.info('Starting FusionAuth setup', {
        appName: inputs.APP_NAME,
        fusionAuthUrl: inputs.FUSION_AUTH_URL
      });
      
      // Create services
      const fusionAuthService = new FusionAuthService(inputs.API_KEY, inputs.FUSION_AUTH_URL);
      const fileGenerator = new FileGenerator();
      
      // Get command line options
      const options = this.program.opts();
      const overwrite = options.force === true;
      
      // 1. Create and configure FusionAuth application
      logger.info('Step 1: Creating and configuring FusionAuth application');
      const appResult = await fusionAuthService.createAndConfigureApplication(inputs);
      
      // 2. Get signing key information
      logger.info('Step 2: Getting signing key information');
      const keyInfo = await fusionAuthService.getSigningKey();
      
      // 3. Create provider files
      logger.info('Step 3: Creating provider files');
      fileGenerator.createProviderFiles(appResult, keyInfo, inputs, overwrite);
      
      // 4. Create environment files
      logger.info('Step 4: Creating environment files');
      fileGenerator.createEnvironmentFiles(appResult, inputs, overwrite);
      
      // 5. Create Vite environment files
      logger.info('Step 5: Creating Vite environment files');
      fileGenerator.createViteEnvironmentFiles(appResult, inputs, overwrite);
      
      // 6. Return success message with next steps
      logger.info('FusionAuth setup completed successfully', {
        clientId: appResult.clientId
      });
      
      return {
        success: true,
        message: "FusionAuth setup completed successfully",
        clientId: appResult.clientId,
        nextSteps: [
          "1. Create a tenant in the admin app by navigating to http://localhost/portal/tenants",
          "2. Copy the tenant public key to the following files:",
          "   - mesh/.env.local",
          "   - app/gamehub-admin/.env.container.local",
          "3. Restart the stack with 'docker compose down && docker compose up -d'",
          "4. Authorize the Service Principal by viewing the logs of the player-ip app, copying the public key, and adding it in the admin app's Service Principals page"
        ]
      };
    } catch (error) {
      logger.error('FusionAuth setup failed', { error });
      
      return {
        success: false,
        message: "FusionAuth setup failed",
        error: (error as Error).message
      };
    }
  }
}