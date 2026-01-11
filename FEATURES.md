# ShadowPay: Advanced Features

This document outlines the advanced privacy-focused features implemented in ShadowPay.

## 1. Payment Link Types

### Two Link Models

**One-Time Links** (`linkUsageType: "one-time"`)
- Can only be paid once
- Status changes to `"paid"` after first payment
- Further payments are rejected
- Useful for: single invoices, one-off transactions

**Reusable Links** (`linkUsageType: "reusable"`)
- Accept multiple payments
- Track `paymentCount` to see how many times paid
- Never expire (unless manually set via `expiresAt`)
- Useful for: donations, tips, recurring requests, bounties

### Amount Flexibility

**Fixed Amount** (`amountType: "fixed"`)
- Sender must pay exact amount specified
- Amount is known during link creation

**Any Amount** (`amountType: "any"`)
- Sender chooses the amount
- Allows payer flexibility
- Receiver sees `amount: null` until payment

### Link Metadata

All links store the following metadata locally (localStorage for demo):

```typescript
interface PaymentLink {
  linkId: string;              // Unique identifier
  url: string;                 // Full shareable URL
  amountType: "fixed" | "any";
  linkUsageType: "one-time" | "reusable";
  amount?: string;             // null if amountType === "any"
  token: Token;                // USDC, USDT, SOL, ETH, DAI
  status: "active" | "paid" | "expired";
  createdAt: number;           // Timestamp
  paidAt?: number;             // Last payment timestamp
  paymentCount: number;        // Counter for reusable links
  expiresAt?: number;          // Optional expiration
}
```

## 2. Privacy Assistant

### Purpose

Provides **real-time, non-blocking guidance** on withdrawal privacy. Helps users make informed decisions without restricting their actions.

### How It Works

The Privacy Assistant analyzes withdrawal requests using heuristics to detect privacy risks:

#### Heuristic 1: Full Balance Withdrawal (30-point penalty)
- **Trigger**: Withdrawing ≥95% of private balance
- **Risk**: Observer can link received amount to withdrawal amount
- **Suggestion**: Keep some funds in pool, split withdrawals

#### Heuristic 2: Immediate Withdrawal (25-point penalty)
- **Trigger**: Withdrawing <1 hour after deposit (configurable)
- **Risk**: Timing analysis can link deposit to withdrawal
- **Suggestion**: Wait at least 1 hour; ideally 1 week for optimal privacy

#### Heuristic 3: Large Amounts (15-point penalty)
- **Trigger**: Withdrawing 75-95% of balance
- **Risk**: Unusual patterns easier to identify
- **Suggestion**: Split into smaller withdrawals over time

#### Heuristic 4: Round Numbers (5-point penalty)
- **Trigger**: Amounts like 1,000, 10,000 (statistically identifiable)
- **Risk**: Round numbers stand out in transaction analysis
- **Suggestion**: Use irregular amounts (e.g., 1,234.56)

#### Heuristic 5: Good Privacy (bonus)
- **Trigger**: User follows best practices (long delay, partial withdrawal, irregular amount)
- **Feedback**: Positive reinforcement

### Privacy Score

- **0-100 scale**: Higher is better
- **Calculated dynamically** as user enters withdrawal amount
- **Labels**:
  - 85+ = Excellent
  - 70-84 = Good
  - 50-69 = Fair
  - 30-49 = Poor
  - <30 = Very Poor

### Risk Levels

- **Low** (score ≥70): Proceed with confidence
- **Medium** (score 40-69): Consider improvements
- **High** (score <40): Follow suggestions for better privacy

### Privacy Score Display

In the Withdraw page, the Privacy Assistant sidebar shows:
- Numeric score (0-100)
- Visual progress bar (color-coded)
- Risk level badge
- Actionable suggestions with icons

## 3. Withdraw UX Integration

### Withdraw Page (`src/pages/Withdraw.tsx`)

