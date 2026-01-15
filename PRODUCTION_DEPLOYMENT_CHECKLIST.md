# 📋 Production Deployment Checklist - Railway Relayer Architecture

## Overview

This checklist ensures the backend-relayer separation works correctly in production. The backend is lightweight and forwards all payments to the relayer service, which handles ZK proof generation.

**Status: ✅ READY FOR PRODUCTION**
- ✅ Backend code: HTTPS validation, timeout protection
- ✅ Relayer code: PORT validation, environment checks
- ✅ Tests: Integration test script ready
- ✅ Documentation: Complete setup guide

---

## Phase 1: Relayer Service Creation (15 minutes)

### Create New Service in Railway
- [ ] Log into Railway Dashboard
- [ ] Select ShadowPay project
- [ ] Click "New" or "Add Service"
- [ ] Choose "Deploy from GitHub Repo"
- [ ] Select your fork (xxcode2/shadowpay)
- [ ] Set deploy path: `/relayer`
- [ ] Click "Create & Deploy"
- [ ] Note the service name (e.g., `shadowpay-relayer`)

### Configure Relayer Environment
**In Railway → Relayer Service → Variables:**

| Variable | Value | Notes |
|----------|-------|-------|
| `PORT` | *(auto)* | Railway assigns automatically |
| `NODE_ENV` | `production` | Enables validation |
| `SOLANA_RPC_URL` | `https://api.devnet.solana.com` | Must match backend |
| `RELAYER_KEYPAIR_PATH` | `./relayer.json` | Must match repo |
| `SERVICE_URL` | *(auto-populate)* | Relayer's public domain |

**CRITICAL: Do NOT set PORT manually** - Railway auto-assigns it

- [ ] Add all variables
- [ ] Save changes
- [ ] Wait for deployment (2-3 minutes)

### Verify Relayer Deployment
```bash
# Get relayer domain from Railway dashboard
# Example: https://shadowpay-relayer.up.railway.app

curl https://YOUR_RELAYER_DOMAIN/health

# Expected response:
{
  "ok": true,
  "relayer": "89dQq1YgasQ88E72tu6qPFmMSe1QNSbD4y647RxuoXN5",
  "balance": 0,
  "rpcUrl": "https://api.devnet.solana.com"
}
```

- [ ] Relayer responds to `/health`
- [ ] Shows relayer wallet address
- [ ] Shows current SOL balance

---

## Phase 2: Backend Configuration (10 minutes)

### Update Backend Environment
**In Railway → Backend Service (shadowpay-production) → Variables:**

**ADD this new variable:**
```bash
RELAYER_URL=https://YOUR_RELAYER_DOMAIN.up.railway.app
```

**Verify existing variables:**
```bash
PORT=3333
SOLANA_RPC_URL=https://api.devnet.solana.com
JWT_SECRET=<your-secret>
PRIVATE_KEY=<your-keypair>
```

**Optional:**
```bash
RELAYER_TIMEOUT=30000    # milliseconds for ZK proof
NODE_ENV=production      # Enable validation
```

- [ ] Add `RELAYER_URL` with correct domain
- [ ] Update existing variables if needed
- [ ] Save changes
- [ ] Backend auto-redeploys

### Verify Backend Deployment
```bash
curl https://shadowpay-production.up.railway.app/health

# Should show:
# "ok": true
# ✅ ARCHITECTURE VERIFIED
# - LIGHTWEIGHT: No ZK proof generation
# - ORCHESTRATOR: Forwards payments to relayer
# - NO OOM: All heavy logic isolated in relayer
```

- [ ] Backend shows startup logs
- [ ] Mentions relayer URL
- [ ] Shows timeout protection enabled

---

## Phase 3: Fund Relayer Wallet (5 minutes)

The relayer wallet needs SOL for gas fees on every transaction.

### Get Devnet SOL
```bash
# Using Solana CLI
solana config set --url devnet
solana airdrop 5 --url devnet

# Or use web faucet:
# https://faucet.solana.com/?amount=5&cluster=devnet
# Paste address: 89dQq1YgasQ88E72tu6qPFmMSe1QNSbD4y647RxuoXN5
```

### Verify Wallet Funded
```bash
curl https://YOUR_RELAYER_DOMAIN/health | grep balance

# Should show: "balance": 5 (or whatever you funded)
```

- [ ] Relayer wallet has SOL
- [ ] Balance shows in `/health` endpoint
- [ ] At least 0.5 SOL for testing

---

## Phase 4: Integration Testing (10 minutes)

### Option A: Use Test Script
```bash
./test-relayer-integration.sh \
  https://shadowpay-production.up.railway.app \
  https://YOUR_RELAYER_DOMAIN/health
```

Should output:
```
✅ Backend health check passed
✅ Relayer health check passed
✅ Created link: link_xyz
✅ Backend successfully called relayer
✅ All integration tests passed!
```

