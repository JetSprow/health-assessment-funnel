# Testing Strategy

## Local quality gate

```bash
npm run db:validate
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --audit-level=high
```

## Vitest coverage

- Deterministic algorithm result and target date.
- Maintain-weight zero-week behavior.
- Zero, NaN and Infinity rejection.
- Goal/target direction validation.
- 260-week projection cap.
- Strict incremental schemas and field boundaries.
- Progress recovery and Decimal serialization.
- Duplicate, stale, out-of-order and concurrent saves.
- Conflicting idempotency-key reuse.
- Completed Session mutation rejection.
- Incomplete submit rejection.
- Locked DTO protected-field leakage prevention.
- Payment idempotency and LOCKED-to-FULL transition.
- Client request-ID generation with and without native `crypto.randomUUID()`.

## Playwright journey

The mobile Chromium test performs:

1. Landing page and Session creation.
2. First three answers.
3. Browser refresh and restored fourth step.
4. Remaining answers and server submission.
5. Locked report assertion.
6. Mock payment and full report assertion.
7. Refresh and persistent full access assertion.
8. Browser console and page error assertion.

## Production release verification

The same mobile Chromium journey is also run against the deployed HTTP/IP environment without starting a local web server. This caught the secure-context limitation of native `crypto.randomUUID()` and now verifies the complete deployed create/save/restore/submit/pay/refresh path.

## CI

The quality job runs static and unit checks. A separate E2E job starts PostgreSQL 16, deploys migrations, installs Chromium and executes the browser journey with one worker.

## Manual release smoke test

- Test from an incognito window.
- Verify mobile and desktop layouts.
- Refresh during the Funnel and after payment.
- Verify direct access to another Session returns 404/unauthorized behavior.
- Confirm PostgreSQL is not reachable from the public network.
- Confirm the production Cookie is HttpOnly, SameSite and Secure when HTTPS is active.
