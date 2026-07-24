# ADR 0004: Security Headers and Endpoint Rate Limiting

* **Status**: Accepted
* **Date**: 2026-07-24

## Context

Web applications face threats from brute-force authentication attacks, cross-site scripting (XSS), clickjacking, MIME-sniffing, and resource exhaustion via high-cost AI/ML endpoints.

## Decision

We enforce a two-pillar security architecture:
1. **Security Headers Middleware (`SecurityHeadersMiddleware`)**: Attaches Helmet.js-equivalent response headers across all HTTP responses:
   - `Content-Security-Policy`
   - `Permissions-Policy`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Cross-Origin-Opener-Policy` & `Cross-Origin-Resource-Policy`
2. **Multi-Tier DRF Throttling**:
   - `auth`: 5 requests/minute for login, registration, password change.
   - `sensitive`: 15 requests/minute for AI chatbot messages, ML risk predictions, What-If simulation, PDF report generation.
   - `user`: 120 requests/minute for authenticated API views.
   - `anon`: 30 requests/minute for public endpoints.

## Consequences

### Positive
* Prevents automated credential stuffing and brute-force attacks.
* Eliminates clickjacking and MIME-type sniffing vulnerabilities.
* Protects server resources from compute-intensive LLM/ML queries.

### Negative
* Legitimate high-volume automated testing must use appropriate throttle overrides or test configurations.
