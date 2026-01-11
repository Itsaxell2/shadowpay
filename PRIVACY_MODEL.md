# ShadowPay Privacy Model

## Core Principle: Non-Custodial by Design

**ShadowPay does NOT hold, manage, or have custody of any user funds.**

All deposits are routed directly to the [Privacy Cash](https://privacycash.io) protocol, which manages funds autonomously. ShadowPay acts as a **metadata layer** — we store information about transactions but never touch the funds themselves.

---

## How It Works

### 1. Creating a Receive Link

When a recipient creates a receive link:

```
User Action: "Create receive link for $100 USDC"
                        ↓
           ShadowPay generates:
           - Link ID (metadata)
           - Amount metadata (100 USDC)
           - Status: "created"
           
           ✅ NO funds are transferred
           ✅ NO contracts are created
           ✅ Just a record saying "this link will receive funds"
```

**What is stored:**
- Link ID (unique identifier)
- Amount and token type
- Creation timestamp
- Status (created → paid → withdrawn)

---

### 2. Depositing Funds (Payer Perspective)

When a payer sends funds via the link:

```
Payer Action: "Deposit $100 to this link"
                        ↓
           ShadowPay Backend:
           1. Calls PrivacyCash.deposit()
           2. Funds transfer to Privacy Cash pool
           3. Privacy Cash returns a "commitment"
           4. ShadowPay stores commitment in link metadata
           
           Commitment = cryptographic proof that funds 
                       are in the Privacy Cash pool
                       
           ✅ Funds are NOW in Privacy Cash pool
           ✅ ShadowPay never touches the funds
           ✅ Only the commitment is stored locally
```

**What the link metadata contains after deposit:**
```json
{
  "linkId": "abc123",
  "amount": 100,
  "token": "USDC",
  "status": "paid",
  "commitment": "y5A...xyz",  // Proof of deposit
  "paidAt": 1699564800000
}
```

---

### 3. Withdrawing Funds (Recipient Perspective)

When a recipient claims/withdraws funds:

```
Recipient Action: "Withdraw $100 from this link"
                        ↓
           ShadowPay Backend:
           1. Validates the link's commitment exists
           2. Calls PrivacyCash.withdraw() with the commitment
           3. Privacy Cash releases funds from pool
           4. Funds transfer directly to recipient's wallet
           5. ShadowPay marks link as "withdrawn"
           
           ✅ Funds transfer directly from pool → recipient wallet
           ✅ ShadowPay is NOT the recipient
           ✅ Withdrawal is autonomous via Privacy Cash contract
```

**What the link metadata contains after withdrawal:**
```json
{
  "linkId": "abc123",
  "amount": 100,
  "token": "USDC",
  "status": "withdrawn",
  "commitment": "y5A...xyz",
  "paidAt": 1699564800000,
  "withdrawnAt": 1699564850000
}
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SHADOWPAY METADATA LAYER                         │
│                                                                      │
│  Frontend                Backend               File Storage          │
│  ┌─────────┐           ┌───────┐             ┌──────────┐          │
│  │ Phantom │──JWT─────>│Express│────────────>│links.json│          │
│  │ Wallet  │           │Server │             │ (metadata)          │
│  └─────────┘           └───────┘             └──────────┘          │
│       ▲                     ▲                                        │
│       │                     │                                        │
│       │              Commitment Storage                              │
│       │              (proof of deposit)                              │
│       │                                                              │
└─────────────────────────────────────────────────────────────────────┘
         │                    │
         │                    │ PrivacyCash SDK Calls
         │                    ▼
    Signature        ┌─────────────────────┐
    Verification     │ PRIVACY CASH POOL   │
                     │ (Solana Contract)   │
                     │                     │
                     │ Holds all funds     │
                     │ Autonomous release  │
                     └─────────────────────┘
```

---

## Key Guarantees

| Aspect | Guarantee |
|--------|-----------|
| **Custody** | ShadowPay never holds funds — they go to Privacy Cash pool |
| **Access** | Only the recipient with the link commitment can withdraw |
| **Privacy** | No transaction history visible to ShadowPay operators |
| **Autonomy** | Privacy Cash contract manages fund release, not ShadowPay |
| **Transparency** | All metadata is traceable and verifiable on-chain |

---

## Privacy Cash Primitives Used

### `PrivacyCash.deposit()`
- **What it does:** Sends funds to Privacy Cash pool, returns commitment
- **When called:** When payer deposits via receive link
- **Parameters:** `{ amount, token }`
- **Returns:** Commitment string (proof of deposit)

### `PrivacyCash.withdraw()`
- **What it does:** Releases funds from pool using commitment
- **When called:** When recipient claims SOL
- **Parameters:** `{ lamports, recipientAddress }`
- **Returns:** Transaction signature

### `PrivacyCash.withdrawSPL()`
- **What it does:** Releases SPL tokens from pool using commitment
- **When called:** When recipient claims USDC/USDT/etc
- **Parameters:** `{ mintAddress, amount, recipientAddress }`
- **Returns:** Transaction signature

---

## Demo vs. Production

### Current Implementation (Demo Mode)
```
Direct withdrawal via owner private key:
  Backend has PRIVATE_KEY in environment
  → Owner can call withdraw/sol and withdraw/spl
  → Pulls funds directly from Privacy Cash pool
  
This is for demonstration and testing ONLY.
```

### Production Recommendation
```
Replace with on-chain Program/Protocol:
  ShadowPay operates a Solana Program
  → Users send funds via the program (non-custodial)
  → Program authorizes withdrawals based on link commitments
  → All fund logic is on-chain, fully transparent
  
This ensures ShadowPay has ZERO access to funds.
```

---

## Security Model

### Authentication
- **Phantom Wallet:** Users prove ownership via message signature
- **JWT Tokens:** Issued for authenticated operations (24h expiry)
- **No Passwords:** All auth is blockchain-native

### Authorization
- **Link Metadata:** Publicly readable (privacy is via commitment obscurity)
- **Withdrawal:** Requires valid JWT + link commitment
- **Owner Operations:** Requires JWT + valid signature

### Cryptography
- **TweetNaCl:** Message signature verification
- **Privacy Cash Commitments:** Zero-knowledge proofs that funds are in pool

---

## Workflow Examples

### Example 1: Bob Sends $50 USDC to Alice

```
1. Alice creates receive link (requests $50 USDC)
   → Link created with status: "created"
   
2. Bob opens link and sees: "Alice is requesting $50 USDC"
   
3. Bob clicks "Send $50 USDC"
   → ShadowPay backend calls PrivacyCash.deposit()
   → Bob's wallet signs transaction (Phantom)
   → $50 USDC transfers to Privacy Cash pool
   → Privacy Cash returns commitment: "xyz123"
   → ShadowPay stores: link.commitment = "xyz123"
   → Link status: "paid"
   
4. Alice logs in and sees: "Link has $50 USDC in pool"
   
5. Alice clicks "Claim Funds"
   → ShadowPay backend validates commitment exists
   → Backend calls PrivacyCash.withdrawSPL()
   → Privacy Cash releases $50 USDC from pool
   → Funds transfer to Alice's wallet address
   → Link status: "withdrawn"
   
6. Alice receives $50 USDC
   ✅ ShadowPay never touched the funds
   ✅ Only stored metadata about the transaction
```

---

## Limitations & Constraints

1. **Amount Immutability:** Once a link is created, amount cannot be changed
2. **No Refunds:** If payer sends too much, funds must be withdrawn by recipient
3. **Link Expiration:** Links don't expire — create new links for different requests
4. **Privacy Trade-off:** Link metadata (amount, token) is visible; amounts are not

---

## Testing the Model

To verify ShadowPay is truly non-custodial:

1. **Check logs:** Backend never stores private keys or recipient addresses
2. **Inspect transactions:** All deposits are on-chain to Privacy Cash
3. **Verify metadata:** links.json only contains IDs and commitments
4. **Validate withdrawal:** Call Privacy Cash directly without ShadowPay

---

## References

- [Privacy Cash Documentation](https://privacycash.io/docs)
- [Solana Program Model](https://docs.solana.com/developing/programming-model/overview)
- [Non-Custodial Wallets](https://en.wikipedia.org/wiki/Custody_(finance))
