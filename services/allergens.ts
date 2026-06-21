// Allergen service — maps recipes to allergens and matches against user selection.
// Local today; later backed by Supabase `ingredient_allergens` / `user_allergens`.

import { Recipe } from '../constants/recipes';
import { INGREDIENT_ALLERGENS } from '../constants/allergens';

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

/** All allergen ids contained in a recipe (deduplicated). */
export function getRecipeAllergens(recipe: Recipe): string[] {
  const ids = new Set<string>();
  for (const ing of recipe.ingredients) {
    const mapped = INGREDIENT_ALLERGENS[normalize(ing.name)];
    if (mapped) mapped.forEach(id => ids.add(id));
  }
  return Array.from(ids);
}

/** Allergen ids that are both in the recipe and selected by the user. */
export function getMatchedAllergens(recipe: Recipe, userAllergens: string[]): string[] {
  if (userAllergens.length === 0) return [];
  const recipeAllergens = getRecipeAllergens(recipe);
  return recipeAllergens.filter(id => userAllergens.includes(id));
}

/** True when a recipe contains at least one of the user's allergens. */
export function recipeHasUserAllergen(recipe: Recipe, userAllergens: string[]): boolean {
  return getMatchedAllergens(recipe, userAllergens).length > 0;
}
