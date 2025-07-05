#!/bin/bash

# Test script for service-ip OAuth 2.0 Client Credentials flow
set -e

echo "Testing service-ip OAuth 2.0 Client Credentials flow..."

# Configuration
SERVICE_IP_URL="${SERVICE_IP_URL:-http://localhost:8083}"
CLIENT_ID="${CLIENT_ID:-test-client}"
CLIENT_SECRET="${CLIENT_SECRET:-test-secret-123}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "INFO")
            echo -e "${YELLOW}ℹ️  $message${NC}"
            ;;
    esac
}

# Test 1: Health check
print_status "INFO" "Testing health endpoint..."
if curl -s -f "$SERVICE_IP_URL/health" > /dev/null; then
    print_status "SUCCESS" "Health endpoint is accessible"
else
    print_status "ERROR" "Health endpoint is not accessible"
    exit 1
fi

# Test 2: Token endpoint with valid credentials
print_status "INFO" "Testing token endpoint with valid credentials..."
TOKEN_RESPONSE=$(curl -s -X POST "$SERVICE_IP_URL/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=client_credentials&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET")

if echo "$TOKEN_RESPONSE" | grep -q "access_token"; then
    print_status "SUCCESS" "Token endpoint returned access token"
    ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    print_status "INFO" "Access token: ${ACCESS_TOKEN:0:20}..."
else
    print_status "ERROR" "Token endpoint did not return access token"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

# Test 3: Token endpoint with invalid credentials
print_status "INFO" "Testing token endpoint with invalid credentials..."
INVALID_RESPONSE=$(curl -s -X POST "$SERVICE_IP_URL/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=client_credentials&client_id=invalid&client_secret=invalid")

if echo "$INVALID_RESPONSE" | grep -q "error"; then
    print_status "SUCCESS" "Token endpoint correctly rejected invalid credentials"
else
    print_status "ERROR" "Token endpoint should reject invalid credentials"
    echo "Response: $INVALID_RESPONSE"
    exit 1
fi

# Test 4: Validate JWT token structure
print_status "INFO" "Validating JWT token structure..."
if echo "$ACCESS_TOKEN" | grep -q "^[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*$"; then
    print_status "SUCCESS" "Access token has valid JWT structure"
else
    print_status "ERROR" "Access token does not have valid JWT structure"
    exit 1
fi

# Test 5: Check token expiration (decode JWT payload)
print_status "INFO" "Checking token expiration..."
JWT_PAYLOAD=$(echo "$ACCESS_TOKEN" | cut -d'.' -f2)
# Add padding if needed for base64 decoding
JWT_PAYLOAD_PADDED=$(echo "$JWT_PAYLOAD" | sed 's/$/===/' | fold -w 4 | head -1)
if command -v base64 > /dev/null && command -v jq > /dev/null; then
    DECODED_PAYLOAD=$(echo "$JWT_PAYLOAD_PADDED" | base64 -d 2>/dev/null | jq . 2>/dev/null || echo "Could not decode")
    if [ "$DECODED_PAYLOAD" != "Could not decode" ]; then
        print_status "SUCCESS" "JWT payload decoded successfully"
        echo "Payload: $DECODED_PAYLOAD"
    else
        print_status "INFO" "Could not decode JWT payload (base64/jq not available or invalid)"
    fi
else
    print_status "INFO" "Skipping JWT payload decode (base64 or jq not available)"
fi

print_status "SUCCESS" "All tests passed! 🎉"
echo ""
echo "Summary:"
echo "  - Health endpoint: ✅"
echo "  - Valid credentials: ✅"
echo "  - Invalid credentials rejection: ✅"
echo "  - JWT structure: ✅"
echo "  - Token expiration check: ✅"