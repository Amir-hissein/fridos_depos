import { Recipe } from '../constants/recipes';

export interface MissingItem {
  name: string;
  quantity: string;
  category: string;
}

/** Singularise + lowercase so "Tomatoes" and "tomato" match. */
function normalizeIngredient(name: string): string {
  const base = name.trim().toLowerCase();
  return base.endsWith('s') && base.length > 3 ? base.slice(0, -1) : base;
}

/** True if the fridge contains an ingredient (fuzzy, substring-tolerant). */
function fridgeHas(name: string, fridge: string[]): boolean {
  const target = normalizeIngredient(name);
  return fridge.some(f => {
    const n = normalizeIngredient(f);
    return n === target || n.includes(target) || target.includes(n);
  });
}

function categorize(name: string): string {
  const n = name.toLowerCase();
  if (/cheese|cream|milk|mozzarella|yogurt|butter|egg/.test(n)) return '🧀 Dairy';
  if (/oil|rice|pasta|flour|sugar|curry|spice|powder|salt/.test(n)) return '🛒 Pantry';
  if (/tomato|zucchini|onion|garlic|basil|lettuce|pepper|carrot|fruit|veg/.test(n)) {
    return '🥬 Fruits & vegetables';
  }
  return '📦 Other';
}

/** Ingredients of a recipe the fridge is missing, ready for the shopping list. */
function generateFromRecipe(recipe: Recipe, fridge: string[]): MissingItem[] {
  return recipe.ingredients
    .filter(ing => !fridgeHas(ing.name, fridge))
    .map(ing => ({
      name: ing.name,
      quantity: ing.quantity,
      category: categorize(ing.name),
    }));
}

/** Per-ingredient ownership + a complete/missing tag for a recipe. */
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

/** Merge the missing ingredients of several recipes (deduplicated by name). */
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
