# ShadowPay + Privacy Cash Integration Guide

## Overview

ShadowPay is a **non-custodial, privacy-first** payment link system that integrates with the Privacy Cash SDK. This document explains the architecture and how it works.

## Key Principle: Links are NOT Wallets

**❌ WRONG:**
```
Link holds funds → User claims → Funds transferred from link
```

**✅ CORRECT:**
```
Link stores commitment → User claims → Funds withdrawn from Privacy Cash pool to recipient
```

A ShadowPay link is **metadata only**. It does not hold, custody, or control funds. Instead:

1. Sender deposits to **Privacy Cash pool** via SDK
2. Pool returns a **commitment** (proof of deposit)
3. Link stores the **commitment** (and nothing else related to funds)
4. Recipient claims link → withdraws from **pool** (not the link)

## Data Flow

### 1. Create Link

```typescript
const link = createLink(1000000, "SOL");
// Returns: { linkId: "abc123...", status: "created", commitment: "" }
// Share this link with whoever should pay you
```

**State:** `created` — Link exists but no funds yet.

---

### 2. Pay Via Link

```typescript
const paidLink = await payViaLink(
  linkId,
  1000000,  // 1 SOL in lamports
  "SOL",
  senderWallet,
  privacyCashClient
);
```

**What happens:**
1. SDK deposits to Privacy Cash pool: `privacyCash.deposit(amount, token)`
2. Pool returns commitment: `{ commitment: "0x123abc..." }`
3. Link is updated:
   ```json
   {
     "linkId": "abc123...",
     "status": "paid",
     "commitment": "0x123abc...",
     "paidAt": 1704067200000
   }
   ```

**State:** `paid` — Link has received payment. Commitment proves it.

**Critical:** Without the commitment, the link is NOT paid.

---

### 3. Claim Link

```typescript
const claimedLink = await claimLink(
  linkId,
  "RecipientWalletAddress",
  privacyCashClient
);
```

**What happens:**
1. Link validation:
   - `status === "paid"` ✓
   - `claimed === false` ✓
   - `commitment` exists ✓
2. SDK withdraws from pool: `privacyCash.withdraw(commitment, recipientAddress)`
3. Pool sends funds **directly** to recipient's wallet
4. Link is updated:
   ```json
   {
     "linkId": "abc123...",
     "status": "claimed",
     "claimed": true,
     "claimedAt": 1704067200001
   }
   ```

**State:** `claimed` — Funds withdrawn. Link is spent.

---

## Privacy Guarantees

### No Wallet Addresses on Link

```typescript
// ❌ BAD - Never do this
const link = {
  senderAddress: "SomeWallet...",  // NO!
  recipientAddress: "OtherWallet...", // NO!
  commitment: "0x123..."
};

// ✅ GOOD - Link is anonymous
const link = {
  commitment: "0x123...",  // Only this matters
  // No wallet addresses
};
```

**Why:** The Privacy Cash pool is anonymous. ShadowPay adds no identifying information.

### No Funds on Link

```typescript
// ❌ BAD - Link never holds funds
link.balance = 1000000;
link.funds = [...];

// ✅ GOOD - Link is just metadata
const link = {
  commitment: "0x123...",  // Proof of deposit in pool
  amount: 1000000,  // Amount reference only
  status: "paid"  // Status flag
};
```

**Why:** ShadowPay is non-custodial. Funds live in Privacy Cash contracts.

---

## Type Definition

```typescript
type PaymentLink = {
  // Identity
  linkId: string;  // Unique identifier

  // Privacy Cash binding
  commitment: string;  // The deposit proof — REQUIRED for "paid"

  // Metadata
  amount: number;  // Amount in smallest unit
  token: string;   // Token type (SOL, USDC, etc.)

  // Lifecycle
  status: "created" | "paid" | "claimed";
  claimed: boolean;

  // Timestamps
  createdAt: number;  // When link was created
  paidAt?: number;    // When deposit happened
  claimedAt?: number; // When withdrawal happened
};
```

---

## Safeguards

### Guard 1: No Claim Without Commitment

```typescript
if (!link.commitment || link.commitment.trim() === "") {
  throw new Error(
    "CRITICAL: Link marked as 'paid' but has no commitment. " +
    "Cannot claim without commitment."
  );
}
```

If a link is marked "paid" but has no commitment, it's a bug. We cannot claim it.

### Guard 2: Status-Based Validation

```typescript
// Can only claim if "paid"
if (link.status !== "paid") {
  throw new Error(`Link must be "paid" to claim. Current: ${link.status}`);
}

// Cannot claim twice
if (link.claimed) {
  throw new Error("Link has already been claimed");
}
```

### Guard 3: Commitment Verification

```typescript
// The commitment is validated by Privacy Cash contracts
// We just need to ensure it exists and use it correctly
const result = await privacyCash.withdraw({
  commitment: link.commitment,  // This is verified by the pool
  recipientAddress: recipientWallet
});
```

---

## Usage Example

### Full Flow in Code

