#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://82.22.31.80}"
WORK_DIR="$(mktemp -d)"
COOKIE_JAR="$WORK_DIR/cookies.txt"
trap 'rm -rf "$WORK_DIR"' EXIT

json_value() {
  local expression="$1"
  python3 -c "import json,sys; print($expression)"
}

api() {
  curl --fail-with-body --silent --show-error \
    -b "$COOKIE_JAR" -c "$COOKIE_JAR" "$@"
}

CREATE_RESPONSE="$(api -X POST "$BASE_URL/api/sessions")"
SESSION_ID="$(printf '%s' "$CREATE_RESPONSE" | json_value "json.load(sys.stdin)['data']['sessionId']")"
VERSION=0

echo "Created session: $SESSION_ID"

save_step() {
  local step_key="$1"
  local request_id="$2"
  local data_json="$3"
  local response

  response="$(api \
    -H 'Content-Type: application/json' \
    -X PATCH \
    "$BASE_URL/api/sessions/$SESSION_ID/steps/$step_key" \
    --data "{\"requestId\":\"$request_id\",\"version\":$VERSION,\"data\":$data_json}")"
  VERSION="$(printf '%s' "$response" | json_value "json.load(sys.stdin)['data']['version']")"
  printf 'Saved %-13s version=%s\n' "$step_key" "$VERSION"
}

RUN_ID="$(date +%s)-$$"
save_step gender "demo-gender-$RUN_ID" '{"gender":"FEMALE"}'
save_step goal "demo-goal-$RUN_ID" '{"goal":"LOSE_WEIGHT"}'
save_step age "demo-age-$RUN_ID" '{"age":32}'
save_step height "demo-height-$RUN_ID" '{"heightCm":165}'
save_step weight "demo-weight-$RUN_ID" '{"weightKg":72}'
save_step target-weight "demo-target-$RUN_ID" '{"targetWeightKg":62}'
save_step activity "demo-activity-$RUN_ID" '{"activityLevel":"MODERATE"}'

api \
  -H 'Content-Type: application/json' \
  -X POST \
  "$BASE_URL/api/sessions/$SESSION_ID/submit" \
  --data "{\"version\":$VERSION}" >/dev/null

echo
echo "Locked result:"
api "$BASE_URL/api/sessions/$SESSION_ID/result" | python3 -m json.tool

api \
  -H 'Content-Type: application/json' \
  -X POST \
  "$BASE_URL/pay" \
  --data "{\"sessionId\":\"$SESSION_ID\",\"idempotencyKey\":\"demo-payment-$RUN_ID\"}" >/dev/null

echo
echo "Full result after mock payment:"
api "$BASE_URL/api/sessions/$SESSION_ID/result" | python3 -m json.tool
