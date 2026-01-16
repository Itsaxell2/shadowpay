# 🚨 CRITICAL FIX: Relayer SOL Balance

**Problem**: "This account may not be used to pay transaction fees"

**Root Cause**: Relayer keypair has **0 SOL balance** and cannot pay transaction fees.

---

## ❌ Error Log

```
error message: res text: {
  "success": false,
  "error": "Simulation failed. 
  Message: Transaction simulation failed: This account may not be used to pay transaction fees. 
  Logs: []. 
  Catch the `SendTransactionError` and call `getLogs()` on it for full details."
}
```

---

## ✅ Solution

### 1. Get Relayer Public Key

Check relayer logs or health endpoint:
```bash
curl https://shadowpay-production-8362.up.railway.app/health
```

Look for `relayerPublicKey` in response.

### 2. Send SOL to Relayer

**Minimum**: 0.01 SOL  
**Recommended**: 0.1 SOL (for ~1000 transactions)

Send mainnet SOL to relayer address using:
- Phantom wallet
- Solana CLI: `solana transfer <RELAYER_ADDRESS> 0.1`
- Solflare, Backpack, etc.

### 3. Verify Balance

Run the check script:
```bash
./scripts/check-relayer-balance.sh
```

Or check manually:
```bash
solana balance <RELAYER_ADDRESS> --url mainnet-beta
```

### 4. Restart Relayer (if needed)

```bash
railway restart --service relayer
```

---

## 🔧 Code Changes

### Added Balance Check on Startup

**File**: `relayer/index.js`

```javascript
// Check relayer SOL balance
const connection = new Connection(RPC_URL, 'confirmed');
const relayerBalance = await connection.getBalance(relayerKeypair.publicKey);
console.log(`💰 Relayer SOL balance: ${relayerBalance / LAMPORTS_PER_SOL} SOL`);

if (relayerBalance === 0) {
  console.error("❌ CRITICAL: Relayer has 0 SOL balance!");
  console.error("❌ Cannot pay transaction fees!");
  console.error(`❌ Please send SOL to: ${relayerKeypair.publicKey.toBase58()}`);
  console.error("❌ Minimum: 0.1 SOL for transaction fees");
  process.exit(1);
}
```

**Result**: Relayer will refuse to start if balance is 0, showing clear error message.

### Improved Error Messages

**File**: `server/routes/privacy.js`

```javascript
if (!relayerResponse.ok) {
  const errorText = await relayerResponse.text();
  let errorMessage = 'Relayer deposit failed';
  
  try {
    const error = JSON.parse(errorText);
    errorMessage = error.error || error.message || errorText;
  } catch {
    errorMessage = errorText || `HTTP ${relayerResponse.status}`;
  }
  
  console.error('❌ Relayer error:', errorMessage);
  throw new Error(errorMessage);
}
```

**Result**: Backend will show full relayer error message instead of "response not ok".

---

## 📋 Checklist

- [ ] Get relayer public key from health endpoint
- [ ] Check current SOL balance
- [ ] Send 0.1 SOL to relayer address (mainnet)
- [ ] Verify transaction on Solscan
- [ ] Restart relayer service
- [ ] Test deposit again
- [ ] Monitor balance over time

---

## 🔍 Monitoring

### Check Balance Regularly

```bash
# Quick check
curl https://shadowpay-production-8362.up.railway.app/health | jq '.balance'

# Or use script
./scripts/check-relayer-balance.sh
```

### Set Up Alerts

Consider setting up balance alerts:
- Railway webhook when balance < 0.05 SOL
- Cron job to check balance daily
- Email notification if balance critical

---

## 💡 Why This Happened

1. **Relayer keypair created** but never funded
2. **Privacy Cash SDK requires SOL** for transaction fees (all Solana transactions need fee payer)
3. **Simulation fails** when fee payer has 0 balance
4. **Error message unclear** - SDK only says "cannot be used to pay fees"

---

## 🎯 Prevention

### For Future

1. **Fund relayer immediately** after generating keypair
2. **Monitor balance** with script or alert
3. **Top up automatically** when balance < 0.05 SOL
4. **Add balance check** to health endpoint

### Recommended Setup

```javascript
// health endpoint returns balance
app.get("/health", async (req, res) => {
  const balance = await connection.getBalance(relayerKeypair.publicKey);
  res.json({
    ok: true,
    relayerPublicKey: relayerKeypair.publicKey.toBase58(),
    balance: balance / LAMPORTS_PER_SOL,
    balanceStatus: balance < 0.01 * LAMPORTS_PER_SOL ? 'CRITICAL' : 
                   balance < 0.05 * LAMPORTS_PER_SOL ? 'LOW' : 'OK'
  });
});
```

---

## 📞 Quick Commands

```bash
# Check relayer health
curl https://shadowpay-production-8362.up.railway.app/health | jq '.'

# Check balance
./scripts/check-relayer-balance.sh

# Send SOL (using Solana CLI)
solana transfer <RELAYER_ADDRESS> 0.1 --url mainnet-beta

# Restart relayer
railway restart --service relayer

# View relayer logs
railway logs --service relayer
```

---

**Status**: 🔴 BLOCKED - Need SOL in relayer  
**Priority**: 🚨 CRITICAL - No deposits possible without this  
**ETA**: 5 minutes after sending SOL
