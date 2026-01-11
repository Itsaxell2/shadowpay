# ShadowPay Architecture & Hardening Guide

## Overview

ShadowPay is a **metadata layer** that facilitates non-custodial payments via Privacy Cash. This document details the refactored architecture with runtime guards and improved error handling.

---

## Frontend Architecture (`src/lib/privacyCashLinks.ts`)

### Service Layer Responsibilities

The `privacyCashLinks.ts` module provides:

1. **Link creation:** Generate receive link metadata
2. **Payment processing:** Initiate deposits to Privacy Cash
3. **Claim/withdrawal:** Initiate withdrawals from Privacy Cash
4. **Validation:** Runtime guards to prevent invalid states
5. **Error messaging:** Privacy-aware user-friendly errors

### Key Data Type

```typescript
export type PaymentLink = {
  linkId: string;              // Unique identifier
  commitment: string;          // Privacy Cash commitment (proof of deposit)
  amount: number;              // Amount requested/paid
  token: string;               // Token type (USDC, SOL, etc.)
  status: "created" | "paid" | "withdrawn";  // Link state
  paidAt?: number;             // When deposit succeeded
  withdrawnAt?: number;        // When withdrawal succeeded
};
```

**Status Transitions:**
```
created → paid → withdrawn
  ↓        ↓        ↓
Init    Deposit  Withdrawn
```

---

### Runtime Guards

#### createLink() — No Guards Needed
Creating a link involves no blockchain interaction or fund movement. It's pure metadata.

#### payViaLink() — Hardened with Guards

```typescript
// Guard 1: Input Validation
if (!linkId || !amount || !token) {
  throw new Error("Link ID, amount, and token are required");
}

if (amount <= 0) {
  throw new Error("Amount must be greater than zero");
}

// Guard 2: Link Existence
const existingLink = linkStore.get(linkId);
if (!existingLink) {
  throw new Error("Link not found. Create a receive link first.");
}

// Guard 3: Idempotency (prevent re-paying)
if (existingLink.status === "paid") {
  throw new Error("This link has already been paid. Create a new link.");
}

if (existingLink.status === "withdrawn") {
  throw new Error("This link has been withdrawn. Create a new link.");
}

// Guard 4: CRITICAL — Commitment Validation
if (!paidLink.commitment || paidLink.commitment.trim() === "") {
  throw new Error(
    "CRITICAL: Deposit succeeded but no commitment returned. " +
    "This should not happen. Link remains unpaid."
  );
}

// Guard 5: Status Transition Validation
if (paidLink.status !== "paid") {
  throw new Error(
    "Deposit succeeded but link status not updated to 'paid'. " +
    "This indicates a backend error. Contact support."
  );
}
```

**Why these guards?**
- Input validation prevents malformed requests
- Link existence prevents orphaned transactions
- Idempotency prevents double-spending
- Commitment validation ensures funds actually reached Privacy Cash
- Status validation ensures state machine consistency

#### claimLink() — Heavily Hardened

```typescript
// Guard 1: Input Validation
if (!recipientWallet || recipientWallet.trim() === "") {
  throw new Error("Recipient wallet is required to withdraw");
}

// Guard 2: Link Existence
const link = linkStore.get(linkId);
if (!link) {
  throw new Error(`Link not found: ${linkId}. Cannot withdraw.`);
}

// Guard 3: Status Check — Must be paid
if (link.status !== "paid") {
  throw new Error(
    `Cannot withdraw from link in '${link.status}' state. ` +
    `Link must be 'paid' first.`
  );
}

// Guard 4: CRITICAL — Commitment Existence
if (!link.commitment || link.commitment.trim() === "") {
  throw new Error(
    "CRITICAL: Link marked as 'paid' but no commitment found. " +
    "This indicates the deposit to Privacy Cash pool did not complete. " +
    "Contact support — funds may not be in the pool."
  );
}

// Guard 5: Withdrawal Status Validation (after backend call)
if (withdrawnLink.status !== "withdrawn") {
  throw new Error(
    "Withdrawal succeeded but link status not updated to 'withdrawn'. " +
    "This is a backend error. Contact support."
  );
}

// Guard 6: Timestamp Validation
if (!withdrawnLink.withdrawnAt) {
  throw new Error(
    "Withdrawal succeeded but no timestamp recorded. " +
    "This is a backend error. Contact support."
  );
}
```

