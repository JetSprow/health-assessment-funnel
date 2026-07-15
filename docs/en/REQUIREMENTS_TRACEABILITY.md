[简体中文](../zh-CN/REQUIREMENTS_TRACEABILITY.md) · **English** · [Documentation Index](README.md)

# Challenge Requirements Traceability Matrix

Baseline brief: `【睿迄科技】全栈开发 3 天挑战` (last modified June 9, 2026 at 19:06).

Status definitions:

- `Complete`: verifiable evidence exists in the repository, automated tests or public environment.
- `Manual submission`: engineering material is ready, but the candidate must personally complete external delivery or identity fields.

## Core product and engineering requirements

| Requirement | Implementation | Test / evidence | Status |
| --- | --- | --- | --- |
| Gender, goal, age, height, weight, target weight and activity | Seven-step Funnel, strict step schemas and incrementally nullable `AssessmentProfile` | Schema tests and Playwright journey | Complete |
| Incremental save after every step | `PATCH /api/sessions/{sessionId}/steps/{stepKey}` | Route tests and real-PostgreSQL Playwright API tests | Complete |
| Resume interrupted progress | `GET /api/sessions/{sessionId}/progress` returns Profile, step and version | Progress tests and browser refresh recovery | Complete |
| Random UserID / Session identity | Anonymous User and 30-day HttpOnly Cookie; only token SHA-256 hash in DB | Session creation, ownership checks and cross-Session rejection | Complete |
| Server-side BMI | `calculateAssessment()` | Deterministic and boundary tests | Complete |
| Server-side calorie guidance | Mifflin-St Jeor baseline, activity factor, goal adjustment and bounds | Algorithm tests | Complete |
| Server-side target date | Weekly loss/gain projection, target date and 260-week cap | Normal, maintain and capped tests | Complete |
| Persisted result linked to user record | One-to-one Result/Session, Session owned by User | Prisma schema, migration and submit transaction | Complete |
| Validate `subscription_status` | Active Subscription and expiry checked for the User | Result route and payment-transition tests | Complete |
| Redacted non-member response | Explicit `PublicAssessmentResultDto` independent of client permission | Protected-field leakage tests | Complete |
| Full member response | `FullAssessmentResultDto` adds calories, date, curve and algorithm version | Route tests and paid Playwright page | Complete |
| `/pay` Mock callback | `POST /pay` and `POST /api/pay`, transactional payment and activation | Idempotency, conflict and LOCKED-to-FULL tests | Complete |
| Professional API methods and contracts | REST-style Session resources and consistent `data/error/meta.requestId` envelope | [API Contract](API.md) and handlers | Complete |
| Stable, extensible database model | Seven relational entities, indexes, unique constraints and CHECK constraints | Mermaid ER diagram, Prisma schema and migrations | Complete |
| State consistency | Optimistic version, request idempotency, transactions and completed-state rejection | Replay, stale, conflict, concurrent and completed tests | Complete |
| TypeScript Node.js backend | Next.js App Router Route Handlers with TypeScript | Typecheck and production build | Complete |
| Prisma and PostgreSQL | Prisma 7 and PostgreSQL 16 | Schema validation, migrations, CI E2E and live DB probe | Complete |
| Product-quality frontend | Mobile-first landing, seven-step rhythm, recovery feedback, result visualization and unlock CTA | Mobile Playwright and public demo | Complete |
| Public full demo | Dedicated-server Nginx + Next.js + PostgreSQL | <http://82.22.31.80>, health probe and production Playwright | Complete |

## Testing and quality requirements

| Requirement | Implementation / evidence | Status |
| --- | --- | --- |
| Algorithm extremes, missing and invalid age/height/weight | Table-driven missing, bounds, non-integer, NaN, Infinity and zero-height tests | Complete |
| Unreasonable target weight | Loss, gain and maintain direction validation and tests | Complete |
| Interrupted save and restore | Playwright fills three steps, refreshes and restores the fourth | Complete |
| Out-of-order submission | Out-of-order writes allowed while preserving highest progress; unit and real-DB tests | Complete |
| Duplicate submission | Same key/payload replays; different payload conflicts | Complete |
| Concurrent updates | Only one request with the same version succeeds | Complete |
| Locked versus full result | Explicit DTO leakage tests | Complete |
| State change after `/pay` | Route and Playwright LOCKED → FULL → refresh persistence | Complete |
| Reject invalid values and injection-shaped input | Strict Zod finite/bounds checks plus database CHECK constraints | Complete |
| One-command test | `npm test`; full gate in [Testing Strategy](TESTING.md) | Complete |
| Automated CI | GitHub Actions Quality and PostgreSQL/Playwright E2E jobs | Complete |
| README explains coverage and omissions | Test sections in both language README files | Complete |

## Deliverables

| Requirement | Deliverable / evidence | Status |
| --- | --- | --- |
| Public URL | <http://82.22.31.80> | Complete |
| Replayable `/pay` cURL/Postman flow | `scripts/demo-flow.sh` and [Demo Guide](DEMO.md) | Complete |
| Paid test sessionId | `64c41d64-1b86-4be9-b3be-f42a9b456dac`; demo Cookie in [Demo Guide](DEMO.md) | Complete |
| GitHub link | <https://github.com/JetSprow/health-assessment-funnel> | Complete |
| Setup and API documentation | `README.en.md` and [API Contract](API.md) | Complete |
| Tests, commands and coverage | `tests/`, README and [Testing Strategy](TESTING.md) | Complete |
| Database schema diagram | README Mermaid ER diagram and [Architecture](ARCHITECTURE.md) | Complete |
| AI-use retrospective | [AI Retrospective](AI_RETROSPECTIVE.md), including modeling, Mock data, logic, boundary tests and a rejected proposal | Complete |
| Email to the three specified recipients | Recipients, body and naming rule in [Submission Checklist](SUBMISSION.md); candidate must send it | Manual submission |
| Document name `【姓名】_全栈挑战_YYYYMMDD` | Template in [Submission Checklist](SUBMISSION.md); candidate's real name is not available | Manual submission |

## Strict conclusion

As of July 15, 2026, the engineering implementation, automated tests, GitHub repository, documentation and public demo requirements are complete. The only reason not to claim every external action is 100% complete is that the candidate must personally send the email and enter their legal/real name.

The current public environment also has a production-readiness limitation that does not block challenge acceptance: it uses HTTP/IP with `COOKIE_SECURE=false`. It must use a domain, HTTPS and `COOKIE_SECURE=true` before accepting anything other than fictional data.
