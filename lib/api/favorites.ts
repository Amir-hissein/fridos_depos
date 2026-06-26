// Favorites API — favourite recipe ids (favorites table, RLS-scoped).
// recipe_id is text (the client-side recipe slug), see migration 001.

import { supabase } from '../supabase';

export async function listFavorites(): Promise<string[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('recipe_id')
    .order('created_at', { ascending: true });
  if (error) {
    if (__DEV__) console.log('[favorites] list error:', error.message);
    return [];
  }
  return (data ?? []).map(r => r.recipe_id as string);
}

export async function addFavorite(recipeId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return;
  const { error } = await supabase
    .from('favorites')
    .upsert({ user_id: uid, recipe_id: recipeId }, { onConflict: 'user_id,recipe_id' });
  if (error && __DEV__) console.log('[favorites] add error:', error.message);
}

export async function removeFavorite(recipeId: string): Promise<void> {
  const { error } = await supabase.from('favorites').delete().eq('recipe_id', recipeId);
  if (error && __DEV__) console.log('[favorites] remove error:', error.message);
}
