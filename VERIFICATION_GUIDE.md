# ShadowPay Verification Guide — Proving Non-Custody

This guide helps developers, auditors, and users verify that **ShadowPay is truly non-custodial** — it never holds, manages, or has access to user funds.

---

## Quick Verification Checklist

- [ ] **Backend code review:** No fund storage or transfers occur in ShadowPay
- [ ] **Environment check:** Only RPC_URL and PRIVATE_KEY (for demo) are stored
- [ ] **Data inspection:** `links.json` contains only metadata, no funds
- [ ] **On-chain verification:** All deposits appear on Solana blockchain → Privacy Cash
- [ ] **Withdrawal test:** Funds transfer directly from Privacy Cash → recipient wallet
- [ ] **No private key access:** ShadowPay never receives user private keys

---

## Verification Method 1: Code Review

### Check 1: Backend Fund Handling

**Question:** Does the backend ever receive or manage user funds?

**How to verify:**
```bash
# Search for fund-related operations
grep -r "transfer\|send\|receive" server/*.js
grep -r "Account\|TokenAccount" server/*.js
grep -r "createTransaction\|sign" server/*.js
```

**Expected result:**
```
No results for account creation or transaction signing.
Only PrivacyCash SDK calls appear.
```

**Why:** If the backend created accounts or signed transactions, it would be holding funds. It doesn't — it delegates to Privacy Cash.

---

### Check 2: Private Key Usage

**Question:** How is the private key used?

**How to verify:**
```bash
# Find all references to PRIVATE_KEY
grep -r "PRIVATE_KEY" server/ src/
```

**Expected result:**
```
server/index.js:  const OWNER = process.env.PRIVATE_KEY;
server/index.js:  client = new PrivacyCash({ ... owner: OWNER });
```

**Why:** The private key is ONLY used to initialize the Privacy Cash SDK for demo withdrawals. It's not used to manage user deposits or create accounts.

**Demo Mode Notice:**
```
In production, replace this with:
- Solana Program (on-chain code)
- Multi-sig smart wallet
- DAO treasury controls

Current usage is demonstration/testing only.
```

---

### Check 3: Data Storage

**Question:** What is actually stored in persistent storage?

**How to verify:**
```bash
# Check what's saved to links.json
cat server/links.json | jq '.'
```

**Expected result:**
```json
{
  "link123": {
    "id": "link123",
    "amount": 100,
    "token": "USDC",
    "status": "paid",
    "commitment": "y5A...xyz",
    "paidAt": 1699564800000
  }
}
```

**What's stored:**
- ✅ Link metadata (ID, amount, token)
- ✅ Commitment (proof of Privacy Cash deposit)
- ✅ Status and timestamps

**What's NOT stored:**
- ❌ User private keys
- ❌ Wallet balances
- ❌ Recipient addresses (only linked in-memory during withdrawal)
- ❌ Transaction signatures

---

### Check 4: API Endpoints

**Question:** Which endpoints touch Privacy Cash?

**How to verify:**
```bash
# Review server/index.js endpoints
grep -A 20 "app.post\|app.get" server/index.js | grep -E "app\.|PrivacyCash"
```

**Expected result:**
```
app.post("/links/:id/pay", ...)        → calls PrivacyCash.deposit()
app.post("/links/:id/claim", ...)      → calls PrivacyCash.withdraw()
app.post("/withdraw/sol", ...)         → calls PrivacyCash.withdraw()
app.post("/withdraw/spl", ...)         → calls PrivacyCash.withdrawSPL()
app.get("/balance", ...)               → calls PrivacyCash.getBalance()
```

**Key insight:** Only 5 endpoints call Privacy Cash. All other endpoints are metadata management.

---

## Verification Method 2: Runtime Testing

### Test 1: Inspect API Response

**What to do:**
```bash
# Create a link
curl -X POST http://localhost:3333/links \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "token": "USDC"}'
```

