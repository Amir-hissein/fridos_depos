-- Migration 001 — favorites.recipe_id → text
-- The recipe catalog is client-side with string ids (slugs / "custom_…"), not
-- DB uuids. So favorites store the recipe id as text, without a FK to recipes.
-- Run this in the Supabase SQL editor.

alter table public.favorites drop constraint if exists favorites_recipe_id_fkey;
alter table public.favorites alter column recipe_id type text;
