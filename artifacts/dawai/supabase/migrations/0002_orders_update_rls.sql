-- ============================================================
-- Dawai (دوائي) — tighten orders UPDATE authorization
-- Apply on top of 0001_init.sql (already applied to the live project).
--
-- Problem: the original orders_update policy used `with check (true)`,
-- which let an authenticated PATIENT set their own order to vendor-only
-- statuses (confirmed/ready/rejected) or otherwise mutate rows.
--
-- Fix: split the WITH CHECK so that
--   • a patient may only move their OWN order to 'received'
--   • a vendor may set their pharmacy's orders to the statuses they control
--     (confirmed / ready / rejected / delivered)
-- ============================================================

drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update to authenticated using (
  user_id = auth.uid()
  or pharmacy_id in (select pharmacy_id from public.profiles where id = auth.uid())
) with check (
  -- المريض: يحدّث طلبه الخاص فقط إلى "تم الاستلام"
  (user_id = auth.uid() and status = 'received')
  -- البائع: يحدّث طلبات متجره فقط إلى الحالات التي يتحكم بها
  or (
    pharmacy_id in (select pharmacy_id from public.profiles where id = auth.uid())
    and status in ('confirmed','ready','rejected','delivered')
  )
);
