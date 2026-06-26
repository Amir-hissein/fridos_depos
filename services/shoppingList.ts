// Shopping list service — derives what's missing for a recipe vs the user's fridge.
// Pure/local today; later this maps to Supabase `shopping_lists` / `shopping_list_items`.

import { Recipe } from '../constants/recipes';

export interface MissingItem {
  name: string;
  quantity: string;
  category: string;
}

/** Normalize a name for comparison: lowercase, trim, strip a trailing plural 's'. */
export function normalizeIngredient(name: string): string {
  const base = name.trim().toLowerCase();
  // basic singular/plural: "tomatoes" -> "tomatoe" is wrong, so only strip simple trailing 's'
  return base.endsWith('s') && base.length > 3 ? base.slice(0, -1) : base;
}

/** True when the fridge contains an ingredient matching `name`. */
export function fridgeHas(name: string, fridge: string[]): boolean {
  const target = normalizeIngredient(name);
  return fridge.some(f => {
    const n = normalizeIngredient(f);
    return n === target || n.includes(target) || target.includes(n);
  });
}

/** Rough category for grouping in the shopping list UI. */
function categorize(name: string): string {
  const n = name.toLowerCase();
  if (/cheese|cream|milk|mozzarella|yogurt|butter|egg/.test(n)) return '🧀 Dairy';
  if (/oil|rice|pasta|flour|sugar|curry|spice|powder|salt/.test(n)) return '🛒 Pantry';
  if (/tomato|zucchini|onion|garlic|basil|lettuce|pepper|carrot|fruit|veg/.test(n)) {
    return '🥬 Fruits & vegetables';
  }
  return '📦 Other';
}

/**
 * Compare a recipe's ingredients with the fridge and return what's missing.
 * Source de vérité = le frigo : un ingrédient manque s'il n'y est pas présent.
 */
export function generateFromRecipe(recipe: Recipe, fridge: string[]): MissingItem[] {
  return recipe.ingredients
    .filter(ing => !fridgeHas(ing.name, fridge))
    .map(ing => ({
      name: ing.name,
      quantity: ing.quantity,
      category: categorize(ing.name),
    }));
}

/**
 * Statut d'une recette dérivé du frigo : liste des ingrédients avec `owned` recalculé,
 * nombre manquant et tag complete/missing. Remplace les valeurs statiques des données.
 */
export function recipeOwnership(recipe: Recipe, fridge: string[]) {
  const ingredients = recipe.ingredients.map(ing => ({
    ...ing,
    owned: fridgeHas(ing.name, fridge),
  }));
  const missingCount = ingredients.filter(i => !i.owned).length;
  return {
    ingredients,
    missingCount,
    tag: (missingCount === 0 ? 'complete' : 'missing') as 'complete' | 'missing',
  };
}

/** How many of a recipe's ingredients are missing from the fridge. */
export function countMissing(recipe: Recipe, fridge: string[]): number {
  return generateFromRecipe(recipe, fridge).length;
}

/**
 * Derive a recipe's status from the fridge: 'complete' when nothing is missing,
 * otherwise 'missing'. Replaces the hard-coded `tag` on the recipe data.
 */
export function deriveRecipeTag(recipe: Recipe, fridge: string[]): 'complete' | 'missing' {
  return countMissing(recipe, fridge) === 0 ? 'complete' : 'missing';
}

/**
 * Merge the missing items of several recipes into one de-duplicated list
 * (e.g. building a shopping list from a whole meal plan).
 */
export function generateFromRecipes(recipes: Recipe[], fridge: string[]): MissingItem[] {
  const byKey = new Map<string, MissingItem>();
  for (const recipe of recipes) {
    for (const item of generateFromRecipe(recipe, fridge)) {
      const key = normalizeIngredient(item.name);
      if (!byKey.has(key)) byKey.set(key, item);
    }
  }
  return Array.from(byKey.values());
}
