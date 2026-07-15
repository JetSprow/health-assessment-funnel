[简体中文](../zh-CN/DEMO.md) · **English** · [Documentation Index](README.md)

# Demo and Replay Guide

## Public environment

- Application: <http://82.22.31.80>
- Health probe: <http://82.22.31.80/api/health>
- Deployment date: 2026-07-15

The current acceptance environment uses a temporary HTTP/IP configuration. Use only fictional data. A production launch requires a domain, trusted HTTPS certificate and `COOKIE_SECURE=true`.

## One-command locked-to-full replay

The repository includes a cURL-based replay script. It creates a fresh anonymous identity, saves all seven steps, submits the assessment, prints the locked response, calls `/pay`, and prints the full response:

```bash
./scripts/demo-flow.sh
```

To test another deployment:

```bash
BASE_URL=http://localhost:3000 ./scripts/demo-flow.sh
```

Requirements: Bash, cURL and Python 3. The script uses a temporary Cookie jar and deletes it on exit.

## Prepaid acceptance Session

The following Session contains only fictional test data and was paid through the Mock endpoint on 2026-07-15:

```text
sessionId: 64c41d64-1b86-4be9-b3be-f42a9b456dac
```

This project enforces anonymous-user ownership, so a `sessionId` alone is intentionally insufficient to read a result. The matching credential below is therefore published as a **demo-only test Cookie**, not as a production secret:

```text
health_assessment_session=a6a1178c-4eaa-460f-8223-3fb9a7ff4154.ctKrNuC4Bwtm-SFFiOivPz-0rMbTlzA4pCUhTWoioBA
```

Replay the paid result directly:

```bash
curl --fail-with-body --silent --show-error \
  -H 'Cookie: health_assessment_session=a6a1178c-4eaa-460f-8223-3fb9a7ff4154.ctKrNuC4Bwtm-SFFiOivPz-0rMbTlzA4pCUhTWoioBA' \
  http://82.22.31.80/api/sessions/64c41d64-1b86-4be9-b3be-f42a9b456dac/result \
  | python3 -m json.tool
```

Expected markers:

```json
{
  "data": {
    "access": "FULL",
    "subscriptionStatus": "ACTIVE"
  }
}
```

Use `./scripts/demo-flow.sh` when the same fresh Session must be observed both before and after payment. Use the fixed prepaid Session only for quick verification of the already-unlocked response.

## Mock payment endpoint

The script calls the challenge-compatible route:

```http
POST /pay
```

The namespaced route is also available:

```http
POST /api/pay
```

Both accept:

```json
{
  "sessionId": "uuid",
  "idempotencyKey": "unique-key-at-least-8-characters"
}
```
