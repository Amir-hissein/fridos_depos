// Profile API — reads/updates the current user's `profiles` row. RLS guarantees
// a user can only ever touch their own row, so queries don't need an explicit
// owner filter (we add one on update for clarity).

import { supabase } from '../supabase';

export interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  sex: string | null;
  height_cm: number | null;
  age: number | null;
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  activity: string | null;
  goal_pace: string | null;
  daily_steps_goal: number | null;
  diet: string | null;
  allergen_mode: string | null;
  locale: string | null;
  onboarding_done: boolean | null;
  is_premium: boolean | null;
}

/** Fetch the signed-in user's profile (null if none / not authenticated). */
export async function getMyProfile(): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from('profiles').select('*').maybeSingle();
  if (error) {
    if (__DEV__) console.log('[profile] getMyProfile error:', error.message);
    return null;
  }
  return data as ProfileRow | null;
}

/** Update fields on the signed-in user's profile and return the new row. */
export async function updateMyProfile(patch: Partial<ProfileRow>): Promise<ProfileRow | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', uid)
    .select()
    .maybeSingle();
  if (error) {
    if (__DEV__) console.log('[profile] updateMyProfile error:', error.message);
    throw error;
  }
  return data as ProfileRow | null;
}
