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
 * An ingredient is missing when it's flagged `owned: false` OR absent from the fridge.
 */
export function generateFromRecipe(recipe: Recipe, fridge: string[]): MissingItem[] {
  return recipe.ingredients
    .filter(ing => !ing.owned || !fridgeHas(ing.name, fridge))
    .map(ing => ({
      name: ing.name,
      quantity: ing.quantity,
      category: categorize(ing.name),
    }));
}
