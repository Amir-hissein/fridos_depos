// Shopping API — the user's shopping list (shopping_items table, RLS-scoped).

import { supabase } from '../supabase';

export interface ShoppingRow {
  id: string;
  name: string;
  category: string;
  checked: boolean;
}

export async function listShopping(): Promise<ShoppingRow[]> {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('id,name,category,checked')
    .order('created_at', { ascending: true });
  if (error) {
    if (__DEV__) console.log('[shopping] list error:', error.message);
    return [];
  }
  return (data ?? []) as ShoppingRow[];
}

export async function addShoppingItem(name: string, category: string): Promise<ShoppingRow | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from('shopping_items')
    .insert({ user_id: uid, name, category, checked: false })
    .select('id,name,category,checked')
    .single();
  if (error) {
    if (__DEV__) console.log('[shopping] add error:', error.message);
    return null;
  }
  return data as ShoppingRow;
}

export async function setShoppingChecked(id: string, checked: boolean): Promise<void> {
  const { error } = await supabase.from('shopping_items').update({ checked }).eq('id', id);
  if (error && __DEV__) console.log('[shopping] toggle error:', error.message);
}

export async function removeShoppingItem(id: string): Promise<void> {
  const { error } = await supabase.from('shopping_items').delete().eq('id', id);
  if (error && __DEV__) console.log('[shopping] remove error:', error.message);
}

export async function clearCheckedShopping(): Promise<void> {
  const { error } = await supabase.from('shopping_items').delete().eq('checked', true);
  if (error && __DEV__) console.log('[shopping] clear error:', error.message);
}
