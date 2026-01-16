// Test if Privacy Cash SDK supports "deposit for another user"
// Relayer pays fees, user owns UTXO

import { PrivacyCash } from 'privacycash';
import { Keypair } from '@solana/web3.js';

console.log("Testing Privacy Cash ownership model...\n");

// Can we initialize SDK with relayer Keypair
// but specify user PublicKey as beneficiary?

const sdk = new PrivacyCash({
  RPC_url: 'https://api.mainnet-beta.solana.com',
  owner: Keypair.generate(), // Relayer keypair
  enableDebug: true
});

console.log("SDK initialized with relayer Keypair");
console.log("Checking deposit() method signature...");

// Check if deposit() accepts a beneficiary parameter
console.log(typeof sdk.deposit);
console.log(sdk.deposit.toString().substring(0, 200));

