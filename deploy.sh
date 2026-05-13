#!/bin/bash
# Quick deployment helper for VPS / server use.
# Usage: ./deploy.sh [optional-target-dir]

set -e

TARGET="${1:-/var/www/rqjurists}"

echo "─── RQ Jurists Deploy Helper ───"
echo ""
echo "Step 1: Installing dependencies..."
npm install

echo ""
echo "Step 2: Building production bundle..."
npm run build

echo ""
echo "Step 3: Build complete. Output is in ./dist/"
echo ""
echo "Next steps — choose ONE of the following:"
echo ""
echo "  A) Deploy to Vercel:"
echo "     npx vercel --prod"
echo ""
echo "  B) Deploy to Netlify:"
echo "     npx netlify-cli deploy --prod --dir=dist"
echo ""
echo "  C) Copy to your server (replace user@server):"
echo "     scp -r dist/* user@your-server:$TARGET/"
echo ""
echo "  D) Run as a local server on this machine (port 4173):"
echo "     npm run preview"
echo ""
echo "✓ Build artifacts ready at: $(pwd)/dist/"
ls -lh dist/
