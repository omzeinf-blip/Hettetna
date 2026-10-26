-- HETTETNA initial schema, security policies and image storage.
-- Additive only: creates new objects, never drops/truncates/alters existing data.
-- Assumes an EMPTY public schema (verified read-only). Aborts if any target table exists.

-- 0) Preflight --------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['staff_profiles','properties','projects','inquiries','contact_settings','rate_limit_hits'] loop
    if to_regclass('public.' || t) is not null then
      raise exception 'public.% already exists - review before applying this migration', t;
    end if;
  end loop;
end $$;

create extension if not exists pg_trgm with schema extensions;

-- 1) Staff and role helpers -------------------------------------------------
create table public.staff_profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null check (role in ('admin', 'agent')),
  full_name  text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff_profiles
                 where user_id = (select auth.uid()) and active);
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff_profiles
                 where user_id = (select auth.uid()) and active and role = 'admin');
$$;

revoke execute on function public.is_staff(), public.is_admin() from public, anon;
grant  execute on function public.is_staff(), public.is_admin() to authenticated;

-- 2) Trigger functions ------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function public.touch_row() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if tg_op = 'INSERT' then new.created_by := auth.uid();
  else new.created_by := old.created_by;
  end if;
  return new;
end $$;

create or replace function public.set_published_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.published and new.published_at is null then new.published_at := now(); end if;
  return new;
end $$;

create or replace function public.track_availability() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT'
     or new.availability_status is distinct from old.availability_status
     or new.last_availability_check is distinct from old.last_availability_check then
    new.availability_updated_at := now();
    new.availability_updated_by := auth.uid();
  end if;
  return new;
end $$;

-- 3) Properties -------------------------------------------------------------
create table public.properties (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[^\s/?#]+$' and length(slug) <= 160),
  property_code  text not null unique check (length(property_code) between 1 and 40),
  title          text not null check (length(title) between 3 and 200),
  transaction_type text not null check (transaction_type in ('sale', 'rent', 'primary')),
  property_type  text not null check (property_type in
                   ('apartment','villa','townhouse','twinhouse','duplex','land','commercial')),
  city           text not null,
  area_id        text not null check (area_id in
                   ('6th-october','sheikh-zayed','october-gardens','new-zayed')),
  area_name      text not null,
  compound       text,
  neighborhood   text,
  price          numeric(14,2) not null check (price > 0),
  currency       text not null default 'EGP' check (currency = 'EGP'),
  area_sqm       numeric(10,2) not null check (area_sqm > 0),
  bedrooms       int check (bedrooms >= 0),
  bathrooms      int check (bathrooms >= 0),
  finishing      text check (finishing in ('finished','semi-finished','core-and-shell')),
  furnishing     text check (furnishing in ('unfurnished','semi-furnished','furnished')),
  floor          text,
  delivery_status text check (delivery_status in ('ready','under-construction')),
  description    text not null check (length(description) <= 5000),
  features       text[] not null default '{}',
  images         jsonb not null default '[]' check (jsonb_typeof(images) = 'array'),
  listing_source text not null check (listing_source in
                   ('owner','authorized-representative','developer-channel','demo')),
  availability_status text not null default 'pending-verification' check (availability_status in
                   ('unknown','available','unavailable','pending-verification')),
  last_availability_check date,
  availability_updated_at timestamptz,
  availability_updated_by uuid references auth.users (id) on delete set null,
  legal_review_status text not null default 'not-reviewed' check (legal_review_status in
                   ('not-reviewed','in-review','reviewed')),
  payment_plan_note text,
  is_demo        boolean not null default false,
  published      boolean not null default false,
  published_at   timestamptz,
  created_by     uuid references auth.users (id) on delete set null,
  updated_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  search_text    text generated always as (lower(
                   coalesce(title,'') || ' ' || coalesce(area_name,'') || ' ' ||
                   coalesce(compound,'') || ' ' || coalesce(neighborhood,'') || ' ' ||
                   coalesce(property_code,'') || ' ' || coalesce(description,''))) stored,
  -- availability may only be "available" once someone recorded when it was checked
  constraint availability_requires_check
    check (availability_status <> 'available' or last_availability_check is not null)
);

create index properties_public_idx on public.properties (published_at desc)
  where published and not is_demo;
create index properties_area_idx   on public.properties (area_id);
create index properties_type_idx   on public.properties (property_type, transaction_type);
create index properties_price_idx  on public.properties (price);
create index properties_search_idx on public.properties using gin (search_text extensions.gin_trgm_ops);

create or replace trigger properties_touch        before insert or update on public.properties
  for each row execute function public.touch_row();
create or replace trigger properties_publish      before insert or update on public.properties
  for each row execute function public.set_published_at();
create or replace trigger properties_availability before insert or update on public.properties
  for each row execute function public.track_availability();

-- 4) Projects ---------------------------------------------------------------
create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[^\s/?#]+$' and length(slug) <= 160),
  name         text not null check (length(name) between 2 and 200),
  developer    text,
  area_id      text not null check (area_id in
                 ('6th-october','sheikh-zayed','october-gardens','new-zayed')),
  area_name    text not null,
  city         text not null,
  description  text not null check (length(description) <= 5000),
  delivery_status text check (delivery_status in ('ready','under-construction')),
  payment_plan_note text,
  images       jsonb not null default '[]' check (jsonb_typeof(images) = 'array'),
  is_demo      boolean not null default false,
  is_primary_sales boolean not null default true,
  unit_types   text[] not null default '{}' check (unit_types <@ array
                 ['apartment','villa','townhouse','twinhouse','duplex','land','commercial']),
  published    boolean not null default false,
  published_at timestamptz,
  created_by   uuid references auth.users (id) on delete set null,
  updated_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index projects_public_idx on public.projects (published_at desc)
  where published and not is_demo;

create or replace trigger projects_touch   before insert or update on public.projects
  for each row execute function public.touch_row();
create or replace trigger projects_publish before insert or update on public.projects
  for each row execute function public.set_published_at();

-- 5) Inquiries (private) ----------------------------------------------------
create table public.inquiries (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('buyer', 'owner', 'contact')),
  name       text not null check (length(name) between 3 and 120),
  phone      text not null check (length(phone) between 10 and 16),
  email      text check (length(email) <= 254),
  transaction_type text check (transaction_type in ('sale','rent','primary','buy-or-rent')),
  preferred_location text check (preferred_location in
               ('6th-october','sheikh-zayed','october-gardens','new-zayed')),
  property_type text check (property_type in
               ('apartment','villa','townhouse','twinhouse','duplex','land','commercial')),
  budget_min   numeric check (budget_min >= 0),
  budget_max   numeric check (budget_max >= 0),
  asking_price numeric check (asking_price >= 0),
  area_sqm     numeric check (area_sqm > 0),
  notes        text check (length(notes) <= 2000),
  property_code text check (length(property_code) <= 40),
  consent      boolean not null check (consent),
  status       text not null default 'new' check (status in ('new','in-review','assigned','closed')),
  assigned_to  uuid references auth.users (id) on delete set null,
  internal_notes text check (length(internal_notes) <= 4000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index inquiries_inbox_idx on public.inquiries (status, created_at desc);
create or replace trigger inquiries_updated before update on public.inquiries
  for each row execute function public.set_updated_at();

-- 6) Contact settings (single row) -----------------------------------------
create table public.contact_settings (
  id              int primary key default 1 check (id = 1),
  whatsapp_number text check (whatsapp_number ~ '^[0-9]{10,15}$'),
  phone           text,
  email           text,
  address         text,
  instagram_url   text check (instagram_url ~ '^https://'),
  facebook_url    text check (facebook_url ~ '^https://'),
  linkedin_url    text check (linkedin_url ~ '^https://'),
  updated_at      timestamptz not null default now()
);
insert into public.contact_settings (id) values (1) on conflict do nothing;
create or replace trigger contact_settings_updated before update on public.contact_settings
  for each row execute function public.set_updated_at();

