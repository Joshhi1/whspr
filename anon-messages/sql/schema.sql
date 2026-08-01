-- ============================================================================
-- Anonymous Messages — Supabase Schema
-- Run this whole file once in the Supabase SQL editor for a FRESH project.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- PROFILES — one per real Supabase Auth account
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1)),
    '[^a-z0-9_]', '', 'gi'
  ));
  if base_username = '' then base_username := 'user'; end if;
  final_username := base_username;

  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (new.id, final_username, coalesce(new.raw_user_meta_data->>'full_name', base_username))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- MESSAGES — anonymous messages sent to a profile. No sender identity is
-- stored anywhere, by design (that's the whole point of the product).
-- ============================================================================
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_recipient on public.messages (recipient_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- Profiles: readable by anyone with the anon key too, since the public send
-- page needs to look up a username without being logged in.
-- Messages: only the recipient can ever read their own inbox. There is
-- intentionally NO insert policy for the anon/authenticated client — sending
-- a message only happens through the backend's service-role key, which is
-- the only way messages get created. This keeps senders fully anonymous and
-- keeps message-sending server-controlled (rate limiting, length checks).
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.messages enable row level security;

create policy "profiles_select_anyone" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "messages_select_own" on public.messages for select using (auth.uid() = recipient_id);
create policy "messages_delete_own" on public.messages for delete using (auth.uid() = recipient_id);
create policy "messages_update_own" on public.messages for update using (auth.uid() = recipient_id);

-- ============================================================================
-- STORAGE (avatars only — no post images needed for this app)
-- ============================================================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;

create policy "avatars_bucket_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_bucket_insert" on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "avatars_bucket_update" on storage.objects for update using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- ============================================================================
-- Realtime — so new anonymous messages appear in the inbox live
-- ============================================================================
alter publication supabase_realtime add table public.messages;
