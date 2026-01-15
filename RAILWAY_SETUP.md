# Railway Deployment Setup for ShadowPay

## Current Issue
Backend on Railway is trying to call relayer at `http://localhost:4444` which doesn't work in production.

## Solution Options

### Option 1: Deploy Relayer as Separate Railway Service (Recommended)

1. **Create new Railway service for Relayer:**
   ```bash
   # In Railway dashboard:
   # 1. New -> Empty Service
   # 2. Connect to same GitHub repo
   # 3. Set root directory: /relayer
   ```

2. **Set Relayer environment variables:**
   ```
   PRIVATE_KEY=<relayer_keypair_base58>
   SOLANA_RPC_URL=https://api.devnet.solana.com
   PORT=4444
   RELAYER_SECRET=<same_as_backend>
   ```

3. **Get Relayer internal URL:**
   ```
   # Railway gives internal URL like:
   # relayer.railway.internal:4444
   ```

4. **Update Backend RELAYER_URL:**
   ```
   # In backend Railway service:
   RELAYER_URL=http://relayer.railway.internal:4444
   ```

### Option 2: Merge Relayer into Backend (Quick Fix)

Combine both services into one deployment:

1. **Modify server/index.js to also start relayer**
2. **Relayer runs on same process, different port**
3. **Backend calls localhost:4444** (works since same container)

**Pros:** Single deployment  
**Cons:** Less scalable, single point of failure

### Option 3: Use Public Relayer URL (Dev Only)

Deploy relayer to separate hosting with public URL:

```
RELAYER_URL=https://shadowpay-relayer.example.com
```

⚠️ Not recommended for production (security risk)

---

## Recommended Implementation

### Step 1: Deploy Relayer to Railway

```bash
# 1. Create relayer/ directory Railway config
cat > relayer/railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "node index.js",
    "restartPolicyType": "on_failure"
  }
}
EOF
```

### Step 2: Set Environment Variables

**Relayer Service:**
```env
PRIVATE_KEY=<base58_keypair>
SOLANA_RPC_URL=https://api.devnet.solana.com
PORT=4444
RELAYER_SECRET=<shared_secret>
```

**Backend Service:**
```env
RELAYER_URL=${{relayer.RAILWAY_PRIVATE_DOMAIN}}
RELAYER_SECRET=<shared_secret>
JWT_SECRET=<your_jwt_secret>
```

### Step 3: Fund Relayer

```bash
# Get relayer public key from logs
# Fund with devnet SOL
solana airdrop 1 <RELAYER_PUBKEY> --url devnet
```

---

## Current Temporary Fix

For local development, ensure:

1. **Start relayer locally:**
   ```bash
   cd relayer && node index.js
   ```

2. **Start backend with local relayer:**
   ```bash
   cd server
   RELAYER_URL=http://localhost:4444 node index.js
   ```

3. **Frontend points to local backend:**
   ```env
   VITE_API_URL=http://localhost:3333
   ```

---

## Verification

After deployment, test:

```bash
# 1. Check relayer health
curl https://<relayer-url>/health

# 2. Check backend can reach relayer
curl https://<backend-url>/health
# Should log relayer connection

# 3. Test deposit flow
# Create link -> Pay -> Should succeed
```
