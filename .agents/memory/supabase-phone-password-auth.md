---
name: Dawai Supabase phone+password auth config
description: Required Supabase project settings + synthetic-email pattern for client-only phone+password login
---

# Dawai phone+password on Supabase (client-only, no SMS)

Login UX is **phone + password**, mapped under the hood to Supabase **email/password** auth.
Synthetic email = `<digits-only phone>@phone.dawai.app` (see `src/services/constants.js` `phoneToEmail`).

## Required Supabase project Auth settings (dashboard, not code)
For client-side synthetic-email signup to return a session immediately, BOTH must hold:
- **Email provider = ENABLED** (Authentication → Sign In/Providers → Email → "Enable Email provider" ON).
- **Confirm email = OFF** → settings expose `mailer_autoconfirm: true`.

**Why:** with "Confirm email" ON, `signUp` (1) returns no session (login then fails), (2) runs a
deliverability check that rejects synthetic domains with `"Email address ... is invalid"`, and
(3) tries to send a confirmation email → `429 email rate limit exceeded`. Turning Confirm email OFF
fixes all three at once. The two toggles ("Enable Email provider" vs "Confirm email") sit together and
are easy to confuse — they do opposite jobs.

## How to verify quickly
Read settings without secrets-in-code via shell: `GET $VITE_SUPABASE_URL/auth/v1/settings` with the
anon key as `apikey` header → check `external.email` (provider) and `mailer_autoconfirm` (confirm-off).
Sandbox `code_execution` can't read `process.env`; use bash `node -e` (secrets are injected into shell).

## Registration order (RLS depends on an active session, so email-confirm MUST be off)
patient: `signUp` → upsert `profiles` (id = auth.uid()).
vendor:  `signUp` → insert `pharmacies` (owner_id = auth.uid()) → upsert `profiles` with `pharmacy_id`.
RLS scopes vendor inventory/orders via `pharmacy_id in (select pharmacy_id from profiles where id=auth.uid())`.