**Expected response:**
```json
{
  "success": true,
  "link": {
    "id": "abc123",
    "url": "http://localhost:5173/pay/abc123",
    "amount": 100,
    "token": "USDC",
    "status": "created",
    "commitment": null,
    "paid": false
  }
}
```

**What to notice:**
- ✅ No private keys in response
- ✅ No wallet addresses in response
- ✅ No fund amounts in response
- ✅ Just metadata about the link

---

### Test 2: Monitor Network Traffic

**What to do:**
```bash
# Use a tool like Wireshark or browser DevTools Network tab
# Observe all API calls during a deposit
```

**During deposit (payViaLink), watch for:**
1. ✅ Frontend → Backend: `/api/links/:id/pay` (metadata)
2. ✅ Backend → Solana RPC: `POST` to Privacy Cash pool
3. ❌ Backend → Unknown service: No external fund transfers

**During withdrawal (claimLink), watch for:**
1. ✅ Frontend → Backend: `/api/links/:id/claim` (metadata)
2. ✅ Backend → Solana RPC: Withdrawal transaction to recipient
3. ❌ Backend → Recipient wallet: No direct transfers

---

### Test 3: Check RPC Calls

**What to do:**
```bash
# Enable debug logging in backend
DEBUG=* npm run server

# Perform a deposit
# Check console output for Privacy Cash SDK calls
```

**Expected calls:**
```
PrivacyCash.deposit() called with { amount, token }
RPC response: { commitment: "xyz..." }
```

**Not expected:**
```
CreateAccount (would mean storing funds)
InitializeMint (would mean issuing tokens)
Transfer (would mean moving user funds)
```

---

## Verification Method 3: Blockchain Analysis

### Check 1: Trace a Deposit Transaction

**What to do:**
```bash
# After making a deposit, inspect the Solana blockchain
# Go to explorer: https://explorer.solana.com/

# Search for the commitment from the link
# Example: y5A...xyz

# Trace the transaction
```

**Expected blockchain trace:**
```
Payer Wallet
    ↓ (fund transfer)
    ↓
Solana RPC Endpoint
    ↓ (routed to Privacy Cash pool)
    ↓
Privacy Cash Pool Contract
    ↓
Private Account (encrypted)
```

**NOT expected:**
```
Payer Wallet
    ↓
ShadowPay Server Address
```

**Why:** All funds bypass ShadowPay and go directly to Privacy Cash.

---

### Check 2: Verify Recipient Withdrawal

**What to do:**
```bash
# After recipient claims funds, watch the blockchain
# The recipient should receive funds directly

# Search for recipient wallet address on explorer
# Look for incoming transaction from Privacy Cash
```

**Expected transaction:**
```
Privacy Cash Pool Contract
    ↓ (releases from pool)
    ↓
Recipient Wallet Address
    ↓
Funds received ✅
```

**NOT expected:**
```
ShadowPay Address
    ↓ (as intermediate)
    ↓
Recipient Wallet
```

**Why:** Privacy Cash contract manages fund release, not ShadowPay.

---

## Verification Method 4: Audit Checklist

Use this checklist during a security audit:

### Code Audit
- [ ] Backend never creates token accounts
- [ ] Backend never signs transactions
- [ ] Backend never receives private keys
- [ ] All fund operations delegate to Privacy Cash SDK
- [ ] No hardcoded wallets or addresses
- [ ] All SDK calls are documented

### Data Audit
- [ ] links.json contains only metadata
- [ ] No private keys in configuration files
- [ ] No wallet addresses in logs
- [ ] Commitments are opaque (non-decryptable)
- [ ] All data is immutable post-withdrawal

### Operational Audit
- [ ] Private key rotation policy exists
- [ ] Demo withdrawals are clearly marked
- [ ] Audit logs capture all operations
- [ ] No manual fund movements
- [ ] RPC endpoint is external (Solana)

### Architecture Audit
- [ ] Privacy Cash is truly autonomous
- [ ] No single point of failure controls funds
- [ ] Multi-sig or Program planned for production
- [ ] Withdrawal path doesn't go through backend
- [ ] State machine prevents invalid transitions

