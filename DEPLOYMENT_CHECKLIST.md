# ✅ Pre-Deployment Checklist

Before deploying to Vercel, verify:

## 🔧 Build & Tests

- [ ] **Local build passes:** `npm run build` (no errors)
- [ ] **TypeScript check:** `tsc --noEmit` (no errors)
- [ ] **Preview works:** `npm run preview` (test at http://localhost:4173)
- [ ] **Console clean:** Open browser DevTools, check for errors

## 🎨 UI/UX

- [ ] **Responsive design:** Test on mobile, tablet, desktop
- [ ] **Wallet connection:** Phantom wallet connects successfully
- [ ] **Navigation:** All pages accessible
- [ ] **Images load:** Logo and assets visible
- [ ] **Animations smooth:** No jank or lag

## 🔐 Security

- [ ] **No secrets committed:** `.env` in `.gitignore`
- [ ] **API keys hidden:** No hardcoded keys in code
- [ ] **HTTPS ready:** App works with `https://`
- [ ] **Headers configured:** Check `vercel.json` security headers

## 🌐 Configuration

- [ ] **vercel.json exists:** Config file in root
- [ ] **.vercelignore exists:** Exclude unnecessary files
- [ ] **Environment variables set:** In Vercel dashboard (if using backend)
- [ ] **Network configured:** `VITE_SOLANA_NETWORK` (testnet or mainnet)

## 📦 Dependencies

- [ ] **No vulnerabilities:** `npm audit` (or fix critical ones)
- [ ] **Lockfile updated:** `package-lock.json` committed
- [ ] **Node version:** 18+ (check `.nvmrc` or `package.json`)

## 🎯 Features

- [ ] **Wallet works without backend:** Test with backend OFF
- [ ] **Create link:** Can create receive links
- [ ] **Pay link:** Payment flow works
- [ ] **Dashboard:** Link list displays
- [ ] **Withdraw:** Works if backend deployed

## 📝 Documentation

- [ ] **README updated:** Deployment URL added
- [ ] **VERCEL_DEPLOYMENT.md:** Guide complete
- [ ] **Environment variables documented:** In README

## 🚀 Ready to Deploy?

If all checked ✅, run:

```bash
# Option 1: Manual deploy
vercel --prod

# Option 2: Use deployment script
./deploy.sh
```

## 🎉 Post-Deployment

After deployment:

- [ ] **Test live URL:** Visit `https://shadowpay-xxx.vercel.app`
- [ ] **Connect wallet:** Test with Phantom
- [ ] **Check console:** No errors in browser DevTools
- [ ] **Test mobile:** Responsive on phone
- [ ] **Share URL:** Send to reviewers/judges

## 🔥 Common Issues

### Build fails on Vercel but works locally?

**Fix:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Wallet not connecting?

**Fix:** Already handled! See `WALLET_CONNECTION_FIX.md`

### 404 on page refresh?

**Fix:** Already handled by `vercel.json` rewrites ✅

### Environment variables not working?

**Fix:**
1. Ensure variable starts with `VITE_`
2. Set in Vercel Dashboard (not in code)
3. Redeploy

---

**All set?** Run `./deploy.sh` or `vercel --prod` 🚀
