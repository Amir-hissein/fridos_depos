// Custom recipes API — user-created recipes (recipes where created_by = uid)
// with their ingredients/steps in child tables. Maps between the app's Recipe
// shape and the DB rows.

import { supabase } from '../supabase';
import { Recipe } from '../../constants/recipes';

/** DB row → app Recipe. */
function rowToRecipe(row: any): Recipe {
  const ingredients = (row.recipe_ingredients ?? [])
    .slice()
    .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
    .map((i: any) => ({ name: i.name, quantity: i.quantity ?? '', owned: true }));
  const steps = (row.recipe_steps ?? [])
    .slice()
    .sort((a: any, b: any) => (a.step_no ?? 0) - (b.step_no ?? 0))
    .map((s: any) => ({ text: s.text }));
  return {
    id: row.id,
    name: row.name,
    time: row.time_min ?? 15,
    difficulty: (row.difficulty ?? 'Kolay') as Recipe['difficulty'],
    kcal: row.kcal ?? 0,
    protein: row.protein_g ?? 0,
    carbs: row.carbs_g ?? 0,
    fat: row.fat_g ?? 0,
    mealType: row.meal_type ?? 'Kahvaltı',
    servings: row.servings ?? 1,
    tag: 'complete',
    missingCount: 0,
    bgColor: row.bg_color ?? '#14201E',
    emoji: row.emoji ?? '🍽️',
    image: row.image_url ?? undefined,
    filters: row.filters ?? [],
    categories: row.categories ?? [],
    ingredients,
    steps,
  };
}

export async function listCustomRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_ingredients(*), recipe_steps(*)')
    .not('created_by', 'is', null) // only user-created (global ones have null)
    .order('created_at', { ascending: false });
  if (error) {
    if (__DEV__) console.log('[customRecipes] list error:', error.message);
    return [];
  }
  return (data ?? []).map(rowToRecipe);
}

/** Persist a fully-built Recipe (id already assigned) + its children. */
export async function createCustomRecipe(recipe: Recipe): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return false;

  const { error: rErr } = await supabase.from('recipes').insert({
    id: recipe.id,
    created_by: uid,
    name: recipe.name,
    time_min: recipe.time,
    difficulty: recipe.difficulty,
    kcal: recipe.kcal,
    protein_g: recipe.protein,
    carbs_g: recipe.carbs,
    fat_g: recipe.fat,
    meal_type: recipe.mealType,
    servings: recipe.servings,
    emoji: recipe.emoji,
    image_url: typeof recipe.image === 'string' ? recipe.image : null,
    bg_color: recipe.bgColor,
    tag: recipe.tag,
    filters: recipe.filters,
    categories: recipe.categories,
  });
  if (rErr) {
    if (__DEV__) console.log('[customRecipes] create error:', rErr.message);
    return false;
  }

  if (recipe.ingredients.length) {
    await supabase.from('recipe_ingredients').insert(
      recipe.ingredients.map((i, idx) => ({
        recipe_id: recipe.id,
        name: i.name,
        quantity: i.quantity,
        position: idx,
      })),
    );
  }
  if (recipe.steps.length) {
    await supabase.from('recipe_steps').insert(
      recipe.steps.map((s, idx) => ({
        recipe_id: recipe.id,
        step_no: idx,
        text: s.text,
      })),
    );
  }
  return true;
}

export async function deleteCustomRecipe(id: string): Promise<void> {
  // Children cascade-delete via FK.
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error && __DEV__) console.log('[customRecipes] delete error:', error.message);
}