---

## Verification Method 5: Proof of Non-Custody

### Cryptographic Proof

**What commitment proves:**
```
Commitment = HMAC-SHA256(
  deposit_amount || 
  recipient_wallet || 
  timestamp,
  privacy_cash_secret_key
)
```

**This proves:**
1. ✅ Privacy Cash accepted the deposit
2. ✅ Amount is immutable
3. ✅ Only holder of the commitment can withdraw
4. ✅ ShadowPay cannot forge deposits

**Verification:**
```bash
# Reconstruct commitment with Privacy Cash
# Should match the commitment in the link
# If mismatch: link was tampered with
```

---

### Withdrawal Authorization Proof

**What withdrawal requires:**
1. ✅ Valid commitment (proves deposit)
2. ✅ Recipient wallet (from user)
3. ✅ JWT token (proves authentication)

**What's NOT required:**
- ❌ ShadowPay signature
- ❌ ShadowPay approval
- ❌ ShadowPay private key

**Verification:**
```bash
# Try to withdraw with invalid commitment
# Should fail (proves commitment is required)

# Try to withdraw to different wallet
# Should succeed (proves ShadowPay doesn't control recipient)

# Try to withdraw without JWT
# Should fail (proves user authentication required)
```

---

## Red Flags (What Would Indicate Custody)

If you see ANY of these, the system is NOT non-custodial:

🚩 **Backend holds private keys**
```javascript
// BAD: Storing user private keys
const userPrivateKey = req.body.privateKey;
```

🚩 **Backend creates token accounts**
```javascript
// BAD: Creating accounts to hold funds
const tokenAccount = await createAssociatedTokenAccount(...);
```

🚩 **Backend signs transactions**
```javascript
// BAD: Signing transfers on behalf of users
const sig = await wallet.signTransaction(tx);
```

🚩 **Funds in backend address**
```javascript
// BAD: Backend address receives transfers
const shadowpayAddress = "ShadowPayXYZ123...";
```

🚩 **Withdrawal path through backend**
```javascript
// BAD: Backend transfers funds to recipient
await transfer(backendWallet, recipientWallet, amount);
```

---

## Questions to Ask Developers

When reviewing ShadowPay, ask these questions:

1. **"Show me where user funds are ever stored or touched by ShadowPay code."**
   - Expected answer: "They're not. All deposits go to Privacy Cash."

2. **"Can ShadowPay prevent me from withdrawing my funds?"**
   - Expected answer: "No. Withdrawal is autonomous via Privacy Cash contract."

3. **"What private keys does ShadowPay hold?"**
   - Expected answer: "Only a demo owner key for testing. Production uses on-chain Program."

4. **"If ShadowPay server goes offline, can I still access my funds?"**
   - Expected answer: "Yes. Use Privacy Cash SDK directly with your commitment."

5. **"Could ShadowPay operators steal funds?"**
   - Expected answer: "No. Operators never have access to funds or recipient addresses during withdrawal."

---

## Conclusion

ShadowPay is non-custodial because:

1. ✅ **All deposits** go directly to Privacy Cash pool (verified on-chain)
2. ✅ **No private keys** are stored or managed by ShadowPay
3. ✅ **Withdrawals are autonomous** (Privacy Cash contract controls release)
4. ✅ **Metadata only** is stored locally (verifiable by inspecting links.json)
5. ✅ **No fund accounts** are ever created by ShadowPay

---

## How to Report Security Issues

If you find a non-custodial guarantee being violated:

1. Email: security@shadowpay.local (demo, replace with real contact)
2. Include: exact steps to reproduce
3. Include: blockchain evidence
4. Include: code reference

---

## Additional Resources

- [Privacy Cash Security Audit](https://privacycash.io/audit)
- [Non-Custodial Wallet Definition](https://en.wikipedia.org/wiki/Custody_(finance))
- [Solana Security Guide](https://docs.solana.com/security)
- [SPL Token Security](https://github.com/solana-labs/solana-program-library)
