-- ============================================================
-- Dawai (دوائي) — Supabase schema migration
-- Auth model: phone + password (synthetic email under the hood)
-- Default governorate: البصرة
-- Safe to run on the current project: existing pharmacies/orders are
-- empty leftovers, so we recreate the full schema cleanly.
-- ============================================================

-- ---------- Clean slate (empty leftover tables) ----------
drop table if exists public.notifications cascade;
drop table if exists public.orders cascade;
drop table if exists public.pharmacy_medications cascade;
drop table if exists public.medications cascade;
drop table if exists public.profiles cascade;
drop table if exists public.pharmacies cascade;

-- ---------- pharmacies (الصيدليات/المتاجر) ----------
create table public.pharmacies (
  id           bigint generated always as identity primary key,
  owner_id     uuid references auth.users(id) on delete set null,
  name         text not null,
  address      text,
  distance     real default 0,
  is_open      boolean not null default true,
  phone        text,
  whatsapp     text,
  rating       real default 0,
  lat          double precision,
  lng          double precision,
  image_url    text,
  type         text not null default 'pharmacy' check (type in ('pharmacy','cosmetic')),
  governorate  text not null default 'البصرة',
  instagram    text,
  tiktok       text,
  status       text not null default 'approved' check (status in ('pending','approved','rejected')),
  created_at   timestamptz not null default now()
);

-- ---------- profiles (ملفات المستخدمين — تمتد من auth.users) ----------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text,
  phone        text unique,
  role         text not null default 'patient' check (role in ('patient','pharmacy','cosmetic')),
  status       text not null default 'active',
  pharmacy_id  bigint references public.pharmacies(id) on delete set null,
  avatar       text,
  created_at   timestamptz not null default now()
);

-- ---------- medications (الأدوية/المنتجات) ----------
create table public.medications (
  id                     bigint generated always as identity primary key,
  name                   text not null,
  generic_name           text,
  category               text,
  description            text,
  requires_prescription  boolean not null default false,
  image_url              text,
  created_at             timestamptz not null default now()
);

-- ---------- pharmacy_medications (مخزون المتاجر) ----------
create table public.pharmacy_medications (
  id             bigint generated always as identity primary key,
  pharmacy_id    bigint not null references public.pharmacies(id) on delete cascade,
  medication_id  bigint not null references public.medications(id) on delete cascade,
  price          numeric(12,2) not null default 0,
  quantity       integer not null default 0,
  updated_at     timestamptz not null default now()
);

