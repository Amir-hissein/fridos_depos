// Nutrition service — single access point for recipe nutrition.
// Today it computes locally from constants; later this is where a Supabase
// `ingredient_nutrition` query would live. Components must never compute directly.

import { Recipe } from '../constants/recipes';
import {
  INGREDIENT_NUTRITION,
  normalizeName,
  resolveGrams,
} from '../constants/nutrition';

export interface MacroSet {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface RecipeNutrition {
  total: MacroSet;
  perServing: MacroSet;
  /** True when some ingredients had no nutrition data (estimate is partial). */
  partial: boolean;
  coveredCount: number;
  totalCount: number;
}

const round = (n: number): number => Math.round(n);
const round1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * Sum nutrition across a recipe's ingredients, scaling each ingredient's
 * per-100g values by its estimated weight. Ingredients without data are
 * skipped and flagged via `partial`.
 */
export function computeRecipeNutrition(recipe: Recipe): RecipeNutrition {
  const total: MacroSet = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  let covered = 0;

  for (const ing of recipe.ingredients) {
    const data = INGREDIENT_NUTRITION[normalizeName(ing.name)];
    if (!data) continue;
    covered += 1;
    const grams = resolveGrams(ing.name, ing.quantity);
    const factor = grams / 100;
    total.kcal += data.kcal * factor;
    total.protein += data.protein * factor;
    total.carbs += data.carbs * factor;
    total.fat += data.fat * factor;
  }

  const servings = recipe.servings > 0 ? recipe.servings : 1;
  const perServing: MacroSet = {
    kcal: total.kcal / servings,
    protein: total.protein / servings,
    carbs: total.carbs / servings,
    fat: total.fat / servings,
  };

  return {
    total: {
      kcal: round(total.kcal),
      protein: round1(total.protein),
      carbs: round1(total.carbs),
      fat: round1(total.fat),
    },
    perServing: {
      kcal: round(perServing.kcal),
      protein: round1(perServing.protein),
      carbs: round1(perServing.carbs),
      fat: round1(perServing.fat),
    },
    partial: covered < recipe.ingredients.length,
    coveredCount: covered,
    totalCount: recipe.ingredients.length,
  };
}
