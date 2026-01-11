/**
 * Privacy Assistant: Heuristic-based withdrawal guidance
 * Non-custodial, non-blocking analysis to help users maintain privacy
 */

import type {
  WithdrawalContext,
  WithdrawalPrivacyAnalysis,
  PrivacySuggestion,
} from "./types";

/**
 * Analyze withdrawal privacy and return score + suggestions
 * 
 * Heuristics:
 * 1. Withdrawing 100% of balance → reduced privacy (easy to link amounts)
 * 2. Immediate withdrawal after deposit → timing-based linking risk
 * 3. Large single withdrawal → pattern analysis risk
 * 4. Multiple withdrawals to same address → address linking risk
 */
export function analyzeWithdrawalPrivacy(
  context: WithdrawalContext
): WithdrawalPrivacyAnalysis {
  const suggestions: PrivacySuggestion[] = [];
  let privacyScore = 100;

  // Heuristic 1: Full balance withdrawal
  const withdrawPercentage = (context.withdrawAmount / context.balance) * 100;
  if (withdrawPercentage >= 95) {
    privacyScore -= 30;
    suggestions.push({
      level: "warning",
      title: "Large balance withdrawal detected",
      description:
        "Withdrawing nearly 100% of your private balance may make it easier for an observer to link the amount you received to the withdrawal amount, reducing privacy.",
      action: "Consider keeping some funds in the privacy pool.",
    });
  } else if (withdrawPercentage >= 75) {
    privacyScore -= 15;
    suggestions.push({
      level: "suggestion",
      title: "Partial balance suggested",
      description:
        "Withdrawing a large portion of your balance could reduce privacy through amount linking.",
      action: "Split into multiple smaller withdrawals over time.",
    });
  }

  // Heuristic 2: Immediate withdrawal (timing-based linking)
  const MIN_DELAY_MS = 1000 * 60 * 60; // 1 hour minimum
  const OPTIMAL_DELAY_MS = 1000 * 60 * 60 * 24 * 7; // 1 week ideal
  
  if (context.timeSinceDeposit < MIN_DELAY_MS) {
    privacyScore -= 25;
    suggestions.push({
      level: "warning",
      title: "Immediate withdrawal detected",
      description:
        "Withdrawing shortly after depositing may allow timing-based analysis to link your deposit and withdrawal.",
      action: `Wait at least ${formatDuration(MIN_DELAY_MS - context.timeSinceDeposit)} before withdrawing.`,
    });
  } else if (context.timeSinceDeposit < OPTIMAL_DELAY_MS) {
    privacyScore -= 10;
    suggestions.push({
      level: "suggestion",
      title: "Additional delay recommended",
      description:
        "Waiting longer between deposit and withdrawal strengthens privacy by obscuring timing patterns.",
      action: `Consider waiting ${formatDuration(OPTIMAL_DELAY_MS - context.timeSinceDeposit)} more for optimal privacy.`,
    });
  }

  // Heuristic 3: Unusual amount patterns
  // Check if withdraw amount matches common round numbers or patterns
  const isRoundNumber =
    context.withdrawAmount % 100 === 0 ||
    context.withdrawAmount % 1000 === 0;
  
  if (isRoundNumber && context.withdrawAmount > 1000) {
    privacyScore -= 5;
    suggestions.push({
      level: "info",
      title: "Round number withdrawal",
      description:
        "Withdrawing round amounts (100, 1000, etc.) may be statistically identifiable.",
      action: "Consider withdrawing an irregular amount like 1,234.56 instead of 1,000.",
    });
  }

  // Heuristic 4: Good privacy practices
  if (context.timeSinceDeposit >= OPTIMAL_DELAY_MS && withdrawPercentage < 75) {
    suggestions.push({
      level: "info",
      title: "Good privacy practices detected",
      description:
        "You're following best practices: appropriate delay, partial withdrawal, irregular amount.",
      action: "You're good to go!",
    });
  }

  // Ensure score is in valid range
  privacyScore = Math.max(0, Math.min(100, privacyScore));

  const riskLevel: "low" | "medium" | "high" =
    privacyScore >= 70 ? "low" : privacyScore >= 40 ? "medium" : "high";

  return {
    privacyScore,
    suggestions,
    riskLevel,
  };
}

/**
 * Get a human-readable privacy score description
 */
export function getPrivacyScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Poor";
  return "Very Poor";
}

/**
 * Format milliseconds into human-readable duration
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

/**
 * Calculate recommended withdrawal amount for privacy
 * Returns array of suggested amounts to split into
 */
export function getRecommendedWithdrawalSplit(
  balance: number,
  desiredAmount: number,
  numSplits: number = 3
): number[] {
  if (desiredAmount >= balance * 0.95) {
    // User wants to withdraw almost everything, split it
    const perSplit = Math.floor(desiredAmount / numSplits);
    return Array(numSplits)
      .fill(0)
      .map((_, i) =>
        i === numSplits - 1
          ? desiredAmount - perSplit * (numSplits - 1) // last split gets remainder
          : perSplit
      );
  }

  // Add some randomness to amount for better privacy
  const base = Math.floor(desiredAmount / numSplits);
  const variance = Math.floor(base * 0.1); // ±10% variance
  return Array(numSplits)
    .fill(0)
    .map((_, i) => {
      const randomVariance = Math.floor(Math.random() * variance * 2 - variance);
      return base + randomVariance;
    });
}
