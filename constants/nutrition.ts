// Per-ingredient nutrition (per 100 g), used to compute recipe totals locally.
// Mirrors a future `ingredient_nutrition` Supabase table — deterministic, offline, free.
// Values are approximations based on common USDA references.

export interface IngredientNutrition {
  kcal: number;
  protein: number; // g per 100 g
  carbs: number; // g per 100 g
  fat: number; // g per 100 g
}

/** Keyed by normalized (lowercase, trimmed) ingredient name. */
export const INGREDIENT_NUTRITION: Record<string, IngredientNutrition> = {
  zucchini: { kcal: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  eggs: { kcal: 155, protein: 13, carbs: 1.1, fat: 11 },
  garlic: { kcal: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'goat cheese log': { kcal: 364, protein: 22, carbs: 0.1, fat: 30 },
  'heavy cream': { kcal: 340, protein: 2.8, carbs: 2.8, fat: 36 },
  tomatoes: { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  'curry powder': { kcal: 325, protein: 14, carbs: 56, fat: 14 },
  onions: { kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  basil: { kcal: 23, protein: 3.2, carbs: 2.7, fat: 0.6 },
  mozzarella: { kcal: 300, protein: 22, carbs: 2.2, fat: 22 },
  'olive oil': { kcal: 884, protein: 0, carbs: 0, fat: 100 },
};

/** Typical weight (g) of one "piece" of an ingredient, when listed in pcs. */
const PIECE_GRAMS: Record<string, number> = {
  zucchini: 196,
  eggs: 50,
  tomatoes: 123,
  onions: 110,
};

/** Generic culinary unit → grams. */
const UNIT_GRAMS: Record<string, number> = {
  clove: 3,
  leaves: 0.5,
  leaf: 0.5,
  bunch: 25,
  ball: 125,
  tbsp: 14,
  tsp: 3,
  cup: 240,
  oz: 28.35,
  pinch: 1,
};

/** Normalize an ingredient name for lookup. */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/** Parse the leading amount of a quantity string (handles "3", "1/2", "3/4", "1.5"). */
function parseAmount(quantity: string): number {
  const frac = quantity.match(/(\d+)\s*\/\s*(\d+)/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const dec = quantity.match(/\d+(\.\d+)?/);
  return dec ? Number(dec[0]) : 1;
}

/** Estimate the weight in grams for a recipe ingredient quantity. */
export function resolveGrams(name: string, quantity: string): number {
  const amount = parseAmount(quantity);
  const q = quantity.toLowerCase();
  for (const unit of Object.keys(UNIT_GRAMS)) {
    if (q.includes(unit)) return amount * UNIT_GRAMS[unit];
  }
  if (/\bpcs?\b|piece/.test(q)) {
    return amount * (PIECE_GRAMS[normalizeName(name)] ?? 100);
  }
  return amount * 100; // fallback
}