```typescript
import { usePrivacyLinks } from "@/hooks/use-privacy-links";
import { PrivacyCash } from "privacycash";

function PaymentComponent() {
  const privacyCashClient = new PrivacyCash({ ...config });
  const { create, pay, claim, loading, error } = usePrivacyLinks({
    privacyCashClient,
  });

  // 1. CREATE LINK
  const handleCreateLink = () => {
    const link = create(1000000, "SOL");
    console.log(`Share this link ID: ${link.linkId}`);
  };

  // 2. PAY VIA LINK
  const handlePayViaLink = async (linkId: string, senderWallet: any) => {
    try {
      const paidLink = await pay(linkId, 1000000, "SOL", senderWallet);
      console.log(`Paid! Commitment: ${paidLink.commitment}`);
    } catch (err) {
      console.error("Payment failed:", err);
    }
  };

  // 3. CLAIM LINK
  const handleClaimLink = async (linkId: string, recipientWallet: string) => {
    try {
      const claimedLink = await claim(linkId, recipientWallet);
      console.log(`Claimed! Funds sent to ${recipientWallet}`);
    } catch (err) {
      console.error("Claim failed:", err);
    }
  };

  return (
    <div>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <button onClick={handleCreateLink}>Create Link</button>
      <button onClick={() => handlePayViaLink("linkId", wallet)}>
        {loading ? "Processing..." : "Pay"}
      </button>
      <button onClick={() => handleClaimLink("linkId", recipientWallet)}>
        Claim
      </button>
    </div>
  );
}
```

---

## Integration with Existing Code

### In CreateLink.tsx

```typescript
// Instead of:
// const res = await fetch(`${apiUrl}/links`, { ... });

// Use:
import { usePrivacyLinks } from "@/hooks/use-privacy-links";

function CreateLink() {
  const { create } = usePrivacyLinks({ privacyCashClient });

  const handleCreate = () => {
    const link = create(amount, token);
    // Link is created locally
    // Share link.linkId with others
  };
}
```

### In PayLink.tsx

```typescript
// Instead of simulating payment, call Privacy Cash:
import { usePrivacyLinks } from "@/hooks/use-privacy-links";

function PayLink() {
  const { pay } = usePrivacyLinks({ privacyCashClient });

  const handlePay = async () => {
    const paidLink = await pay(linkId, amount, token, wallet);
    // Funds are now in Privacy Cash pool
    // Commitment is stored on the link
  };
}
```

### In Withdraw.tsx / Claim Flow

```typescript
// Instead of direct withdrawal:
import { usePrivacyLinks } from "@/hooks/use-privacy-links";

function ClaimLink() {
  const { claim } = usePrivacyLinks({ privacyCashClient });

  const handleClaim = async () => {
    const claimedLink = await claim(linkId, recipientWallet);
    // Funds withdrawn from Privacy Cash pool
    // Sent to recipientWallet
  };
}
```

---

## Database Schema (if using persistent storage)

If you migrate from in-memory to a database, use this schema:

```sql
CREATE TABLE payment_links (
  linkId VARCHAR(255) PRIMARY KEY,
  commitment VARCHAR(255) NOT NULL,  -- Required for paid links
  amount BIGINT NOT NULL,
  token VARCHAR(50) NOT NULL,
  status ENUM('created', 'paid', 'claimed') DEFAULT 'created',
  claimed BOOLEAN DEFAULT FALSE,
  createdAt BIGINT NOT NULL,
  paidAt BIGINT,
  claimedAt BIGINT,
  CHECK (status = 'created' OR commitment IS NOT NULL)  -- Safeguard
);
```

---

## Why This Design?

| Aspect | Benefit |
|--------|---------|
| **Non-Custodial** | ShadowPay never holds funds. All funds in Privacy Cash contracts. |
| **Privacy** | No wallet addresses stored. Commitment is opaque. |
| **Scalable** | Links are just metadata. Infinite links, same pool. |
| **Auditable** | All funds on-chain in Privacy Cash. Complete transparency. |
| **Composable** | Works with any Privacy Cash pool. No lock-in. |

---

## Testing

```typescript
import { 
  createLink, 
  payViaLink, 
  claimLink, 
  getLink 
} from "@/lib/privacyCashLinks";

// Test 1: Create link
const link = createLink(1000000, "SOL");
expect(link.status).toBe("created");

// Test 2: Pay via link
const paidLink = await payViaLink(link.linkId, 1000000, "SOL", wallet, client);
expect(paidLink.status).toBe("paid");
expect(paidLink.commitment).not.toBeEmpty();

// Test 3: Claim link
const claimedLink = await claimLink(link.linkId, recipientWallet, client);
expect(claimedLink.status).toBe("claimed");

// Test 4: Cannot claim twice
await expect(claimLink(link.linkId, wallet2, client))
  .rejects.toThrow("already been claimed");

// Test 5: Commitment is required
const badLink = createLink(1000000, "SOL");
await expect(claimLink(badLink.linkId, recipientWallet, client))
  .rejects.toThrow("no commitment");
```

---

## Summary

1. **Links are metadata only** — They store commitments, not funds
2. **Commitments come from Privacy Cash** — Returned by `deposit()`
3. **Claiming uses commitments** — Privacy Cash validates and sends funds
4. **Non-custodial** — ShadowPay never touches funds
5. **Private** — No wallet addresses stored
6. **Auditable** — All transactions on-chain in Privacy Cash
