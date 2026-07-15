[简体中文](../zh-CN/AI_RETROSPECTIVE.md) · **English** · [Documentation Index](README.md)

# AI-Assisted Development Retrospective

## Scope

AI assistance was used to convert a challenge brief into an executable plan, scaffold the repository, implement vertical slices, inspect framework-specific documentation, generate tests, run commands and iterate on failures.

## High-value uses

1. **Requirement decomposition**: translated product requirements into persistence, algorithm, access-control, payment and proof slices.
2. **Framework adaptation**: checked Next.js 16 documentation before using asynchronous `cookies()` and Promise-based dynamic route params.
3. **Schema design**: connected idempotency, optimistic locking and result auditability to concrete relational constraints.
4. **Test generation**: created boundary, concurrency, redaction and browser tests rather than relying only on the happy path.
5. **Fast feedback**: repeatedly ran Lint, TypeScript, Vitest, Build, API smoke tests and Playwright.

## Human judgment retained

- Selecting a modular monolith instead of unnecessary services.
- Treating public result serialization as an allow-list problem.
- Keeping the algorithm explicitly non-medical.
- Choosing server-side persistence and computation as trust boundaries.
- Rejecting deployment shortcuts that would expose PostgreSQL publicly.

## Errors found and corrected

- An initial browser script clicked the next numeric input before the UI transition completed; explicit question assertions made the E2E deterministic.
- Playwright initially used `127.0.0.1` against a dev server opened as `localhost`, causing Next.js development-origin blocking; the base URL was aligned.
- A first leakage assertion treated locked-section names as leaked values; tests were corrected to inspect object keys and protected result values separately.
- Step replay initially accepted the same idempotency key with a different payload; payload hashes and conflict handling were added.
- Completed Sessions initially allowed new step mutations; the API now rejects them.
- The first Docker dependency layer ran `npm ci` before copying the Prisma schema, so the `postinstall` generation hook failed; dependency installation now skips lifecycle scripts and the builder runs Prisma generation only after the full source is present.
- Skipping dependency lifecycle scripts also left the migration image without a cached Prisma schema engine, making startup depend on a runtime download; the migrator now generates during image build so releases do not require that download when migrations run.
- Production smoke testing over a temporary plain-HTTP IP exposed that `crypto.randomUUID()` is restricted to secure browser contexts; client idempotency IDs now use a Web Crypto UUID fallback that also works before HTTPS is configured.

## Limitations and review requirements

AI-generated implementation still requires human review for privacy law, medical claims, production payment, backup restoration and infrastructure security. Passing tests demonstrate the specified behavior, not clinical or regulatory correctness.

## Estimated impact

The largest productivity gain came from maintaining a short feedback loop across product, API, database and browser layers. The most important quality gain came from using AI to enumerate failure modes, then proving them with automated tests instead of accepting generated code at face value.

## Challenge-requested examples

### Database modeling and Mock data

AI was used to enumerate candidate entities and failure modes, then the final model was narrowed to `User`, `AssessmentSession`, `AssessmentProfile`, `AssessmentResult`, `Subscription`, `PaymentEvent` and `StepEvent`. Mock data was generated for realistic weight-loss, weight-gain, maintain-weight, boundary and payment scenarios. The generated values were accepted only when they passed the same Zod rules used by the API.

### Complex logic and boundary test generation

AI helped enumerate the health-calculation branches, projection caps, goal/target direction conflicts, missing numeric fields, non-finite values, duplicate requests, conflicting idempotency keys, stale versions and concurrent writes. Those scenarios were converted into deterministic Vitest cases and real-PostgreSQL Playwright API checks.

### One proposal/test I explicitly rejected

Yes. An AI-generated leakage test initially failed merely because the locked response listed the names of locked sections such as `projectionCurve`. That assertion was wrong: naming a locked section is not the same as returning its protected value. I rejected that test because it confused UI metadata with data disclosure. The replacement test checks the response object keys and sentinel protected values separately, so it fails only if private result data is actually serialized.
