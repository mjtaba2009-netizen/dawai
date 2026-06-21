---
name: Dawai Supabase backend
description: How Dawai's data layer works after the full Supabase migration, plus the schema-apply and connector gotchas.
---

# Dawai — Supabase backend

Dawai (artifacts/dawai) is now **100% Supabase** (Auth + Postgres + Storage) with **no
custom server**. The old Express + Drizzle + OpenAPI/Orval stack (artifacts/api-server,
lib/{api-spec,api-client-react,api-zod,db}) was deleted. The client talks to Supabase
directly using `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, which are baked into the
Vite build — the app does NOT use the Replit connector proxy at runtime.

## Schema / RLS source of truth — does NOT auto-apply
- `artifacts/dawai/supabase/migrations/*.sql` is the source of truth for tables, RLS,
  storage buckets, and seed data.
- **It does not run automatically.** Editing a migration file does not change the live
  project — the SQL must be run manually against the live Supabase DB (SQL editor or a
  re-bound connection). Easy to forget and assume the file edit is live.

## orders UPDATE authorization (decision)
- A patient may only move their OWN order to `received`.
- A vendor may set their pharmacy's orders to `confirmed`/`ready`/`rejected`/`delivered`.
- **Why:** the initial policy used `with check (true)`, letting patients set
  vendor-only statuses. Keep these two role-scoped branches in any future RLS change.

## Connector 401 gotcha
- `listConnections('supabase')` (and the connector proxy generally) can return **401
  Unauthorized** in the code_execution sandbox even while the app works fine — because
  the app uses the VITE_ env vars, not the connector.
- **How to apply privileged DB ops (DDL/RLS):** re-bind the connection via
  `proposeIntegration` (then read its settings for a DB connection string), or have the
  user paste the SQL into the Supabase SQL editor. The Replit `DATABASE_URL` / `PG*`
  point to a leftover Replit Postgres (`helium`), NOT Supabase — do not use them.

## Auth
- Phone + password, mapped to a synthetic email under the hood. **No SMS/OTP** in the
  auth flow. (`verifyOTP` exists in authService but is unused scaffolding.)
- Detailed required Supabase dashboard Auth settings: see `supabase-phone-password-auth.md`.

## Order flow / enforcement (design)
- Checkout creates **one order row per cart line item** (`createOrder` takes a single
  pharmacy+medication+quantity; there is no order_items / multi-line order table).
  Partial failure leaves failed lines in the cart.
- **Prescription/stock gates are client-only.** The UI blocks Rx items, but the DB does
  not verify `requires_prescription`, stock, or quantity on insert — RLS only checks
  `user_id = auth.uid()`. Direct API calls can bypass the Rx gate / oversell. Treat
  server-side Rx + transactional stock decrement as the first hardening steps before a
  real launch; don't assume they exist.
