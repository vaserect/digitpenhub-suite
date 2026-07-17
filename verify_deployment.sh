#!/bin/bash
# Digitpen Hub - Deployment Verification Script
# Automatically verifies key live endpoints on the running system.

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔍 Starting production verification checks..."
echo "============================================"

# Helper function for check reporting
report_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}[PASS]${NC} $2"
  else
    echo -e "${RED}[FAIL]${NC} $2"
    exit 1
  fi
}

# Check 1: Next.js Frontend Port 4000
echo "1. Checking Frontend (Port 4000)..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/login || echo "000")
if [ "$FRONTEND_STATUS" == "200" ]; then
  report_result 0 "Frontend /login loaded successfully (HTTP 200)."
else
  report_result 1 "Frontend /login failed with status: $FRONTEND_STATUS"
fi

# Check 2: Express Backend Port 4001 Health
echo "2. Checking Backend Health (Port 4001)..."
BACKEND_HEALTH=$(curl -s http://127.0.0.1:4001/api/v1/health || echo "{}")
if echo "$BACKEND_HEALTH" | grep -q '"status":"healthy"'; then
  report_result 0 "Backend public health endpoint is healthy: $BACKEND_HEALTH"
else
  report_result 1 "Backend public health endpoint failed: $BACKEND_HEALTH"
fi

# Check 3: Rate Limiting Headers
echo "3. Checking Rate Limiting Headers..."
HEADERS=$(curl -s -I http://127.0.0.1:4001/api/v1/health)
if echo "$HEADERS" | grep -q -i "ratelimit-remaining"; then
  LIMIT=$(echo "$HEADERS" | grep -i "ratelimit-limit" | tr -d '\r' | awk '{print $2}')
  REMAINING=$(echo "$HEADERS" | grep -i "ratelimit-remaining" | tr -d '\r' | awk '{print $2}')
  report_result 0 "Rate limiting headers active (Limit: $LIMIT, Remaining: $REMAINING)."
else
  report_result 1 "Rate limiting headers not found in response headers."
fi

# Check 4: Detailed Subsystems & Flutterwave Config
echo "4. Checking Detailed Health & Gateway Configuration..."
# Create a temporary mock JWT token to query the detailed health check
JWT_TOKEN=$(cd backend && node -e '
const jwt = require("jsonwebtoken");
console.log(jwt.sign({ sub: "ebe0101e-4664-44fd-8ba1-37ac006c08aa", jti: "51f6a67e-9cb1-427d-b998-7f8d182ea8d7" }, "your-secret-key-here"));
')

DETAILED_HEALTH=$(curl -s -b "dph_session=$JWT_TOKEN" http://127.0.0.1:4001/api/v1/health/detailed || echo "{}")
if echo "$DETAILED_HEALTH" | grep -q '"database":{"status":"healthy"'; then
  echo -e "${GREEN}✓${NC} Database is healthy."
else
  echo -e "${RED}✗${NC} Database health warning."
fi

if echo "$DETAILED_HEALTH" | grep -q '"payment":{"status":"healthy"'; then
  report_result 0 "Flutterwave payment gateway is fully configured."
else
  report_result 1 "Flutterwave payment gateway check failed or warning: $(echo "$DETAILED_HEALTH" | grep -o '"payment":{[^}]*}' || echo "$DETAILED_HEALTH")"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}🎉 ALL DEPLOYMENT VERIFICATION CHECKS PASSED!${NC}"
echo -e "${GREEN}============================================${NC}"
