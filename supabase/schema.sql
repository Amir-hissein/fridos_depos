-- ============================================================================
-- Fridos — Supabase schema (run in the Supabase SQL editor)
-- ----------------------------------------------------------------------------
-- Design notes:
--  * Every user-owned table has RLS so a user only ever sees their own rows.
--  * Auth is Supabase Auth (auth.users). `profiles` is the 1:1 app-side row.
--  * Daily tracking is DATE-based (not the demo "weekly 0-6" model). The app's
--    weekly state maps to real calendar dates: weeklyIntake[i] -> log_date.
--  * Per-meal calories/macros are NORMALIZED into meal_entries (one row per
--    logged item). A slot's total = SUM of its entries for that date.
-- ============================================================================

-- gen_random_uuid() is available on Supabase out of the box (pgcrypto).

-- ────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES  (extends auth.users 1:1)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  full_name         text,
  email             text,
  -- onboarding / goal data (services/plan.ts UserProfile)
  sex               text check (sex in ('male','female')),
  height_cm         numeric,
  age               int,
  current_weight_kg numeric,
  target_weight_kg  numeric,
  activity          text check (activity in ('sedentary','active','cardio')),
  goal_pace         text check (goal_pace in ('easy','medium','hard')),
  daily_steps_goal  int default 8000,
  diet              text check (diet in ('healthy','keto','vegan','glutenfree','vegetarian')) default 'healthy',
  -- app state
  allergen_mode     text check (allergen_mode in ('warn','hide')) default 'warn',
  locale            text default 'tr',
  onboarding_done   boolean default false,
  is_premium        boolean default false,  -- cached; RevenueCat is source of truth
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. DAILY_LOGS  (one row per user per day: water, steps, weigh-in)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.daily_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  log_date    date not null,
  water_ml    int  default 0,
  steps       int  default 0,
  weight_kg   numeric,            -- the day's weigh-in (weight history = order by log_date)
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id, log_date)
);
create index if not exists daily_logs_user_date_idx on public.daily_logs (user_id, log_date);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. RECIPES  (global catalog + user custom recipes)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.recipes (
  id          text primary key,   -- client-generated ids (slugs / "custom_<ts>")
  created_by  uuid references auth.users(id) on delete cascade, -- null = seeded/global
  name        text not null,
  time_min    int,
  difficulty  text,
  kcal        int,
  protein_g   numeric,
  carbs_g     numeric,
  fat_g       numeric,
  meal_type   text,               -- breakfast/lunch/dinner/snack/any
  servings    int default 1,
  emoji       text,
  image_url   text,
  bg_color    text,
  tag         text,
  filters     text[] default '{}',
  categories  text[] default '{}',
  created_at  timestamptz default now()
);
create index if not exists recipes_created_by_idx on public.recipes (created_by);

create table if not exists public.recipe_ingredients (
  id         uuid primary key default gen_random_uuid(),
  recipe_id  text not null references public.recipes(id) on delete cascade,
  name       text not null,
  quantity   text,
  position   int default 0
);
create index if not exists recipe_ingredients_recipe_idx on public.recipe_ingredients (recipe_id);

