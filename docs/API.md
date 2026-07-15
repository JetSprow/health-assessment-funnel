# API Contract

All successful responses use:

```json
{
  "data": {},
  "meta": { "requestId": "uuid" }
}
```

Errors use:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  },
  "meta": { "requestId": "uuid" }
}
```

## Authentication

`POST /api/sessions` sets the `health_assessment_session` HttpOnly Cookie. All Session, result and payment operations authenticate this Cookie and verify resource ownership.

## Endpoints

### `GET /api/health`

Runtime and database readiness probe.

### `POST /api/sessions`

Creates an anonymous User and Assessment Session.

Status: `201 Created`.

### `GET /api/sessions/{sessionId}/progress`

Restores Profile, current step and optimistic version.

Possible status codes: `200`, `400`, `401`, `404`, `500`, `503`.

### `PATCH /api/sessions/{sessionId}/steps/{stepKey}`

```json
{
  "requestId": "gender-unique-request-id",
  "version": 0,
  "data": { "gender": "FEMALE" }
}
```

Step keys and payloads:

| Key | Payload |
| --- | --- |
| `gender` | `{ "gender": "MALE" \| "FEMALE" }` |
| `goal` | `{ "goal": "LOSE_WEIGHT" \| "GAIN_WEIGHT" \| "MAINTAIN_WEIGHT" }` |
| `age` | `{ "age": 18..80 }` |
| `height` | `{ "heightCm": 120..230 }` |
| `weight` | `{ "weightKg": 35..300 }` |
| `target-weight` | `{ "targetWeightKg": 35..300 }` |
| `activity` | `{ "activityLevel": "SEDENTARY" \| "LIGHT" \| "MODERATE" \| "ACTIVE" \| "VERY_ACTIVE" }` |

Conflict behavior:

- Exact request replay: `200`, `duplicated: true`.
- Same request ID with a different payload: `409 IDEMPOTENCY_CONFLICT`.
- Stale version: `409 VERSION_CONFLICT`.
- New answer after completion: `409 ASSESSMENT_COMPLETED`.

### `POST /api/sessions/{sessionId}/submit`

```json
{ "version": 7 }
```

Validates the complete persisted Profile and stores the versioned calculation in one transaction.

Possible status codes include `422 INCOMPLETE_ASSESSMENT` and `409 VERSION_CONFLICT`.

### `GET /api/sessions/{sessionId}/result`

Locked response:

```json
{
  "access": "LOCKED",
  "subscriptionStatus": "INACTIVE",
  "summary": { "bmi": 25.71, "category": "OVERWEIGHT" },
  "lockedSections": ["recommendedCalories", "targetDate", "projectionCurve"]
}
```

Full response adds the calorie target, target date, projection curve, cap flag, algorithm version and calculation timestamp.

### `POST /api/pay` and `POST /pay`

```json
{
  "sessionId": "uuid",
  "idempotencyKey": "payment-demo-001"
}
```

The same key and Session return the original successful Payment Event. Reusing the key for another Session returns `409 IDEMPOTENCY_CONFLICT`.
