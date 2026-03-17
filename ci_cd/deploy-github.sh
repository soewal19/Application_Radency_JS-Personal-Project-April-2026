#!/bin/bash
# ============================================================
# ci_cd/deploy-github.sh — Push latest code to GitHub
# ============================================================
# Usage:
#   chmod +x ci_cd/deploy-github.sh
#   ./ci_cd/deploy-github.sh "Your commit message"
#
# This script:
#   1. Stages all changes
#   2. Commits with the provided message
#   3. Pushes to the main branch on GitHub
#   4. Optionally triggers a Render deploy (if RENDER_API_KEY and RENDER_SERVICE_IDS are set)

set -e

COMMIT_MSG="${1:-"chore: auto deploy"}"

echo "📦 Staging all changes..."
git add -A

echo "💬 Committing: $COMMIT_MSG"
git commit -m "$COMMIT_MSG" || echo "Nothing to commit, skipping..."

echo "⬆️  Pushing to GitHub (main)..."
git push origin main

echo "✅ Code pushed to GitHub successfully!"

# Optionally trigger Render deploys if env vars are set
if [ -n "$RENDER_API_KEY" ] && [ -n "$RENDER_BACKEND_SERVICE_ID" ]; then
  echo ""
  echo "🚀 Triggering backend redeploy on Render..."
  RENDER_SERVICE_ID="$RENDER_BACKEND_SERVICE_ID" \
    "$(dirname "$0")/deploy-render.sh"
fi

if [ -n "$RENDER_API_KEY" ] && [ -n "$RENDER_FRONTEND_SERVICE_ID" ]; then
  echo ""
  echo "🚀 Triggering frontend redeploy on Render..."
  RENDER_SERVICE_ID="$RENDER_FRONTEND_SERVICE_ID" \
    "$(dirname "$0")/deploy-render.sh"
fi