-- ---------- orders (الطلبات) ----------
create table public.orders (
  id             bigint generated always as identity primary key,
  user_id        uuid references auth.users(id) on delete set null,
  pharmacy_id    bigint references public.pharmacies(id) on delete set null,
  medication_id  bigint references public.medications(id) on delete set null,
  quantity       integer not null default 1,
  total_price    numeric(12,2),
  tracking_code  text,
  status         text not null default 'pending'
                 check (status in ('pending','confirmed','ready','rejected','delivered','received')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- notifications (الإشعارات) ----------
create table public.notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  title       text,
  message     text,
  is_read     boolean not null default false,
  type        text not null default 'system',
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Grants (PostgREST roles)
-- ============================================================
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.pharmacies           enable row level security;
alter table public.profiles             enable row level security;
alter table public.medications          enable row level security;
alter table public.pharmacy_medications enable row level security;
alter table public.orders               enable row level security;
alter table public.notifications        enable row level security;

-- pharmacies: public read; authenticated create; owner update
drop policy if exists pharmacies_read on public.pharmacies;
create policy pharmacies_read on public.pharmacies for select using (true);
drop policy if exists pharmacies_insert on public.pharmacies;
create policy pharmacies_insert on public.pharmacies for insert to authenticated with check (true);
drop policy if exists pharmacies_update on public.pharmacies;
create policy pharmacies_update on public.pharmacies for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- profiles: self read/write
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- medications: public read; authenticated write
drop policy if exists medications_read on public.medications;
create policy medications_read on public.medications for select using (true);
drop policy if exists medications_insert on public.medications;
create policy medications_insert on public.medications for insert to authenticated with check (true);
drop policy if exists medications_update on public.medications;
create policy medications_update on public.medications for update to authenticated using (true) with check (true);

-- pharmacy_medications: public read; vendor manages own inventory
drop policy if exists pm_read on public.pharmacy_medications;
create policy pm_read on public.pharmacy_medications for select using (true);
drop policy if exists pm_write on public.pharmacy_medications;
create policy pm_write on public.pharmacy_medications for all to authenticated
  using (pharmacy_id in (select pharmacy_id from public.profiles where id = auth.uid()))
  with check (pharmacy_id in (select pharmacy_id from public.profiles where id = auth.uid()));

-- orders: patient creates/reads own; vendor reads/updates orders for their pharmacy
drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders for insert to authenticated with check (user_id = auth.uid());
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select to authenticated using (
  user_id = auth.uid()
  or pharmacy_id in (select pharmacy_id from public.profiles where id = auth.uid())
);
drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update to authenticated using (
  user_id = auth.uid()
  or pharmacy_id in (select pharmacy_id from public.profiles where id = auth.uid())
) with check (true);

-- notifications: user manages own
drop policy if exists notifications_self on public.notifications;
create policy notifications_self on public.notifications for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- Storage buckets (public read)
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('certificates','certificates', true),
  ('prescriptions','prescriptions', true),
  ('medicine-images','medicine-images', true)
on conflict (id) do nothing;

drop policy if exists storage_dawai_read on storage.objects;
create policy storage_dawai_read on storage.objects for select using (
  bucket_id in ('certificates','prescriptions','medicine-images')
);
drop policy if exists storage_dawai_insert on storage.objects;
create policy storage_dawai_insert on storage.objects for insert to authenticated with check (
  bucket_id in ('certificates','prescriptions','medicine-images')
);

-- ============================================================
-- Seed data (sample catalog so the app isn't empty) — البصرة
-- ============================================================
insert into public.pharmacies (name, address, distance, phone, whatsapp, type, governorate, instagram, tiktok)
values
 ('صيدلية الشفاء','شارع الاستقلال، البصرة', 0.8, '07701112233', '9647701112233', 'pharmacy','البصرة', null, null),
 ('صيدلية النور','العشار، البصرة', 1.5, '07702223344', '9647702223344', 'pharmacy','البصرة', null, null),
 ('متجر لمسة جمال','الجزائر، البصرة', 2.1, '07703334455', '9647703334455', 'cosmetic','البصرة', 'lamsa_beauty', 'lamsa_beauty');

insert into public.medications (name, generic_name, category, description, requires_prescription)
values
 ('باراسيتامول 500ملغ','Paracetamol','مسكنات','خافض للحرارة ومسكن للألم', false),
 ('أموكسيسيلين 500ملغ','Amoxicillin','مضادات حيوية','مضاد حيوي واسع الطيف', true),
 ('فيتامين سي 1000ملغ','Vitamin C','فيتامينات','مكمل غذائي لتعزيز المناعة', false),
 ('سيروم فيتامين سي','Vitamin C Serum','عناية بالبشرة','سيروم مضيء للبشرة', false);

insert into public.pharmacy_medications (pharmacy_id, medication_id, price, quantity)
select p.id, m.id, (1000 + (m.id * 250)), 50
from public.pharmacies p
cross join public.medications m
where p.type = 'pharmacy' and m.category <> 'عناية بالبشرة';

insert into public.pharmacy_medications (pharmacy_id, medication_id, price, quantity)
select p.id, m.id, 15000, 30
from public.pharmacies p
cross join public.medications m
where p.type = 'cosmetic' and m.category = 'عناية بالبشرة';
