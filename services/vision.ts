// Vision service — turns a photo into either a list of fridge ingredients
// (detect-ingredients) or a plated-meal nutrition estimate (detect-meal).
//
// The app never calls the AI directly: each function resizes the image, POSTs it
// to a Supabase Edge Function (which holds the Anthropic key), and maps the JSON
// back to our types. All failure modes throw a typed `VisionError` so screens
// can show a precise state (loading / empty / error + retry). Set
// `VISION_OFFLINE_MOCK = true` to demo offline without a deployed backend.

import { Colors } from '../constants/colors';
import { supabase } from '../lib/supabase';
import { prepareImageForUpload } from '../lib/image';

/** Flip to true to bypass the backend and use canned data (offline dev/demo). */
const VISION_OFFLINE_MOCK = false;

/** Max time to wait for an analysis before failing with a timeout. */
const ANALYZE_TIMEOUT_MS = 30_000;

export type VisionErrorReason = 'no_image' | 'network' | 'analysis' | 'timeout';

/** Typed failure so the UI can react precisely (retry, manual add, etc.). */
export class VisionError extends Error {
  reason: VisionErrorReason;
  constructor(reason: VisionErrorReason, message?: string) {
    super(message ?? reason);
    this.name = 'VisionError';
    this.reason = reason;
  }
}

export interface DetectedIngredient {
  id: string;
  name: string;
  emoji: string;
  confidence: number; // 0–100
  bg: string;
  default: boolean; // pre-checked in the review screen
}

const MOCK_DETECTIONS: DetectedIngredient[] = [
  { id: 'd1', emoji: '🍅', name: 'Tomatoes', confidence: 98, bg: Colors.greenLight, default: true },
  { id: 'd2', emoji: '🥚', name: 'Eggs', confidence: 95, bg: Colors.goldLight, default: true },
  { id: 'd3', emoji: '🥬', name: 'Zucchini', confidence: 91, bg: Colors.greenLight, default: true },
  { id: 'd4', emoji: '🧀', name: 'Mozzarella', confidence: 64, bg: Colors.goldLight, default: false },
  { id: 'd5', emoji: '🧄', name: 'Garlic', confidence: 88, bg: Colors.goldLight, default: true },
  { id: 'd6', emoji: '🫒', name: 'Olive oil', confidence: 82, bg: Colors.greenLight, default: true },
];

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/* ── Shared analysis pipeline ───────────────────────────────────── */

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new VisionError('timeout')), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

/** Resize → invoke the Edge Function → return its parsed JSON, or throw VisionError. */
async function analyze(fn: 'detect-meal' | 'detect-ingredients', uri: string): Promise<any> {
  let prepared;
  try {
    prepared = await prepareImageForUpload(uri);
  } catch (e) {
    if (__DEV__) console.log('[vision] image prep failed:', e);
    throw new VisionError('no_image');
  }

  let res: { data: any; error: any };
  try {
    res = await withTimeout(
      supabase.functions.invoke(fn, {
        body: { image: prepared.data, mediaType: prepared.mediaType },
      }),
      ANALYZE_TIMEOUT_MS,
    );
  } catch (e) {
    if (e instanceof VisionError) throw e; // timeout
    if (__DEV__) console.log(`[vision] ${fn} transport error:`, e);
    throw new VisionError('network', String((e as Error)?.message ?? e));
  }

  if (res.error) {
    if (__DEV__) console.log(`[vision] ${fn} returned error:`, res.error.message);
    throw new VisionError('network', res.error.message);
  }
  if (!res.data || res.data.error) {
    if (__DEV__) console.log(`[vision] ${fn} analysis error:`, res.data?.error);
    throw new VisionError('analysis', res.data?.error);
  }
  return res.data;
}

/* ── Ingredients (fridge scan) ──────────────────────────────────── */

function ingredientBg(confidence: number): string {
  if (confidence >= 85) return Colors.greenLight;
  if (confidence >= 65) return Colors.goldLight;
  return Colors.orangeLight;
}

function normalizeIngredients(d: any): DetectedIngredient[] {
  const arr = Array.isArray(d?.items) ? d.items : [];
  return arr
    .map((it: any, i: number) => {
      const raw = typeof it?.confidence === 'number' ? it.confidence : 50;
      const confidence = Math.max(0, Math.min(100, Math.round(raw)));
      return {
        id: `d${i + 1}`,
        name: String(it?.name ?? '').trim(),
        emoji: String(it?.emoji ?? '🥗'),
        confidence,
        bg: ingredientBg(confidence),
        default: confidence >= 70,
      };
    })
    .filter((x: DetectedIngredient) => x.name.length > 0);
}

