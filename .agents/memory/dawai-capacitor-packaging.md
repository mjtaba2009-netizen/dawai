---
name: Dawai Capacitor / sub-path packaging
description: How to package the /dawai/ web app for a relative-base shell (Capacitor) without breaking the web build; the direct-fetch base-URL gotcha.
---

# Packaging the Dawai web app for a native/relative-base shell

The dawai artifact is a Vite SPA **served at sub-path `/dawai/`** (vite `base` comes
from the required `BASE_PATH` env). Any packaging that runs the built assets from a
non-`/dawai/` origin (Capacitor WebView at `capacitor://localhost`, a generic static
host, etc.) needs a **relative base** and a **remote API base**.

## The non-obvious gotcha
Two independent things resolve the API/base, and they are easy to miss:
1. The generated client `@workspace/api-client-react` → configured via `setBaseUrl()`
   (and `setAuthTokenGetter()` for bearer auth; the app is fully token-based, token
   lives in `localStorage.dawai_user.token`, no cookies).
2. **Several screens bypass the generated client and call `fetch()` directly**, deriving
   their prefix from `import.meta.env.BASE_URL`. In a relative build `BASE_URL === "./"`,
   so these silently hit `./api/...` on the shell origin and break (login/register,
   pharmacy dashboard, orders board, order automation).

**Fix pattern:** a single `src/lib/api-base.ts` exports `API_PREFIX` (for direct
fetches), `REMOTE_API_BASE` (drives `setBaseUrl`/auth getter, native-only), and
`ROUTER_BASENAME`. All driven by one env var `VITE_API_BASE_URL`. Unset → web
behavior unchanged (same-origin under `/dawai`). Set → everything points at the
deployed backend.

**Why:** keeping web and shell consistent from one switch avoids the split-brain where
the generated client is remapped but raw `fetch()` calls are not.

## Router basename
`BrowserRouter basename={import.meta.env.BASE_URL}` breaks when base is `"./"` (not a
valid path prefix). Normalize: `ROUTER_BASENAME = BASE_URL === "./" ? "/" : BASE_URL`.

## Build switch
`build:mobile` = `BASE_PATH=./ NODE_ENV=production vite build` → emits relative
`./assets/...`. Keep the normal `build` (BASE_PATH=/dawai/) untouched. Output dir is
`dist/public` (NOT `dist`) — Capacitor `webDir` must be `dist/public`.

## Environment limits (Replit)
This Linux container has **no native toolchain** (no Xcode/Android SDK/Gradle/pod), so
`cap add ios/android`, `cap sync`, and APK/IPA builds **cannot run here** — they happen
on the user's Mac/PC or cloud CI. Only JS deps + config + CSS are set up on-platform.
Install Capacitor with `pnpm --filter @workspace/dawai add ...` (never `npm install`).
`bundledWebRuntime` was removed in Capacitor 5+ (project is on v8) — omit it.
