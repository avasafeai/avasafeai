-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Profiles table
create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  full_name   text,
  phone       text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Applications table
create table if not exists public.applications (
  id                uuid     primary key default gen_random_uuid(),
  user_id           uuid     references public.profiles(id) on delete cascade,
  service_type      text     not null default 'oci_new',
  status            text     not null default 'draft' check (status in ('draft','ready','paid','submitted','approved')),
  form_data         jsonb,
  validation_errors jsonb,
  stripe_payment_id text,
  vfs_reference     text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.applications enable row level security;

create policy "Users can view own applications"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "Users can insert own applications"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own applications"
  on public.applications for update
  using (auth.uid() = user_id);

-- Documents table
create table if not exists public.documents (
  id               uuid primary key default gen_random_uuid(),
  application_id   uuid references public.applications(id) on delete cascade,
  user_id          uuid references public.profiles(id) on delete cascade,
  doc_type         text not null check (doc_type in ('passport','renunciation','address_proof','photo','signature')),
  storage_path     text not null,
  extracted_data   jsonb,
  created_at       timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Users can view own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can insert own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update own documents"
  on public.documents for update
  using (auth.uid() = user_id);

-- Auto-update updated_at on applications
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
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
