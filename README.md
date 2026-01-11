# ShadowPay - Privacy-First Payment Links on Solana

**A secure, privacy-preserving payment link platform powered by the Privacy Cash Protocol.**

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHADOWPAY ARCHITECTURE                        │
│                     (Non-Custodial Model)                        │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   SENDER     │
                    │  (Creator)   │
                    └──────┬───────┘
                           │ 1. Create Link
                           ↓
        ┌────────────────────────────────────┐
        │    SHADOWPAY FRONTEND (React)      │
        │  ┌──────────────────────────────┐  │
        │  │ • Link Creation UI           │  │
        │  │ • Payment Page               │  │
        │  │ • Withdrawal Page            │  │
        │  │ • Privacy Guidance           │  │
        │  └──────────────────────────────┘  │
        └────────┬──────────────┬────────────┘
                 │              │
         2. API Calls    5. Fetch Link
                 ↓              ↓
        ┌───────────────────────────────────┐
        │   SHADOWPAY BACKEND (Express)     │
        │  ┌─────────────────────────────┐  │
        │  │ • JWT Authentication        │  │
        │  │ • Link Metadata Storage     │  │
        │  │ • Commitment Management     │  │
        │  │ • Privacy Cash SDK Wrapper  │  │
        │  └─────────────────────────────┘  │
        └────┬──────────────────────┬───────┘
             │                      │
     3. deposit()          6. withdraw(commitment)
             │                      │
             ↓                      ↓
┌────────────────────────────────────────────────┐
│       PRIVACY CASH PROTOCOL (On-Chain)         │
│  ┌──────────────────────────────────────────┐  │
│  │  PRIVACY POOL (Smart Contract)           │  │
│  │  • Holds all deposited funds             │  │
│  │  • Verifies commitments                  │  │
│  │  • Executes withdrawals                  │  │
│  │  • Guarantees privacy via mixing         │  │
│  └──────────────────────────────────────────┘  │
└───────────┬──────────────────────┬─────────────┘
            │                      │
   4. Returns Commitment  7. Releases Funds
            │                      │
            ↓                      ↓
    ┌──────────────┐      ┌──────────────┐
    │    PAYER     │      │  RECIPIENT   │
    │ (Depositor)  │      │ (Withdrawer) │
    └──────────────┘      └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  KEY PRINCIPLES:                                                 │
│  • Funds NEVER held by ShadowPay backend                        │
│  • All funds in Privacy Cash on-chain pool                      │
│  • Backend stores METADATA only (link ID, commitment, status)   │
│  • Users sign withdrawals with their own wallets                │
│  • Privacy guaranteed by Privacy Cash Protocol                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔒 What is ShadowPay?

ShadowPay lets you:
- **Send payment links** without revealing your wallet address
- **Receive payments** privately through a mixing pool
- **Withdraw funds** with real-time privacy guidance
- **Authenticate** using just your Solana wallet (no passwords!)
- **Track transactions** on the blockchain

All powered by the **ShadowPay Protocol** for maximum privacy.

## ✨ Key Features

### 🛡️ Complete Authentication System
- **Wallet-based login** (Phantom, Solflare, etc.)
- **Cryptographic signatures** (TweetNaCl)
- **JWT token management** (24h sessions)
- **No passwords** = No password database hacks

### 🔐 Encryption & Security
- **TweetNaCl encryption** for data transmission
- **Public-key cryptography** (ephemeral keypairs)
- **Base58 key encoding** (Solana standard)
- **Server-side asymmetric decryption**

### 💰 Payment Features
- **One-time links** (auto-expire after 1st payment)
- **Reusable links** (accept unlimited payments)
- **Fixed or flexible amounts** (you choose)
- **Multiple tokens** (SOL, USDC, USDT, extensible)

