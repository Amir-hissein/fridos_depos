// Tracking API — daily logs (water/steps/weight) + meal entries (calories/macros).
// The app's weekday index (0=Mon..6=Sun) maps to real ISO dates of the current
// week; this module reads/writes those dates. Meal slots are persisted as
// normalized meal_entries (one row per item); a slot is re-synced as a whole.

import { supabase } from '../supabase';

export type Slot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** ISO dates Mon..Sun for the week containing `ref` (default: today, local). */
export function weekDates(ref: Date = new Date()): string[] {
  const dow = (ref.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(ref);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(ref.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toISO(d);
  });
}

export interface DayLogRow {
  log_date: string;
  water_ml: number;
  steps: number;
  weight_kg: number | null;
}

export interface MealEntryRow {
  log_date: string;
  slot: Slot;
  source: string;
  recipe_id: string | null;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

/** Fetch all daily logs + meal entries for the given dates. */
export async function getWeek(
  dates: string[],
): Promise<{ logs: DayLogRow[]; entries: MealEntryRow[] }> {
  const [logsRes, entriesRes] = await Promise.all([
    supabase.from('daily_logs').select('log_date,water_ml,steps,weight_kg').in('log_date', dates),
    supabase
      .from('meal_entries')
      .select('log_date,slot,source,recipe_id,kcal,protein_g,carbs_g,fat_g')
      .in('log_date', dates),
  ]);
  if (logsRes.error && __DEV__) console.log('[tracking] getWeek logs:', logsRes.error.message);
  if (entriesRes.error && __DEV__) console.log('[tracking] getWeek entries:', entriesRes.error.message);
  return {
    logs: (logsRes.data ?? []) as DayLogRow[],
    entries: (entriesRes.data ?? []) as MealEntryRow[],
  };
}

/**
 * Earliest recorded weigh-in (the "starting weight" for progress).
 * Weight history = `daily_logs` ordered by `log_date`; the first non-null
 * `weight_kg` is the baseline. Returns null when the user has no weigh-in yet.
 */
export async function getStartWeight(): Promise<number | null> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('weight_kg')
    .not('weight_kg', 'is', null)
    .order('log_date', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (__DEV__) console.log('[tracking] getStartWeight:', error.message);
    return null;
  }
  return (data?.weight_kg ?? null) as number | null;
}

/** Upsert water/steps/weight for a date. */
export async function upsertDayLog(
  date: string,
  patch: Partial<Pick<DayLogRow, 'water_ml' | 'steps' | 'weight_kg'>>,
): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return;
  const { error } = await supabase
    .from('daily_logs')
    .upsert({ user_id: uid, log_date: date, ...patch }, { onConflict: 'user_id,log_date' });
  if (error && __DEV__) console.log('[tracking] upsertDayLog:', error.message);
}

export interface SlotEntryInput {
  source: string;
  recipe_id?: string | null;
  kcal: number;
  macros?: { protein: number; carbs: number; fat: number } | null;
}

/** Replace all meal entries for a (date, slot) with the given set. */
export async function syncSlot(date: string, slot: Slot, entries: SlotEntryInput[]): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return;
  await supabase.from('meal_entries').delete().eq('log_date', date).eq('slot', slot);
  if (entries.length) {
    const rows = entries.map(e => ({
      user_id: uid,
      log_date: date,
      slot,
      source: e.source,
      recipe_id: e.recipe_id ?? null,
      kcal: Math.round(e.kcal),
      protein_g: e.macros?.protein ?? 0,
      carbs_g: e.macros?.carbs ?? 0,
      fat_g: e.macros?.fat ?? 0,
    }));
    const { error } = await supabase.from('meal_entries').insert(rows);
    if (error && __DEV__) console.log('[tracking] syncSlot insert:', error.message);
  }
}
