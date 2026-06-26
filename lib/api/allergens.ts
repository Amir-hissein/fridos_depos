// Allergens API — selected allergen ids (user_allergens) + the warn/hide mode
// which lives on the profiles row.

import { supabase } from '../supabase';
import type { AllergenMode } from '../../context/AllergenContext';

export async function listAllergens(): Promise<string[]> {
  const { data, error } = await supabase.from('user_allergens').select('allergen_id');
  if (error) {
    if (__DEV__) console.log('[allergens] list error:', error.message);
    return [];
  }
  return (data ?? []).map(r => r.allergen_id as string);
}

export async function addAllergen(allergenId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return;
  const { error } = await supabase
    .from('user_allergens')
    .upsert({ user_id: uid, allergen_id: allergenId }, { onConflict: 'user_id,allergen_id' });
  if (error && __DEV__) console.log('[allergens] add error:', error.message);
}

export async function removeAllergen(allergenId: string): Promise<void> {
  const { error } = await supabase.from('user_allergens').delete().eq('allergen_id', allergenId);
  if (error && __DEV__) console.log('[allergens] remove error:', error.message);
}

/** Replace the whole selection (used by the "select all / set" action). */
export async function setAllergens(ids: string[]): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return;
  // Clear then insert the new set — simplest consistent "replace".
  await supabase.from('user_allergens').delete().eq('user_id', uid);
  if (ids.length) {
    const rows = ids.map(allergen_id => ({ user_id: uid, allergen_id }));
    const { error } = await supabase.from('user_allergens').insert(rows);
    if (error && __DEV__) console.log('[allergens] set error:', error.message);
  }
}

export async function getAllergenMode(): Promise<AllergenMode | null> {
  const { data, error } = await supabase.from('profiles').select('allergen_mode').maybeSingle();
  if (error) {
    if (__DEV__) console.log('[allergens] getMode error:', error.message);
    return null;
  }
  return (data?.allergen_mode as AllergenMode) ?? null;
}

export async function setAllergenMode(mode: AllergenMode): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return;
  const { error } = await supabase.from('profiles').update({ allergen_mode: mode }).eq('id', uid);
  if (error && __DEV__) console.log('[allergens] setMode error:', error.message);
}
