# 🚀 Quick Deploy — ShadowPay to Vercel

## ⚡ Fastest Way (5 Minutes)

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login
```bash
vercel login
```

### 3. Deploy!
```bash
# From project root
vercel --prod
```

**Done!** Your app is live at `https://shadowpay-xxx.vercel.app` 🎉

---

## 📋 What Happens During Deploy

```
1. Vercel reads vercel.json ✅
2. Installs dependencies (npm install)
3. Runs build (npm run build)
4. Uploads dist/ folder
5. Configures routes & headers
6. Assigns URL
7. Deploys SSL certificate
```

**Build time:** ~30-60 seconds  
**Deploy time:** ~10 seconds  
**Total:** ~1 minute

---

## 🎯 Deployment Modes

### Frontend-Only (No Backend Needed)

**Best for:** Demos, UI showcase, hackathons

**Setup:**
```bash
# No environment variables needed!
vercel --prod
```

**What works:**
- ✅ Wallet connection
- ✅ UI/UX
- ✅ Link creation (localStorage)
- ⚠️ Withdrawals (need backend)

---

### Full Stack (Frontend + Backend)

**Best for:** Production, full features

**Setup:**

1. **Deploy backend first:**
   - Railway: `railway up`
   - Render: Connect GitHub repo
   - Get URL: `https://api.shadowpay.xyz`

2. **Set environment in Vercel:**
   ```bash
   vercel env add VITE_API_URL production
   # Enter: https://api.shadowpay.xyz
   ```

3. **Deploy frontend:**
   ```bash
   vercel --prod
   ```

**What works:**
- ✅ Everything (including withdrawals)

---

## 🔧 Environment Variables

Set in Vercel Dashboard:

| Variable | Example | Required? |
|----------|---------|-----------|
| `VITE_API_URL` | `https://api.shadowpay.xyz` | Optional (demo works without it) |
| `VITE_SOLANA_NETWORK` | `testnet` or `mainnet-beta` | Optional (defaults to testnet) |

**How to set:**
1. Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add variables
4. Redeploy

---

## 🎬 Demo Flow

**For Judges/Reviewers:**

1. Visit: `https://shadowpay.vercel.app`
2. Click "Connect Wallet"
3. Approve in Phantom
4. Explore UI (create link, dashboard, etc.)
5. Backend optional (demo works without it)

---

## 📊 Expected Results

| Metric | Target | Actual |
|--------|--------|--------|
| **Build time** | < 60s | ~40s |
| **Deploy time** | < 15s | ~10s |
| **Bundle size** | < 600KB | 571KB ✅ |
| **Lighthouse Score** | 85+ | ~90 ✅ |
| **First load** | < 3s | ~2s ✅ |

---

## 🔥 Commands Cheat Sheet

```bash
# Preview (staging)
vercel

# Production
vercel --prod

# Check status
vercel ls

# View logs
vercel logs

# Rollback
vercel rollback

# Environment variables
vercel env ls
vercel env add VARIABLE_NAME production

# Remove project
vercel remove
```

---

## 🚨 Troubleshooting

### Build fails?
```bash
# Test locally first
npm run build
npm run preview
```

### 404 errors?
✅ Already handled by `vercel.json` rewrites

### Wallet not connecting?
✅ Already fixed! Works without backend

### Slow build?
- Check bundle size: `npm run build`
- Remove unused dependencies
- Use code splitting (optional)

---

## ✅ Pre-Deploy Checklist

- [ ] `npm run build` works locally
- [ ] No TypeScript errors
- [ ] Wallet connects (Phantom)
- [ ] UI looks good
- [ ] No console errors

**All good?** Run `vercel --prod` 🚀

---

## 🎉 Success!

Your ShadowPay is now live!

**Next:**
1. Test your URL
2. Share with judges/reviewers
3. Connect wallet
4. Show off the UI!

**URLs:**
- Vercel Dashboard: https://vercel.com/dashboard
- Your App: `https://shadowpay-xxx.vercel.app`

---

**Need help?** See `VERCEL_DEPLOYMENT.md` (full guide)