/**
 * Detect ingredients from a captured/selected image.
 * Throws `VisionError` on failure; returns `[]` when no food is recognized.
 */
export async function detectIngredients(imageUri?: string): Promise<DetectedIngredient[]> {
  if (VISION_OFFLINE_MOCK) {
    await delay(400);
    return MOCK_DETECTIONS;
  }
  if (!imageUri) throw new VisionError('no_image');
  return normalizeIngredients(await analyze('detect-ingredients', imageUri));
}

/* ── Meal (plate scan) ──────────────────────────────────────────── */

export type NutriScore = 'A' | 'B' | 'C' | 'D' | 'E';

/** A single food item identified on the plate. */
export interface MealItem {
  id: string;
  /** i18n key suffix under `scan.mealResult.items.*`; falls back to `name`. */
  key: string;
  name: string;
  emoji: string;
  grams: number;
  kcal: number;
}

export interface DetectedMeal {
  name: string;
  emoji: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  confidence: number;
  nutriScore: NutriScore;
  items: MealItem[];
}

/** Offline / demo estimate (only used when VISION_OFFLINE_MOCK is true). */
const MOCK_MEAL: DetectedMeal = {
  name: 'Grilled chicken & veggies',
  emoji: '🍗',
  kcal: 442,
  protein: 38,
  carbs: 26,
  fat: 19,
  fiber: 6,
  sugar: 8,
  confidence: 92,
  nutriScore: 'A',
  items: [
    { id: 'm1', key: 'grilled_chicken', name: 'Grilled chicken', emoji: '🍗', grams: 150, kcal: 220 },
    { id: 'm2', key: 'broccoli', name: 'Broccoli', emoji: '🥦', grams: 80, kcal: 55 },
    { id: 'm3', key: 'basmati_rice', name: 'Basmati rice', emoji: '🍚', grams: 120, kcal: 145 },
    { id: 'm4', key: 'olive_oil', name: 'Olive oil', emoji: '🫒', grams: 5, kcal: 22 },
  ],
};

/** Coerce the Edge Function's JSON into a safe DetectedMeal (ids, clamps, defaults). */
function normalizeMeal(m: any): DetectedMeal {
  const num = (v: any, d = 0) => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.round(v)) : d);
  const items: MealItem[] = Array.isArray(m?.items)
    ? m.items.map((it: any, i: number) => ({
        id: `m${i + 1}`,
        key: String(it?.key ?? ''),
        name: String(it?.name ?? ''),
        emoji: String(it?.emoji ?? '🍽️'),
        grams: num(it?.grams),
        kcal: num(it?.kcal),
      }))
    : [];
  const score = ['A', 'B', 'C', 'D', 'E'].includes(m?.nutriScore) ? m.nutriScore : 'C';
  return {
    name: String(m?.name ?? 'Meal'),
    emoji: String(m?.emoji ?? '🍽️'),
    kcal: num(m?.kcal),
    protein: num(m?.protein),
    carbs: num(m?.carbs),
    fat: num(m?.fat),
    fiber: num(m?.fiber),
    sugar: num(m?.sugar),
    confidence: num(m?.confidence, 80),
    nutriScore: score as NutriScore,
    items,
  };
}

/**
 * Estimate the calories, macros & per-item breakdown of a plated meal from a photo.
 * Throws `VisionError` on failure. All numbers describe the meal at portion = 1×;
 * the UI scales them when the user adjusts the portion slider.
 */
export async function detectMeal(imageUri?: string): Promise<DetectedMeal> {
  if (VISION_OFFLINE_MOCK) {
    await delay(500);
    return MOCK_MEAL;
  }
  if (!imageUri) throw new VisionError('no_image');
  return normalizeMeal(await analyze('detect-meal', imageUri));
}

/** A detected meal scaled to a chosen portion — all numbers ready to display/log. */
export interface ScaledMeal {
  portion: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  items: MealItem[];
}

/**
 * The AI estimate is anchored at portion = 1×. This is the single place that
 * turns it into the calories/macros the user actually logs once they adjust the
 * portion — keep this logic out of the screens so the value that hits the
 * calorie tracker always comes from here.
 */
export function scaleMeal(meal: DetectedMeal, portion: number): ScaledMeal {
  const r = (n: number) => Math.round(n * portion);
  return {
    portion,
    kcal: r(meal.kcal),
    protein: r(meal.protein),
    carbs: r(meal.carbs),
    fat: r(meal.fat),
    fiber: r(meal.fiber),
    sugar: r(meal.sugar),
    items: meal.items.map(it => ({ ...it, grams: r(it.grams), kcal: r(it.kcal) })),
  };
}
