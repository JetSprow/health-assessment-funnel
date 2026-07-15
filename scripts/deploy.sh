#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/health-assessment-funnel}"
BRANCH="${BRANCH:-main}"

cd "$PROJECT_DIR"
git fetch --prune origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
docker compose --env-file .env.production build --pull
docker compose --env-file .env.production up -d --remove-orphans
docker compose --env-file .env.production ps
