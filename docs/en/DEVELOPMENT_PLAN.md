[简体中文](../zh-CN/DEVELOPMENT_PLAN.md) · **English** · [Documentation Index](README.md)

# Health Assessment Funnel Development Plan

> Status baseline: July 15, 2026. The challenge implementation and public deployment are complete. This plan separates completed milestones, the current runtime state and the remaining production-hardening backlog.

## 1. Goal and acceptance criteria

Deliver a publicly verifiable full-stack application within the three-day challenge scope:

- Anonymous entry without registration.
- Seven incrementally persisted steps with refresh recovery.
- Server-only calculation and persisted results.
- Strict allow-listed redaction for unsubscribed users.
- Idempotent Mock payment with persisted subscription activation.
- Defined duplicate, out-of-order, stale-version and concurrent-request behavior.
- Complete automated tests, CI, database diagram, deployment guide and replay path.

## 2. Completed challenge milestones

### M0: Engineering baseline — complete

- Next.js 16, React 19, TypeScript and Tailwind CSS 4.
- ESLint, Vitest, Playwright and GitHub Actions.
- Prisma 7, PostgreSQL Adapter and Zod.
- Lint, typecheck, test, build and database commands.

### M1: Data model and anonymous identity — complete

- `User`, `AssessmentSession`, `AssessmentProfile`, `AssessmentResult`, `Subscription`, `PaymentEvent` and `StepEvent`.
- Raw anonymous token only in an HttpOnly Cookie; PostgreSQL stores only its SHA-256 hash.
- Session creation, ownership authorization, migrations and database CHECK constraints.

### M2: Incremental save and recovery — complete

- Strict Zod schemas for all seven steps.
- Request idempotency through `requestId` and optimistic locking through Session `version`.
- Tested replay, conflicting-key, stale-version, out-of-order and concurrent-write semantics.
- Progress API returns a JSON-safe Profile, current step and version.
- Browser restoration and 409 state resynchronization.

### M3: Server calculation and submission — complete

- Full Profile validation is repeated on submit.
- Server-side BMI, category, demonstrative calorie target, target date and capped 260-week projection.
- Persisted algorithm version, calculation time and projection cap flag.
- Result upsert and Session completion in one transaction.

### M4: Result access and payment — complete

- Separate allow-listed `createPublicResultDto` and `createFullResultDto` serializers.
- Equivalent `/api/pay` and `/pay` Mock payment routes.
- Transactional Payment Event and Subscription activation with globally unique payment keys.
- `LOCKED` before payment and persistent `FULL` access after payment.

### M5: Product UI — complete

- Mobile-first landing page and seven-step one-question Funnel.
- Progress, save feedback, back editing, error retries and disabled/loading states.
- Locked report, full report, SVG projection and Mock-payment CTA.
- Explicit non-medical disclaimer.

### M6: Quality and delivery — complete

- Vitest coverage for algorithms, schemas, recovery, idempotency, locking, concurrency, redaction and payment.
- Playwright coverage for create, answer, refresh, submit, pay and persistent access.
- PostgreSQL 16-backed Quality and E2E GitHub Actions jobs.
- Docker Compose, Nginx, migrations, backup, deploy and demo scripts.
- Simplified Chinese, English and AI-friendly GitHub documentation.

## 3. Current deployment state

- Public demo: <http://82.22.31.80>
- Health probe: <http://82.22.31.80/api/health>
- GitHub source branch: `main`
- Server directory: `/opt/health-assessment-funnel`
- Runtime: Nginx + Next.js standalone + Prisma migration + PostgreSQL 16.
- Temporary HTTP/IP mode with `COOKIE_SECURE=false`; fictional test data only.

Release gate:

```bash
npm run db:validate
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --audit-level=high
```

## 4. Production-hardening backlog

These items do not block the challenge acceptance environment, but are mandatory before real user data or a public campaign.

### P0: Domain, HTTPS and access security

1. Configure a production domain and trusted TLS certificate.
2. Enforce HTTP-to-HTTPS redirects.
3. Set `COOKIE_SECURE=true` and verify Cookie attributes.
4. Disable root password login after SSH-key access is confirmed, and rotate the shared password.
5. Add rate limiting, edge/WAF protection and security-event monitoring.

### P1: Privacy, compliance and product responsibility

1. Add privacy policy, consent, retention and deletion workflows.
2. Review applicable health-data and privacy laws.
3. Obtain professional review for health copy and algorithm claims; preserve the non-medical positioning.
4. Keep real health information out of logs, issues, demo data and fixtures.

### P1: Reliability and operations

1. Copy backups off-host and run scheduled restore drills.
2. Add centralized logs, uptime monitoring and alerts.
3. Alert on database capacity, disk usage and certificate expiry.
4. Formalize migration rollback, disaster recovery and incident response.
5. If real billing is added, replace Mock payment and implement signature verification, reconciliation and refunds.

## 5. Main risks

| Risk | Current control | Follow-up |
| --- | --- | --- |
| Protected-result leakage | Separate allow-listed DTOs and leakage tests | Keep contract regression tests |
| Multi-tab silent overwrite | Optimistic versioning and 409 recovery | Preserve real-DB concurrency tests |
| Duplicate retry/write/payment | Payload hashes and idempotent events | Monitor conflicts and abnormal replays |
| Health output mistaken for medical advice | UI and documentation disclaimers | Professional and legal review |
| HTTP/IP Cookie limitations | Fictional data only | Domain, TLS and Secure Cookie |
| Single-server failure | Local backup script | Off-host backup, restore drill and alerting |

## 6. Definition of Done

Challenge delivery is complete when:

- The main flow works through real API and browser boundaries.
- Security, access, idempotency and concurrency guarantees have automated evidence.
- Prisma validation, lint, typecheck, tests, build and E2E pass.
- GitHub, CI, public demo, health probe and replay script are available.
- Chinese and English README files, full docs and AI Quickstart stay synchronized.
- No production secrets or real health data are committed.

The candidate must still perform the external identity actions: enter their real name and send the material described in the [Submission Checklist](SUBMISSION.md).
