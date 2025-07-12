# Troubleshooting

This guide provides solutions to common issues encountered when setting up, developing, and deploying the GameHub platform.

## Table of Contents

- [Troubleshooting](#troubleshooting)
  - [Table of Contents](#table-of-contents)
  - [Setup Issues](#setup-issues)
    - [Node.js and npm Issues](#nodejs-and-npm-issues)
      - [Problem: Node.js version compatibility](#problem-nodejs-version-compatibility)
      - [Problem: npm install fails with permission errors](#problem-npm-install-fails-with-permission-errors)
      - [Problem: Package lock conflicts](#problem-package-lock-conflicts)
    - [Git Configuration Issues](#git-configuration-issues)
      - [Problem: Git authentication failures](#problem-git-authentication-failures)
      - [Problem: Line ending issues (Windows)](#problem-line-ending-issues-windows)
  - [Development Environment](#development-environment)
    - [Port Conflicts](#port-conflicts)
      - [Problem: Port already in use](#problem-port-already-in-use)
    - [Environment Variables](#environment-variables)
      - [Problem: Environment variables not loading](#problem-environment-variables-not-loading)
    - [Hot Reload Issues](#hot-reload-issues)
      - [Problem: Hot reload not working](#problem-hot-reload-not-working)
  - [Docker and Containerization](#docker-and-containerization)
    - [Docker Desktop Issues](#docker-desktop-issues)
      - [Problem: Docker daemon not running](#problem-docker-daemon-not-running)
      - [Problem: Docker build fails with memory issues](#problem-docker-build-fails-with-memory-issues)
    - [Docker Compose Issues](#docker-compose-issues)
      - [Problem: Services can't communicate](#problem-services-cant-communicate)
      - [Problem: Volume mounting issues](#problem-volume-mounting-issues)
  - [Authentication Problems](#authentication-problems)
    - [OAuth Configuration Issues](#oauth-configuration-issues)
      - [Problem: Invalid redirect URI](#problem-invalid-redirect-uri)
      - [Problem: Token validation fails](#problem-token-validation-fails)
    - [CORS Issues](#cors-issues)
      - [Problem: CORS policy blocks requests](#problem-cors-policy-blocks-requests)
  - [Frontend Issues](#frontend-issues)
    - [React Build Issues](#react-build-issues)
      - [Problem: Build fails with TypeScript errors](#problem-build-fails-with-typescript-errors)
      - [Problem: Memory issues during build](#problem-memory-issues-during-build)
    - [Runtime Issues](#runtime-issues)
      - [Problem: White screen of death](#problem-white-screen-of-death)
  - [Backend Service Issues](#backend-service-issues)
    - [API Endpoint Issues](#api-endpoint-issues)
      - [Problem: 404 Not Found for API routes](#problem-404-not-found-for-api-routes)
      - [Problem: 500 Internal Server Error](#problem-500-internal-server-error)
    - [Service IP Issues](#service-ip-issues)
      - [Problem: OAuth token request fails](#problem-oauth-token-request-fails)
      - [Problem: JWT token validation fails](#problem-jwt-token-validation-fails)
      - [Problem: Client credentials file not found](#problem-client-credentials-file-not-found)
      - [Problem: Service-ip container fails to start](#problem-service-ip-container-fails-to-start)
      - [Problem: Service-to-service authentication fails](#problem-service-to-service-authentication-fails)
    - [Content Store Issues](#content-store-issues)
      - [Problem: File upload fails with "No files were uploaded"](#problem-file-upload-fails-with-no-files-were-uploaded)
      - [Problem: File upload fails with size limit exceeded](#problem-file-upload-fails-with-size-limit-exceeded)
      - [Problem: "Invalid token" error on upload](#problem-invalid-token-error-on-upload)
      - [Problem: "Invalid issuer" or "Invalid audience" error](#problem-invalid-issuer-or-invalid-audience-error)
      - [Problem: "Invalid key ID" error](#problem-invalid-key-id-error)
      - [Problem: Content retrieval returns 404](#problem-content-retrieval-returns-404)
      - [Problem: Hash mismatch or corruption](#problem-hash-mismatch-or-corruption)
      - [Problem: "No authentication configurations found"](#problem-no-authentication-configurations-found)
      - [Problem: Provider file parsing errors](#problem-provider-file-parsing-errors)
      - [Problem: Performance issues with uploads](#problem-performance-issues-with-uploads)
      - [Problem: Storage capacity issues](#problem-storage-capacity-issues)
    - [Jinaga Issues](#jinaga-issues)
      - [Problem: Jinaga replicator connection fails](#problem-jinaga-replicator-connection-fails)
      - [Problem: Authorization policies not working](#problem-authorization-policies-not-working)
      - [Problem: Jinaga model build fails](#problem-jinaga-model-build-fails)
  - [Infrastructure Issues](#infrastructure-issues)
    - [PostgreSQL Database Issues](#postgresql-database-issues)
      - [Problem: PostgreSQL container fails to start](#problem-postgresql-container-fails-to-start)
      - [Problem: Database connection refused](#problem-database-connection-refused)
      - [Problem: Database migration fails](#problem-database-migration-fails)
    - [NGINX Reverse Proxy Issues](#nginx-reverse-proxy-issues)
      - [Problem: NGINX fails to start](#problem-nginx-fails-to-start)
      - [Problem: Service routing not working](#problem-service-routing-not-working)
      - [Problem: SSL certificate issues](#problem-ssl-certificate-issues)
    - [Network Connectivity Issues](#network-connectivity-issues)
      - [Problem: Services can't communicate across networks](#problem-services-cant-communicate-across-networks)
      - [Problem: Health checks failing](#problem-health-checks-failing)
  - [Deployment Problems](#deployment-problems)
    - [FusionAuth Issues](#fusionauth-issues)
      - [Problem: FusionAuth fails to start](#problem-fusionauth-fails-to-start)
      - [Problem: FusionAuth database connection fails](#problem-fusionauth-database-connection-fails)
    - [Azure Deployment Issues](#azure-deployment-issues)
      - [Problem: Container deployment fails](#problem-container-deployment-fails)
      - [Problem: Environment variables not set in production](#problem-environment-variables-not-set-in-production)
    - [CI/CD Pipeline Issues](#cicd-pipeline-issues)
      - [Problem: Build pipeline fails](#problem-build-pipeline-fails)
    - [Performance Issues](#performance-issues)
      - [Problem: Slow application response](#problem-slow-application-response)
    - [Static File Serving Issues](#static-file-serving-issues)
      - [Problem: Admin interface not loading](#problem-admin-interface-not-loading)
      - [Problem: Environment variables not loading](#problem-environment-variables-not-loading-1)
      - [Problem: React apps show 404 or blank page](#problem-react-apps-show-404-or-blank-page)
      - [Problem: API calls fail from frontend](#problem-api-calls-fail-from-frontend)
  - [Getting Help](#getting-help)
    - [Debug Information Collection](#debug-information-collection)
    - [Service-Specific Debugging](#service-specific-debugging)
      - [Jinaga Model Issues](#jinaga-model-issues)
      - [Frontend Build Issues](#frontend-build-issues)
      - [Backend Service Issues](#backend-service-issues-1)
      - [Service IP Debugging](#service-ip-debugging)
    - [Support Resources](#support-resources)
    - [Creating Bug Reports](#creating-bug-reports)
    - [Quick Diagnostic Commands](#quick-diagnostic-commands)

## Setup Issues

### Node.js and npm Issues

#### Problem: Node.js version compatibility
```bash
Error: The engine "node" is incompatible with this module
```

**Solution:**
```bash
# Check current Node.js version
node --version

# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 18
nvm install 18
nvm use 18

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show compatible npm version
```

#### Problem: npm install fails with permission errors
```bash
Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
```

**Solution:**
```bash
# Option 1: Use nvm (recommended)
nvm install node
nvm use node

# Option 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Option 3: Use npx for one-time commands
npx create-react-app my-app
```

#### Problem: Package lock conflicts
```bash
Error: npm ERR! peer dep missing
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# For persistent issues, try
npm ci --legacy-peer-deps
```

### Git Configuration Issues

#### Problem: Git authentication failures
```bash
Error: remote: Repository not found
```

**Solution:**
```bash
# Configure Git credentials
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# Set up SSH key
ssh-keygen -t ed25519 -C "your.email@company.com"
cat ~/.ssh/id_ed25519.pub  # Copy to GitHub/Azure DevOps

# Test SSH connection
ssh -T git@github.com
```

#### Problem: Line ending issues (Windows)
```bash
Warning: LF will be replaced by CRLF
```

**Solution:**
```bash
# Configure Git to handle line endings
git config --global core.autocrlf true  # Windows
git config --global core.autocrlf input # macOS/Linux

# Fix existing repository
git config core.autocrlf true
git rm --cached -r .
git reset --hard
```

## Development Environment

### Port Conflicts

#### Problem: Port already in use
```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using the port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Use different port
PORT=3001 npm start

# Or configure in package.json
{
  "scripts": {
    "start": "PORT=3001 react-scripts start"
  }
}
```

### Environment Variables

#### Problem: Environment variables not loading
```bash
Error: process.env.VITE_API_URL is undefined
```

**Solution:**
```bash
# Check .env file location (must be in project root)
ls -la .env

# Verify variable names (Vite requires VITE_ prefix)
# .env file:
VITE_API_URL=http://localhost:3002
VITE_AUTH_CLIENT_ID=your-client-id

# Restart development server after .env changes
npm run dev

# Debug environment variables
console.log('Environment:', import.meta.env);  # Vite
console.log('Environment:', process.env);      # Node.js
```

### Hot Reload Issues

#### Problem: Hot reload not working
```bash
# Changes not reflected in browser
```

**Solution:**
```bash
# For Vite applications
# vite.config.ts
export default defineConfig({
  server: {
    watch: {
      usePolling: true,  # For Docker/WSL
    },
    host: true,  # For Docker containers
  }
});

# For Docker development
# docker-compose.yml
environment:
  - CHOKIDAR_USEPOLLING=true
  - WATCHPACK_POLLING=true

# Clear browser cache
# Chrome: Ctrl+Shift+R (hard refresh)
# Or disable cache in DevTools
```

## Docker and Containerization

### Docker Desktop Issues

#### Problem: Docker daemon not running
```bash
Error: Cannot connect to the Docker daemon
```

**Solution:**
```bash
# Start Docker Desktop
# Windows: Start Docker Desktop application
# macOS: Start Docker Desktop application
# Linux: Start Docker service
sudo systemctl start docker

# Verify Docker is running
docker --version
docker ps

# Add user to docker group (Linux)
sudo usermod -aG docker $USER
# Log out and back in
```

#### Problem: Docker build fails with memory issues
```bash
Error: failed to solve: process "/bin/sh -c npm install" did not complete successfully
```

**Solution:**
```bash
# Increase Docker memory allocation
# Docker Desktop > Settings > Resources > Memory: 4GB+

# Use multi-stage builds to reduce memory usage
# Dockerfile
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
```

### Docker Compose Issues

#### Problem: Services can't communicate
```bash
Error: getaddrinfo ENOTFOUND service-name
```

**Solution:**
```bash
# Ensure services are on the same network
# docker-compose.yml
networks:
  app-network:
    driver: bridge

services:
  service-a:
    networks:
      - app-network
  service-b:
    networks:
      - app-network

# Use service names for internal communication
# Instead of: http://localhost:3002
# Use: http://game-service:3002

# Debug network connectivity
docker compose exec service-a ping service-b
docker network ls
docker network inspect <network-name>
```

#### Problem: Volume mounting issues
```bash
Error: bind source path does not exist
```

**Solution:**
```bash
# Use relative paths from docker-compose.yml location
volumes:
  - ./app:/app  # Correct
  - /absolute/path:/app  # Use absolute paths carefully

# For Windows, ensure drive sharing is enabled
# Docker Desktop > Settings > Resources > File Sharing

# Debug volume mounts
docker compose exec service ls -la /app
docker inspect <container-name>
```

## Authentication Problems

### OAuth Configuration Issues

#### Problem: Invalid redirect URI
```bash
Error: AADSTS50011: The reply URL specified in the request does not match
```

**Solution:**
```bash
# Update Azure AD app registration
# Azure Portal > App Registrations > Your App > Authentication
# Add redirect URIs:
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
https://your-domain.com/auth/callback

# Verify environment variables
VITE_AUTH_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_AUTH_POST_LOGOUT_REDIRECT_URI=http://localhost:3000
```

#### Problem: Token validation fails
```bash
Error: Invalid token signature
```

**Solution:**
```bash
# Check JWT configuration
JWT_SECRET=your-secret-key
JWT_ISSUER=https://your-auth-provider.com
JWT_AUDIENCE=your-api-audience

# Verify token in JWT debugger (jwt.io)
# Check token expiration
# Ensure clock synchronization between services

# Debug token validation
console.log('Token payload:', jwt.decode(token));
console.log('Token header:', jwt.decode(token, { complete: true }).header);
```

### CORS Issues

#### Problem: CORS policy blocks requests
```bash
Error: Access to fetch at 'http://localhost:3002' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
```bash
# Configure CORS in backend
// Express.js
import cors from 'cors';

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://your-domain.com'
  ],
  credentials: true
}));

# For development, allow all origins (not for production)
app.use(cors({ origin: true, credentials: true }));

# Check preflight requests
# Network tab in browser DevTools
# Look for OPTIONS requests
```

## Frontend Issues

### React Build Issues

#### Problem: Build fails with TypeScript errors
```bash
Error: TS2307: Cannot find module '@/components/Button'
```

**Solution:**
```bash
# Check tsconfig.json path mapping
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"]
    }
  }
}

# Verify Vite configuration
// vite.config.ts
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components')
    }
  }
});

# Clear TypeScript cache
rm -rf node_modules/.cache
npm run build
```

#### Problem: Memory issues during build
```bash
Error: JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Or in package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
  }
}

# Optimize build configuration
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'date-fns']
        }
      }
    }
  }
});
```

### Runtime Issues

#### Problem: White screen of death
```bash
# Blank page with no errors in console
```

**Solution:**
```bash
# Check browser console for errors
# F12 > Console tab

# Check network requests
# F12 > Network tab

# Verify build output
ls -la dist/  # Check if files exist

# Test with simple component
// App.tsx
function App() {
  return <div>Hello World</div>;
}

# Check React DevTools
# Install React Developer Tools browser extension
```

## Backend Service Issues

### API Endpoint Issues

#### Problem: 404 Not Found for API routes
```bash
Error: GET /api/sessions 404 (Not Found)
```

**Solution:**
```bash
# Check route registration
// app.ts
import sessionRoutes from './routes/sessions';
app.use('/api/sessions', sessionRoutes);

# Verify route definitions
// routes/sessions.ts
router.get('/', getAllSessions);  # GET /api/sessions
router.get('/:id', getSessionById);  # GET /api/sessions/123

# Check middleware order
app.use(express.json());  # Before routes
app.use('/api/sessions', sessionRoutes);  # After middleware

# Debug with logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

#### Problem: 500 Internal Server Error
```bash
Error: Internal Server Error
```

**Solution:**
```bash
# Check server logs
docker compose logs game-service

# Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

# Use try-catch in async routes
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await getSessions();
    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});
```

### Service IP Issues

#### Problem: OAuth token request fails
```bash
Error: invalid_client or invalid_grant
```

**Solution:**
```bash
# Verify client credentials exist
ls -la mesh/secrets/service-ip/clients/
cat mesh/secrets/service-ip/clients/your-client-id

# Check client configuration format
cat mesh/secrets/service-ip/clients/your-client-id.json
# Should contain: {"clientId": "your-client-id", "clientSecret": "...", "scopes": [...]}

# Test token endpoint directly
curl -X POST http://localhost:8083/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=your-client-id&client_secret=$(cat mesh/secrets/service-ip/clients/your-client-id)"

# Check service-ip logs
docker compose logs service-ip
```

#### Problem: JWT token validation fails
```bash
Error: JsonWebTokenError: invalid signature
```

**Solution:**
```bash
# Verify JWT_SECRET matches between services
echo $JWT_SECRET

# Check token format and expiration
# Use jwt.io to decode and inspect token

# Ensure consistent JWT_SECRET across all services
# In .env files:
JWT_SECRET=your-shared-secret-here

# Restart services after changing JWT_SECRET
docker compose restart service-ip
```

#### Problem: Client credentials file not found
```bash
Error: ENOENT: no such file or directory, open 'clients/client-name'
```

**Solution:**

**Recommended:** Use the automated initialization script to set up all required directories and secrets:
```bash
./scripts/init-mesh.sh
```

**Note:** The script now writes secrets to `.env.local` instead of modifying `.env`.

**Manual setup (for custom client configurations):**
```bash
# Create client credentials directory
mkdir -p mesh/secrets/service-ip/clients

# Generate new client credentials
CLIENT_SECRET=$(openssl rand -base64 32)
echo "$CLIENT_SECRET" > mesh/secrets/service-ip/clients/new-client

# Create JSON configuration
echo "{
  \"clientId\": \"new-client\",
  \"clientSecret\": \"$CLIENT_SECRET\",
  \"scopes\": [\"read\", \"write\"],
  \"description\": \"New service client\"
}" > mesh/secrets/service-ip/clients/new-client.json

# Verify file permissions
ls -la mesh/secrets/service-ip/clients/
```

#### Problem: Service-ip container fails to start
```bash
Error: Container exits with code 1
```

**Solution:**
```bash
# Check container logs
docker compose logs service-ip

# Verify environment variables
docker compose exec service-ip env | grep -E "(PORT|JWT_SECRET|CLIENTS_DIR)"

# Check volume mounts
docker compose exec service-ip ls -la /app/secrets/clients

# Verify Dockerfile and build process
docker build -t service-ip ./app/service-ip
docker run --rm service-ip npm test

# Check for port conflicts
lsof -i :8083  # macOS/Linux
netstat -ano | findstr :8083  # Windows
```

#### Problem: Service-to-service authentication fails
```bash
Error: 401 Unauthorized when calling other services
```

**Solution:**
```bash
# Test token generation
TOKEN=$(curl -s -X POST http://localhost:8083/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=your-client-id&client_secret=$(cat mesh/secrets/service-ip/clients/your-client-id)" \
  | jq -r '.access_token')

echo "Generated token: $TOKEN"

# Test token usage
curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/protected-endpoint

# Verify token payload
echo $TOKEN | cut -d. -f2 | base64 -d | jq .

# Check service logs for authentication errors
docker compose logs player-ip
docker compose logs content-store
```

### Content Store Issues

#### Problem: File upload fails with "No files were uploaded"
```bash
Error: No files were uploaded
```

**Solution:**
```bash
# Verify multipart form data is being sent
# Frontend: Ensure FormData is used correctly
const formData = new FormData();
formData.append('file', fileInput.files[0]);

# Backend: Check Content-Type header
# Should be: multipart/form-data; boundary=...

# Test with curl
curl -X POST http://localhost:8081/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/test-file.jpg"
```

#### Problem: File upload fails with size limit exceeded
```bash
Error: File too large
```

**Solution:**
```bash
# Check file size limit (default 50MB)
# Increase limit in server.js if needed
app.use(fileUpload({
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
}));

# Or compress files before upload
# Use image optimization for media files
```

#### Problem: "Invalid token" error on upload
```bash
Error: Invalid token
```

**Solution:**
```bash
# Verify JWT token is valid
# Check token in JWT debugger (jwt.io)

# Ensure Authorization header format
Authorization: Bearer YOUR_JWT_TOKEN

# Verify provider configuration matches token issuer/audience
# Check mesh/secrets/content-store/*.provider files

# Test token with other services first
curl -H "Authorization: Bearer $TOKEN" http://localhost:8082/health
```

#### Problem: "Invalid issuer" or "Invalid audience" error
```bash
Error: Invalid issuer
Error: Invalid audience
```

**Solution:**
```bash
# Check provider configuration matches JWT claims
# Token issuer must match provider.issuer
# Token audience must match provider.audience

# Debug JWT token claims
node -e "console.log(JSON.parse(Buffer.from('$TOKEN'.split('.')[1], 'base64')))"

# Update provider configuration
{
  "issuer": "player-ip",        # Must match JWT iss claim
  "audience": "gamehub-players" # Must match JWT aud claim
}
```

#### Problem: "Invalid key ID" error
```bash
Error: Invalid key ID
```

**Solution:**
```bash
# Verify JWT header contains correct kid claim
# Check provider key_id matches JWT header kid

# Debug JWT header
node -e "console.log(JSON.parse(Buffer.from('$TOKEN'.split('.')[0], 'base64')))"

# Update provider key_id to match
{
  "key_id": "player-ip-key"  # Must match JWT header kid
}
```

#### Problem: Content retrieval returns 404
```bash
Error: Content not found
```

**Solution:**
```bash
# Verify content hash is correct
# Check if file exists in storage directory
docker exec content-store ls -la /app/storage

# Check file permissions
ls -la mesh/secrets/content-store/
chmod 644 mesh/secrets/content-store/*.provider

# Verify storage directory is mounted correctly
docker inspect content-store | grep -A 10 Mounts
```

#### Problem: Hash mismatch or corruption
```bash
Error: Content hash verification failed
```

**Solution:**
```bash
# Verify file integrity
sha256sum /path/to/original/file
docker exec content-store sha256sum /app/storage/HASH_PREFIX

# Check for storage corruption
docker exec content-store fsck /app/storage

# Re-upload corrupted files
# Content-addressable storage will detect duplicates
```

#### Problem: "No authentication configurations found"
```bash
Error: No authentication configurations found
```

**Solution:**
```bash
# Verify provider files exist
ls -la mesh/secrets/content-store/

# Create test provider file
cat > mesh/secrets/content-store/test.provider << EOF
{
  "provider": "test",
  "issuer": "test",
  "audience": "test",
  "key_id": "test-key",
  "key": "test-secret"
}
EOF

# Check file permissions and ownership
chmod 644 mesh/secrets/content-store/*.provider
```

#### Problem: Provider file parsing errors
```bash
Error: Invalid JSON in provider file
```

**Solution:**
```bash
# Validate JSON syntax
cat mesh/secrets/content-store/service-ip.provider | jq .

# Verify file encoding (UTF-8)
file mesh/secrets/content-store/*.provider

# Check for hidden characters
hexdump -C mesh/secrets/content-store/service-ip.provider | head
```

#### Problem: Performance issues with uploads
```bash
# Uploads taking too long
```

**Solution:**
```bash
# Check available disk space
df -h

# Monitor upload progress
docker stats content-store

# Check network connectivity
ping content-store-host

# Optimize file sizes before upload
# Use compression for large files
# Consider chunked uploads for very large files

# Check Docker resource limits
docker inspect content-store | grep -A 5 Resources
```

#### Problem: Storage capacity issues
```bash
Error: No space left on device
```

**Solution:**
```bash
# Check storage usage
docker exec content-store du -sh /app/storage
df -h

# Clean up old or unused files
# Content-addressable storage prevents duplicates
# But you may need to implement cleanup policies

# Monitor storage growth
docker exec content-store find /app/storage -type f -exec ls -lh {} \; | head -20

# Consider implementing file retention policies
# Archive old content to external storage
```

### Jinaga Issues

#### Problem: Jinaga replicator connection fails
```bash
Error: Failed to connect to Jinaga replicator
```

**Solution:**
```bash
# Check front-end-replicator service status
cd mesh/
docker compose ps front-end-replicator
docker compose logs front-end-replicator

# Verify connection configuration in services
# Should use: http://front-end-replicator:8080/jinaga

# Test connection manually
curl http://localhost:8080/jinaga

# Check network connectivity
docker compose exec player-service ping front-end-replicator

# Verify policies are loaded
docker compose exec front-end-replicator ls -la /var/lib/replicator/policies/
```

#### Problem: Authorization policies not working
```bash
Error: Access denied for fact creation
```

**Solution:**
```bash
# Regenerate policies from model
cd app/gamehub-model
npm run build
npm run generate-policies

# Verify policy file was created
cat ../../mesh/front-end/policies/gamehub.policy

# Restart replicator to reload policies
cd ../../mesh
docker compose restart front-end-replicator

# Check replicator logs for policy loading
docker compose logs front-end-replicator | grep -i policy
```

#### Problem: Jinaga model build fails
```bash
Error: Cannot find module 'gamehub-model'
```

**Solution:**
```bash
# Build the model first (required for all other services)
cd app/gamehub-model
npm install
npm run clean
npm run build

# Verify build output
ls -la dist/

# Check for TypeScript errors
npm run build:types

# If using in other services, ensure proper import paths
# import { ... } from 'gamehub-model'
# import { ... } from 'gamehub-model/authorization'
```
## Infrastructure Issues

### PostgreSQL Database Issues

#### Problem: PostgreSQL container fails to start
```bash
Error: database system is shut down
Error: could not connect to server
```

**Solution:**
```bash
# Check PostgreSQL container logs
docker compose logs postgres

# Verify environment variables
grep POSTGRES_ .env

# Check disk space
df -h

# Remove corrupted volume and restart
docker compose down
docker volume rm gamehub-postgres-data
docker compose up -d postgres

# Wait for database to initialize
docker compose logs -f postgres
```

#### Problem: Database connection refused
```bash
Error: connection to server at "postgres" (172.x.x.x), port 5432 failed
```

**Solution:**
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Verify network connectivity
docker compose exec player-ip ping postgres

# Check PostgreSQL health
docker compose exec postgres pg_isready -U gamehub_admin -d gamehub

# Restart PostgreSQL service
docker compose restart postgres

# Check database logs for errors
docker compose logs postgres | grep ERROR
```

#### Problem: Database migration fails
```bash
Error: relation "users" does not exist
Error: permission denied for database
```

**Solution:**
```bash
# Run database migrations manually
docker compose exec player-ip npm run migrate

# Check database permissions
docker compose exec postgres psql -U gamehub_admin -d gamehub -c "\du"

# Reset database if needed
docker compose down
docker volume rm gamehub-postgres-data
docker compose up -d postgres
# Wait for initialization, then run migrations
```

### NGINX Reverse Proxy Issues

#### Problem: NGINX fails to start
```bash
Error: nginx: [emerg] cannot load certificate
Error: nginx: [emerg] bind() to 0.0.0.0:80 failed
```

**Solution:**
```bash
# Check NGINX configuration syntax
docker compose exec nginx nginx -t

# Check if port 80/443 is already in use
sudo lsof -i :80
sudo lsof -i :443

# Verify SSL certificates exist (if using SSL)
ls -la mesh/nginx/ssl/

# Check NGINX logs
docker compose logs nginx

# Restart NGINX
docker compose restart nginx
```

#### Problem: Service routing not working
```bash
Error: 502 Bad Gateway
Error: upstream connect error
```

**Solution:**
```bash
# Check if backend services are running
docker compose ps

# Verify service health endpoints
curl http://localhost/player-ip/health
curl http://localhost/service-ip/health
curl http://localhost/replicator/health

# Check NGINX upstream configuration
docker compose exec nginx cat /etc/nginx/conf.d/default.conf

# Test internal service connectivity
docker compose exec nginx wget -qO- http://player-ip:8082/health
docker compose exec nginx wget -qO- http://service-ip:8083/health

# Restart NGINX and dependent services
docker compose restart nginx player-ip service-ip
```

#### Problem: SSL certificate issues
```bash
Error: SSL certificate problem: self signed certificate
Error: certificate verify failed
```

**Solution:**
```bash
# For development, use self-signed certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout mesh/nginx/ssl/key.pem \
  -out mesh/nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Set proper permissions
chmod 600 mesh/nginx/ssl/key.pem
chmod 644 mesh/nginx/ssl/cert.pem

# For production, use Let's Encrypt or proper CA certificates
# Update NGINX configuration to use SSL
# Restart NGINX
docker compose restart nginx
```

### Network Connectivity Issues

#### Problem: Services can't communicate across networks
```bash
Error: getaddrinfo ENOTFOUND service-name
Error: connect ECONNREFUSED
```

**Solution:**
```bash
# Check Docker networks
docker network ls | grep gamehub

# Verify service network assignments
docker compose config | grep -A 5 networks

# Test network connectivity between services
docker compose exec player-ip ping postgres
docker compose exec player-ip ping service-ip
docker compose exec nginx ping fusionauth

# Recreate networks if needed
docker compose down
docker network prune
docker compose up -d

# Check service dependencies
docker compose ps
```

#### Problem: Health checks failing
```bash
Warning: Health check failed
Error: service unhealthy
```

**Solution:**
```bash
# Check individual service health
docker compose exec postgres pg_isready -U gamehub_admin -d gamehub
docker compose exec player-ip curl -f http://localhost:8082/health
docker compose exec service-ip curl -f http://localhost:8083/health
docker compose exec fusionauth curl -f http://localhost:9011/api/status

# Check health check configuration
docker compose config | grep -A 10 healthcheck

# View health check logs
docker inspect $(docker compose ps -q postgres) | grep Health -A 20

# Adjust health check intervals if needed
# Edit docker-compose.yml health check settings
# Restart services
docker compose up -d
```


## Deployment Problems

### FusionAuth Issues

#### Problem: FusionAuth fails to start
```bash
Error: FusionAuth container exits with code 1
```

**Solution:**
```bash
# Check database is running first
cd mesh/
docker compose ps db
docker compose logs db

# Verify database credentials match
# Check .env file has matching credentials for:
# POSTGRES_USER, POSTGRES_PASSWORD
# DATABASE_USERNAME, DATABASE_PASSWORD

# Check FusionAuth logs for specific errors
docker compose logs fusionauth

# Reset FusionAuth if needed (development only)
docker compose down -v fusionauth
docker volume rm gamehub_fusionauth_config
docker compose up -d fusionauth
```

#### Problem: FusionAuth database connection fails
```bash
Error: Unable to connect to database
```

**Solution:**
```bash
# Verify PostgreSQL is accessible
docker compose exec fusionauth ping db

# Check database URL configuration
# Should be: jdbc:postgresql://db:5432/fusionauth

# Test database connection manually
docker compose exec db psql -U $POSTGRES_USER -c "SELECT 1;"

# Check if fusionauth database exists
docker compose exec db psql -U $POSTGRES_USER -l | grep fusionauth
```

### Azure Deployment Issues

#### Problem: Container deployment fails
```bash
Error: Failed to pull image from registry
```

**Solution:**
```bash
# Check Azure Container Registry credentials
az acr credential show --name your-registry-name

# Login to registry
az acr login --name your-registry-name

# Build and push images
docker build -t your-registry.azurecr.io/gamehub:latest .
docker push your-registry.azurecr.io/gamehub:latest

# Verify image exists
az acr repository list --name your-registry-name
az acr repository show-tags --name your-registry-name --repository gamehub
```

#### Problem: Environment variables not set in production
```bash
Error: Required environment variable not found
```

**Solution:**
```bash
# For Azure Container Instances, set environment variables
az container create \
  --resource-group your-resource-group \
  --name gamehub-app \
  --image your-registry.azurecr.io/gamehub:latest \
  --environment-variables \
    NODE_ENV=production \
    POSTGRES_HOST=your-postgres-host \
    JWT_SECRET=your-jwt-secret

# For sensitive values, use Azure Key Vault
az keyvault secret set --vault-name your-keyvault --name jwt-secret --value "your-secret"

# Reference secrets in container deployment
--secure-environment-variables \
  JWT_SECRET=@Microsoft.KeyVault(SecretUri=https://your-keyvault.vault.azure.net/secrets/jwt-secret/)
```

### CI/CD Pipeline Issues

#### Problem: Build pipeline fails
```bash
Error: No hosted parallelism has been purchased or granted
```

**Solution:**
```bash
# Request free tier for public repositories
# Or purchase parallel jobs for private repositories

# Use self-hosted agents
# Azure DevOps > Project Settings > Agent pools > Add pool

# Optimize pipeline for free tier
# Use matrix strategy to run jobs sequentially
strategy:
  matrix:
    admin:
      serviceName: 'admin'
    player:
      serviceName: 'player'
  maxParallel: 1  # Run one at a time
```

### Performance Issues

#### Problem: Slow application response
```bash
# Application takes too long to respond
```

**Solution:**
```bash
# Check resource allocation
docker stats

# Increase container resources
# docker-compose.yml
services:
  game-service:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'

# Add caching
# Redis for session storage
# CDN for static assets
# Database query optimization

# Monitor performance
# Application Insights
# Database query logs
# Container metrics
```

### Static File Serving Issues

#### Problem: Admin interface not loading
**Symptoms:** 404 errors when accessing `/admin`

**Solution:**
1. Ensure the admin frontend is built:
   ```bash
   cd app
   npm run build:admin:container
   ```
2. Verify files exist in `mesh/nginx/app/gamehub-admin/`
3. Restart nginx service:
   ```bash
   cd mesh
   docker-compose restart nginx
   ```

#### Problem: Environment variables not loading
**Symptoms:** Application shows default values or connection errors

**Solution:**
1. Check `.env.container.local` exists in `app/gamehub-admin/`
2. Verify environment variables are prefixed with `VITE_`
3. Rebuild the application after environment changes

#### Problem: React apps show 404 or blank page
```bash
# Static files not found or not built
```

**Solution:**
```bash
# Build React applications first
cd app/gamehub-admin
npm run build

cd ../gamehub-player
npm run build

# Copy built files to nginx directory
cp -r dist/* ../../mesh/nginx/app/gamehub-admin/
cp -r dist/* ../../mesh/nginx/app/gamehub-player/

# Restart nginx to pick up new files
cd ../../mesh
docker compose restart nginx

# Check nginx configuration
docker compose exec nginx cat /etc/nginx/conf.d/default.conf
```

#### Problem: API calls fail from frontend
```bash
Error: Network Error or CORS issues
```

**Solution:**
```bash
# Check nginx routing configuration
# Verify API routes are properly proxied

# Test API endpoints directly
curl http://localhost/api/health
curl http://localhost/content/health

# Check service connectivity
cd mesh/
docker compose exec nginx ping player-service
docker compose exec nginx ping game-service

# Verify CORS configuration in services
# Should allow origin: http://localhost
```

## Getting Help

### Debug Information Collection
```bash
# System information
node --version
npm --version
docker --version
docker compose --version

# Project-specific information
cd mesh/
docker compose ps
docker compose logs --tail=50

# Network information
docker network ls
docker network inspect gamehub_jinaga_net
docker network inspect gamehub_fusionauth_net

# Environment variables (sanitized)
cd mesh/
cat .env | sed 's/=.*/=***/'

# Service health checks
curl -I http://localhost
curl -I http://localhost:9011
curl -I http://localhost:8080
curl -I http://localhost:8083/health  # service-ip
curl -I http://localhost:8082  # player-ip
curl -I http://localhost:8081  # content-store
```

### Service-Specific Debugging

#### Jinaga Model Issues
```bash
cd app/gamehub-model
npm run build 2>&1 | tee build.log
npm run generate-policies 2>&1 | tee policies.log
```

#### Frontend Build Issues
```bash
cd app/gamehub-admin
npm run build 2>&1 | tee admin-build.log

cd ../gamehub-player
npm run build 2>&1 | tee player-build.log
```

#### Backend Service Issues
```bash
cd mesh/
docker compose logs service-ip > service-ip.log
docker compose logs player-ip > player-ip.log
docker compose logs content-store > content-store.log
docker compose logs front-end-replicator > replicator.log
```

#### Service IP Debugging
```bash
# Check service-ip health and configuration
curl -I http://localhost:8083/health
curl -X POST http://localhost:8083/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=your-client-id&client_secret=$(cat mesh/secrets/service-ip/clients/your-client-id)"

# Debug client credentials
ls -la mesh/secrets/service-ip/clients/
cat mesh/secrets/service-ip/clients/your-client-id.json

# Check service-ip logs and environment
docker compose exec service-ip env | grep -E "(PORT|JWT_SECRET|CLIENTS_DIR|NODE_ENV)"
docker compose logs service-ip --tail=50

# Test JWT token validation
TOKEN=$(curl -s -X POST http://localhost:8083/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=your-client-id&client_secret=$(cat mesh/secrets/service-ip/clients/your-client-id)" \
  | jq -r '.access_token')
echo $TOKEN | cut -d. -f2 | base64 -d | jq .
```

### Support Resources
- **Documentation**: Check the other getting-started guides
- **Logs**: Always check service logs first (`docker compose logs [service]`)
- **Model Documentation**: `app/gamehub-model/README.md`
- **Distribution Rules**: `app/gamehub-model/DISTRIBUTION.md`
- **Jinaga Documentation**: [jinaga.com](https://jinaga.com)
- **FusionAuth Documentation**: [fusionauth.io/docs](https://fusionauth.io/docs)

### Creating Bug Reports
When reporting issues, include:
1. **Environment**: OS, Node.js version, Docker version
2. **Steps to reproduce**: Exact commands and actions taken
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Logs**: Relevant error messages and service logs
6. **Configuration**: Sanitized environment variables and config files
7. **Service Status**: Output of `docker compose ps`
8. **Network Info**: Docker network configuration if networking issues

### Quick Diagnostic Commands
```bash
# Full system check
cd mesh/
echo "=== Service Status ===" && docker compose ps
echo "=== Recent Logs ===" && docker compose logs --tail=10
echo "=== Network Test ===" && curl -I http://localhost
echo "=== FusionAuth Test ===" && curl -I http://localhost:9011
echo "=== Jinaga Test ===" && curl -I http://localhost:8080
```

---

*This troubleshooting guide covers the most common issues specific to the GameHub platform. For general Docker, Node.js, or React issues, refer to the respective technology documentation.*