**Key Features:**
- Real-time balance display
- Withdraw amount input with presets (25%, 50%, 75%, Max)
- Recipient wallet address input
- Privacy Assistant sidebar showing:
  - Current privacy score (updates as you type)
  - Personalized suggestions
  - Risk assessment
  - Recommended split amounts (for full withdrawals)

**Non-Blocking Design:**
- Privacy suggestions are advisory only
- Users can proceed even with "high risk" score
- Goal: educate, not restrict

**Quick Preset Buttons:**
```
[25%] [50%] [75%] [Max]
```
Allow rapid selection of common withdrawal amounts.

### Visual Feedback

**Privacy Score Bar:**
```
Score: 45/100
████░░░░░░░░░░░░░░ 45%
Status: Medium Risk
```

**Suggestion Cards:**
- ⚠️ Warning (orange) - concerning privacy risks
- ⚡ Suggestion (blue) - optimization opportunities
- ℹ️ Info (cyan) - FYI messages

**Example Suggestions:**
```
⚠️ Large balance withdrawal detected
   Withdrawing nearly 100% of your private balance may make it 
   easier for an observer to link amounts.
   
   💡 Consider keeping some funds in the privacy pool.

⚡ Additional delay recommended
   Waiting longer between deposit and withdrawal strengthens privacy.
   
   💡 Consider waiting 6d 18h more for optimal privacy.

ℹ️ Round number withdrawal
   Withdrawing round amounts (100, 1000, etc.) may be statistically 
   identifiable.
   
   💡 Consider withdrawing 1,234.56 instead of 1,000.
```

**Recommended Split Modal:**
- Available when withdrawing ≥95% of balance
- Suggests splitting into 3 withdrawals with variance
- Shows irregular amounts to reduce pattern analysis
- User can copy amounts to clipboard

## 4. Code Architecture

### File Structure

```
src/lib/
├── types.ts                   # Core TypeScript types
├── privacyCash.ts            # SDK wrapper (deposit/withdraw/links)
├── privacyAssistant.ts       # Heuristic analysis engine
└── utils.ts                  # Utility functions

src/pages/
├── CreateLink.tsx            # Create payment links (one-time/reusable)
├── PayLink.tsx               # Receive/pay links
├── Withdraw.tsx              # Withdraw with privacy guidance
└── ...

src/components/
└── layout/
    └── Header.tsx            # Navigation (includes /withdraw)
```

### Types (`src/lib/types.ts`)

```typescript
// Link metadata
export interface PaymentLink {
  linkId: string;
  amountType: AmountType;
  linkUsageType: LinkUsageType;
  amount?: string;
  token: Token;
  status: LinkStatus;
  createdAt: number;
  paidAt?: number;
  paymentCount: number;
  expiresAt?: number;
}

// Withdrawal analysis
export interface WithdrawalPrivacyAnalysis {
  privacyScore: number;
  suggestions: PrivacySuggestion[];
  riskLevel: "low" | "medium" | "high";
}

export interface WithdrawalContext {
  balance: number;
  withdrawAmount: number;
  timeSinceDeposit: number;
  lastWithdrawalTime?: number;
}
```

### Privacy Service (`src/lib/privacyAssistant.ts`)

**Main Export:**
```typescript
export function analyzeWithdrawalPrivacy(
  context: WithdrawalContext
): WithdrawalPrivacyAnalysis;
```

**Helper Functions:**
```typescript
export function getPrivacyScoreLabel(score: number): string;
export function getRecommendedWithdrawalSplit(
  balance: number,
  desiredAmount: number,
  numSplits?: number
): number[];
```

**Usage Example:**
```typescript
const context: WithdrawalContext = {
  balance: 1000,
  withdrawAmount: 950,
  timeSinceDeposit: 300000, // 5 minutes
};

const analysis = analyzeWithdrawalPrivacy(context);
// => {
//   privacyScore: 40,
//   riskLevel: "medium",
//   suggestions: [
//     { level: "warning", title: "...", description: "..." },
//     { level: "suggestion", title: "...", description: "..." }
//   ]
// }
```

### SDK Wrapper (`src/lib/privacyCash.ts`)

