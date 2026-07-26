#!/usr/bin/env bash
# health-check.sh — Service health check script for AuctionHub
# Usage: ./scripts/health-check.sh [--env <local|k8s>] [--format <text|json>]
set -euo pipefail

ENV="${MICRO_ENV:-local}"
FORMAT="${FORMAT:-text}"
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

while [[ $# -gt 0 ]]; do
  case $1 in
    --env) ENV="$2"; shift 2 ;;
    --format) FORMAT="$2"; shift 2 ;;
    --backend-url) BACKEND_URL="$2"; shift 2 ;;
    --frontend-url) FRONTEND_URL="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

check_endpoint() {
  local name="$1" url="$2" expected_status="${3:-200}"
  local start_time end_time duration status_code

  start_time=$(date +%s%N)
  status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
  end_time=$(date +%s%N)
  duration=$(( (end_time - start_time) / 1000000 ))

  if [ "$status_code" = "$expected_status" ]; then
    if [ "$FORMAT" = "text" ]; then
      echo -e "${GREEN}✅ $name${NC} — HTTP $status_code (${duration}ms)"
    fi
    echo "OK:$name:$status_code:${duration}ms"
  else
    if [ "$FORMAT" = "text" ]; then
      echo -e "${RED}❌ $name${NC} — HTTP $status_code (expected $expected_status)"
    fi
    echo "FAIL:$name:$status_code"
  fi
}

echo "🩺 AuctionHub Health Check [$ENV]"
echo "=================================="

# Collect results
RESULTS=()

RESULTS+=("$(check_endpoint 'Backend API Health' "$BACKEND_URL/health")")
RESULTS+=("$(check_endpoint 'Backend API Root' "$BACKEND_URL/api/v1")")
RESULTS+=("$(check_endpoint 'Swagger Docs' "$BACKEND_URL/api/docs")")
RESULTS+=("$(check_endpoint 'Prometheus Metrics' "$BACKEND_URL/metrics")")
RESULTS+=("$(check_endpoint 'Frontend' "$FRONTEND_URL")")

if [ "$ENV" = "k8s" ]; then
  echo ""
  echo "🔍 Kubernetes Pod Status:"
  kubectl get pods -n auctionhub -o wide 2>/dev/null || echo "kubectl not configured"
fi

# Summary
FAILS=$(printf '%s\n' "${RESULTS[@]}" | grep -c '^FAIL:' || true)
TOTAL=${#RESULTS[@]}
PASSES=$((TOTAL - FAILS))

echo ""
echo "=================================="
if [ "$FAILS" -eq 0 ]; then
  echo -e "${GREEN}✅ All $TOTAL checks passed${NC}"
  exit 0
else
  echo -e "${RED}❌ $FAILS/$TOTAL checks failed${NC}"
  exit 1
fi
