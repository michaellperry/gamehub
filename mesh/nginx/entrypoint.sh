#!/bin/sh

# Custom entrypoint for NGINX with setup status monitoring

# Function to update setup status
update_setup_status() {
    while true; do
        /usr/local/bin/generate-setup-status.sh
        sleep 10  # Update every 10 seconds
    done
}

# Start the setup status updater in the background
update_setup_status &

# Generate initial setup status
/usr/local/bin/generate-setup-status.sh

# Start NGINX with the provided arguments
exec "$@"