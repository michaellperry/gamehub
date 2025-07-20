# Content Store Authentication

This directory contains authentication configuration for the Content Store application.

## Authentication Configuration

The Content Store uses JWT-based authentication. Authentication providers are configured using `.provider` files in this directory.

### Provider Files

Each `.provider` file should be a JSON file with the following structure:

```json
{
    "provider": "provider-name",
    "issuer": "https://issuer-url.com",
    "audience": "audience-value",
    "key_id": "key-identifier",
    "key": "public-key-in-pem-format"
}
```

Where:

- `provider`: A unique identifier for the authentication provider
- `issuer`: The issuer URL that should match the `iss` claim in the JWT
- `audience`: The audience value that should match the `aud` claim in the JWT
- `key_id`: The key ID that should match the `kid` header in the JWT
- `key`: The public key in PEM format used to verify the JWT signature

### Anonymous Access

If you want to allow anonymous access to the Content Store, create an empty file named `allow-anonymous` in this directory.

When this file exists, requests without authentication will be allowed. When this file is removed, all requests must include valid authentication.

## JWT Format

The Content Store expects JWTs to be provided in the Authorization header using the Bearer scheme:

```
Authorization: Bearer <token>
```

The JWT should include the following claims:

- `iss` (issuer): Must match the `issuer` value in a provider configuration
- `aud` (audience): Must match the `audience` value in a provider configuration
- `sub` (subject): The user identifier
- `display_name` (optional): The user's display name

## User Object

When authentication succeeds, the Express request object will include a `user` property with the following structure:

```js
req.user = {
    id: 'user-id-from-sub-claim',
    provider: 'provider-name-from-config',
    profile: {
        displayName: 'display-name-from-claim',
    },
};
```

This user object can be used in route handlers to identify the authenticated user and implement authorization logic.