create table if not exists public.recipe_steps (
  id         uuid primary key default gen_random_uuid(),
  recipe_id  text not null references public.recipes(id) on delete cascade,
  step_no    int not null,
  text       text not null
);
create index if not exists recipe_steps_recipe_idx on public.recipe_steps (recipe_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. MEAL_ENTRIES  (each logged item for a meal slot on a date)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.meal_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  log_date   date not null,
  slot       text not null check (slot in ('breakfast','lunch','dinner','snack')),
  source     text not null check (source in ('recipe','scan','custom','quick')) default 'quick',
  recipe_id  text references public.recipes(id) on delete set null,
  name       text,               -- label for scan/quick/custom entries
  kcal       int  not null default 0,
  protein_g  numeric default 0,
  carbs_g    numeric default 0,
  fat_g      numeric default 0,
  created_at timestamptz default now()
);
create index if not exists meal_entries_user_date_idx on public.meal_entries (user_id, log_date);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. FAVORITES
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.favorites (
  user_id    uuid not null references auth.users(id) on delete cascade,
  recipe_id  text not null,   -- client-side recipe id (slug / "custom_<ts>"); no FK
  created_at timestamptz default now(),
  primary key (user_id, recipe_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. FRIDGE_ITEMS
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.fridge_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz default now(),
  unique (user_id, name)
);
create index if not exists fridge_items_user_idx on public.fridge_items (user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. SHOPPING_ITEMS
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.shopping_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  category   text,
  checked    boolean default false,
  created_at timestamptz default now()
);
create index if not exists shopping_items_user_idx on public.shopping_items (user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 8. USER_ALLERGENS  (selected allergen ids; catalog stays client-side)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.user_allergens (
  user_id     uuid not null references auth.users(id) on delete cascade,
  allergen_id text not null,
  primary key (user_id, allergen_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 9. NOTIFICATION_PREFS  (1:1)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.notification_prefs (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  enabled    boolean default false,
  hydration  boolean default true,
  meals      boolean default true,
  recap      boolean default true,
  updated_at timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 10. SCAN_HISTORY  (optional — AI plate / fridge scans)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.scan_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('meal','fridge')),
  image_url  text,
  result     jsonb,
  created_at timestamptz default now()
);
create index if not exists scan_history_user_idx on public.scan_history (user_id, created_at desc);

-- ────────────────────────────────────────────────────────────────────────────
-- 11. SUBSCRIPTIONS  (optional — cached RevenueCat entitlement)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  is_active   boolean default false,
  plan        text,               -- 'monthly' | 'annual'
  provider    text default 'revenuecat',
  expires_at  timestamptz,
  updated_at  timestamptz default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles           enable row level security;
alter table public.daily_logs         enable row level security;
alter table public.recipes            enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_steps       enable row level security;
alter table public.meal_entries       enable row level security;
alter table public.favorites          enable row level security;
alter table public.fridge_items       enable row level security;
alter table public.shopping_items     enable row level security;
alter table public.user_allergens     enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.scan_history       enable row level security;
alter table public.subscriptions      enable row level security;

-- Helper macro pattern: owner-only access on user_id = auth.uid()
-- profiles uses id = auth.uid()
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own daily_logs" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own meal_entries" on public.meal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own favorites" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own fridge_items" on public.fridge_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own shopping_items" on public.shopping_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own user_allergens" on public.user_allergens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own notification_prefs" on public.notification_prefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own scan_history" on public.scan_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);
-- subscriptions are written by a trusted server (service role) from RevenueCat webhooks.

-- Recipes: everyone can read global + their own; users write only their own.
create policy "read recipes" on public.recipes
  for select using (created_by is null or created_by = auth.uid());
create policy "insert own recipes" on public.recipes
  for insert with check (created_by = auth.uid());
create policy "update own recipes" on public.recipes
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "delete own recipes" on public.recipes
  for delete using (created_by = auth.uid());

-- Recipe children inherit access from their parent recipe.
create policy "read recipe_ingredients" on public.recipe_ingredients
  for select using (exists (
    select 1 from public.recipes r where r.id = recipe_id
      and (r.created_by is null or r.created_by = auth.uid())));
create policy "write recipe_ingredients" on public.recipe_ingredients
  for all using (exists (
    select 1 from public.recipes r where r.id = recipe_id and r.created_by = auth.uid()))
  with check (exists (
    select 1 from public.recipes r where r.id = recipe_id and r.created_by = auth.uid()));

create policy "read recipe_steps" on public.recipe_steps
  for select using (exists (
    select 1 from public.recipes r where r.id = recipe_id
      and (r.created_by is null or r.created_by = auth.uid())));
create policy "write recipe_steps" on public.recipe_steps
  for all using (exists (
    select 1 from public.recipes r where r.id = recipe_id and r.created_by = auth.uid()))
  with check (exists (
    select 1 from public.recipes r where r.id = recipe_id and r.created_by = auth.uid()));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-create a profile + notification_prefs row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email)
  on conflict (id) do nothing;

  insert into public.notification_prefs (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at fresh on mutable tables.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_updated   on public.profiles;
create trigger profiles_updated   before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists daily_logs_updated on public.daily_logs;
create trigger daily_logs_updated before update on public.daily_logs
  for each row execute function public.set_updated_at();

-- ============================================================================
-- DONE. Next: seed `recipes` (created_by = null) from constants/recipes.ts.
-- ============================================================================
