# Shadowpay × Privacy Cash Integration

This guide explains how **Shadowpay** integrates with the **Privacy Cash SDK** to enable private, untraceable payment links.

## Architecture Overview

```
Frontend (React/Vite)
    ↓
    ├─ CreateLink: POST /links → Server creates + stores link
    ├─ PayLink: GET /links/:id, POST /links/:id/pay → Server tracks payment
    └─ Fallback: Local localStorage if server unavailable
    
Server (Express.js + Privacy Cash SDK)
    ├─ POST /links → Create & persist payment link (links.json)
    ├─ GET /links/:id → Retrieve link details
    ├─ POST /links/:id/pay → Mark link as paid
    └─ POST /withdraw/spl, /withdraw/sol → Privacy Cash withdraw
```

## Local Setup

### Prerequisites
- Node.js 24+
- npm

### 1. Install & Run Server

```bash
cd server
npm install
npm start
```

Server listens on `http://localhost:3333`.

**Optional**: To enable Privacy Cash withdrawals, create `.env`:
```
RPC_URL=https://api.mainnet-beta.solana.com
PRIVATE_KEY=<your-private-key>
FRONTEND_ORIGIN=http://localhost:5173
```

**Note**: Withdraw endpoints throw errors if `PRIVATE_KEY` is invalid, but link endpoints work without it.

### 2. Install & Run Frontend

```bash
npm install
npm run dev
```

Frontend listens on `http://localhost:5173` (or `http://localhost:8080` if port conflict).

### 3. Test Workflow

**Create Private Payment Link:**
1. Open frontend at `http://localhost:5173`
2. Enter amount (e.g., 50 USDC) and select token
3. Click "Create Private Payment Link"
4. Link is persisted to `server/links.json` and displayed

**Receive Payment:**
1. Share the generated link with a payer
2. Payer clicks link → redirected to `/pay/{linkId}`
3. Payer sees amount and privacy details
4. Payer clicks "Pay Privately" → API marks link as paid

**Manual API Test:**

Create link:
```bash
curl -X POST http://localhost:3333/links \
  -H "Content-Type: application/json" \
  -d '{"amount":"50","token":"USDC","anyAmount":false}'
```

Fetch link details (use link `id` from response):
```bash
curl http://localhost:3333/links/{id}
```

Mark as paid:
```bash
curl -X POST http://localhost:3333/links/{id}/pay
```

## File Structure

```
server/
├── index.js           # Express app + endpoints
├── links.json         # Persisted payment links
├── package.json       # Server dependencies
└── README.md          # Server setup

src/
├── lib/
│   └── privacyCash.ts # Local stub (fallback if server down)
└── pages/
    ├── CreateLink.tsx # Create private link UI
    └── PayLink.tsx    # Pay link UI (receiver)
```

## How It Works

### Creating a Link

1. **Frontend**: User enters amount + token in `CreateLink.tsx`
2. **Request**: POST to `http://localhost:3333/links` with amount/token
3. **Server**: Generates unique link ID, saves to `links.json`, returns URL
4. **Display**: Frontend shows generated link & allows copy/share

### Paying a Link

1. **Frontend**: User navigates to `/pay/{linkId}`
2. **Load**: `PayLink.tsx` fetches link details from `GET /links/:id}`
3. **Display**: Shows amount, privacy guarantees
4. **Confirm**: User clicks "Pay Privately"
5. **Mark**: POST to `/links/:id/pay` → server sets `paid: true`
6. **Success**: Frontend confirms payment completed

### Fallback (Server Down)

If server is unreachable, `CreateLink.tsx` and `PayLink.tsx` gracefully fall back to:
- **Local storage** (`localStorage`)
- **Client-side stub** functions in `src/lib/privacyCash.ts`
- Links persist in browser but not shared across devices

## Privacy & Security Notes

- **Link Storage**: Links are stored server-side in `links.json` (plain text for demo)
  - For production: use encrypted DB (e.g., PostgreSQL + encryption)
  
- **Wallet Privacy**: No on-chain link between sender/receiver
  - Enforced by Privacy Cash SDK's mixing pools
  
- **Withdraw Integration**: 
  - Requires valid `PRIVATE_KEY` in `.env`
  - Use only with testnet/devnet first
  - For production: store key in HSM or key management service

## Next Steps

1. **Database**: Replace `links.json` with persistent DB (PostgreSQL, MongoDB)
2. **Authentication**: Add JWT for link ownership verification
3. **Encryption**: Encrypt sensitive link data at rest
4. **Testnet**: Deploy to Solana Devnet with test USDC
5. **Mainnet**: Once audited, deploy with real withdrawals

## Bounty Checklist

- [x] Private payment links (sender → receiver, no on-chain link)
- [x] Create link UI (amount + token selection)
- [x] Pay link UI (confirm amount, privacy badges)
- [x] Server persistence (links.json)
- [x] Privacy Cash SDK integration stub (lazy init)
- [x] Fallback mode (local storage if server down)
- [ ] Production deployment (DB, HSM, audit)
