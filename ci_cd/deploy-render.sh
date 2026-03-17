#!/bin/bash
# ============================================================
# ci_cd/deploy-render.sh — Deploy EventHub to Render.com
# ============================================================
# Usage:
#   chmod +x ci_cd/deploy-render.sh
#   RENDER_API_KEY=rnd_xxx RENDER_SERVICE_ID=srv-xxx ./ci_cd/deploy-render.sh
#
# Environment variables:
#   RENDER_API_KEY      — Render API key (from Account > API Keys)
#   RENDER_SERVICE_ID   — The service ID to redeploy (srv-xxx)
#                         Find it in the Render dashboard URL for your service

set -e

API_KEY="${RENDER_API_KEY:?RENDER_API_KEY is required}"
SERVICE_ID="${RENDER_SERVICE_ID:?RENDER_SERVICE_ID is required}"
RENDER_API="https://api.render.com/v1"

echo "🚀 Triggering deploy on Render.com..."
echo "   Service ID: $SERVICE_ID"

RESPONSE=$(curl -s -X POST \
  "${RENDER_API}/services/${SERVICE_ID}/deploys" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"clearCache": "do_not_clear"}')

DEPLOY_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$DEPLOY_ID" ]; then
  echo "❌ Failed to trigger deploy. Response:"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ Deploy triggered! Deploy ID: $DEPLOY_ID"
echo "   Monitor at: https://dashboard.render.com"

# Poll deploy status
echo ""
echo "⏳ Polling deploy status (checking every 15s)..."
for i in $(seq 1 20); do
  sleep 15
  STATUS=$(curl -s \
    "${RENDER_API}/services/${SERVICE_ID}/deploys/${DEPLOY_ID}" \
    -H "Authorization: Bearer ${API_KEY}" \
    | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

  echo "   [Check $i/20] Status: $STATUS"

  if [ "$STATUS" = "live" ]; then
    echo "✅ Deploy successful! Service is live."
    exit 0
  elif [ "$STATUS" = "build_failed" ] || [ "$STATUS" = "update_failed" ]; then
    echo "❌ Deploy failed with status: $STATUS"
    exit 1
  fi
done

echo "⚠️  Deploy polling timed out. Check the dashboard manually."
