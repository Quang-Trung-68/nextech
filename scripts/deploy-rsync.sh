#!/usr/bin/env bash
# =============================================================================
# NexTech — Direct VPS Deployment Script via rsync & SSH
# =============================================================================
set -euo pipefail

VPS_IP="${VPS_IP:-34.142.231.221}"
VPS_USER="${VPS_USER:-trungdang}"
VPS_PATH="${VPS_PATH:-/home/trungdang/nextech}"
GCLOUD_INSTANCE="${GCLOUD_INSTANCE:-instance-20260506-142755}"
GCLOUD_ZONE="${GCLOUD_ZONE:-asia-southeast1-c}"

echo "========================================================"
echo "🚀 Starting NexTech deployment via rsync..."
echo "📍 Target VPS: $VPS_USER@$VPS_IP"
echo "📂 Remote Path: $VPS_PATH"
echo "========================================================"

# --- 1. Rsync directories ---
echo "⏳ Synchronizing source files..."
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='dist' \
  --exclude='.venv' \
  --exclude='__pycache__' \
  --exclude='backend/node_modules' \
  --exclude='backend/.env' \
  --exclude='frontend/node_modules' \
  --exclude='frontend/dist' \
  --exclude='frontend/.env' \
  --exclude='admin/node_modules' \
  --exclude='admin/dist' \
  --exclude='admin/.env' \
  ./ "$VPS_USER@$VPS_IP:$VPS_PATH"

echo "✅ File synchronization complete."
echo "========================================================"

# --- 2. Run remote build and deploy script ---
echo "⚙️  Triggering build & container services on VPS..."
ssh "$VPS_USER@$VPS_IP" "bash $VPS_PATH/scripts/deploy.sh"

echo "========================================================"
echo "🎉 NexTech successfully deployed directly to VPS!"
echo "========================================================"
