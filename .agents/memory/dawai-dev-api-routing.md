---
name: Dawai dev API routing & api-server restart
description: How the web app reaches the API in dev, and why api-server route changes need a workflow restart before they take effect.
---

# Dawai dev: API routing + api-server staleness

## Reaching the API from the shell (curl smoke tests)
- The web app is served at its base path and calls the API at `/api/...` (BASE_PATH resolves so API_PREFIX is effectively empty same-origin). The shared Replit proxy routes `https://$REPLIT_DEV_DOMAIN/api/...` → the api-server.
- Do NOT curl `$REPLIT_DEV_DOMAIN/dawai/api/...` — that path hits the **vite dev server's SPA fallback** and returns `index.html` (HTML, not JSON). A GET there can look like a `200` while actually serving the app shell, and a POST returns `404`.
- **How to apply:** when smoke-testing endpoints from bash, use `$REPLIT_DEV_DOMAIN/api/<route>`.

## api-server can serve STALE route code until restarted
- Observed: after editing `auth.ts`, the running server still returned the OLD zod enum (`patient|pharmacy`, missing `cosmetic`) even though source had the new value. Restarting the `artifacts/api-server: API Server` workflow fixed it.
- **Why:** the api-server dev process did not pick up the route/source change on its own in this case.
- **How to apply:** after editing api-server source, restart its workflow before trusting smoke-test results, or you may be testing stale behavior.

## Auth model (pre-existing, app-wide)
- Tokens are `base64("<userId>:<phone>")` with no signature; `decodeUserId` only parses the id, and patient order endpoints hardcode `userId: 1`. This is the existing architecture across the whole app, not specific to one feature — do not assume per-user isolation for patient orders, and treat any "harden auth" request as a cross-cutting change touching every endpoint.
