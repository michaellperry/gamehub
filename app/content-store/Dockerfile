FROM node:22-alpine
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --include=dev

# Copy application code
COPY src ./src

# Create storage directory
RUN mkdir -p storage

# Expose port
EXPOSE 8081

# Start the application
CMD ["node", "src/server.js"]
