# Shadowpay Server (Privacy Cash helper)

This small helper demonstrates using the `privacycash` SDK to perform withdrawals (server-side). It assumes you keep the owner private key on the server (not recommended for production without HSM).

Environment variables (create a `.env` file):

- `RPC_URL` - Solana RPC endpoint (Mainnet or Devnet)
- `PRIVATE_KEY` - Owner private key used by the SDK (string)

Install and run:

```bash
cd server
npm install
npm start
```

Endpoints:

- `POST /withdraw/spl` { mint, amount, recipient }
- `POST /withdraw/sol` { lamports, recipient }

Use these endpoints from a trusted backend to trigger withdrawals through Privacy Cash.
