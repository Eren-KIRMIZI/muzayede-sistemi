#!/usr/bin/env bash
# rollback.sh — Deployment rollback script for AuctionHub
# Usage: ./scripts/rollback.sh --target <backend|frontend|all> [--revision <N>]
set -euo pipefail

TARGET="${1:-all}"
REVISION="${REVISION:-}"  # Empty = rollback to previous
NAMESPACE="auctionhub"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

while [[ $# -gt 0 ]]; do
  case $1 in
    --target) TARGET="$2"; shift 2 ;;
    --revision) REVISION="$2"; shift 2 ;;
    --namespace) NAMESPACE="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

check_kubectl() {
  if ! command -v kubectl &>/dev/null; then
    echo -e "${RED}❌ kubectl is not installed${NC}"
    exit 1
  fi
}

rollback_deployment() {
  local name="$1"
  echo -e "${YELLOW}⏪ Rolling back: $name${NC}"

  if [ -n "$REVISION" ]; then
    kubectl rollout undo deployment/"$name" -n "$NAMESPACE" --to-revision="$REVISION"
  else
    kubectl rollout undo deployment/"$name" -n "$NAMESPACE"
  fi

  echo -e "   Waiting for rollback to complete..."
  kubectl rollout status deployment/"$name" -n "$NAMESPACE" --timeout=120s

  local image
  image=$(kubectl get deployment "$name" -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}')
  echo -e "${GREEN}✅ $name rolled back. Running image: $image${NC}"
}

show_history() {
  local name="$1"
  echo "📋 Rollout history for $name:"
  kubectl rollout history deployment/"$name" -n "$NAMESPACE" 2>/dev/null || echo "  (no history available)"
}

check_kubectl

echo "🔄 AuctionHub Rollback — Target: $TARGET"
if [ -n "$REVISION" ]; then
  echo "   Revision: $REVISION"
else
  echo "   Revision: previous (latest - 1)"
fi
echo ""

# Show current history
case "$TARGET" in
  backend) show_history auctionhub-backend ;;
  frontend) show_history auctionhub-frontend ;;
  all)
    show_history auctionhub-backend
    show_history auctionhub-frontend
    ;;
  *) echo -e "${RED}Unknown target: $TARGET (use backend|frontend|all)${NC}"; exit 1 ;;
esac

echo ""
read -rp "Proceed with rollback? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo ""
case "$TARGET" in
  backend)  rollback_deployment auctionhub-backend ;;
  frontend) rollback_deployment auctionhub-frontend ;;
  all)
    rollback_deployment auctionhub-backend
    rollback_deployment auctionhub-frontend
    ;;
esac

echo ""
echo "📊 Current pod status:"
kubectl get pods -n "$NAMESPACE" -l "app in (auctionhub-backend,auctionhub-frontend)"

echo ""
echo -e "${GREEN}✅ Rollback complete.${NC}"
echo "⚠️  Run health check: ./scripts/health-check.sh --env k8s"
