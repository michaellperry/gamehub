# Troubleshooting

This guide provides solutions to common issues encountered when setting up, developing, and deploying the GameHub platform.

## Table of Contents

- [Setup Issues](#setup-issues)
- [Development Environment](#development-environment)
- [Docker and Containerization](#docker-and-containerization)
- [Database Issues](#database-issues)
- [Authentication Problems](#authentication-problems)
- [Frontend Issues](#frontend-issues)
- [Backend Service Issues](#backend-service-issues)
- [Deployment Problems](#deployment-problems)

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
docker-compose exec service-a ping service-b
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
docker-compose exec service ls -la /app
docker inspect <container-name>
```

## Database Issues

### PostgreSQL Connection Issues

#### Problem: Connection refused
```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Verify connection parameters
# Use container name instead of localhost in Docker
POSTGRES_HOST=postgres  # Not localhost
POSTGRES_PORT=5432
POSTGRES_DB=gamehub
POSTGRES_USER=gamehub_user

# Test connection manually
docker-compose exec postgres psql -U gamehub_user -d gamehub -c "SELECT 1;"
```

#### Problem: Authentication failed
```bash
Error: password authentication failed for user
```

**Solution:**
```bash
# Check environment variables match
# docker-compose.yml
environment:
  - POSTGRES_USER=gamehub_user
  - POSTGRES_PASSWORD=secure_password
  - POSTGRES_DB=gamehub

# Reset PostgreSQL data if needed
docker-compose down -v  # Removes volumes
docker-compose up -d postgres

# Check PostgreSQL logs for details
docker-compose logs postgres
```

### Database Migration Issues

#### Problem: Migration fails
```bash
Error: relation "users" does not exist
```

**Solution:**
```bash
# Run migrations manually
docker-compose exec game-service npm run migrate

# Check migration status
docker-compose exec game-service npm run migrate:status

# Reset database if needed (development only)
docker-compose exec game-service npm run migrate:reset
docker-compose exec game-service npm run migrate

# Verify database schema
docker-compose exec postgres psql -U gamehub_user -d gamehub -c "\dt"
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
docker-compose logs game-service

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

### Jinaga Issues

#### Problem: Jinaga replicator connection fails
```bash
Error: Failed to connect to Jinaga replicator
```

**Solution:**
```bash
# Check front-end-replicator service status
cd mesh/
docker-compose ps front-end-replicator
docker-compose logs front-end-replicator

# Verify connection configuration in services
# Should use: http://front-end-replicator:8080/jinaga

# Test connection manually
curl http://localhost:8080/jinaga

# Check network connectivity
docker-compose exec player-service ping front-end-replicator

# Verify policies are loaded
docker-compose exec front-end-replicator ls -la /var/lib/replicator/policies/
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
docker-compose restart front-end-replicator

# Check replicator logs for policy loading
docker-compose logs front-end-replicator | grep -i policy
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
docker-compose ps db
docker-compose logs db

# Verify database credentials match
# Check .env file has matching credentials for:
# POSTGRES_USER, POSTGRES_PASSWORD
# DATABASE_USERNAME, DATABASE_PASSWORD

# Check FusionAuth logs for specific errors
docker-compose logs fusionauth

# Reset FusionAuth if needed (development only)
docker-compose down -v fusionauth
docker volume rm gamehub_fusionauth_config
docker-compose up -d fusionauth
```

#### Problem: FusionAuth database connection fails
```bash
Error: Unable to connect to database
```

**Solution:**
```bash
# Verify PostgreSQL is accessible
docker-compose exec fusionauth ping db

# Check database URL configuration
# Should be: jdbc:postgresql://db:5432/fusionauth

# Test database connection manually
docker-compose exec db psql -U $POSTGRES_USER -c "SELECT 1;"

# Check if fusionauth database exists
docker-compose exec db psql -U $POSTGRES_USER -l | grep fusionauth
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
docker-compose restart nginx

# Check nginx configuration
docker-compose exec nginx cat /etc/nginx/conf.d/default.conf
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
docker-compose exec nginx ping player-service
docker-compose exec nginx ping game-service

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
docker-compose --version

# Project-specific information
cd mesh/
docker-compose ps
docker-compose logs --tail=50

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
docker-compose logs game-service > game-service.log
docker-compose logs player-service > player-service.log
docker-compose logs front-end-replicator > replicator.log
```

### Support Resources
- **Documentation**: Check the other getting-started guides
- **Logs**: Always check service logs first (`docker-compose logs [service]`)
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
7. **Service Status**: Output of `docker-compose ps`
8. **Network Info**: Docker network configuration if networking issues

### Quick Diagnostic Commands
```bash
# Full system check
cd mesh/
echo "=== Service Status ===" && docker-compose ps
echo "=== Recent Logs ===" && docker-compose logs --tail=10
echo "=== Network Test ===" && curl -I http://localhost
echo "=== FusionAuth Test ===" && curl -I http://localhost:9011
echo "=== Jinaga Test ===" && curl -I http://localhost:8080
```

---

*This troubleshooting guide covers the most common issues specific to the GameHub platform. For general Docker, Node.js, or React issues, refer to the respective technology documentation.*