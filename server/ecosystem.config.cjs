module.exports = {
  apps: [
    {
      name: "shadowpay-backend",
      script: "index.js",
      cwd: "/root/shadowpay/server",
      node_args: "--enable-source-maps",
      env: {
        NODE_ENV: "production",
        PORT: 3333,
	JWT_SECRET: "0dc1d76d50107a277cfd020aa94e65a42424be88ac708775f10a258ea34f4e86"
      }
    }
  ]
}
