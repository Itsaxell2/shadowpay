/**
 * Core types for ShadowPay payment links and privacy analysis
 */

export type LinkUsageType = "one-time" | "reusable";
export type AmountType = "fixed" | "any";
export type LinkStatus = "active" | "paid" | "expired";
export type Token = "USDC" | "USDT" | "SOL" | "ETH" | "DAI";

/**
 * Payment Link Metadata
 * Stored off-chain (localStorage for now, can migrate to backend DB)
 */
export interface PaymentLink {
  linkId: string;
  url: string;
  amountType: AmountType;
  linkUsageType: LinkUsageType;
  amount?: string; // null if amountType === "any"
  token: Token;
  status: LinkStatus;
  createdAt: number; // timestamp
  paidAt?: number; // timestamp when paid (one-time) or last paid (reusable)
  paymentCount: number; // counter for reusable links
  expiresAt?: number; // optional expiration timestamp
}

/**
 * Privacy withdrawal analysis result
 * Guides user decisions without blocking them
 */
export interface WithdrawalPrivacyAnalysis {
  privacyScore: number; // 0-100, higher = better privacy
  suggestions: PrivacySuggestion[];
  riskLevel: "low" | "medium" | "high"; // derived from privacyScore
}

/**
 * Individual privacy suggestion/warning
 */
export interface PrivacySuggestion {
  level: "warning" | "suggestion" | "info"; // warning = concerning, suggestion = optimization, info = FYI
  title: string;
  description: string;
  action?: string; // optional recommended action
}

/**
 * Withdrawal context for privacy analysis
 */
export interface WithdrawalContext {
  balance: number; // current private balance
  withdrawAmount: number; // amount to withdraw
  timeSinceDeposit: number; // milliseconds since last deposit
  lastWithdrawalTime?: number; // timestamp of previous withdrawal
}

/**
 * ShadowPay transaction options
 */
export interface WithdrawOptions {
  amount: number;
  token: Token;
  recipient: string; // destination wallet (Solana pubkey)
  skipPrivacyCheck?: boolean; // if true, bypass privacy warnings
}

export interface DepositOptions {
  amount: number;
  token: Token;
}
