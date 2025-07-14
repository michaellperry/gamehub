# GameHub FusionAuth Setup

This directory contains an automation script for setting up FusionAuth for the GameHub application. The script creates and configures a FusionAuth application, sets up OAuth and CORS settings, and generates the necessary configuration files.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A running FusionAuth instance
- FusionAuth API key with appropriate permissions

## Installation

1. Navigate to the setup directory:
   ```bash
   cd setup
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

## Usage

### Basic Setup

Run the setup script with your FusionAuth API key:

```bash
npm run dev -- --api-key YOUR_API_KEY
```

Or using the compiled version:

```bash
npm start -- --api-key YOUR_API_KEY
```

### Advanced Options

The script supports various configuration options:

```bash
npm run dev -- \
  --api-key YOUR_API_KEY \
  --fusion-auth-url http://localhost/auth \
  --app-name GameHub \
  --admin-redirect-uri http://localhost/admin/callback \
  --player-redirect-uri http://localhost/player/callback \
  --content-store-url http://localhost/content \
  --replicator-url http://localhost/replicator/jinaga \
  --player-ip-url http://localhost/player-ip \
  --jwt-secret development-secret-key \
  --jwt-issuer player-ip \
  --jwt-audience gamehub-player \
  --player-app-url http://localhost/player \
  --force \
  --verbose
```

### Command Line Options

| Option                  | Description                    | Default                              |
| ----------------------- | ------------------------------ | ------------------------------------ |
| `--api-key`             | FusionAuth API key (required)  | -                                    |
| `--fusion-auth-url`     | FusionAuth URL                 | `http://localhost/auth`              |
| `--app-name`            | Application name               | `GameHub`                            |
| `--admin-redirect-uri`  | Admin redirect URI             | `http://localhost/admin/callback`    |
| `--player-redirect-uri` | Player redirect URI            | `http://localhost/player/callback`   |
| `--content-store-url`   | Content store URL              | `http://localhost/content`           |
| `--replicator-url`      | Replicator URL                 | `http://localhost/replicator/jinaga` |
| `--player-ip-url`       | Player IP URL                  | `http://localhost/player-ip`         |
| `--jwt-secret`          | JWT secret                     | `development-secret-key`             |
| `--jwt-issuer`          | JWT issuer                     | `player-ip`                          |
| `--jwt-audience`        | JWT audience                   | `gamehub-player`                     |
| `--player-app-url`      | Player app URL                 | `http://localhost/player`            |
| `--force`               | Force overwrite existing files | `false`                              |
| `--verbose`             | Enable verbose logging         | `false`                              |

## What the Script Does

1. **Creates FusionAuth Application**: Sets up a new OAuth application in FusionAuth with the specified name and configuration
2. **Configures OAuth Settings**: Sets up PKCE (Proof Key for Code Exchange) and other OAuth security settings
3. **Configures CORS**: Adds the necessary CORS origins to allow cross-origin requests
4. **Generates Provider Files**: Creates the FusionAuth provider file for the replicator
5. **Creates Environment Files**: Generates environment configuration files for the mesh and admin app

## Generated Files

The script creates the following files:

- `../mesh/replicator/authentication/fusionauth.provider` - FusionAuth provider configuration
- `../mesh/.env` - Mesh environment variables
- `../app/gamehub-admin/.env.container.local` - Admin app environment variables

## Post-Setup Steps

After running the setup script, you'll need to:

1. **Create a tenant** in the admin app by navigating to `http://localhost/portal/tenants`
2. **Update tenant configuration** using the setup script:
   ```bash
   ./scripts/setup-tenant.sh "YOUR_TENANT_PUBLIC_KEY"
   ```
   Or manually copy the tenant public key to the following files:
   - `app/gamehub-admin/.env.container.local`
3. **Rebuild the admin application** to apply the tenant configuration:
   ```bash
   cd app && npm run build:admin:container
   ```
4. **Authorize the Service Principal** by viewing the logs of the player-ip app, copying the public key, and adding it in the admin app's Service Principals page

## Updating Tenant Keys

Use the setup script to update tenant public keys and rebuild the admin application:

```bash
./scripts/setup-tenant.sh "YOUR_TENANT_PUBLIC_KEY"
```

Alternatively, use the included utility to update tenant public keys across configuration files only:

```bash
npm run update-tenant-key -- --tenant-key "YOUR_TENANT_PUBLIC_KEY"
```

Note: When using the utility directly, you'll need to manually rebuild the admin application:
```bash
cd ../app && npm run build:admin:container
```

Options:
- `--tenant-key` - The tenant public key in PEM format (required)
- `--verbose` - Enable verbose logging
- `--force` - Force update even if files don't exist

## Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run the script directly with ts-node
- `npm start` - Run the compiled JavaScript version
- `npm test` - Run tests (if available)

### Project Structure

```
setup/
├── src/
│   ├── cli/           # Command line interface
│   ├── services/      # Business logic services
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── dist/              # Compiled JavaScript (generated)
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
└── README.md          # This file
```

## Troubleshooting

### Common Issues

1. **API Key Invalid**: Ensure your FusionAuth API key has the necessary permissions
2. **Connection Refused**: Verify that FusionAuth is running and accessible at the specified URL
3. **File Permission Errors**: Ensure the script has write permissions to the target directories
4. **CORS Issues**: Check that all required origins are properly configured

### Logging

Enable verbose logging with the `--verbose` flag to see detailed information about the setup process:

```bash
npm run dev -- --api-key YOUR_API_KEY --verbose
```

### Getting Help

Use the help command to see all available options:

```bash
npm run dev -- --help
```

## License

This project is licensed under the ISC License.