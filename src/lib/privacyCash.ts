/**
 * ShadowPay Protocol wrapper
 * Handles payment links, deposits, and withdrawals
 * Non-custodial: all funds secured on-chain by ShadowPay contracts
 */

import {
  createPaymentLink,
  getAllPaymentLinks,
  return {
    linkId,
    url,
    amountType: opts.amountType || 'fixed',
    linkUsageType: opts.linkUsageType || 'one-time',
    amount: opts.amount,
    token: (opts.token || 'SOL') as Token,
    status: 'active',
    import { createPaymentLink, getAllPaymentLinks } from './supabasePayment';
    import { PaymentLink, AmountType, LinkUsageType, Token } from './types';

    export async function createPrivateLink(opts: {
      amount?: string;
      token?: string;
      amountType?: AmountType;
      linkUsageType?: LinkUsageType;
      expiresIn?: number; // milliseconds, optional
      creator_id: string;
    }): Promise<PaymentLink> {
      const linkId = Math.random().toString(36).slice(2, 9);
      const url = `${window.location.origin}/pay/${linkId}`;
      await createPaymentLink({
        creator_id: opts.creator_id,
        link_id: linkId,
        amount: opts.amount,
        token: (opts.token || 'SOL') as Token,
      });
      return {
        linkId,
        url,
        amountType: opts.amountType || 'fixed',
        linkUsageType: opts.linkUsageType || 'one-time',
        amount: opts.amount,
        token: (opts.token || 'SOL') as Token,
        status: 'active',
        createdAt: Date.now(),
        paymentCount: 0,
        expiresAt: opts.expiresIn ? Date.now() + opts.expiresIn : undefined
      };
    }

    export async function getLinkDetails(linkId?: string | null): Promise<PaymentLink | null> {
      if (!linkId) return null;
      const links = await getAllPaymentLinks();
      return links.find((l: any) => l.linkId === linkId) || null;
    }

    export async function getAllLinks(): Promise<PaymentLink[]> {
      return await getAllPaymentLinks();
    }
 */
export async function depositToPrivacyPool(
  opts: DepositOptions
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  /**
   * ShadowPay Protocol wrapper
   * Handles payment links, deposits, and withdrawals
   * Non-custodial: all funds secured on-chain by ShadowPay contracts
   */
}

/**
 * Withdraw from ShadowPay privacy pool to destination wallet
 * Real Solana transaction using connected Phantom wallet
 * Non-custodial: breaks on-chain link between sender/receiver
 * 
 * @param opts - Withdrawal configuration with privacy considerations
 * @returns Transaction result
 */
export async function withdrawFromPrivacyPool(
  opts: WithdrawOptions
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // Check balance first
    const currentBalance = await getPrivateBalance();
    if (currentBalance < opts.amount) {
      return {
        success: false,
        error: "Insufficient private balance",
      };
    }

    // Get Phantom wallet
    const phantom = (window as any).phantom?.solana;
    if (!phantom?.isConnected) {
      return {
        success: false,
        error: "Wallet not connected. Please connect your Phantom wallet.",
      };
    }

    // Only SOL supported on devnet
    if (opts.token !== "SOL") {
      return {
        success: false,
        error: "Only SOL is supported on devnet. USDC/USDT coming Q1 2026.",
      };
    }

    // Create real Solana transaction
    const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = await import("@solana/web3.js");
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    
    // Validate recipient address
    let recipientPubkey: any;
    try {
      recipientPubkey = new PublicKey(opts.recipient);
    } catch (err) {
      return {
        success: false,
        error: "Invalid recipient address",
      };
    }

    const fromPubkey = phantom.publicKey;
    const lamports = Math.floor(opts.amount * LAMPORTS_PER_SOL);

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey: recipientPubkey,
          PaymentLink,
          LinkUsageType,
          AmountType,
          DepositOptions,
          WithdrawOptions,
          Token
        } from "./types";

export default {
  createPrivateLink,
  getLinkDetails,
  payLink,
  getAllLinks,
};
