# Service Identity Provider

This service provides OAuth 2.0 tokens for services using Client Credentials Flow with shared secrets.

## Features

- OAuth 2.0 Client Credentials flow
- File-based client credentials storage
- JWT token generation
- Support for multiple distinct secrets

## API Endpoints

### Token Endpoint

`POST /token`

This endpoint implements the OAuth 2.0 Client Credentials flow. It validates the client credentials and returns an access token.

#### Request

```
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=your-client-id&client_secret=your-client-secret&scope=optional-scope
```

#### Response

```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "scope": "optional-scope"
}
```

## Client Credentials

Client credentials are stored as files in the `CLIENTS_DIR` directory. Each file is named after the client ID, and the content of the file is the client secret.

For example:

- File: `/app/secrets/clients/attendee-ip`
- Content: `your-client-secret`

## Configuration

The service can be configured using environment variables:

| Variable       | Description                             | Default                |
| -------------- | --------------------------------------- | ---------------------- |
| SERVER_PORT    | Port to listen on                       | 8083                   |
| NODE_ENV       | Environment (development, production)   | development            |
| JWT_SECRET     | Secret key for JWT signing              | development-secret-key |
| JWT_EXPIRES_IN | JWT expiration time                     | 1h                     |
| JWT_ISSUER     | JWT issuer claim                        | service-ip             |
| JWT_AUDIENCE   | JWT audience claim                      | service-clients        |
| CORS_ORIGIN    | CORS allowed origins                    | \*                     |
| LOG_LEVEL      | Logging level                           | info                   |
| CLIENTS_DIR    | Directory containing client credentials | ./secrets/clients      |

## Docker

The service can be run in a Docker container. The Dockerfile is provided in the repository.

```bash
docker build -t service-ip .
docker run -p 8083:8083 -v ./secrets:/app/secrets service-ip
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run in production mode
npm start
```