-- 6b) Rate-limit counters (server-only; stores a keyed hash, never the visitor's IP) --
create table public.rate_limit_hits (
  id         bigint generated always as identity primary key,
  scope      text not null check (length(scope) <= 40),
  key        text not null check (length(key) <= 80),
  created_at timestamptz not null default now()
);
create index rate_limit_hits_lookup_idx on public.rate_limit_hits (scope, key, created_at desc);
create index rate_limit_hits_age_idx    on public.rate_limit_hits (created_at);

-- 7) Row Level Security -----------------------------------------------------
alter table public.staff_profiles  enable row level security;
alter table public.properties      enable row level security;
alter table public.projects        enable row level security;
alter table public.inquiries       enable row level security;
alter table public.contact_settings enable row level security;
alter table public.rate_limit_hits enable row level security;  -- no policies: only the service role can use it

-- 8) Table privileges (RLS still applies on top) ---------------------------
revoke all on public.staff_profiles, public.properties, public.projects,
              public.inquiries, public.contact_settings, public.rate_limit_hits from anon, authenticated;

grant select on public.staff_profiles to authenticated;

-- anon sees public listing columns only (not staff user ids or audit fields)
grant select (id, slug, property_code, title, transaction_type, property_type, city, area_id,
  area_name, compound, neighborhood, price, currency, area_sqm, bedrooms, bathrooms, finishing,
  furnishing, floor, delivery_status, description, features, images, listing_source,
  availability_status, last_availability_check, legal_review_status, payment_plan_note,
  is_demo, published, published_at, created_at, updated_at, search_text)
  on public.properties to anon;
grant select, insert, update, delete on public.properties to authenticated;

