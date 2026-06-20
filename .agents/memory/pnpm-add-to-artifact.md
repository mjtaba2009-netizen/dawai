---
name: Adding npm deps to a workspace artifact
description: How to install an npm package into a specific artifact/package in this pnpm monorepo
---

To add a runtime or dev dependency to a specific artifact (e.g. `@workspace/dawai`), run:

```
pnpm --filter @workspace/<pkg> add <dep>
pnpm --filter @workspace/<pkg> add -D <dep>   # dev dep
```

**Why:** The generic package-management install tool installs at the monorepo root and fails with `ERR_PNPM_ADDING_TO_ROOT` because the root is a pnpm workspace, not a leaf package. Dependencies must be scoped to a leaf package.

**How to apply:** Whenever a feature needs a new library inside one artifact (e.g. `canvas-confetti` + `@types/canvas-confetti` for `@workspace/dawai`), use the `pnpm --filter` form, then restart that artifact's workflow if Vite needs to re-optimize the new dep.
