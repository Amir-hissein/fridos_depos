import { Recipe } from '../constants/recipes';
import { recipeHasUserAllergen } from './allergens';

export interface CalorieRange {
  min: number;
  max: number;
}

export function parseCalorieRange(label: string): CalorieRange | null {
  const m = label.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return null;
  return { min: Number(m[1]), max: Number(m[2]) };
}

export function recipeInCalorieRange(recipe: Recipe, range: CalorieRange): boolean {
  return recipe.kcal >= range.min && recipe.kcal <= range.max;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_CATEGORIES: Record<MealType, string[]> = {
  breakfast: ['breakfast-stars', 'breakfast-goodies'],
  lunch: ['sana-uygun', 'popular-bowls', 'high-protein'],
  dinner: ['light-dinner', 'chef-recommended'],
  snack: ['fit-desserts', 'fruits'],
};

export function recipeMatchesMeal(recipe: Recipe, meal: MealType): boolean {
  const cats = MEAL_CATEGORIES[meal];
  return recipe.categories?.some((c) => cats.includes(c)) ?? false;
}

export type Diet = 'vegan' | 'keto' | 'gluten-free' | 'high-protein' | 'low-calorie';

export function recipeMatchesDiet(recipe: Recipe, diet: Diet): boolean {
  return recipe.categories?.includes(diet as any) ?? false;
}

export interface RecipeFilter {
  calorieRange?: CalorieRange | string | null;
  maxKcal?: number;
  minKcal?: number;
  meal?: MealType | null;
  diet?: Diet | null;
  category?: string | null;
  excludeAllergens?: string[];
}

export function filterRecipes(recipes: Recipe[], filter: RecipeFilter = {}): Recipe[] {
  const range =
    typeof filter.calorieRange === 'string'
      ? parseCalorieRange(filter.calorieRange)
      : (filter.calorieRange ?? null);

  return recipes.filter((r) => {
    if (range && !recipeInCalorieRange(r, range)) return false;
    if (filter.maxKcal != null && r.kcal > filter.maxKcal) return false;
    if (filter.minKcal != null && r.kcal < filter.minKcal) return false;
    if (filter.meal && !recipeMatchesMeal(r, filter.meal)) return false;
    if (filter.diet && !recipeMatchesDiet(r, filter.diet)) return false;
    if (filter.category && !r.categories?.includes(filter.category as any)) return false;
    if (filter.excludeAllergens?.length && recipeHasUserAllergen(r, filter.excludeAllergens))
      return false;
    return true;
  });
}

export const DIET_CATEGORY: Record<string, string | null> = {
  healthy: null,
  keto: 'keto',
  vegan: 'vegan',
  glutenfree: 'gluten-free',
  vegetarian: 'vegan',
};

export function recommendRecipes(
  recipes: Recipe[],
  opts: { diet?: string | null; allergens?: string[]; limit?: number } = {},
): Recipe[] {
  const allergens = opts.allergens ?? [];
  const safe = allergens.length
    ? recipes.filter((r) => !recipeHasUserAllergen(r, allergens))
    : recipes;

  const cat = opts.diet ? DIET_CATEGORY[opts.diet] : null;
  let ordered = safe;
  if (cat) {
    const match = safe.filter((r) => r.categories?.includes(cat as any));
    const rest = safe.filter((r) => !r.categories?.includes(cat as any));
    ordered = [...match, ...rest];
  }
  return opts.limit ? ordered.slice(0, opts.limit) : ordered;
}

/** Sort helpers. */
export function sortByKcal(recipes: Recipe[], dir: 'asc' | 'desc' = 'asc'): Recipe[] {
  const s = [...recipes].sort((a, b) => a.kcal - b.kcal);
  return dir === 'asc' ? s : s.reverse();
}