### 🎯 Privacy Features
- **Wallet hiding** (links don't reveal recipient)
- **Transaction mixing** (ShadowPay privacy pool)
- **Withdrawal guidance** (5 privacy heuristics)
- **Real-time privacy score** (0-100)
- **Smart recommendations** (split withdrawals, timing, amounts)

### 🌐 Solana Testnet Ready
- **Testnet support** (configured for testing)
- **Explorer integration** (view all transactions)
- **Phantom wallet** (native browser extension)
- **Airdrop support** (get testnet SOL)

## 🚀 Quick Start

See **QUICKSTART.md** for a 5-minute setup guide.

### 1-Minute Deploy to Vercel 🚀
```bash
npm i -g vercel
vercel --prod
```
**Done!** Your app is live. See [QUICK_DEPLOY.md](QUICK_DEPLOY.md)

### Local Development
```bash
# Backend
cd server
npm install
node --env-file=.env.testnet index.js

# Frontend (new terminal)
npm install
npm run dev
```

Then visit http://localhost:5173 and connect your Phantom wallet!

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **QUICKSTART.md** | 5-minute setup guide |
| **VERCEL_DEPLOYMENT.md** | 🚀 Deploy to Vercel (frontend-only or full) |
| **WALLET_CONNECTION_FIX.md** | 🆕 Wallet works without backend (hackathon mode) |
| **DEMO_VS_PRODUCTION.md** | 🆕 Demo vs Production architecture explained |
| **DEPLOYMENT.md** | Testnet & production setup |
| **ADVANCED_FEATURES.md** | Architecture & implementation |
| **FEATURES.md** | Detailed feature descriptions |
| **INTEGRATION.md** | API integration guide |

> **For Reviewers/Auditors:** Start with [DEMO_VS_PRODUCTION.md](DEMO_VS_PRODUCTION.md) to understand our architectural choices and security model.

> **⚡ Quick Fix:** Wallet not connecting? See [WALLET_CONNECTION_FIX.md](WALLET_CONNECTION_FIX.md) — wallet now works even if backend is offline!

> **🚀 Deploy Now:** Ready to go live? See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for one-click Vercel deployment!

## 🔑 Environment Variables

### Frontend (`.env.testnet`)
```
VITE_API_URL=http://localhost:3333
VITE_SOLANA_NETWORK=testnet
```

### Backend (`server/.env.testnet`)
```
PORT=3333
RPC_URL=https://api.testnet.solana.com
PRIVATE_KEY=<your-base58-private-key>
JWT_SECRET=<random-secret>
FRONTEND_ORIGIN=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

## ✅ What's New (Latest)

### ✨ Authentication & Encryption
- [x] Wallet-based authentication (Phantom)
- [x] JWT token management (24h expiry)
- [x] TweetNaCl encryption
- [x] Message signing & verification

### 🔐 Real ShadowPay Protocol
- [x] Actual SDK withdrawal integration
- [x] SOL and SPL token support
- [x] Transaction hash returns
- [x] Error handling from SDK

### 🌐 Solana Testnet
- [x] Testnet RPC configuration
- [x] Network-aware token addresses
- [x] Solana Explorer links
- [x] Phantom wallet testnet support

### 💰 Payment Features
- [x] One-time payment links
- [x] Reusable payment links
- [x] Fixed & flexible amounts
- [x] Multiple token support

### 🎯 Privacy Features
- [x] 5 privacy heuristics
- [x] Real-time privacy score (0-100)
- [x] Withdrawal recommendations
- [x] Split withdrawal suggestions

## 📡 API Endpoints

### Authentication
```
POST /auth/login      - Sign in with wallet
POST /auth/verify     - Verify JWT token (protected)
GET  /balance         - Get pool balance (protected)
```

### Withdrawals (Protected)
```
POST /withdraw/sol    - Withdraw SOL
POST /withdraw/spl    - Withdraw SPL tokens
```

### Payment Links
```
POST /links           - Create new link
GET  /links/:id       - Get link details
POST /links/:id/pay   - Mark link as paid
GET  /health          - Server health check
```

## 🔐 Security Architecture

```
User → Phantom Wallet (Sign Message)
  ↓
POST /auth/login (publicKey + signature)
  ↓
Server: Verify signature (TweetNaCl)
  ↓
Generate JWT token (24h expiry)
  ↓
Client: Store token + use in all requests
  ↓
Protected endpoints verify Authorization header
  ↓
Real ShadowPay Protocol withdrawals
  ↓
Transaction broadcast to Solana testnet
```

## 💻 Development Commands

```bash
# Frontend
npm run dev              # Development server
npm run dev:testnet      # Dev with testnet config
npm run build            # Production build
npm run build:testnet    # Production testnet build

# Backend
cd server
node --env-file=.env.testnet index.js
```

## 🎯 Privacy Heuristics

The withdrawal privacy assistant analyzes:

1. **Full Balance Withdrawal** - Warns if withdrawing 95%+ balance
2. **Immediate Withdrawal** - Suggests waiting if within 1 hour
3. **Large Withdrawal** - Recommends splitting 75-95% amounts
4. **Round Numbers** - Suggests irregular amounts (±10%)
5. **Good Practices** - Bonus points for privacy-aware behavior

## 🧪 Testing Checklist

- [ ] Connect wallet (Phantom)
- [ ] Sign authentication message
- [ ] Create one-time payment link
- [ ] Create reusable payment link
- [ ] Receive payment on link
- [ ] Check privacy score in withdraw
- [ ] Withdraw with real SDK
- [ ] View transaction on explorer
- [ ] Verify JWT token expiry (24h)

## 🚀 Deployment

### Local Development
```bash
# Terminal 1
cd server && node --env-file=.env.testnet index.js

# Terminal 2
npm run dev
```

### Production (Vercel + Railway)
1. Deploy frontend to Vercel with `.env.testnet`
2. Deploy backend to Railway with environment variables
3. Point frontend API_URL to backend
4. Set production RPC endpoints

See **DEPLOYMENT.md** for complete guide.

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Server won't start" | Check port 3333, verify env vars |
| "Invalid signature" | Ensure Phantom on testnet |
| "CORS error" | Check CORS_ORIGIN config |
| "Withdrawal fails" | Verify recipient address |

## 📝 Project Structure

```
shadowpay/
├── src/
│   ├── lib/
│   │   ├── auth.ts              [NEW] Authentication
│   │   ├── solana-config.ts      [NEW] Network config
│   │   ├── privacyCash.ts        [UPDATED] SDK wrapper
│   │   └── privacyAssistant.ts   Privacy heuristics
│   └── pages/
│       └── Withdraw.tsx          [UPDATED] Real SDK integration
├── server/
│   ├── auth.js                  [NEW] Auth service
│   ├── index.js                 [UPDATED] API endpoints
│   └── .env.testnet             [NEW] Backend config
├── QUICKSTART.md                [NEW] Setup guide
├── DEPLOYMENT.md                [NEW] Deploy guide
└── ADVANCED_FEATURES.md         [NEW] Architecture
```

## 🎉 What You Can Do Now

1. ✅ Create private payment links
2. ✅ Receive payments in a mixing pool
3. ✅ Withdraw privately with guidance
4. ✅ Authenticate with just your wallet
5. ✅ View all transactions on Solana Explorer
6. ✅ Deploy to testnet
7. ✅ Scale to mainnet

## 📞 Getting Help

- **Setup Issues?** → Read QUICKSTART.md
- **Architecture Questions?** → Check ADVANCED_FEATURES.md
- **API Integration?** → See INTEGRATION.md
- **Deployment Help?** → Follow DEPLOYMENT.md

## 🔮 Next Steps

1. Run the quick start guide (QUICKSTART.md)
2. Test the complete flow locally
3. Deploy to testnet (DEPLOYMENT.md)
4. Monitor transactions on explorer
5. Scale to production when ready

---

**Built with ❤️ for privacy-conscious Solana users**

Made with Solana ⚡ ShadowPay 🔐 TypeScript 💙

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
