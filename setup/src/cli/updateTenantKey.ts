import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { logger } from '../utils/logger';
import { fileExists, readFile, writeFile } from '../utils/helpers';

/**
 * File information interface
 */
interface FileInfo {
    path: string;
    variableName: string;
    exists: boolean;
    quoted: boolean; // Indicates if the value should be enclosed in extra quotes
}

/**
 * Updates the tenant public key in all relevant files
 */
export async function updateTenantKey(): Promise<void> {
    const program = new Command();

    program
        .name('update-tenant-key')
        .description('Updates the tenant public key in multiple configuration files')
        .requiredOption('-k, --tenant-key <key>', 'Tenant public key (in PEM format)')
        .option('-v, --verbose', 'Enable verbose logging', false)
        .option('-f, --force', 'Force update even if files do not exist', false);

    program.parse(process.argv);
    const options = program.opts();

    // Set log level based on verbose flag
    if (options.verbose) {
        process.env.LOG_LEVEL = 'debug';
        logger.debug('Verbose logging enabled');
    }

    const tenantKey = options.tenantKey;
    const singleQuotedTenantKey = `"${tenantKey}"`;
    const extraQuotedTenantKey = `'"${tenantKey}"'`;
    const force = options.force;

    try {
        logger.info('Starting tenant public key update process');

        // Define files to update with their variable names
        const filesToUpdate: FileInfo[] = [
            {
                path: '../app/gamehub-admin/.env.container.local',
                variableName: 'VITE_TENANT_PUBLIC_KEY',
                exists: false,
                quoted: true
            },
            {
                path: '../mesh/.env.local',
                variableName: 'TENANT_PUBLIC_KEY',
                exists: false,
                quoted: false
            }
        ];

        // Check if files exist
        for (const file of filesToUpdate) {
            const fullPath = path.resolve(__dirname, file.path);
            file.exists = fileExists(file.path);

            if (!file.exists) {
                if (force) {
                    logger.warn(`File not found: ${file.path}. Will create it because --force flag is set.`);
                } else {
                    logger.error(`File not found: ${file.path}. Use --force flag to create it.`);
                    throw new Error(`File not found: ${file.path}`);
                }
            }
        }

        // Update each file
        for (const file of filesToUpdate) {
            try {
                logger.info(`Updating tenant public key in ${file.path}`);

                let content = '';

                // Read existing content if file exists
                if (file.exists) {
                    content = readFile(file.path);
                    logger.debug(`Read existing content from ${file.path}`);
                }

                // Update or add the tenant key variable
                const variableRegex = new RegExp(`^${file.variableName}=.*$`, 'm');
                const variableLine = `${file.variableName}=${file.quoted ? extraQuotedTenantKey : singleQuotedTenantKey}`;

                if (content.match(variableRegex)) {
                    // Replace existing variable
                    content = content.replace(variableRegex, variableLine);
                    logger.debug(`Replaced existing ${file.variableName} in ${file.path}`);
                } else {
                    // Add new variable
                    content = content.trim();
                    if (content && !content.endsWith('\n')) {
                        content += '\n';
                    }
                    content += `${variableLine}\n`;
                    logger.debug(`Added new ${file.variableName} to ${file.path}`);
                }

                // Write updated content
                writeFile(file.path, content, true);
                logger.info(`Successfully updated ${file.variableName} in ${file.path}`);
            } catch (error) {
                logger.error(`Failed to update ${file.path}`, { error });
                throw new Error(`Failed to update ${file.path}: ${(error as Error).message}`);
            }
        }

        logger.info('Tenant public key updated successfully in all files');

        // Suggest next steps
        console.log('\nNext steps:');
        console.log('Rebuild the admin app to apply changes:');
        console.log('   cd app && npm run build:admin:container');

    } catch (error) {
        logger.error('Failed to update tenant public key', { error });
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }
}

// Allow direct execution
if (require.main === module) {
    updateTenantKey().catch(error => {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    });
}