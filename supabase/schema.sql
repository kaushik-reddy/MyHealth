-- ============================================================
--  MyHealth — Supabase schema
--  Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
--  It is safe to re-run; objects use IF NOT EXISTS / OR REPLACE.
-- ============================================================

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  full_name            text,
  sex                  text not null default 'male' check (sex in ('male','female')),
  age                  int  not null default 30,
  height_cm            numeric not null default 170,
  start_weight_kg      numeric not null default 80,
  current_weight_kg    numeric not null default 80,
  goal_weight_kg       numeric not null default 75,
  goal_type            text not null default 'lose' check (goal_type in ('lose','maintain','gain')),
  activity_level       text not null default 'light',
  weekly_rate_kg       numeric not null default 0.5,
  daily_calorie_target int  not null default 2000,
  daily_sugar_limit_g  numeric not null default 30,
  daily_step_goal      int  not null default 8000,
  daily_water_goal_ml  int  not null default 2500,
  daily_protein_goal_g int  not null default 90,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ---------- DAILY LOGS ----------
create table if not exists public.daily_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  log_date        date not null,
  steps           int     not null default 0,
  distance_km     numeric not null default 0,
  active_calories numeric not null default 0,
  calories_intake numeric not null default 0,
  sugar_g         numeric not null default 0,
  protein_g       numeric not null default 0,
  water_ml        int     not null default 0,
  weight_kg       numeric,
  mood            text,
  notes           text,
  created_at      timestamptz not null default now(),
  unique (user_id, log_date)
);

-- ---------- FOOD ENTRIES ----------
create table if not exists public.food_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  log_date   date not null,
  name       text not null,
  meal_type  text not null default 'snack' check (meal_type in ('breakfast','lunch','dinner','snack')),
  calories   numeric not null default 0,
  sugar_g    numeric not null default 0,
  protein_g  numeric not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- SUGAR ITEMS (avoid list) ----------
create table if not exists public.sugar_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  sugar_g      numeric not null default 0,
  category     text,
  avoid        boolean not null default false,
  times_logged int not null default 0,
  note         text,
  created_at   timestamptz not null default now()
);

-- ---------- WEIGHT ENTRIES ----------
create table if not exists public.weight_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  weight_kg  numeric not null,
  unique (user_id, entry_date)
);

-- Helpful indexes.
create index if not exists idx_daily_logs_user_date on public.daily_logs (user_id, log_date);
create index if not exists idx_food_entries_user_date on public.food_entries (user_id, log_date);
create index if not exists idx_sugar_items_user on public.sugar_items (user_id);
create index if not exists idx_weight_entries_user on public.weight_entries (user_id, entry_date);

-- ============================================================
--  Row Level Security — every table is private to its owner
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.daily_logs     enable row level security;
alter table public.food_entries   enable row level security;
alter table public.sugar_items    enable row level security;
alter table public.weight_entries enable row level security;

-- profiles: id == auth.uid()
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- generic user_id == auth.uid() policies
drop policy if exists "own daily_logs" on public.daily_logs;
create policy "own daily_logs" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own food_entries" on public.food_entries;
create policy "own food_entries" on public.food_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own sugar_items" on public.sugar_items;
create policy "own sugar_items" on public.sugar_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own weight_entries" on public.weight_entries;
create policy "own weight_entries" on public.weight_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
--  Auto-create a blank profile row when a user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
