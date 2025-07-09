# Status and setup pages for GameHub

The GameHub stack serves up two pages to indicate status and to guide the developer through setup.

## Service observability endpoints

In general, each service exposes three endpoints for observability:
- `/health`: Succeeds if the service is up
- `/configured`: Returns a JSON object listing the configuration groups and whether they are configured
- `/ready`: Succeeds if the service is ready to handle requests

### Player IP

The configured endpoint looks for the following configuration groups:

- `jwt`: Indicates if the `JWT_` environment variables are set
- `service-ip`: Indicates if the `SERVICE_IP_` environment variables and secrets are set

### Service IP

The configured endpoint looks for the following configuration groups:

- `jwt`: Indicates if the `JWT_` environment variables are set
- `clients`: Lists the names of the configured clients in the `CLIENTS_DIR` folder

### Content Store

The configured endpoint looks for the following configuration groups:

- `secrets`: Indicates if the `AUTH_DIR` folder contains the required secrets

### Replicator

In this iteration, the replicator will not be modified.

### Admin Portal

The admin portal is a compiled and bundled web application. Rather than exposing endpoints, it exports a function that returns the configured groups. The groups are:

- `client`: Indicates if the `VITE_CLIENT_ID` environment variable is set
- `tenant`: Indicates if the `VITE_TENANT_PUBLIC_KEY` environment variable is set

## Relay

The relay service gathers observability information from all GameHub services and provides a unified view. It can be accessed at:

```
http://localhost/relay
```

The service is a generic application that operates based on a configurable list of services and endpoints. The configuration is stored in the `RELAY_CONFIG` environment variable, which is a JSON object with the following structure:

```json
{
  "services": {
    "service-ip": {
      "name": "Service IP",
      "healthEndpoint": "http://service-ip/health",
      "configuredEndpoint": "http://service-ip/configured",
      "readyEndpoint": "http://service-ip/ready"
    },
    "player-ip": {
      "name": "Player IP",
      "healthEndpoint": "http://player-ip/health",
      "configuredEndpoint": "http://player-ip/configured",
      "readyEndpoint": "http://player-ip/ready"
    },
    "content-store": {
      "name": "Content Store",
      "healthEndpoint": "http://content-store/health",
      "configuredEndpoint": "http://content-store/configured",
      "readyEndpoint": "http://content-store/ready"
    }
  }
}
```

It returns a JSON object with the health, configured, and ready status of each service. The JSON structure is as follows:

```json
{
  "services": {
    "service-ip": {
      "health": true,
      "configured": true,
      "configuredGroups": {
        "jwt": true,
        "clients": ["player-ip"]
      },
      "ready": true
    },
    "player-ip": {
      "health": true,
      "configured": true,
      "configuredGroups": {
        "jwt": true,
        "service-ip": true
      },
      "ready": true
    },
    "content-store": {
      "health": true,
      "configured": true,
      "configuredGroups": {
        "secrets": true
      },
      "ready": true
    }
  }
}
```

## Status Page

The status page provides real-time information about the health and availability of the GameHub services. It can be accessed at:

```
http://localhost/status
```

The status page periodically fetches data from the relay service and front-end application bundles, and displays the health, configured status, and readiness of each service or bundle in a user-friendly format. Each service is represented with a card that includes:
- **Service Name**: The name of the service or bundle
- **Health Status**: Indicates if the service is healthy (red or green) (services only)
- **Configured Status**: Indicates if the service or bundle is fully configured (red or green)
- **Ready Status**: Indicates if the service is ready (red or green) (services only)

When the user hovers over the configured status, a tooltip appears showing the specific configuration groups and their statuses. This provides detailed insight into what is configured and what is missing.

## Setup Page

The setup page offers a guided walkthrough for configuring and initializing the GameHub environment. It can be accessed at:

```
http://localhost/setup
```

The setup page provides step-by-step instructions for setting up the GameHub services, including:
- **FusionAuth Configuration**: Instructions for setting up FusionAuth, including creating an application and obtaining the API key.
- **Tenant Creation**: Steps for creating a tenant and configuring it for multi-tenancy.
- **Service Principal Configuration**: Instructions for creating service principals for the Player-IP service.

Each step is represented with a card that includes:
- **Step Title**: A clear title for the step
- **Completion Status**: Indicates if the step is completed (green checkmark) or pending (no decoration)
- **Description**: A brief description of what the step entails

Below the set of cards, the instructions to complete the next pending step are displayed. This includes:
- **Action Items**: Clear instructions on what to do next
- **Link to Admin Interfaces**: Direct links to the relevant admin interfaces (e.g., FusionAuth, tenant management)
- **Data Collection**: Text areas for copying API keys and public keys collected from the admin interfaces
- **Command Generation**: Auto-generated terminal commands based on user inputs

The FusionAuth configuration is complete when the following configured groups are true:
- Admin Portal - `client`

The tenant configuration is complete when the following configured groups are true:
- Admin Portal - `tenant`

The service principal configuration is complete when the following readiness endpoints are true:
- Player IP - `ready`