**Privacy-Aware Error Messages:**
- Explains WHY operations fail (not just "error")
- Distinguishes between user errors and system errors
- Never exposes sensitive data
- Suggests corrective actions

---

## Backend Architecture (`server/index.js`)

### Non-Custodial Guarantees

The backend is explicitly documented as NON-CUSTODIAL:

```javascript
/**
 * SHADOWPAY BACKEND — NON-CUSTODIAL RECEIVE LINK SERVICE
 * 
 * CORE PRINCIPLE: This backend NEVER holds or manages funds.
 * 
 * All deposits and withdrawals are routed directly through 
 * the Privacy Cash SDK.
 */
```

### Endpoint Structure

#### Authentication Endpoints
```
POST /auth/login   → Sign message with Phantom, get JWT
POST /auth/verify  → Validate JWT token (protected)
```

#### Link Management Endpoints
```
POST /links              → Create receive link (metadata only)
GET  /links/:id          → Retrieve link metadata
POST /links/:id/pay      → Deposit to Privacy Cash pool
POST /links/:id/claim    → Withdraw from Privacy Cash pool
```

#### Owner Operations (Demo)
```
POST /withdraw/sol       → Owner-only: Direct SOL withdrawal
POST /withdraw/spl       → Owner-only: Direct SPL withdrawal
GET  /balance            → Check pool balance
```

### Payment Deposit Endpoint (`POST /links/:id/pay`)

**Flow:**
```
1. Client calls endpoint with { amount, token }
2. Backend validates inputs
3. Backend calls PrivacyCash.deposit()
4. Privacy Cash returns commitment
5. Backend stores commitment in link metadata
6. Backend marks link as "paid"
7. Backend returns updated link to frontend
```

**Guards:**
```javascript
// Input validation
if (!amount || !token) {
  return res.status(400).json({ error: "Amount and token required" });
}

if (amount <= 0) {
  return res.status(400).json({ error: "Amount must be positive" });
}

// Idempotency
if (link.paid) {
  return res.status(400).json({ error: "This link has already been paid" });
}

// Commitment validation
if (!commitment) {
  return res.status(500).json({ 
    error: "Deposit succeeded but no commitment returned." 
  });
}
```

### Withdrawal Endpoint (`POST /links/:id/claim`)

**Flow:**
```
1. Client calls endpoint with { recipientWallet }
2. Backend validates JWT (user authenticated)
3. Backend loads link and checks it's been paid
4. Backend validates commitment exists
5. Backend calls PrivacyCash.withdraw() or PrivacyCash.withdrawSPL()
6. Privacy Cash releases funds to recipient
7. Backend marks link as "withdrawn"
8. Backend returns updated link
```

**Guards:**
```javascript
// State validation
if (!link.paid) {
  return res.status(400).json({ 
    error: "Link must be paid before withdrawal" 
  });
}

if (link.status === "withdrawn") {
  return res.status(400).json({ 
    error: "Link already withdrawn" 
  });
}

// Commitment validation
if (!link.commitment) {
  return res.status(500).json({ 
    error: "CRITICAL: Link marked paid but no commitment found" 
  });
}

// Status validation (post-withdrawal)
if (withdrawnLink.status !== "withdrawn") {
  return res.status(500).json({ 
    error: "Withdrawal succeeded but status not updated" 
  });
}
```

---

## State Machine Validation

### Link Lifecycle

