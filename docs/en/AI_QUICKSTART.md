[简体中文](../zh-CN/AI_QUICKSTART.md) · **English** · [Documentation Index](README.md)

# AI-Friendly Quickstart

This document is the shortest reliable path for an AI coding agent to understand, modify and verify this repository without breaking its security or state guarantees.

## 1. Mission

The application is an anonymous health-assessment funnel:

1. Create an anonymous User and Assessment Session.
2. Save seven answers incrementally.
3. Restore progress after interruption.
4. Submit the complete Profile.
5. Calculate and persist a versioned assessment on the server.
6. Return a redacted result before subscription.
7. Activate a Mock subscription through an idempotent payment endpoint.
8. Return the full result after payment.

The algorithm is demonstrative and non-clinical.

## 2. Read these files first

Use this order for most tasks:

1. `AGENTS.md` — framework-specific operating rules.
2. `README.en.md` — product, setup and delivery overview.
3. `prisma/schema.prisma` — authoritative relational model.
4. `src/domain/assessment/assessment.schema.ts` — input contracts.
5. `src/domain/assessment/assessment.algorithm.ts` — calculation rules.
6. `src/domain/assessment/result-access.ts` — locked/full output boundary.
7. `src/server/anonymous-session.ts` — anonymous authentication.
8. Relevant Route Handler under `src/app/api/`.
9. Matching tests under `tests/unit/` and `tests/e2e/`.

For deployment work, also read `compose.yaml`, `Dockerfile`, `deploy/nginx/default.conf` and `docs/en/DEPLOYMENT.md`.

## 3. Stack and version-sensitive rules

- Next.js `16.2.10`, App Router.
- React `19.2.4`.
- TypeScript with strict checking.
- Prisma `7.8.x` with generated Client in `src/generated/prisma/`.
- PostgreSQL 16.
- Zod 4.
- Vitest 4 and Playwright 1.61.

This is not an older Next.js project. Before changing framework behavior, read the relevant local guide under `node_modules/next/dist/docs/`.

Current Next.js rules used by the codebase:

- `cookies()` is asynchronous.
- Dynamic Route Handler `params` are Promises.
- Server code must not assume Pages Router conventions.
- The production image uses Next.js standalone output.

Do not hand-edit `src/generated/prisma/`. Change `prisma/schema.prisma`, generate the Client, and commit migrations when the database shape changes.

## 4. Repository map

```text
src/app/                         Pages, layouts and UI
src/app/api/                     HTTP Route Handlers
src/app/pay/                     Challenge-compatible /pay alias
src/domain/assessment/           Zod contracts, algorithm and DTOs
src/server/                      Auth, Prisma and API response helpers
src/generated/prisma/            Generated Prisma Client; do not hand-edit
prisma/schema.prisma             Authoritative database model
prisma/migrations/               Versioned SQL migrations
tests/unit/                      Domain and Route Handler tests
tests/e2e/                       Mobile UI and real-DB API tests
deploy/nginx/                    Reverse-proxy configuration
scripts/                         Deploy, backup and demo replay scripts
docs/en/                         English documentation
docs/zh-CN/                      Simplified Chinese documentation
```

## 5. Non-negotiable invariants

### Anonymous authentication

- The browser receives `health_assessment_session=<userId>.<rawToken>` in an HttpOnly Cookie.
- PostgreSQL stores only the SHA-256 hash of the raw token.
- Every Session, result and payment operation verifies ownership.
- Never log, persist or return raw production tokens.

### Incremental persistence

- Supported step keys are `gender`, `goal`, `age`, `height`, `weight`, `target-weight` and `activity`.
- Every step payload is strict and rejects extra fields.
- A request carries both `requestId` and optimistic `version`.
- Exact replay must return success with `duplicated: true`.
- Reusing a request ID with another payload must return `409 IDEMPOTENCY_CONFLICT`.
- A stale version must return `409 VERSION_CONFLICT`.
- A completed assessment must reject new mutations.

