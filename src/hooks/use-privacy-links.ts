/**
 * React Hook for Privacy Cash Link Management
 * 
 * This hook provides a clean interface to the link payment flow
 * for use in React components.
 */

import { useState, useCallback } from "react";
import {
  PaymentLink,
  createLink as createLinkService,
  payViaLink as payViaLinkService,
  claimLink as claimLinkService,
  getLink,
  validateLinkForClaim,
} from "@/lib/privacyCashLinks";

export function usePrivacyLinks() {
  const [links, setLinks] = useState<Map<string, PaymentLink>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new payment link
   * 
   * The link is created in "created" status with no funds yet.
   */
  const create = useCallback(
    (amount: number, token: string) => {
      try {
        setError(null);
        const link = createLinkService(amount, token);
        setLinks((prev) => new Map(prev).set(link.linkId, link));
        return link;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create link";
        setError(message);
        throw err;
      }
    },
    []
  );

  /**
   * Pay via a link (deposit to Privacy Cash pool)
   * 
   * This deposits funds to the pool and binds the commitment to the link.
   * After this, the link is "paid" and ready to be claimed.
   */
  const pay = useCallback(
    async (linkId: string, amount: number, token: string) => {
      setLoading(true);
      setError(null);
      try {
        const paidLink = await payViaLinkService(linkId, amount, token);
        setLinks((prev) => new Map(prev).set(linkId, paidLink));
        return paidLink;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Payment failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Claim a link (withdraw from Privacy Cash pool)
   * 
   * This withdraws the funds from the pool to the recipient's wallet.
   * The link must be "paid" and must have a commitment.
   */
  const claim = useCallback(
    async (linkId: string, recipientWallet: string) => {
      setLoading(true);
      setError(null);
      try {
        // Validate before attempting claim
        validateLinkForClaim(linkId);

        const claimedLink = await claimLinkService(linkId, recipientWallet);
        setLinks((prev) => new Map(prev).set(linkId, claimedLink));
        return claimedLink;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Claim failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Fetch a link's current status
   */
  const fetchLink = useCallback((linkId: string) => {
    const link = getLink(linkId);
    if (link) {
      setLinks((prev) => new Map(prev).set(linkId, link));
    }
    return link;
  }, []);

  /**
   * Check if a link can be claimed
   */
  const canClaim = useCallback((linkId: string): boolean => {
    try {
      validateLinkForClaim(linkId);
      return true;
    } catch {
      return false;
    }
  }, []);

  /**
   * Get a link from local state
   */
  const getLocalLink = useCallback(
    (linkId: string) => links.get(linkId),
    [links]
  );

  return {
    // State
    links,
    loading,
    error,

    // Operations
    create,
    pay,
    claim,
    fetchLink,
    getLocalLink,
    canClaim,
  };
}
