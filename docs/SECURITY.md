# Security Notes

## Implemented controls

- Anonymous raw tokens remain in HttpOnly Cookies; PostgreSQL stores only SHA-256 hashes.
- Cookies use HttpOnly, SameSite=Lax, path scoping and a 30-day lifetime. The `Secure` flag is enabled by default in production code and can be explicitly disabled only for the temporary HTTP/IP demo deployment.
- Every Session operation verifies authenticated ownership.
- Zod rejects malformed, non-finite, out-of-range and extra input fields.
- PostgreSQL CHECK constraints provide a second validation boundary.
- Session versions prevent silent concurrent overwrites.
- Step and payment idempotency keys prevent duplicate command processing.
- Public and full result DTOs are separate constructors.
- PostgreSQL is only available on the private Docker network.
- The app container runs as an unprivileged user.
- Nginx adds clickjacking, MIME sniffing, referrer and browser permission headers.
- CI runs dependency, type, test and build checks; `npm audit` is currently clean.

## Production actions

- The checked-in Compose example sets `COOKIE_SECURE=false` so the temporary IP-only HTTP deployment remains usable. As soon as HTTPS is configured, set `COOKIE_SECURE=true`, redeploy and verify the flag in browser developer tools.

- Replace all example secrets with randomly generated values.
- Keep `.env.production` mode `600` and outside Git.
- Rotate the server password shared during setup.
- Prefer SSH keys; disable root password login after key access is verified.
- Configure a host/provider firewall for SSH, HTTP and HTTPS only.
- Add HTTPS before collecting real user data.
- Add rate limiting and monitoring before a public campaign.
- Treat health data as sensitive and define deletion/retention rules.

## Known demo limitations

- Payment is a Mock endpoint and must not be presented as real billing.
- The assessment algorithm is not clinically validated.
- There is no registered account recovery flow; access is tied to the anonymous Cookie.
- No WAF, distributed rate limiter or centralized security event pipeline is included.

## Reporting

Do not open a public issue containing secrets or personal health data. Revoke exposed credentials immediately and use a private channel for sensitive reports.
