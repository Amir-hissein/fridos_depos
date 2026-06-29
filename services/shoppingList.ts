import { Recipe } from '../constants/recipes';

export interface MissingItem {
  name: string;
  quantity: string;
  category: string;
}

export function normalizeIngredient(name: string): string {
  const base = name.trim().toLowerCase();
  return base.endsWith('s') && base.length > 3 ? base.slice(0, -1) : base;
}

export function fridgeHas(name: string, fridge: string[]): boolean {
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


export function generateFromRecipe(recipe: Recipe, fridge: string[]): MissingItem[] {
  return recipe.ingredients
    .filter(ing => !fridgeHas(ing.name, fridge))
    .map(ing => ({
      name: ing.name,
      quantity: ing.quantity,
      category: categorize(ing.name),
    }));
}


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


export function countMissing(recipe: Recipe, fridge: string[]): number {
  return generateFromRecipe(recipe, fridge).length;
}


export function deriveRecipeTag(recipe: Recipe, fridge: string[]): 'complete' | 'missing' {
  return countMissing(recipe, fridge) === 0 ? 'complete' : 'missing';
}


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
