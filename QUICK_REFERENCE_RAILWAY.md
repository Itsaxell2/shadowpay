# 🚀 Quick Reference: Railway Relayer Setup

## The Fix in 30 Seconds

### Problem
Backend tried to call `http://localhost:4444` in production → doesn't work

### Solution
Set `RELAYER_URL` environment variable to relayer's Railway domain

### Result
✅ Payments flow backend → relayer → ZK proof → Solana

---

## Step 1: Deploy Relayer

```bash
# In Railway Dashboard:
1. Create new service from GitHub
2. Select your fork
3. Set deploy path: /relayer
4. Wait for deployment
5. Note the domain (e.g., shadowpay-relayer.up.railway.app)
```

## Step 2: Configure Relayer

**Railway → Relayer Service → Variables:**
```
PORT=                    (auto-assigned, leave blank)
NODE_ENV=production
SOLANA_RPC_URL=https://api.devnet.solana.com
RELAYER_KEYPAIR_PATH=./relayer.json
```

## Step 3: Configure Backend

**Railway → Backend Service → Variables:**
```
RELAYER_URL=https://shadowpay-relayer.up.railway.app
RELAYER_TIMEOUT=30000
NODE_ENV=production
```

## Step 4: Fund Relayer

```bash
# Get free devnet SOL
solana airdrop 5 --url devnet

# Check balance
curl https://shadowpay-relayer.up.railway.app/health
```

## Step 5: Test

```bash
./test-relayer-integration.sh https://shadowpay-production.up.railway.app https://shadowpay-relayer.up.railway.app
```

---

## Verification

### Backend
```bash
curl https://shadowpay-production.up.railway.app/health
# Shows: "LIGHTWEIGHT: No ZK proof generation"
```

### Relayer
```bash
curl https://shadowpay-relayer.up.railway.app/health
# Shows: {"ok": true, "balance": 5.0}
```

### Logs
Backend: `📡 Forwarding to relayer: POST https://...`  
Relayer: `💰 Depositing 0.001 SOL...` → `✅ Deposit successful`

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `RELAYER_URL not configured` | Set RELAYER_URL in backend |
| `Connection timeout (30s)` | Relayer offline - restart service |
| `Balance: 0` | Airdrop SOL: `solana airdrop 5` |
| `PORT not set (production)` | Railway auto-assigns PORT (leave blank) |

---

## Files to Know

| File | Purpose |
|------|---------|
| `server/index.js` | Backend (forwarding) |
| `relayer/index.js` | Relayer (ZK generation) |
| `RAILWAY_RELAYER_SETUP.md` | Detailed setup guide |
| `test-relayer-integration.sh` | Integration tests |
| `PRODUCTION_DEPLOYMENT_CHECKLIST.md` | Full checklist |

---

## Environment Variables

### Backend (`RELAYER_URL` is KEY)
```
RELAYER_URL=https://shadowpay-relayer.up.railway.app
RELAYER_TIMEOUT=30000 (optional)
SOLANA_RPC_URL=https://api.devnet.solana.com
PORT=3333
JWT_SECRET=<your-secret>
PRIVATE_KEY=<your-keypair>
```

### Relayer (`PORT` is auto)
```
PORT=               (auto-assigned by Railway)
NODE_ENV=production (enables validation)
SOLANA_RPC_URL=https://api.devnet.solana.com
RELAYER_KEYPAIR_PATH=./relayer.json
```

---

## Success = ✅

- ✅ Backend runs on 3333 (lightweight)
- ✅ Relayer runs on 4444 (with ZK)
- ✅ `curl relayer/health` returns `{"ok": true}`
- ✅ Backend logs show relayer URL
- ✅ Relayer has SOL balance > 0
- ✅ Test script passes
- ✅ Payments work end-to-end

---

## Fast Rollback

If needed:
```bash
# Disable payments temporarily
# In Railway → Backend → Variables
# Set: RELAYER_URL=   (empty)

# This makes backend fail gracefully:
# "RELAYER_URL not configured"
```

---

## Health Check URLs

```
Backend:  https://shadowpay-production.up.railway.app/health
Relayer:  https://shadowpay-relayer.up.railway.app/health
```

---

## Architecture

```
USER PAYMENT
    ↓
BACKEND (Port 3333) - Lightweight
  - Validate request
  - Forward to relayer
  - Store result
    ↓
RELAYER (Port 4444) - Heavy Worker
  - Generate ZK proof
  - Submit to Solana
  - Return tx hash
    ↓
USER CONFIRMATION
```

---

## Remember

- ❌ Don't hardcode `localhost:4444`
- ✅ Use `$RELAYER_URL` from environment
- ❌ Don't manually set PORT in relayer
- ✅ Let Railway auto-assign PORT
- ❌ Don't skip funding wallet
- ✅ Airdrop SOL to relayer address
- ✅ Verify both services with `/health`

---

See: `RAILWAY_RELAYER_SETUP.md` for full instructions