### Option B: Manual Testing
```bash
# 1. Create payment link
LINK=$(curl -X POST https://shadowpay-production.up.railway.app/links \
  -H "Content-Type: application/json" \
  -d '{"amount": 0.001, "creator_id": "test"}' | jq -r '.id')

# 2. Test payment (may fail auth, but shows relayer connection)
curl -X POST https://shadowpay-production.up.railway.app/links/$LINK/pay \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.001,
    "payerWallet": "3h6wDvzcP8fMTJim8y18b3B4y7ZhzrmM3CfyBj9oJQv5",
    "token": "test"
  }'

# 3. Check backend logs for relayer connection
# Expected: "📡 Forwarding to relayer: POST https://..."
```

- [ ] Create test link succeeds
- [ ] Backend can reach relayer (no timeout)
- [ ] Logs show "Forwarding to relayer"
- [ ] No "RELAYER_URL not configured" error

---

## Phase 5: Production Monitoring (Ongoing)

### Daily Checks
- [ ] Backend logs show successful payments
- [ ] No "connection timeout" errors
- [ ] No "RELAYER_URL not configured" errors
- [ ] Backend memory < 200MB
- [ ] Relayer memory < 1.5GB

### Watch for Issues
| Error | Cause | Fix |
|-------|-------|-----|
| `RELAYER_URL not configured` | Missing env var | Set RELAYER_URL in Railway |
| `Connection timeout` (30s) | Relayer slow/down | Check relayer logs, restart |
| `Relayer error (500)` | SDK error | Check relayer logs |
| `Relayer error (401)` | Auth failure | Check RELAYER_SECRET |
| `Balance: 0` | No funds | Airdrop SOL to relayer |

### Sample Healthy Logs

**Backend:**
```
🚀 Backend running on port 3333
🔁 Relayer at: https://shadowpay-relayer.up.railway.app
⏱️  Relayer timeout: 30000ms
✅ ARCHITECTURE VERIFIED:
   - LIGHTWEIGHT: No ZK proof generation
   - ORCHESTRATOR: Forwards payments to relayer
   - RESILIENT: Timeout protection on relayer calls

📡 Forwarding to relayer: POST https://shadowpay-relayer.up.railway.app/deposit
✅ Payment processed via relayer: 5h3Xyz...
```

**Relayer:**
```
🚀 Relayer running on port 4444
🌐 Service URL: https://shadowpay-relayer.up.railway.app
🔧 Environment: production
✅ Privacy Cash client initialized for relayer

💰 Depositing 0.001 SOL to Privacy Cash...
✅ Deposit successful: 5h3Xyz...
```

---

## Phase 6: Rollback Plan

If something breaks:

### Quick Fix (5 minutes)
```bash
# 1. Check relayer status
# In Railway dashboard → Relayer → Deployments
# If showing errors, restart the service

# 2. Check RELAYER_URL in backend
# In Railway dashboard → Backend → Variables
# Verify URL is correct and accessible

# 3. Restart services
# Dashboard → Service → Restart
```

### Full Rollback (15 minutes)
```bash
# Revert to previous commit
git revert HEAD

# Push to trigger new deployment
git push

# Wait for Railway to redeploy both services
```

### Emergency Disable
```bash
# Temporarily disable relayer calls
# In Railway → Backend → Variables
# Set: RELAYER_URL=  (empty string)

# Backend will fail gracefully:
# "RELAYER_URL not configured" error
# Users see: Service temporarily unavailable
```

---

## Summary Table

| Item | Status | Action |
|------|--------|--------|
| Backend code updated | ✅ | None - merged |
| Relayer code updated | ✅ | None - merged |
| Backend validation | ✅ | Ready |
| Relayer validation | ✅ | Ready |
| Timeout protection | ✅ | Ready (30s default) |
| Integration test | ✅ | Ready (`test-relayer-integration.sh`) |
| Documentation | ✅ | Complete |
| Deployment guide | ✅ | `RAILWAY_RELAYER_SETUP.md` |
| Architecture guide | ✅ | `ARCHITECTURE_OOM_FIX.md` |

---

## Next Steps

1. **Deploy Relayer Service**
   - Create new Railway service from `/relayer`
   - Configure environment variables
   - Deploy and verify `/health`

2. **Configure Backend**
   - Add `RELAYER_URL` variable
   - Restart backend service
   - Verify logs show relayer URL

3. **Fund & Test**
   - Airdrop SOL to relayer wallet
   - Run integration tests
   - Monitor logs during first payments

4. **Monitor Production**
   - Watch for timeout errors
   - Check memory usage
   - Scale relayer if needed for high volume

---

## Support

For detailed setup instructions:
- See: `RAILWAY_RELAYER_SETUP.md`
- See: `ARCHITECTURE_OOM_FIX.md`
- See: `OOM_REFACTOR_COMPLETE.md`

For local testing:
```bash
./test-relayer-integration.sh http://localhost:3333 http://localhost:4444
```

For production logs:
- Backend: Railway Dashboard → Backend → Logs
- Relayer: Railway Dashboard → Relayer → Logs

For verification:
```bash
# Test relayer connection
curl https://YOUR_RELAYER_DOMAIN/health

# Test backend
curl https://shadowpay-production.up.railway.app/health
```
