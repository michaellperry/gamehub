#!/bin/sh

# Script to generate setup status JSON based on environment variables

echo "=== GameHub Setup Status Check ==="
echo "Timestamp: $(date)"

# Default values
FUSIONAUTH_APPLICATION_ID=${FUSIONAUTH_APPLICATION_ID:-"generated_application_id_change_me"}
FUSIONAUTH_KEY_ID=${FUSIONAUTH_KEY_ID:-"generated_key_id_change_me"}
TENANT_PUBLIC_KEY=${TENANT_PUBLIC_KEY:-""}

echo "Environment variables:"
echo "  FUSIONAUTH_APPLICATION_ID: ${FUSIONAUTH_APPLICATION_ID}"
echo "  FUSIONAUTH_KEY_ID: ${FUSIONAUTH_KEY_ID}"
echo "  TENANT_PUBLIC_KEY: $(if [ -n "$TENANT_PUBLIC_KEY" ]; then echo '[SET]'; else echo '[EMPTY]'; fi)"

# Check Step 1: FusionAuth configuration
echo "Checking Step 1: FusionAuth configuration..."
if [ "$FUSIONAUTH_APPLICATION_ID" != "generated_application_id_change_me" ] && [ "$FUSIONAUTH_KEY_ID" != "generated_key_id_change_me" ]; then
    STEP1_COMPLETED="true"
    echo "  ✓ FusionAuth is configured"
else
    STEP1_COMPLETED="false"
    echo "  ✗ FusionAuth needs configuration"
fi

# Check Step 2: Tenant public key
echo "Checking Step 2: Tenant public key..."
if [ -n "$TENANT_PUBLIC_KEY" ] && [ "$TENANT_PUBLIC_KEY" != "" ]; then
    STEP2_COMPLETED="true"
    echo "  ✓ Tenant public key is set"
else
    STEP2_COMPLETED="false"
    echo "  ✗ Tenant public key is missing"
fi

# Check Step 3: Player IP service readiness
echo "Checking Player-IP service readiness at http://gamehub-player-ip:8082/ready..."
if wget --quiet --tries=1 --timeout=5 --spider http://gamehub-player-ip:8082/ready 2>/dev/null; then
    STEP3_COMPLETED="true"
    echo "Player-IP service is ready"
else
    STEP3_COMPLETED="false"
    echo "Player-IP service is not ready"
fi

# Generate JSON response
cat > /var/www/setup-status.json << EOF
{
  "step1_completed": $STEP1_COMPLETED,
  "step2_completed": $STEP2_COMPLETED,
  "step3_completed": $STEP3_COMPLETED
}
EOF

echo "Setup status updated: Step1=$STEP1_COMPLETED, Step2=$STEP2_COMPLETED, Step3=$STEP3_COMPLETED"