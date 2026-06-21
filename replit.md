# دوائي — Dawai

Dawai is an Arabic, right-to-left medical marketplace where patients browse pharmacies
and cosmetic shops, order medicines/products, and track orders, while vendors manage
inventory and incoming orders from a Kanban dashboard. Prices are shown in IQD.

## Run & Operate

- `pnpm --filter @workspace/dawai run dev` — run the Dawai web app (Vite dev server)
- `pnpm --filter @workspace/dawai run build` — production build of the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Required env (client build): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS v4, Framer Motion (glassmorphism UI)
- Data layer: TanStack Query over a local Supabase service layer
- Backend: Supabase — Auth + Postgres + Storage (no custom server)
- Auth: phone + password mapped to a synthetic email under the hood (no SMS/OTP)

## Where things live

- Web app: `artifacts/dawai/`
- Supabase service layer (source of truth for data access):
  `artifacts/dawai/src/services/` — `supabaseClient.ts`, `authService.ts`,
  `dbService.ts`, `hooks.ts` (TanStack Query), `types.ts`, `constants.ts`
- Database schema, RLS policies, storage buckets, and seed data:
  `artifacts/dawai/supabase/migrations/0001_init.sql` (source of truth)
- Auth/session state: `artifacts/dawai/src/contexts/AuthContext.tsx`
- Routing base name: `artifacts/dawai/src/lib/api-base.ts`

## Architecture decisions

- The app talks directly to Supabase from the client (no Express/API server). The
  previous Express + Drizzle + OpenAPI/Orval backend was fully removed.
- Row Level Security enforces access: public read for catalog/vendors; profile and
  notification rows are self-scoped; order updates are split — a patient may only move
  their own order to `received`, while a vendor may set their pharmacy's orders to
  `confirmed`/`ready`/`rejected`/`delivered`.
- The default governorate is البصرة (Basra). Vendor socials are TikTok/Instagram only.

## Product

- Patients: browse pharmacies/cosmetic shops, search medicines, cart + checkout,
  track orders (tracking code `#DW-XXXX`), confirm receipt, notifications.
- Vendors (pharmacy/cosmetic): KYC registration + digital partnership signature gate,
  Kanban order board, inventory management.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The Replit-managed PostgreSQL module (`DATABASE_URL` / `PG*`) is a leftover from the
  old stack and is NOT used by the app — all data lives in Supabase. Safe to ignore.
- Schema/RLS changes must be made in `0001_init.sql` AND applied to the live Supabase
  project; the migration file alone does not run automatically.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
