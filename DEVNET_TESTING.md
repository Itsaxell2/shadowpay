# 💰 Get Devnet SOL for Testing

## 🎯 Quick Airdrop

### Option 1: Solana Faucet (Recommended)
```
https://faucet.solana.com
```

**Steps:**
1. Visit https://faucet.solana.com
2. Paste your wallet address
3. Select "Devnet"
4. Click "Confirm Airdrop"
5. Wait 30 seconds
6. You'll receive 1-2 SOL on devnet

---

### Option 2: Solana CLI
```bash
solana airdrop 2 <YOUR_WALLET_ADDRESS> --url devnet
```

---

### Option 3: Phantom Wallet Built-in

1. Open Phantom wallet
2. Settings → Developer Settings
3. Enable "Testnet Mode"
4. Click "Airdrop" button
5. Receive 1 SOL on devnet

---

## 🧪 Testing Real Transactions

### Setup:

1. **Get devnet SOL:**
   - Use faucet above (free, unlimited)

2. **Connect wallet:**
   - Make sure Phantom is on devnet/testnet
   - Connect at http://localhost:5173

3. **Create payment link:**
   - Amount: 0.1 SOL (or any small amount)
   - Token: SOL

4. **Pay the link:**
   - Click "Pay X SOL"
   - Phantom opens with REAL transaction
   - Approve → SOL actually transfers on devnet
   - See on explorer: https://explorer.solana.com/tx/[signature]?cluster=devnet

---

## 🔍 Verify Transaction

After payment, check:
```
https://explorer.solana.com/address/[YOUR_ADDRESS]?cluster=devnet
```

You'll see:
- ✅ Transaction history
- ✅ Real balance changes
- ✅ Transaction signature
- ✅ Fees paid

---

## 💡 What's Different Now?

### Before (Demo Mode):
```
❌ Sign message only (no real transaction)
❌ No balance change
❌ No blockchain record
❌ localStorage only
```

### Now (Real Devnet):
```
✅ REAL Solana transaction
✅ Balance actually decreases
✅ Transaction on blockchain
✅ Visible on Solana Explorer
✅ Fees paid (very small)
```

---

## 🎯 Example Flow

```
1. User clicks "Pay 0.5 SOL"
2. App checks devnet balance: 2 SOL ✅
3. Creates Solana transaction:
   - From: Your wallet
   - To: Burn address (demo)
   - Amount: 0.5 SOL
4. Phantom shows REAL transaction preview:
   - "Transfer 0.5 SOL"
   - "Network fee: ~0.000005 SOL"
5. User approves
6. Transaction broadcasts to devnet
7. App waits for confirmation (~2 seconds)
8. SUCCESS! View on explorer
```

---

## ⚠️ Important Notes

### Network Fee:
- Every transaction costs ~0.000005 SOL
- Very cheap (less than $0.01 even on mainnet)

### Demo Recipient:
- Currently sends to burn address: `11111111111111111111111111111112`
- This is safe for testing
- In production, would send to Privacy Cash pool

### Backend vs Frontend:
- **Backend ON:** Uses Privacy Cash SDK (privacy pool)
- **Backend OFF:** Direct transfer (demo, no privacy mixing)

---

## 🚀 Production Deployment

For mainnet:

1. **Set network to mainnet:**
   ```bash
   VITE_SOLANA_NETWORK=mainnet-beta
   ```

2. **Backend REQUIRED:**
   - Frontend-only = no privacy mixing
   - Backend with Privacy Cash SDK = full privacy

3. **Real recipient:**
   - Change from burn address to Privacy Cash pool address

---

## 🔗 Useful Links

- **Devnet Faucet:** https://faucet.solana.com
- **Explorer:** https://explorer.solana.com
- **Phantom Wallet:** https://phantom.app
- **Solana Docs:** https://docs.solana.com

---

## 🐛 Troubleshooting

### "Insufficient balance"
```
Solution: Get devnet SOL from faucet
https://faucet.solana.com
```

### "Transaction failed"
```
1. Check you're on devnet (not mainnet)
2. Try smaller amount (0.1 SOL)
3. Wait a few seconds and retry
4. Check RPC status: https://status.solana.com
```

### "Phantom not found"
```
Install Phantom: https://phantom.app/download
```

---

**Ready to test!** Get devnet SOL and try a real payment 🚀