```
┌─────────────┐
│   created   │  ← Link metadata initialized
└──────┬──────┘
       │
       │ payViaLink() called
       │ ✓ Commitment received
       ▼
┌─────────────┐
│    paid     │  ← Funds in Privacy Cash pool
└──────┬──────┘
       │
       │ claimLink() called
       │ ✓ Withdrawal succeeds
       ▼
┌─────────────┐
│  withdrawn  │  ← Funds released to recipient
└─────────────┘
```

### Invalid Transitions (Prevented by Guards)

```
created → paid         ✓ ALLOWED (via deposit)
paid    → created      ✗ BLOCKED (cannot restart)
paid    → withdrawn    ✓ ALLOWED (via withdrawal)
withdrawn → created    ✗ BLOCKED (cannot reuse)
withdrawn → paid       ✗ BLOCKED (immutable)
created → withdrawn    ✗ BLOCKED (must pay first)
```

---

## Error Handling Philosophy

### Categorization

**User Errors** (4xx status):
- Invalid input: "Amount must be positive"
- Logic errors: "Link already paid"
- Missing data: "Recipient wallet required"

**System Errors** (5xx status):
- SDK failures: "Deposit to Privacy Cash pool failed"
- State inconsistencies: "Link marked paid but no commitment"
- Unexpected conditions: "This should not happen"

### Error Message Patterns

✅ **Good:**
```
"CRITICAL: Deposit succeeded but no commitment returned. 
This should not happen. Link remains unpaid."
```

✅ **Good:**
```
"Link must be 'paid' to withdraw. Current status: created."
```

✗ **Bad:**
```
"Error"
```

✗ **Bad:**
```
"SDK failed"
```

---

## Testing Hardness

### Unit Tests to Add

```typescript
// payViaLink() Tests
✓ Throws error if amount <= 0
✓ Throws error if link doesn't exist
✓ Throws error if link already paid
✓ Throws error if commitment missing from response
✓ Throws error if status not "paid" after deposit
✓ Successfully deposits and stores commitment

// claimLink() Tests
✓ Throws error if wallet not provided
✓ Throws error if link doesn't exist
✓ Throws error if link not paid
✓ Throws error if commitment missing
✓ Throws error if status not "withdrawn" after withdrawal
✓ Throws error if withdrawnAt not set
✓ Successfully withdraws and marks withdrawn
```

### Integration Tests to Add

```typescript
// Full Workflow Tests
✓ Create → Pay → Claim workflow succeeds
✓ Multiple payments to same link fails (idempotency)
✓ Claim before payment fails
✓ Partial payment doesn't mark link as paid
✓ Concurrent claims race condition handling
```

---

## Deployment Checklist

- [ ] All guards are in place
- [ ] Error messages are privacy-aware
- [ ] No sensitive data in error logs
- [ ] Commitments stored securely
- [ ] JWT tokens have appropriate expiry (24h)
- [ ] Private key usage documented as demo-only
- [ ] CORS properly configured for production domain
- [ ] Rate limiting implemented for API endpoints
- [ ] All tests passing (unit + integration)
- [ ] Build succeeds with zero errors

---

## Future Hardening

### Short Term
1. Add request rate limiting
2. Add request validation middleware
3. Add logging for audit trail
4. Add transaction receipts/proofs

### Medium Term
1. Replace owner withdrawal with on-chain Program
2. Add web3 event listeners for Privacy Cash deposits
3. Add automatic dispute resolution
4. Add refund mechanisms

### Long Term
1. Migrate to fully on-chain metadata (Solana PDAs)
2. Implement governance for protocol upgrades
3. Add multi-sig support for owner operations
4. Add privacy-preserving analytics

---

## References

- [Privacy Cash SDK](https://privacycash.io)
- [State Machine Design Patterns](https://refactoring.guru/design-patterns/state)
- [API Error Handling Best Practices](https://tools.ietf.org/html/rfc7807)
