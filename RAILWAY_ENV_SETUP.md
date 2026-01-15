## 🚀 Railway Environment Setup

### Required Variables

Go to Railway Dashboard → Your Service → Variables → Add the following:

```bash
SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=c455719c-354b-4a44-98d4-27f8a18aa79c
RELAYER_SECRET=shadowpay-relayer-secret-123
NODE_ENV=production
```

### Why Helius RPC?

**BEFORE (Free RPC):**
- ZK proof: 20-30s
- Railway timeout: 30s
- Result: ❌ 502 timeout

**AFTER (Helius RPC):**
- ZK proof: 3-8s ✅
- Railway timeout: 30s
- Result: ✅ Success in time

### Test After Deploy

```bash
# Wait 1-2 minutes for Railway redeploy

# Test health
curl https://shadowpay-production-8362.up.railway.app/health

# Test deposit (should complete in 5-10s)
curl -X POST https://shadowpay-production-8362.up.railway.app/deposit \
  -H "Content-Type: application/json" \
  -H "x-relayer-auth: shadowpay-relayer-secret-123" \
  -d '{"lamports": 5000000}'

# Expected: {"success": true, "tx": "..."}
# Time: 5-10s ✅
```

### If Still Issues

Check Railway logs:
```bash
railway logs --tail 100
```

Common issues:
- ALT not found → PrivacyCash SDK need initialization
- Still timeout → Increase to mainnet RPC or use premium tier
- Authentication error → Verify RELAYER_SECRET matches