**Link Management:**
```typescript
createPrivateLink(opts: {
  amount?: string;
  token?: string;
  amountType?: AmountType;
  linkUsageType?: LinkUsageType;
  expiresIn?: number;
}): Promise<PaymentLink>;

getLinkDetails(linkId?: string): Promise<PaymentLink | null>;
payLink(linkId?: string): Promise<{ success: boolean }>;
canPayLink(linkId?: string): Promise<boolean>;
```

**Balance & Transactions:**
```typescript
getPrivateBalance(): Promise<number>;
depositToPrivacyPool(opts: DepositOptions): Promise<TxResult>;
withdrawFromPrivacyPool(opts: WithdrawOptions): Promise<TxResult>;
```

## 5. Privacy Philosophy

### Non-Custodial
- All funds secured by **Privacy Cash smart contracts**
- No intermediary holds user keys
- Users control destination wallets

### Heuristic-Based (Not AI)
- Uses simple, understandable rules
- No ML/AI black boxes
- Transparent scoring logic
- Easy to audit and improve

### User-Empowered
- Privacy guidance is **advisory only**
- Users can override suggestions
- Goal is education, not restriction
- Respects user autonomy

### Privacy-First Design
- Wallet addresses never shown in UI
- No on-chain link between sender/receiver
- Deposit → Privacy Pool → Withdraw to any address
- Timing delays and amount variance recommended

## 6. Integration with Privacy Cash SDK

Currently, the service layer uses **mock implementations** for demo. To integrate with the actual Privacy Cash SDK:

### Step 1: Install SDK
```bash
npm install privacycash @solana/web3.js
```

### Step 2: Update `src/lib/privacyCash.ts`

Replace mock implementations with actual SDK calls:

```typescript
import { PrivacyCash } from 'privacycash';
import { PublicKey } from '@solana/web3.js';

const client = new PrivacyCash({
  RPC_url: process.env.VITE_RPC_URL,
  owner: process.env.VITE_PRIVATE_KEY // DO NOT expose in browser!
});

export async function depositToPrivacyPool(
  opts: DepositOptions
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const mintAddress = new PublicKey(TOKEN_MINT[opts.token]);
    const result = await client.depositSPL({
      amount: opts.amount,
      mintAddress
    });
    return { success: true, txHash: result.txHash };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function withdrawFromPrivacyPool(
  opts: WithdrawOptions
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const mintAddress = new PublicKey(TOKEN_MINT[opts.token]);
    const result = await client.withdrawSPL({
      amount: opts.amount,
      mintAddress,
      recipientAddress: opts.recipient
    });
    return { success: true, txHash: result.txHash };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
```

### Step 3: Store Private Key Securely
**⚠️ IMPORTANT:** Never expose private keys in browser code!

For production:
- Keep private key on **backend server**
- Expose withdrawal endpoint that performs validation
- Use JWT/signatures for user authentication
- Consider using **Hardware Wallet** (Ledger) for extra security

## 7. Future Enhancements

- [ ] Database persistence (replace localStorage)
- [ ] User authentication & link ownership
- [ ] Email/SMS notifications on payments
- [ ] QR codes for easy sharing
- [ ] Multi-sig withdrawals for large amounts
- [ ] Advanced privacy metrics (graph analysis)
- [ ] Integration with Solana Devnet/Mainnet
- [ ] Mobile app (React Native)

## 8. Testing Withdraw Flow

Test the privacy assistant with different scenarios:

1. **Optimal Privacy** (score ≈90):
   - Balance: 1000 USDC
   - Withdraw: 100 USDC (10%)
   - Time since deposit: 7 days

2. **Medium Risk** (score ≈50):
   - Balance: 1000 USDC
   - Withdraw: 700 USDC (70%)
   - Time since deposit: 2 hours

3. **High Risk** (score ≈20):
   - Balance: 1000 USDC
   - Withdraw: 990 USDC (99%)
   - Time since deposit: 5 minutes

Navigate to `/withdraw` to test in the app.
