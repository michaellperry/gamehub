FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

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