# ShadowPay Testnet Deployment Guide

## Overview
This guide covers deploying ShadowPay to Solana testnet with real Privacy Cash SDK integration.

## Prerequisites

1. **Solana CLI** installed
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
   ```

2. **Phantom Wallet** or similar Solana wallet extension
   - Install from https://phantom.app
   - Switch to Testnet in settings

3. **Node.js** (v18+) and npm

4. **Testnet SOL** (airdrop)
   ```bash
   solana airdrop 2 $(solana address) --url testnet
   ```

## Step 1: Setup Private Key

```bash
# Generate keypair if you don't have one
solana-keygen new

# Export your private key (base58)
solana-keygen export-secret-key ~/.config/solana/id.json

# Copy the base58 private key to server/.env.testnet
```

## Step 2: Configure Environment

**Frontend (.env.testnet):**
```bash
VITE_API_URL=http://localhost:3333
VITE_SOLANA_NETWORK=testnet
```

**Backend (server/.env.testnet):**
```bash
PORT=3333
RPC_URL=https://api.testnet.solana.com
PRIVATE_KEY=<your-base58-private-key>
JWT_SECRET=<random-secret-key>
FRONTEND_ORIGIN=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

## Step 3: Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

## Step 4: Build & Deploy

**Development (Local Testing):**
```bash
# Terminal 1: Backend
cd server
node --env-file=.env.testnet index.js

# Terminal 2: Frontend
npm run dev
```

**Production (Vercel/Railway):**

### Frontend (Vercel)
```bash
npm install -g vercel
vercel --env-file .env.testnet
```

### Backend (Railway)
```bash
# Connect GitHub repo to Railway
# Set environment variables in dashboard
# Deploy from main branch
```

## Step 5: Test Features

### Authentication
1. Visit http://localhost:5173
2. Connect Phantom wallet
3. Sign message to authenticate
4. Receive JWT token

### Create Payment Link
1. Click "Create Link"
2. Select link type (one-time/reusable)
3. Set amount and token
4. Share generated link

### Withdraw with Privacy
1. Click "Withdraw"
2. Enter recipient address
3. Monitor privacy score
4. Confirm withdrawal
5. View transaction on Solana Explorer

## SDK Integration Details

### Deposits
```typescript
// Handled by SDK internally
await client.deposit({ amount, token });
```

### Withdrawals (Real)
```typescript
// POST /withdraw/spl
{
  mint: "EPjFWaLb3odcccccccccccccccccccccccccccccccc",
  amount: 1000000,
  recipient: "Receiver..."
}

// POST /withdraw/sol
{
  lamports: 1000000000,
  recipient: "Receiver..."
}
```

### Privacy Features
- ✅ Wallet hiding (payment links don't reveal recipient)
- ✅ Transaction obscuring (Privacy Cash mixing pool)
- ✅ Withdrawal guidance (5 heuristics)
- ✅ Encrypted link storage
- ✅ JWT authentication

## Monitoring

### Check Server Health
```bash
curl http://localhost:3333/health
```

### View Logs
```bash
# Frontend
npm run dev

# Backend
node --env-file=.env.testnet index.js
```

### Monitor Balance
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3333/balance
```

## Troubleshooting

### "Private key not set"
- Ensure PRIVATE_KEY is in server/.env.testnet
- Verify it's valid base58 format

### "Invalid signature"
- Check wallet is connected
- Ensure correct network (testnet)
- Try signing again

### "Withdrawal failed"
- Check recipient address format
- Verify sufficient balance
- Check RPC URL is valid

### "CORS error"
- Ensure CORS_ORIGIN includes frontend URL
- Check server is running

## Security Notes

⚠️ **IMPORTANT:**
- Never commit private keys to git
- Use environment variables for secrets
- Keep JWT_SECRET secure
- Only use testnet for development
- Enable 2FA on wallet for mainnet

## Next Steps

1. Deploy to testnet
2. Load some testnet tokens
3. Test complete flow
4. Audit smart contracts
5. Consider mainnet migration

## Support

For issues:
1. Check logs for error messages
2. Verify environment variables
3. Test with curl commands
4. Check network connectivity
