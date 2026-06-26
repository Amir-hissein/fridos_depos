// Vision service — turns a fridge photo into a list of detected ingredients.
//
// IMPORTANT (production): the app must NEVER call the Anthropic API directly.
// This function will POST the image to a Supabase Edge Function `detect-ingredients`
// that holds the API key, runs the vision model, and returns ONLY a JSON array of
// `{ name, confidence }`. Parse it defensively (try/catch, strip ``` fences).
//
// Today it returns a deterministic mock so the full UX works end-to-end offline.

import { Colors } from '../constants/colors';

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
  { id: 'd4', emoji: '🧀', name: 'Mozzarella', confidence: 64, bg: '#f0efe9', default: false },
  { id: 'd5', emoji: '🧄', name: 'Garlic', confidence: 88, bg: Colors.goldLight, default: true },
  { id: 'd6', emoji: '🫒', name: 'Olive oil', confidence: 82, bg: Colors.greenLight, default: true },
];

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Detect ingredients from a captured/selected image.
 * @param imageUri local URI of the photo (unused by the mock).
 */
export async function detectIngredients(imageUri?: string): Promise<DetectedIngredient[]> {
  // Simulated round-trip to the Edge Function.
  await delay(400);

  // --- Real implementation (sketch) ---
  // const res = await fetch(`${SUPABASE_URL}/functions/v1/detect-ingredients`, {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ image: base64 }),
  // });
  // const raw = await res.text();
  // return parseDetections(raw); // defensive JSON parse
  return MOCK_DETECTIONS;
}

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

/**
 * Estimate the calories, macros & per-item breakdown of a plated meal from a photo.
 * Mock today; later a Supabase Edge Function proxying a vision model.
 *
 * All numbers describe the meal at portion = 1×. The UI scales them when the
 * user adjusts the portion slider.
 */
export async function detectMeal(imageUri?: string): Promise<DetectedMeal> {
  await delay(500);
  return {
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
