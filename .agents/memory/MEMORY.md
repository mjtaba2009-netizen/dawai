# Memory Index

- [Orval query-hook queryKey gotcha](orval-query-hook-querykey.md) — generated useX query hooks need an explicit `queryKey` when you pass `options.query`, else TS2741.
- [Dawai order flow](dawai-order-flow.md) — checkout = N orders (one per line); Rx/stock gates are client-only; OrderAutomationContext is wired but dormant.
- [Adding npm deps to an artifact](pnpm-add-to-artifact.md) — use `pnpm --filter @workspace/<pkg> add <dep>`; root install fails with ERR_PNPM_ADDING_TO_ROOT.
- [api-server zod dependency](dawai-zod-dep.md) — zod must be a direct dep of api-server for esbuild to bundle it (transitive usage doesn't count).
