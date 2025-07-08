# 3-Step Setup Guide for GameHub Docker Compose Mesh

Before you can use your full GameHub Docker Compose mesh, you need to initialize three components:

1. **FusionAuth**: Configure the authentication service.
2. **GameHub Tenant**: Set up a tenant for your GameHub instance.
3. **Service Principals**: Create a service principal for support services.

## Step 1: FusionAuth Configuration

FusionAuth is your administrator identity provider. This step sets up your FusionAuth admin account and configures the identity provider with the proper OAuth2 flows and JWT settings.

1. Navigate to http://localhost/auth/
2. Create an admin account
3. Run the FusionAuth setup to create an API key (skip the other steps).
4. Copy that API key.
5. From your terminal, execute: `./scripts/setup-fusionauth.sh <API_KEY>`

### Step 2: Tenant Creation and Configuration

GameHub is a multi-tenant application. Create the tenant using your administrator account so that you have full access to the tenant management features. Then run a script to configure the web apps to use that tenant.

1. Navigate to http://localhost/portal/tenants
2. Log in using FusionAuth credentials from Step 1
3. Create new tenant and copy the generated public key
4. From your terminal, execute: `./scripts/setup-tenant.sh "<TENANT_PUBLIC_KEY>"`

**Script Functionality**:
- Validates tenant public key format
- Updates [`mesh/.env.local`](mesh/.env.local:1) with `TENANT_PUBLIC_KEY`
- Restarts necessary Docker services to apply changes
- Validates tenant configuration

### Step 3: Service Principal Configuration

The backend services authenticate using service principals. This step creates a service principal for the Player-IP service, which allows players to anonymously log into your game.

1. Navigate to http://localhost/portal/service-principals
2. Log in using FusionAuth credentials
3. Click "Create Service Principal for Player-IP"
4. System automatically fetches player-ip public key from http://localhost/player-ip/public-key
5. Confirm service principal creation

**System Functionality**:
- Admin portal makes GET request to player-ip service for public key
- Creates service principal with fetched key
- Updates service configurations automatically

## Setup Page Implementation

The setup page at http://localhost should include:

### Key Features:
- **Progress Indicator**: Visual progress bar showing current step
- **Direct Links**: Buttons opening required admin interfaces (FusionAuth, tenant management, service principals)
- **Copy-Paste Helpers**: Text areas for API keys and public keys
- **Command Generation**: Auto-generated terminal commands with user inputs
- **Validation Feedback**: Real-time status updates

### On-Screen Instructions Structure:
Each step provides:
- Clear action items with clickable links
- Step-by-step terminal commands
- Success criteria and validation steps
- "Next Step" navigation

## Script Specifications

### 1. `scripts/setup-fusionauth.sh` (renamed from setup.sh)
- **Purpose**: Configure FusionAuth with GameHub application
- **Parameters**: `<API_KEY>`
- **Updates**: [`mesh/.env`](mesh/.env:12-13) with FusionAuth IDs

### 2. `scripts/setup-tenant.sh` (new)
- **Purpose**: Configure tenant settings across mesh services
- **Parameters**: `<TENANT_PUBLIC_KEY>`
- **Updates**: [`mesh/.env.local`](mesh/.env.local:3) with tenant key

### 3. `scripts/validate-setup.sh` (new)
- **Purpose**: Validate complete mesh setup
- **Validates**: Service health, authentication flows, service principal configuration

## Technical Implementation Notes

### Environment File Updates:
- **Step 1**: Updates `FUSIONAUTH_APPLICATION_ID` and `FUSIONAUTH_KEY_ID` in [`mesh/.env`](mesh/.env:1)
- **Step 2**: Updates `TENANT_PUBLIC_KEY` in [`mesh/.env.local`](mesh/.env.local:1)
- **Step 3**: Handled through service APIs, no direct file updates

### Service Dependencies:
- FusionAuth must be fully initialized before Step 1
- Admin portal requires FusionAuth authentication for Steps 2 and 3
- Player-IP service must expose `/public-key` endpoint for Step 3
- Health checks required between each step

This design provides a streamlined, user-friendly setup process with clear documentation, automated scripts, and comprehensive validation to ensure successful GameHub mesh deployment.