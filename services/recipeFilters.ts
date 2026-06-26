// Recipe filtering service — calorie ranges, meal types, diet & allergen filters.
// Pure/local; operates on the in-memory RECIPES. Screens call these instead of
// filtering arrays inline so the rules stay consistent everywhere.

import { Recipe } from '../constants/recipes';
import { recipeHasUserAllergen } from './allergens';

export interface CalorieRange {
  min: number;
  max: number;
}

/** Parse "300-400kcal" / "300-400 kcal" / "800-1000" → { min, max }. */
export function parseCalorieRange(label: string): CalorieRange | null {
  const m = label.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return null;
  return { min: Number(m[1]), max: Number(m[2]) };
}

export function recipeInCalorieRange(recipe: Recipe, range: CalorieRange): boolean {
  return recipe.kcal >= range.min && recipe.kcal <= range.max;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** Recipe categories that map to each meal type. */
const MEAL_CATEGORIES: Record<MealType, string[]> = {
  breakfast: ['breakfast-stars', 'breakfast-goodies'],
  lunch: ['sana-uygun', 'popular-bowls', 'high-protein'],
  dinner: ['light-dinner', 'chef-recommended'],
  snack: ['fit-desserts', 'fruits'],
};

export function recipeMatchesMeal(recipe: Recipe, meal: MealType): boolean {
  const cats = MEAL_CATEGORIES[meal];
  return recipe.categories?.some(c => cats.includes(c)) ?? false;
}

/** Diet tags derived from recipe categories. */
export type Diet = 'vegan' | 'keto' | 'gluten-free' | 'high-protein' | 'low-calorie';

export function recipeMatchesDiet(recipe: Recipe, diet: Diet): boolean {
  return recipe.categories?.includes(diet as any) ?? false;
}

export interface RecipeFilter {
  /** A CalorieRange or a label like "300-400 kcal". */
  calorieRange?: CalorieRange | string | null;
  maxKcal?: number;
  minKcal?: number;
  meal?: MealType | null;
  diet?: Diet | null;
  category?: string | null;
  /** Hide recipes containing any of these allergen ids. */
  excludeAllergens?: string[];
}

/** Apply a combined filter to a list of recipes. */
export function filterRecipes(recipes: Recipe[], filter: RecipeFilter = {}): Recipe[] {
  const range = typeof filter.calorieRange === 'string'
    ? parseCalorieRange(filter.calorieRange)
    : filter.calorieRange ?? null;

  return recipes.filter(r => {
    if (range && !recipeInCalorieRange(r, range)) return false;
    if (filter.maxKcal != null && r.kcal > filter.maxKcal) return false;
    if (filter.minKcal != null && r.kcal < filter.minKcal) return false;
    if (filter.meal && !recipeMatchesMeal(r, filter.meal)) return false;
    if (filter.diet && !recipeMatchesDiet(r, filter.diet)) return false;
    if (filter.category && !(r.categories?.includes(filter.category as any))) return false;
    if (filter.excludeAllergens?.length && recipeHasUserAllergen(r, filter.excludeAllergens)) return false;
    return true;
  });
}

/** Préférence diète du profil → catégorie de recette correspondante (ou null = pas de filtre). */
export const DIET_CATEGORY: Record<string, string | null> = {
  healthy: null,
  keto: 'keto',
  vegan: 'vegan',
  glutenfree: 'gluten-free',
  vegetarian: 'vegan', // pas de catégorie végétarienne dédiée → repli sur vegan
};

/**
 * Recettes personnalisées selon le profil : on écarte les allergènes de l'utilisateur,
 * puis on remonte en tête celles qui correspondent à sa diète (sans masquer le reste,
 * pour ne jamais aboutir à une liste vide).
 */
export function recommendRecipes(
  recipes: Recipe[],
  opts: { diet?: string | null; allergens?: string[]; limit?: number } = {},
): Recipe[] {
  const allergens = opts.allergens ?? [];
  const safe = allergens.length
    ? recipes.filter(r => !recipeHasUserAllergen(r, allergens))
    : recipes;

  const cat = opts.diet ? DIET_CATEGORY[opts.diet] : null;
  let ordered = safe;
  if (cat) {
    const match = safe.filter(r => r.categories?.includes(cat as any));
    const rest = safe.filter(r => !r.categories?.includes(cat as any));
    ordered = [...match, ...rest];
  }
  return opts.limit ? ordered.slice(0, opts.limit) : ordered;
}

/** Sort helpers. */
export function sortByKcal(recipes: Recipe[], dir: 'asc' | 'desc' = 'asc'): Recipe[] {
  const s = [...recipes].sort((a, b) => a.kcal - b.kcal);
  return dir === 'asc' ? s : s.reverse();
}
