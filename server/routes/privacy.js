/**
 * Privacy Cash API Routes
 * 
 * Backend endpoints untuk Privacy Cash operations via relayer.
 * Semua ZK proof generation dan SDK operations di relayer.
 */

import express from 'express';

const router = express.Router();

// Environment
const RELAYER_URL = process.env.RELAYER_URL || 'http://localhost:4444';
const RELAYER_AUTH_SECRET = process.env.RELAYER_AUTH_SECRET;

/**
 * POST /api/privacy/build-deposit
 * Request backend to build unsigned deposit transaction
 * Backend uses Privacy Cash SDK (Node.js only)
 * Returns unsigned transaction for user to sign in browser
 */
router.post('/build-deposit', async (req, res) => {
  try {
    const { amount, walletAddress, linkId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address required'
      });
    }

    const lamports = Math.floor(amount * 1_000_000_000);

    console.log(`🔨 Requesting unsigned deposit transaction from relayer...`);
    console.log(`   Amount: ${amount} SOL`);
    console.log(`   User: ${walletAddress}`);

    // Request relayer to build unsigned transaction
    const relayerResponse = await fetch(`${RELAYER_URL}/build-deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(RELAYER_AUTH_SECRET && {
          'x-relayer-auth': RELAYER_AUTH_SECRET
        })
      },
      body: JSON.stringify({
        lamports,
        userPublicKey: walletAddress,
        linkId,
      })
    });

    if (!relayerResponse.ok) {
      const errorText = await relayerResponse.text();
      let errorMessage = 'Failed to build transaction';
      
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.error || error.message || errorText;
      } catch {
        errorMessage = errorText || `HTTP ${relayerResponse.status}`;
      }
      
      console.error('❌ Relayer error:', errorMessage);
      throw new Error(errorMessage);
    }

    const result = await relayerResponse.json();
    
    console.log(`✅ Unsigned transaction received from relayer`);

    res.json({
      success: true,
      unsignedTransaction: result.unsignedTransaction,
      commitment: result.commitment,
      nullifier: result.nullifier,
    });

  } catch (error) {
    console.error('❌ Build deposit failed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to build transaction'
    });
  }
});

/**
 * POST /api/privacy/submit-deposit
 * Submit user-signed deposit transaction to relayer
 */
router.post('/submit-deposit', async (req, res) => {
  try {
    const { signedTransaction, linkId } = req.body;

    if (!signedTransaction) {
      return res.status(400).json({
        success: false,
        message: 'signedTransaction required'
      });
    }

    console.log(`📡 Submitting signed deposit to relayer...`);

    // Forward signed transaction to relayer
    const relayerResponse = await fetch(`${RELAYER_URL}/submit-deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(RELAYER_AUTH_SECRET && {
          'x-relayer-auth': RELAYER_AUTH_SECRET
        })
      },
      body: JSON.stringify({
        signedTransaction,
        linkId,
      })
    });

    if (!relayerResponse.ok) {
      const errorText = await relayerResponse.text();
      let errorMessage = 'Relayer submission failed';
      
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.error || error.message || errorText;
      } catch {
        errorMessage = errorText || `HTTP ${relayerResponse.status}`;
      }
      
      console.error('❌ Relayer error:', errorMessage);
      throw new Error(errorMessage);
    }

    const result = await relayerResponse.json();
    
    console.log(`✅ Deposit submitted successfully`);
    console.log(`   TX: ${result.tx}`);

    res.json({
      success: true,
      txSignature: result.tx,
      message: 'Deposit successful'
    });

  } catch (error) {
    console.error('❌ Submit deposit failed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Deposit failed'
    });
  }
});

/**
 * POST /api/privacy/withdraw
 * Request withdrawal from Privacy Cash pool via relayer
 */
router.post('/withdraw', async (req, res) => {
  try {
    const { lamports, recipientAddress, commitment, linkId } = req.body;

    if (!lamports || lamports <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    if (!recipientAddress) {
      return res.status(400).json({
        success: false,
        message: 'Recipient address required'
      });
    }

    if (!commitment) {
      return res.status(400).json({
        success: false,
        message: 'Commitment required for withdrawal'
      });
    }

    console.log(`📡 Forwarding withdrawal request to relayer...`);
    console.log(`   Amount: ${lamports / 1e9} SOL`);
    console.log(`   Recipient: ${recipientAddress}`);

    // Call relayer service
    const relayerResponse = await fetch(`${RELAYER_URL}/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(RELAYER_AUTH_SECRET && {
          'x-relayer-auth': RELAYER_AUTH_SECRET
        })
      },
      body: JSON.stringify({
        lamports,
        recipient: recipientAddress,
        commitment,
        linkId,
      })
    });

    if (!relayerResponse.ok) {
      const error = await relayerResponse.json();
      throw new Error(error.error || 'Relayer withdrawal failed');
    }

    const result = await relayerResponse.json();
    
    console.log(`✅ Withdrawal successful via relayer`);
    console.log(`   TX: ${result.tx}`);

    res.json({
      success: true,
      txSignature: result.tx,
      amount: lamports / 1e9,
      recipient: recipientAddress,
      message: 'Withdrawal successful'
    });

  } catch (error) {
    console.error('❌ Withdrawal request failed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Withdrawal failed'
    });
  }
});

export default router;
