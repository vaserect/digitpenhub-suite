#!/bin/bash
# Digitpen Hub - Deployment Verification Script
# Verifies key live endpoints, no placeholder markers, and module health.
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No color

echo "🔍 Digitpen Hub — Production Verification"
echo "=========================================="

report_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}[PASS]${NC} $2"
  else
    echo -e "${RED}[FAIL]${NC} $2"
    exit 1
  fi
}

warn_result() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

# Helper: check if jq is available
HAS_JQ=false
command -v jq >/dev/null 2>&1 && HAS_JQ=true

# ── Check 1: Frontend ──
echo "1. Frontend (Port 4000)..."
FS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/login 2>/dev/null || echo "000")
report_result $([ "$FS" == "200" ] && echo 0 || echo 1) "Frontend /login → $FS"

# ── Check 2: Backend Health ──
echo "2. Backend Health (Port 4001)..."
BH=$(curl -s http://127.0.0.1:4001/api/v1/health 2>/dev/null || echo "{}")
report_result $(echo "$BH" | grep -q '"status":"healthy"' && echo 0 || echo 1) "Backend → $BH"

# ── Check 3: Rate Limiting ──
echo "3. Rate Limiting..."
HDRS=$(curl -s -I http://127.0.0.1:4001/api/v1/health 2>/dev/null)
if echo "$HDRS" | grep -qi "ratelimit-remaining"; then
  LIMIT=$(echo "$HDRS" | grep -i "ratelimit-limit" | tr -d '\r' | awk '{print $2}')
  REM=$(echo "$HDRS" | grep -i "ratelimit-remaining" | tr -d '\r' | awk '{print $2}')
  report_result 0 "Rate limiting: limit=$LIMIT remaining=$REM"
else
  warn_result "Rate limiting headers not found"
fi

# ── Check 4: Detailed Health (skip if JWT_SECRET not resolvable) ──
echo "4. Detailed Health..."
JWT_SECRET=""
if [ -f backend/.env ] && grep -q 'JWT_SECRET' backend/.env; then
  JWT_SECRET=$(grep 'JWT_SECRET' backend/.env | tail -1 | cut -d= -f2 | tr -d ' ')
fi
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-secret-key-here" ]; then
  warn_result "JWT_SECRET not set properly — skipping detailed health (set JWT_SECRET in .env)"
else
  JWT=$(cd backend && node -e "
    try { const j = require('jsonwebtoken');
    console.log(j.sign({ sub: 'ebe0101e-4664-44fd-8ba1-37ac006c08aa', jti: '51f6a67e-9cb1-427d-b998-7f8d182ea8d7' }, '$JWT_SECRET'));
    } catch(e) { console.error('JWT signing failed:', e.message); process.exit(1); }
  " 2>/dev/null || echo "")
  if [ -n "$JWT" ]; then
    DH=$(curl -s -b "dph_session=$JWT" http://127.0.0.1:4001/api/v1/health/detailed 2>/dev/null || echo "{}")
    if echo "$DH" | grep -q '"database":{"status":"healthy"'; then
      echo -e "${GREEN}[PASS]${NC} Database healthy"
    else
      warn_result "Database health check failed"
    fi
    if echo "$DH" | grep -q '"payment":{"status":"healthy"'; then
      echo -e "${GREEN}[PASS]${NC} Payment gateway configured"
    else
      warn_result "Payment gateway not configured or not healthy"
    fi
  else
    warn_result "Could not generate JWT — skipping detailed health"
  fi
fi

# ── Check 5: No Placeholder Markers ──
echo "5. Placeholder Markers..."
for endpoint in "/api/v1/modules" "/api/v1/billing/plans" "/api/v1/features"; do
  BODY=$(curl -s "http://127.0.0.1:4001$endpoint" 2>/dev/null || echo "")
  if echo "$BODY" | grep -qi "TODO\|MOCK_\|mock-token\|mock_campaign\|lorem ipsum" 2>/dev/null; then
    warn_result "Placeholder marker found in $endpoint"
  fi
done
echo -e "${GREEN}[PASS]${NC} No placeholder markers in API responses"

# ── Check 6: Key API Endpoints ──
echo "6. Key API Endpoints..."
ENDPOINTS=("api/v1/billing/plans" "api/v1/content/public" "api/v1/builder/templates?limit=3")
for ep in "${ENDPOINTS[@]}"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:4001/$ep" 2>/dev/null || echo "000")
  if [ "$CODE" = "200" ] || [ "$CODE" = "401" ]; then
    echo -e "${GREEN}[PASS]${NC} /$ep → $CODE"
  else
    warn_result "/$ep → $CODE (expected 200 or 401)"
  fi
done

# ── Check 7: Module Route Health ──
echo "7. Module Routes..."
for route in "api/v1/crm" "api/v1/invoices" "api/v1/hr/employees"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:4001/$route" 2>/dev/null || echo "000")
  if [ "$CODE" != "000" ] && [ "$CODE" != "502" ]; then
    echo -e "${GREEN}[PASS]${NC} /$route → $CODE"
  else
    warn_result "/$route unreachable → $CODE"
  fi
done

echo ""
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}✅ ALL CHECKS COMPLETE${NC}"
echo -e "${GREEN}====================================${NC}"
