# ShadowPay: Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
- Node.js v18+
- Phantom Wallet (or compatible Solana wallet)
- Testnet SOL for gas fees

### Step 1: Get Testnet SOL
```bash
# If you have Solana CLI installed
solana airdrop 2 --url testnet

# Or request from faucet: https://faucet.solana.com
```

### Step 2: Create Private Key
```bash
# Generate or export your existing Solana keypair
solana-keygen export-secret-key ~/.config/solana/id.json
# Copy the output (base58 string)
```

### Step 3: Configure Backend
Create `server/.env.testnet`:
```bash
PORT=3333
RPC_URL=https://api.testnet.solana.com
PRIVATE_KEY=<paste-your-base58-key-here>
JWT_SECRET=dev-secret-key-123
FRONTEND_ORIGIN=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

### Step 4: Install & Run

**Terminal 1 - Backend:**
```bash
cd server
npm install
node --env-file=.env.testnet index.js
# Output: Server listening on http://localhost:3333
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
# Output: http://localhost:5173
```

### Step 5: Test the App

1. **Authenticate**
   - Open http://localhost:5173
   - Click "Connect Wallet"
   - Approve signature in Phantom
   - You'll be authenticated with JWT

2. **Create a Payment Link**
   - Click "Create Link"
   - Select "One-Time" or "Reusable"
   - Set amount (e.g., 1 USDC)
   - Select token (SOL, USDC, USDT)
   - Click "Create Private Payment Link"
   - Copy generated link

3. **Receive Payment**
   - Open generated link in new tab
   - Shows amount and token
   - Click "Pay"
   - Confirm in Phantom
   - Transaction sent to privacy pool

4. **Withdraw Privately**
   - Click "Withdraw"
   - Enter recipient wallet address
   - See real-time privacy score
   - Confirm withdrawal
   - View on Solana Explorer

## 📚 Key Features Added

### ✅ Authentication
- Wallet-based (no passwords!)
- Message signing with Phantom
- JWT tokens (24h expiry)
- Automatic token injection

### ✅ Encryption
- TweetNaCl public-key encryption
- Base58 key encoding
- Ephemeral keypairs for each message
- Server-side asymmetric decryption

### ✅ Real Privacy Cash SDK
- Actual withdrawals via Privacy Cash
- SOL and SPL token support
- Transaction hash returned
- Proper error handling from SDK

### ✅ Solana Testnet Ready
- Configurable network support
- Automatic token detection
- Explorer links for all transactions
- Phantom wallet integration

## 🔧 Useful Commands

```bash
# Frontend
npm run dev              # Development server
npm run dev:testnet      # Development with testnet config
npm run build            # Production build
npm run build:testnet    # Production build (testnet)

# Backend
cd server
node --env-file=.env.testnet index.js      # Start server
npm install              # Install dependencies
```

## 📡 API Endpoints

### Public
```
GET  /health          - Server status
```

### Authentication
```
POST /auth/login      - Sign in with wallet
POST /auth/verify     - Verify JWT token (requires token)
```

### Protected Endpoints (require Bearer token)
```
GET  /balance         - Get privacy pool balance
POST /withdraw/sol    - Withdraw SOL (real SDK)
POST /withdraw/spl    - Withdraw SPL tokens (real SDK)
```

### Payment Links
```
POST /links            - Create new link
GET  /links/:id        - Get link details
POST /links/:id/pay    - Mark link as paid
```

## 🔐 Security Notes

⚠️ **IMPORTANT:**
- Never share your `PRIVATE_KEY`
- Keep `JWT_SECRET` secret
- `.env.testnet` should not be committed to git
- Always use testnet for development
- Use Phantom's built-in security features

## 🐛 Troubleshooting

### "Server won't start"
```bash
# Check if port 3333 is in use
lsof -i :3333

# Kill any process on that port
kill -9 <PID>
```

### "Invalid signature"
- Make sure Phantom is on Testnet
- Try signing again
- Check RPC_URL is correct

### "Withdrawal failed"
- Verify recipient address format
- Check you have sufficient balance
- Check network connectivity

### "CORS errors"
- Ensure CORS_ORIGIN matches your frontend URL
- Check FRONTEND_ORIGIN is correct
- Verify backend is running

## 📖 Full Documentation

- **DEPLOYMENT.md** - Complete testnet & production setup
- **ADVANCED_FEATURES.md** - Architecture & implementation details
- **FEATURES.md** - Feature descriptions with examples
- **INTEGRATION.md** - API integration guide

## 🎯 Next Steps

1. ✅ Run locally & test all features
2. Test with multiple wallets
3. Try creating/paying/withdrawing
4. Check transactions on explorer
5. Review DEPLOYMENT.md for production

## 💡 Pro Tips

- Use `getSolscanUrl(txHash)` to get explorer links
- Privacy score changes in real-time as you adjust amount
- One-time links auto-expire after 1st payment
- Reusable links accept unlimited payments
- Withdrawal suggestions help maximize privacy

## 🚀 Deploy to Production

When ready:
1. Follow DEPLOYMENT.md
2. Use production RPC endpoint
3. Deploy frontend to Vercel
4. Deploy backend to Railway
5. Update environment variables
6. Enable mainnet support (if needed)

---

**Questions?** Check the docs or create an issue!

**Happy Privacy-Preserving Payments!** 🎉