### Calculation

- Complete data is validated again on submit.
- BMI, calories, target date and projection are calculated only on the server.
- Persist `algorithmVersion` with the result.
- Keep calculation output deterministic when a fixed `now` is supplied.
- Never describe the algorithm as clinically validated.

### Result access

- Do not construct one large result object and delete fields for unpaid users.
- Use separate allow-listed constructors for locked and full DTOs.
- Locked responses must not contain protected values such as calories, target date or projection data.

### Payment

- `/pay` and `/api/pay` must behave identically.
- Payment idempotency keys are globally unique.
- Payment creation and subscription activation must stay transactional.
- Mock payment must never be presented as real billing.

### Database and deployment

- Use migrations for production changes.
- Preserve database CHECK constraints unless the domain rules intentionally change.
- PostgreSQL must not be bound to a public host port.
- The app container runs as a non-root user.
- `COOKIE_SECURE=false` is allowed only for the temporary HTTP/IP demo.

## 6. Local bootstrap

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run dev
```

Typical environment variables:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
COOKIE_SECURE=false
```

Use `COOKIE_SECURE=true` behind trusted HTTPS.

## 7. Quality gate

Run the smallest relevant test during iteration, then the complete gate before delivery:

```bash
npm run db:validate
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --audit-level=high
```

Run Playwright against the public deployment without starting a local server:

```bash
PLAYWRIGHT_BASE_URL=http://82.22.31.80 npm run test:e2e
```

Replay the acceptance flow with cURL:

```bash
./scripts/demo-flow.sh
```

## 8. Task-to-file guide

| Task | Start here | Verify with |
| --- | --- | --- |
| Change a questionnaire field | `assessment.schema.ts`, Prisma Profile, Funnel UI | Schema tests, route tests, E2E |
| Change calculation rules | `assessment.algorithm.ts` | Deterministic and boundary tests |
| Change locked/full access | `result-access.ts`, result Route Handler | Leakage tests, payment/result tests |
| Change save semantics | step Route Handler, `StepEvent`, Session version | Replay/concurrency tests and real-DB E2E |
| Change payment semantics | pay Route Handler, `PaymentEvent`, `Subscription` | Payment idempotency tests and E2E |
| Change database shape | `prisma/schema.prisma`, new migration | `db:validate`, tests, build |
| Change UI journey | Funnel/result components | Mobile Playwright |
| Change deployment | Dockerfile, Compose, Nginx, scripts | Build, health probe, deployment runbook |
| Change public API | Route Handler and `docs/*/API.md` | Contract tests and both language docs |

## 9. Change workflow for an AI agent

1. Restate the requested behavior and identify affected invariants.
2. Read the implementation and its closest tests before editing.
3. Prefer the smallest coherent vertical change.
4. Update validation, persistence, API, UI and documentation together when the contract changes.
5. Add a regression test before or with the fix.
6. Run targeted tests.
7. Run the full quality gate.
8. Check `git diff --check` and inspect the final diff.
9. Update both `docs/en/` and `docs/zh-CN/` editions.
10. Never commit `.env`, credentials, real health data or server passwords.

## 10. Common mistakes to avoid

- Using outdated synchronous Next.js APIs.
- Editing generated Prisma files directly.
- Trusting client-calculated health results.
- Returning protected fields and hiding them only in CSS.
- Treating an idempotency-key replay with a different payload as success.
- Updating a Session without an optimistic version predicate.
- Adding a production Schema change without a migration.
- Running destructive Docker cleanup with `--volumes`.
- Exposing PostgreSQL or committing production secrets.
- Updating only one documentation language.

## 11. Definition of done

A change is complete when:

- The requested behavior works through the real API boundary.
- Security and state invariants still hold.
- Tests cover the happy path and relevant failure modes.
- Prisma validation, lint, typecheck, tests and production build pass.
- E2E passes when the user journey or persistence flow changes.
- English and Chinese documentation are synchronized.
- No secret or personal health data appears in the diff.
