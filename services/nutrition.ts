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

/* ─────────────────────────────────────────────────────────────────────────
 * Macro arithmetic — shared helpers so screens never compute macros inline.
 * ───────────────────────────────────────────────────────────────────────── */

export const EMPTY_MACROS: MacroSet = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

/** Energy (kcal) implied by macros using the Atwater factors 4/4/9. */
export function kcalFromMacros(m: { protein: number; carbs: number; fat: number }): number {
  return round(m.protein * 4 + m.carbs * 4 + m.fat * 9);
}

/** Scale a macro set by a factor (e.g. a number of portions). */
export function scaleMacros(m: MacroSet, factor: number): MacroSet {
  return {
    kcal: round(m.kcal * factor),
    protein: round1(m.protein * factor),
    carbs: round1(m.carbs * factor),
    fat: round1(m.fat * factor),
  };
}

/** Add two macro sets together. */
export function addMacros(a: MacroSet, b: MacroSet): MacroSet {
  return {
    kcal: round(a.kcal + b.kcal),
    protein: round1(a.protein + b.protein),
    carbs: round1(a.carbs + b.carbs),
    fat: round1(a.fat + b.fat),
  };
}

/** Sum a list of macro sets. */
export function sumMacros(list: MacroSet[]): MacroSet {
  return list.reduce(addMacros, { ...EMPTY_MACROS });
}

/** The curated macros stored on a recipe (authored per its `servings`). */
export function getRecipeMacros(recipe: Recipe): MacroSet {
  return { kcal: recipe.kcal, protein: recipe.protein, carbs: recipe.carbs, fat: recipe.fat };
}

/** Recipe macros scaled to the chosen number of portions. */
export function getRecipeMacrosForPortions(recipe: Recipe, portions: number): MacroSet {
  return scaleMacros(getRecipeMacros(recipe), portions);
}

/** Macro split (% of kcal) — defaults match the plan target ratio 25/50/25. */
export function macroSplit(m: MacroSet): { protein: number; carbs: number; fat: number } {
  const total = m.protein * 4 + m.carbs * 4 + m.fat * 9;
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round(((m.protein * 4) / total) * 100),
    carbs: Math.round(((m.carbs * 4) / total) * 100),
    fat: Math.round(((m.fat * 9) / total) * 100),
  };
}
