module.exports = {
  apps: [
    {
      name: "shadowpay-relayer",
      script: "index.js",
      cwd: "/root/shadowpay/relayer",
      env: {
        NODE_ENV: "production",
        PORT: 4444,
        RELAYER_KEYPAIR_PATH: "/root/shadowpay/relayer/relayer.json",
	SOLANA_RPC_URL: "https://mainnet.helius-rpc.com/?api-key=c455719c-354b-4a44-98d4-27f8a18aa79c"
      }
    }
  ]
}
