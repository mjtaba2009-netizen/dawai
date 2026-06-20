---
name: Dawai api-server zod dependency
description: zod must be a direct dependency of api-server for esbuild to bundle it; sub-path exports like zod/v4 also fail.
---

The api-server esbuild bundle cannot resolve `zod` or `zod/v4` unless `zod` is listed in `artifacts/api-server/package.json` under `dependencies`. The db and api-zod packages use zod internally but that doesn't make it available to api-server.

**Why:** esbuild bundles only packages listed in the package's own dependencies. Transitive zod usage by sibling workspace packages doesn't count.

**How to apply:** Whenever writing route files in api-server that need Zod validation directly (not via @workspace/api-zod), run `pnpm add zod` inside `artifacts/api-server` first.
