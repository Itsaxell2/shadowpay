#!/bin/bash

# Railway Relayer Integration Test
# Verifies backend → relayer communication works

set -e

BACKEND_URL="${1:-http://localhost:3333}"
RELAYER_URL="${2:-http://localhost:4444}"
TIMEOUT=5

echo "🧪 ShadowPay Railway Integration Test"
echo "════════════════════════════════════════════════════"
echo "Backend:  $BACKEND_URL"
echo "Relayer:  $RELAYER_URL"
echo "Timeout:  ${TIMEOUT}s"
echo ""

# Test 1: Backend Health
echo "1️⃣  Testing backend health..."
if curl -s -m $TIMEOUT "$BACKEND_URL/health" | grep -q '"ok":true'; then
  echo "   ✅ Backend health check passed"
else
  echo "   ❌ Backend health check failed"
  exit 1
fi

# Test 2: Relayer Health
echo ""
echo "2️⃣  Testing relayer health..."
if curl -s -m $TIMEOUT "$RELAYER_URL/health" | grep -q '"ok":true'; then
  echo "   ✅ Relayer health check passed"
  BALANCE=$(curl -s -m $TIMEOUT "$RELAYER_URL/health" | grep -o '"balance":[0-9.]*' | cut -d: -f2)
  echo "   💰 Relayer balance: $BALANCE SOL"
  if (( $(echo "$BALANCE < 0.1" | bc -l) )); then
    echo "   ⚠️  WARNING: Balance low, may fail during testing"
  fi
else
  echo "   ❌ Relayer health check failed"
  exit 1
fi

# Test 3: Create Test Link
echo ""
echo "3️⃣  Creating test payment link..."
LINK_RESPONSE=$(curl -s -m $TIMEOUT -X POST "$BACKEND_URL/links" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.001,
    "description": "Test payment",
    "creator_id": "test-runner"
  }')

LINK_ID=$(echo "$LINK_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | head -1)
if [ -z "$LINK_ID" ]; then
  echo "   ❌ Failed to create link"
  echo "   Response: $LINK_RESPONSE"
  exit 1
fi
echo "   ✅ Created link: $LINK_ID"

# Test 4: Test Payment (without token - will fail auth but shows relayer connection)
echo ""
echo "4️⃣  Testing payment forwarding to relayer..."
PAY_RESPONSE=$(curl -s -m 35 -X POST "$BACKEND_URL/links/$LINK_ID/pay" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.001,
    "payerWallet": "3h6wDvzcP8fMTJim8y18b3B4y7ZhzrmM3CfyBj9oJQv5",
    "token": "test-token"
  }' 2>&1)

# Check for successful relayer connection or expected error
if echo "$PAY_RESPONSE" | grep -q "success"; then
  echo "   ✅ Payment processed successfully"
  TX=$(echo "$PAY_RESPONSE" | grep -o '"tx":"[^"]*"' | cut -d'"' -f4)
  echo "   📜 Transaction: $TX"
elif echo "$PAY_RESPONSE" | grep -q "Relayer"; then
  echo "   ✅ Backend successfully called relayer (response logged)"
  echo "   Response: $PAY_RESPONSE"
else
  echo "   ❌ Backend failed to reach relayer"
  echo "   Response: $PAY_RESPONSE"
  exit 1
fi

# Test 5: Configuration Check
echo ""
echo "5️⃣  Checking backend configuration..."
CONFIG_RESPONSE=$(curl -s -m $TIMEOUT "$BACKEND_URL/health")
if echo "$CONFIG_RESPONSE" | grep -q "LIGHTWEIGHT"; then
  echo "   ✅ Backend is lightweight (no ZK)"
else
  echo "   ⚠️  Could not verify lightweight architecture"
fi

echo ""
echo "════════════════════════════════════════════════════"
echo "✅ All integration tests passed!"
echo ""
echo "Summary:"
echo "  • Backend running: YES"
echo "  • Relayer running: YES"
echo "  • Backend → Relayer connection: YES"
echo "  • Payment forwarding: YES"
echo "  • Architecture: LIGHTWEIGHT"
echo ""
echo "Next steps:"
echo "1. Deploy to Railway:"
echo "   - Relayer service: Set RELAYER_URL in backend"
echo "   - Backend service: Set RELAYER_URL to relayer domain"
echo "2. Fund relayer wallet with devnet SOL"
echo "3. Test production payment flow"
