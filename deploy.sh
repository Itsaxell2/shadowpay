#!/bin/bash

# 🚀 ShadowPay Quick Deploy to Vercel
# Run this script to deploy to production

echo "🚀 ShadowPay Vercel Deployment"
echo "================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI not found"
    echo "📦 Installing Vercel CLI..."
    npm i -g vercel
fi

echo "✅ Vercel CLI ready"
echo ""

# Build locally first to catch errors
echo "🔨 Building locally first..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Local build successful"
    echo ""
else
    echo "❌ Build failed! Fix errors before deploying."
    exit 1
fi

# Ask for deployment type
echo "📋 Deployment Options:"
echo "1) Preview (staging)"
echo "2) Production"
echo ""
read -p "Choose deployment type (1 or 2): " deploy_type

case $deploy_type in
    1)
        echo ""
        echo "🚀 Deploying to preview..."
        vercel
        ;;
    2)
        echo ""
        echo "🚀 Deploying to production..."
        vercel --prod
        ;;
    *)
        echo "❌ Invalid choice. Run script again."
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Test your deployment URL"
echo "2. Connect wallet (Phantom)"
echo "3. Verify UI works"
echo "4. Set environment variables in Vercel dashboard (if needed)"
echo ""
echo "🔗 Vercel Dashboard: https://vercel.com/dashboard"
