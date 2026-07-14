// Vision service — bridges the scan screens to the Supabase Edge Functions
// (`detect-ingredients` / `detect-meal`), which run Claude vision server-side so
// the Anthropic key never ships in the app. The image is downscaled + base64'd
// on-device first (see lib/image), then posted to the function.

import { Colors } from '../constants/colors';
import { supabase } from '../lib/supabase';
import { prepareImageForUpload } from '../lib/image';

export interface DetectedIngredient {
  id: string;
  name: string;
  emoji: string;
  confidence: number; // 0–100
  bg: string;
  default: boolean; // pre-checked in the review screen
}

/** Confidence at/above which an item is pre-checked in the review screen. */
const PRECHECK_THRESHOLD = 70;

/** Rotating set of soft tints so the detected chips aren't monochrome. */
const CHIP_BGS = [Colors.greenLight, Colors.goldLight, Colors.orangeLight];

/** A vision request failed — screens catch this and show the error/retry state. */
export class VisionError extends Error {
  constructor(
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'VisionError';
  }
}

/** Raw item shape returned by the `detect-ingredients` Edge Function. */
interface RawIngredient {
  name: string;
  emoji?: string;
  confidence?: number;
}

/**
 * Detect food ingredients in a fridge/pantry photo via the Edge Function.
 * Throws {@link VisionError} on a missing image, a transport/server error, or a
 * malformed response so the caller can show the retry UI.
 */
export async function detectIngredients(imageUri?: string): Promise<DetectedIngredient[]> {
  if (!imageUri) throw new VisionError('missing_image');

  const { data: image, mediaType } = await prepareImageForUpload(imageUri).catch(() => {
    throw new VisionError('image_encode_failed');
  });

  const { data, error } = await supabase.functions.invoke('detect-ingredients', {
    body: { image, mediaType },
  });
  if (error) throw new VisionError('request_failed', error.message);
  if (data?.error) throw new VisionError(String(data.error));

  const items: RawIngredient[] = Array.isArray(data?.items) ? data.items : [];
  return items
    .filter((it) => it && typeof it.name === 'string' && it.name.trim().length > 0)
    .map((it, i) => {
      const confidence = clampConfidence(it.confidence);
      return {
        id: `det_${i}_${slug(it.name)}`,
        name: it.name.trim(),
        emoji: it.emoji?.trim() || '🥗',
        confidence,
        bg: CHIP_BGS[i % CHIP_BGS.length],
        default: confidence >= PRECHECK_THRESHOLD,
      };
    });
}

const clampConfidence = (n: unknown): number => {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : 50;
  return Math.min(100, Math.max(0, v));
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

export type NutriScore = 'A' | 'B' | 'C' | 'D' | 'E';

export interface MealItem {
  id: string;
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

const NUTRI_SCORES: NutriScore[] = ['A', 'B', 'C', 'D', 'E'];
const num = (n: unknown): number =>
  typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : 0;

/**
 * Detect a plated meal (dish, per-item breakdown, calories + macros at 1×
 * portion) via the `detect-meal` Edge Function. Throws {@link VisionError} on a
 * missing image, transport/server error, or malformed response.
 */
export async function detectMeal(imageUri?: string): Promise<DetectedMeal> {
  if (!imageUri) throw new VisionError('missing_image');

  const { data: image, mediaType } = await prepareImageForUpload(imageUri).catch(() => {
    throw new VisionError('image_encode_failed');
  });

  const { data, error } = await supabase.functions.invoke('detect-meal', {
    body: { image, mediaType },
  });
  if (error) throw new VisionError('request_failed', error.message);
  if (data?.error) throw new VisionError(String(data.error));
  if (!data || typeof data.name !== 'string') throw new VisionError('invalid_response');

  const rawItems: any[] = Array.isArray(data.items) ? data.items : [];
  return {
    name: data.name.trim(),
    emoji: typeof data.emoji === 'string' && data.emoji.trim() ? data.emoji.trim() : '🍽️',
    kcal: num(data.kcal),
    protein: num(data.protein),
    carbs: num(data.carbs),
    fat: num(data.fat),
    fiber: num(data.fiber),
    sugar: num(data.sugar),
    confidence: clampConfidence(data.confidence),
    nutriScore: NUTRI_SCORES.includes(data.nutriScore) ? data.nutriScore : 'C',
    items: rawItems
      .filter((it) => it && typeof it.name === 'string')
      .map((it, i) => ({
        id: `mi_${i}_${slug(it.name)}`,
        key: typeof it.key === 'string' && it.key ? it.key : slug(it.name),
        name: it.name.trim(),
        emoji: typeof it.emoji === 'string' && it.emoji.trim() ? it.emoji.trim() : '🍴',
        grams: num(it.grams),
        kcal: num(it.kcal),
      })),
  };
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
    items: meal.items.map((it) => ({ ...it, grams: r(it.grams), kcal: r(it.kcal) })),
  };
}
