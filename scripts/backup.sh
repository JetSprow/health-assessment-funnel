#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/health-assessment-funnel}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/health-assessment}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$BACKUP_DIR"
cd "$PROJECT_DIR"
set -a
source .env.production
set +a

docker compose --env-file .env.production exec -T db \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc \
  > "$BACKUP_DIR/health-assessment-$TIMESTAMP.dump"

find "$BACKUP_DIR" -type f -name 'health-assessment-*.dump' -mtime "+$RETENTION_DAYS" -delete
