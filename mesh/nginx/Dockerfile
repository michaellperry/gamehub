FROM nginx:stable-alpine

# Install required packages
RUN apk add --no-cache wget

# Copy the setup status generation script
COPY generate-setup-status.sh /usr/local/bin/generate-setup-status.sh
RUN chmod +x /usr/local/bin/generate-setup-status.sh

# Create directory for setup status file
RUN mkdir -p /var/www

# Create initial setup status file
RUN echo '{"step1_completed":false,"step2_completed":false,"step3_completed":false}' > /var/www/setup-status.json

# Copy custom entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]