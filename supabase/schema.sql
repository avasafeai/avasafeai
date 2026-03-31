-- Enable extensions
create extension if not exists "pgcrypto";

-- ─── profiles ────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  full_name     text,
  phone         text,
  plan          text not null default 'locker' check (plan in ('locker','apply','family')),
  plan_expires  timestamptz,
  created_at    timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"    on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile"  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile"  on public.profiles for update using (auth.uid() = id);

-- ─── documents ───────────────────────────────────────────────────────────────

create table if not exists public.documents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade,
  doc_type        text not null check (doc_type in (
                    'us_passport','indian_passport','oci_card',
                    'renunciation','pan_card','address_proof','photo','signature'
                  )),
  storage_path    text,   -- null after image is deleted post-extraction
  extracted_data  jsonb,
  expires_at      timestamptz,
  created_at      timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Users can view own documents"    on public.documents for select using (auth.uid() = user_id);
create policy "Users can insert own documents"  on public.documents for insert with check (auth.uid() = user_id);
create policy "Users can update own documents"  on public.documents for update using (auth.uid() = user_id);
create policy "Users can delete own documents"  on public.documents for delete using (auth.uid() = user_id);

-- ─── applications ─────────────────────────────────────────────────────────────

create table if not exists public.applications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade,
  service_type      text not null check (service_type in ('oci_new','oci_renewal','passport_renewal')),
  status            text not null default 'draft' check (status in (
                      'draft','locker_ready','form_complete','validated',
                      'paid','package_generated','submitted','approved'
                    )),
  form_data         jsonb,
  validation_errors jsonb,
  stripe_payment_id text,
  arn               text,   -- Application Reference Number from government portal
  vfs_reference     text,
  package_url       text,   -- signed URL to PDF package
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.applications enable row level security;

create policy "Users can view own applications"    on public.applications for select using (auth.uid() = user_id);
create policy "Users can insert own applications"  on public.applications for insert with check (auth.uid() = user_id);
create policy "Users can update own applications"  on public.applications for update using (auth.uid() = user_id);

-- ─── alerts ──────────────────────────────────────────────────────────────────

create table if not exists public.alerts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade,
  document_id  uuid references public.documents(id) on delete cascade,
  alert_type   text not null check (alert_type in ('expiry_warning','expiry_critical','update_required')),
  message      text not null,
  sent_at      timestamptz,
  read_at      timestamptz,
  created_at   timestamptz default now()
);

alter table public.alerts enable row level security;

create policy "Users can view own alerts"    on public.alerts for select using (auth.uid() = user_id);
create policy "Users can update own alerts"  on public.alerts for update using (auth.uid() = user_id);

-- ─── triggers ────────────────────────────────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── storage policies ────────────────────────────────────────────────────────

-- Run these in the Supabase dashboard after creating a bucket named "documents":
-- create policy "User-scoped upload"
--   on storage.objects for insert with check (
--     bucket_id = 'documents' and
--     (storage.foldername(name))[1] = auth.uid()::text
--   );
-- create policy "User-scoped read"
--   on storage.objects for select using (
--     bucket_id = 'documents' and
--     (storage.foldername(name))[1] = auth.uid()::text
--   );
-- create policy "User-scoped delete"
--   on storage.objects for delete using (
--     bucket_id = 'documents' and
--     (storage.foldername(name))[1] = auth.uid()::text
--   );
