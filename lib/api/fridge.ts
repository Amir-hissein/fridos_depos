// Fridge API — the user's fridge ingredients (fridge_items table, RLS-scoped).

import { supabase } from '../supabase';

export async function listFridge(): Promise<string[]> {
  const { data, error } = await supabase
    .from('fridge_items')
    .select('name')
    .order('created_at', { ascending: true });
  if (error) {
    if (__DEV__) console.log('[fridge] list error:', error.message);
    return [];
  }
  return (data ?? []).map((r) => r.name as string);
}

export async function addFridgeItems(names: string[]): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid || names.length === 0) return;
  const rows = names.map((name) => ({ user_id: uid, name }));
  const { error } = await supabase
    .from('fridge_items')
    .upsert(rows, { onConflict: 'user_id,name' });
  if (error && __DEV__) console.log('[fridge] add error:', error.message);
}

export async function removeFridgeItem(name: string): Promise<void> {
  // RLS limits the delete to the current user's rows; name is unique per user.
  const { error } = await supabase.from('fridge_items').delete().eq('name', name);
  if (error && __DEV__) console.log('[fridge] remove error:', error.message);
}
