FROM node:20-alpine AS gamehub-model-builder

WORKDIR /gamehub-model

# Copy gamehub-model package files
COPY gamehub-model/package*.json ./

# Install gamehub-model dependencies
RUN npm install

# Copy gamehub-model source code
COPY gamehub-model/ ./

# Build gamehub-model
RUN npm run build

# Stage 2: Build player-ip
FROM node:20-alpine AS builder

WORKDIR /app

# Copy the built gamehub-model from the previous stage
COPY --from=gamehub-model-builder /gamehub-model /gamehub-model

# Copy player-ip package files
COPY player-ip/package*.json ./

# Create a symlink to make the local gamehub-model dependency work
RUN mkdir -p node_modules && ln -sf /gamehub-model node_modules/gamehub-model

# Install player-ip dependencies
RUN npm install

# Copy player-ip source code
COPY player-ip/ ./

# Build TypeScript
RUN npm run build

# Stage 3: Runtime
FROM node:20-alpine

WORKDIR /app

# Copy built application and dependencies from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /gamehub-model /gamehub-model

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S player-ip -u 1001

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R player-ip:nodejs /app/data

# Change ownership of the app directory
RUN chown -R player-ip:nodejs /app

# Switch to non-root user
USER player-ip

# Expose port
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8082/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the server
CMD ["npm", "start"]