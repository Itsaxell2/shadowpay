# Fix Old Payment Links

## Problem
Old links in localStorage may have `amount = undefined` causing "Invalid payment amount" error.

## Quick Fix
User needs to clear localStorage ONCE:

### Browser Console (F12):
```javascript
localStorage.clear()
location.reload()
```

Then create NEW links - old links are now cleaned.

---

## Why QR Code Was Removed?

**QR codes are NOT useful for crypto payment links** because:

❌ Crypto wallets (Phantom, MetaMask) **DON'T scan QR codes** for payment URLs  
❌ QR codes in crypto are for **addresses/signatures**, not web links  
✅ **Copy & Paste** is the standard way to share crypto payment links  
✅ Easier to share via chat, social media, email, etc.

**Traditional payment apps** (GoPay, Dana, PayPal) use QR codes.  
**Web3 apps** use direct links or wallet connect.

---

## Testing New Links

1. Clear localStorage (once)
2. Create new payment link: `/create-link`
3. Enter amount: `0.01` SOL
4. Copy link and share
5. Open link → Amount should display correctly
6. Pay → Real Solana transaction on devnet
7. Check on Solana Explorer

**All transactions are now REAL on Solana devnet! No more demo/simulation.**
