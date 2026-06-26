-- Migration 002 — recipes.id → text
-- Custom recipes use client-generated string ids ("custom_<timestamp>"), so the
-- recipes primary key (and the child FKs) must be text rather than uuid.
-- Run this in the Supabase SQL editor (after 001).

alter table public.recipe_ingredients drop constraint if exists recipe_ingredients_recipe_id_fkey;
alter table public.recipe_steps       drop constraint if exists recipe_steps_recipe_id_fkey;

alter table public.recipes            alter column id drop default;
alter table public.recipes            alter column id type text using id::text;
alter table public.recipe_ingredients alter column recipe_id type text using recipe_id::text;
alter table public.recipe_steps       alter column recipe_id type text using recipe_id::text;

alter table public.recipe_ingredients
  add constraint recipe_ingredients_recipe_id_fkey
  foreign key (recipe_id) references public.recipes(id) on delete cascade;
alter table public.recipe_steps
  add constraint recipe_steps_recipe_id_fkey
  foreign key (recipe_id) references public.recipes(id) on delete cascade;
