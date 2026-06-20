---
name: Orval query-hook queryKey gotcha
description: Why generated react-query hooks in @workspace/api-client-react throw TS2741 when you pass query options.
---

The generated `useX(...params, options)` query hooks type their `options.query` as the **full** `UseQueryOptions` (not `Partial`). So passing `{ query: { enabled: !!q } }` fails typecheck with `TS2741: Property 'queryKey' is missing`.

**Fix:** also pass the generated key, e.g.
`useSearchMedications({ q }, { query: { enabled: !!q, queryKey: getSearchMedicationsQueryKey({ q }) } })`.
Every generated hook exports a matching `getXQueryKey(params?)`.

**Why:** orval emits non-Partial option types here; the hook still merges/overrides queryKey internally, so the explicit key is only to satisfy the type. Hooks called with **no** options don't hit this.

**How to apply:** any time you add `query.enabled`/`staleTime`/etc. to a generated hook call, import and pass `getXQueryKey(...)` too. Re-running codegen can resurface this on hooks that previously had no options.
