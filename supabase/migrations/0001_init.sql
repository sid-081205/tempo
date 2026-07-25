-- Tempo initial schema
-- Run with: supabase db push  (or paste into the Supabase SQL editor)

-- Profiles: one row per auth user.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  autonomy_level smallint not null default 1 check (autonomy_level between 0 and 3),
  goals text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Connected sources (calendar, gmail, wearables, ...).
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  kind text not null check (kind in ('context', 'health')),
  status text not null default 'connected' check (status in ('connected', 'paused', 'error')),
  connected_at timestamptz not null default now(),
  unique (user_id, provider)
);

-- People context: who the names in the calendar actually are.
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  relation text,
  hr_delta numeric,
  effect text check (effect in ('restores', 'neutral', 'elevates')),
  note text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

-- Calendar events (synced from connectors).
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  external_id text,
  title text not null,
  kind text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  attendee_ids uuid[] not null default '{}',
  hr_delta numeric,
  recovery_min integer,
  effect text check (effect in ('restores', 'neutral', 'elevates')),
  impact_summary text,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

-- Raw physiological samples (heart rate, HRV, temperature, ...).
create table if not exists public.health_samples (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null,
  metric text not null,
  value numeric not null,
  recorded_at timestamptz not null
);
create index if not exists health_samples_user_metric_time
  on public.health_samples (user_id, metric, recorded_at desc);

-- Daily rollups.
create table if not exists public.daily_metrics (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  hrv numeric,
  resting_hr numeric,
  sleep_hours numeric,
  sleep_score numeric,
  energy numeric,
  strain numeric,
  meeting_hours numeric,
  primary key (user_id, day)
);

-- Manual check-ins (WHOOP-journal style).
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mood smallint check (mood between 1 and 5),
  energy smallint check (energy between 1 and 5),
  symptoms text[],
  note text,
  created_at timestamptz not null default now()
);

-- Generated insights.
create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('trends', 'schedule', 'future')),
  title text not null,
  body text not null,
  stat text,
  stat_label text,
  action text,
  status text not null default 'active' check (status in ('active', 'done', 'dismissed')),
  created_at timestamptz not null default now()
);

-- Chat history.
create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Row level security: users only see their own rows.
alter table public.profiles enable row level security;
alter table public.connections enable row level security;
alter table public.people enable row level security;
alter table public.events enable row level security;
alter table public.health_samples enable row level security;
alter table public.daily_metrics enable row level security;
alter table public.checkins enable row level security;
alter table public.insights enable row level security;
alter table public.chat_messages enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own connections" on public.connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own people" on public.people
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own events" on public.events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own health_samples" on public.health_samples
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own daily_metrics" on public.daily_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own checkins" on public.checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own insights" on public.insights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own chat_messages" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create a profile on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
