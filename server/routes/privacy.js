/**
 * Privacy Cash API Routes - PARTIAL IMPLEMENTATION
 * 
 * CORRECT ARCHITECTURE (confirmed by Privacy Cash team):
 * 
 * ✅ DEPOSITS (User-signed, non-custodial):
 * - User signs in browser: Use privacyCashClientSigned.ts
 * - Submit to: POST /api/links/:id/pay (not these routes)
 * - Server: Stores metadata only (commitment, status)
 * 
 * ⚠️  WITHDRAWALS (Relayer-signed, for future):
 * - Route exists: POST /api/privacy/withdraw
 * - But currently NOT IMPLEMENTED (relayer needs Privacy Cash SDK)
 * 
 * ❌ DEPRECATED ROUTES (DO NOT USE):
 * - POST /api/privacy/build-deposit
 * - POST /api/privacy/deposit
 * 
 * Reason: Violates non-custodial principle
 */

import express from 'express';

const router = express.Router();

// Deprecated endpoints - return 410 Gone
router.post('/build-deposit', (req, res) => {
  res.status(410).json({
    error: 'Gone - This endpoint is deprecated',
    reason: 'Use frontend Privacy Cash SDK for user-signed deposits',
    architecture: 'User signs in browser → POST /api/links/:id/pay'
  });
});

router.post('/deposit', (req, res) => {
  res.status(410).json({
    error: 'Gone - This endpoint is deprecated',
    reason: 'Relayer deposits violate non-custodial principle',
    migrate: 'Use frontend signing + POST /api/links/:id/pay',
    doc: 'See privacyCashClientSigned.ts'
  });
});

/**
 * POST /api/privacy/withdraw (PLACEHOLDER - NOT IMPLEMENTED)
 * 
 * Future: Relayer-signed withdrawal from Privacy Cash pool
 * This is safe for privacy because relayer doesn't know recipient identity
 * (privacy mixing happens on-chain via Privacy Cash protocol)
 */
router.post('/withdraw', (req, res) => {
  res.status(501).json({
    error: 'Not implemented',
    reason: 'Withdraw requires Privacy Cash SDK integration with relayer',
    status: 'Coming soon',
    workaround: 'For now, users can withdraw using Privacy Cash directly'
  });
});
