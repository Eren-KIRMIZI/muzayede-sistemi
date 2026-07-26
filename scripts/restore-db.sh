#!/usr/bin/env bash
# restore-db.sh — PostgreSQL restore script for AuctionHub
# Usage: ./scripts/restore-db.sh --file <backup.sql.gz> [--env <dev|prod>]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_FILE=""
ENV="${MICRO_ENV:-dev}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --file) BACKUP_FILE="$2"; shift 2 ;;
    --env) ENV="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ --file is required"
  echo "Usage: $0 --file backups/dev_auction_platform_20260726_120000.sql.gz"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Load DATABASE_URL
if [ -f "$SCRIPT_DIR/../apps/backend/.env" ]; then
  source <(grep -E '^DATABASE_URL=' "$SCRIPT_DIR/../apps/backend/.env" | sed 's/export //')
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL is not set"; exit 1
fi

DB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

echo "⚠️  WARNING: This will REPLACE all data in '$DB_NAME' on $DB_HOST"
read -rp "Type 'yes' to confirm: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."; exit 0
fi

echo "📥 Restoring from: $BACKUP_FILE"

# Drop & recreate the schema
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
  "DROP DATABASE IF EXISTS ${DB_NAME}_restore; CREATE DATABASE ${DB_NAME}_restore;"

# Restore into the new DB
zcat "$BACKUP_FILE" | PGPASSWORD="$DB_PASS" psql \
  -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "${DB_NAME}_restore"

# Swap databases
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME';"
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
  "DROP DATABASE IF EXISTS ${DB_NAME}_old; ALTER DATABASE $DB_NAME RENAME TO ${DB_NAME}_old; ALTER DATABASE ${DB_NAME}_restore RENAME TO $DB_NAME;"

echo "✅ Restore complete. Old database kept as: ${DB_NAME}_old"