grant select (id, slug, name, developer, area_id, area_name, city, description, delivery_status,
  payment_plan_note, images, is_demo, is_primary_sales, unit_types, published, published_at,
  created_at, updated_at) on public.projects to anon;
grant select, insert, update, delete on public.projects to authenticated;

-- inquiries: no anon access at all; staff may only change workflow fields
grant select, delete on public.inquiries to authenticated;
grant update (status, assigned_to, internal_notes) on public.inquiries to authenticated;

grant select on public.contact_settings to anon, authenticated;
grant update (whatsapp_number, phone, email, address, instagram_url, facebook_url, linkedin_url)
  on public.contact_settings to authenticated;

-- 9) Storage bucket for listing photos -------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 10) Policies (each created only if a policy with that name does not exist) --
do $do$
declare p record;
begin
  for p in select * from (values
    ('public','staff_profiles','read own profile or admin',
     $ddl$create policy "read own profile or admin" on public.staff_profiles for select to authenticated
          using (user_id = (select auth.uid()) or (select public.is_admin()))$ddl$),

    ('public','properties','public read published properties',
     $ddl$create policy "public read published properties" on public.properties for select
          to anon, authenticated using (published and not is_demo)$ddl$),
    ('public','properties','staff read all properties',
     $ddl$create policy "staff read all properties" on public.properties for select
          to authenticated using ((select public.is_staff()))$ddl$),
    ('public','properties','staff insert properties',
     $ddl$create policy "staff insert properties" on public.properties for insert
          to authenticated with check ((select public.is_staff()))$ddl$),
    ('public','properties','staff update properties',
     $ddl$create policy "staff update properties" on public.properties for update
          to authenticated using ((select public.is_staff())) with check ((select public.is_staff()))$ddl$),
    ('public','properties','admin delete properties',
     $ddl$create policy "admin delete properties" on public.properties for delete
          to authenticated using ((select public.is_admin()))$ddl$),

    ('public','projects','public read published projects',
     $ddl$create policy "public read published projects" on public.projects for select
          to anon, authenticated using (published and not is_demo)$ddl$),
    ('public','projects','staff read all projects',
     $ddl$create policy "staff read all projects" on public.projects for select
          to authenticated using ((select public.is_staff()))$ddl$),
    ('public','projects','staff insert projects',
     $ddl$create policy "staff insert projects" on public.projects for insert
          to authenticated with check ((select public.is_staff()))$ddl$),
    ('public','projects','staff update projects',
     $ddl$create policy "staff update projects" on public.projects for update
          to authenticated using ((select public.is_staff())) with check ((select public.is_staff()))$ddl$),
    ('public','projects','admin delete projects',
     $ddl$create policy "admin delete projects" on public.projects for delete
          to authenticated using ((select public.is_admin()))$ddl$),

    ('public','inquiries','staff read inquiries',
     $ddl$create policy "staff read inquiries" on public.inquiries for select
          to authenticated using ((select public.is_staff()))$ddl$),
    ('public','inquiries','staff update inquiries',
     $ddl$create policy "staff update inquiries" on public.inquiries for update
          to authenticated using ((select public.is_staff())) with check ((select public.is_staff()))$ddl$),
    ('public','inquiries','admin delete inquiries',
     $ddl$create policy "admin delete inquiries" on public.inquiries for delete
          to authenticated using ((select public.is_admin()))$ddl$),

    ('public','contact_settings','public read contact settings',
     $ddl$create policy "public read contact settings" on public.contact_settings for select
          to anon, authenticated using (true)$ddl$),
    ('public','contact_settings','admin update contact settings',
     $ddl$create policy "admin update contact settings" on public.contact_settings for update
          to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))$ddl$),

    ('storage','objects','staff read property images',
     $ddl$create policy "staff read property images" on storage.objects for select
          to authenticated using (bucket_id = 'property-images' and (select public.is_staff()))$ddl$),
    ('storage','objects','staff upload property images',
     $ddl$create policy "staff upload property images" on storage.objects for insert
          to authenticated with check (bucket_id = 'property-images' and (select public.is_staff()))$ddl$),
    ('storage','objects','staff update property images',
     $ddl$create policy "staff update property images" on storage.objects for update
          to authenticated using (bucket_id = 'property-images' and (select public.is_staff()))
          with check (bucket_id = 'property-images' and (select public.is_staff()))$ddl$),
    ('storage','objects','staff delete property images',
     $ddl$create policy "staff delete property images" on storage.objects for delete
          to authenticated using (bucket_id = 'property-images' and (select public.is_staff()))$ddl$)
  ) as t(schemaname, tablename, policyname, ddl)
  loop
    if not exists (select 1 from pg_policies
                   where schemaname = p.schemaname and tablename = p.tablename
                     and policyname = p.policyname) then
      execute p.ddl;
    end if;
  end loop;
end $do$;
-- NOTE: no INSERT policy exists on public.inquiries. Only the server (service role) can add rows.
