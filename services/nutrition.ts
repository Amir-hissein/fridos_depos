
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
  partial: boolean;
  coveredCount: number;
  totalCount: number;
}

const round = (n: number): number => Math.round(n);
const round1 = (n: number): number => Math.round(n * 10) / 10;

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

export const EMPTY_MACROS: MacroSet = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

export function kcalFromMacros(m: { protein: number; carbs: number; fat: number }): number {
  return round(m.protein * 4 + m.carbs * 4 + m.fat * 9);
}

export function scaleMacros(m: MacroSet, factor: number): MacroSet {
  return {
    kcal: round(m.kcal * factor),
    protein: round1(m.protein * factor),
    carbs: round1(m.carbs * factor),
    fat: round1(m.fat * factor),
  };
}

export function addMacros(a: MacroSet, b: MacroSet): MacroSet {
  return {
    kcal: round(a.kcal + b.kcal),
    protein: round1(a.protein + b.protein),
    carbs: round1(a.carbs + b.carbs),
    fat: round1(a.fat + b.fat),
  };
}

export function sumMacros(list: MacroSet[]): MacroSet {
  return list.reduce(addMacros, { ...EMPTY_MACROS });
}

export function getRecipeMacros(recipe: Recipe): MacroSet {
  return { kcal: recipe.kcal, protein: recipe.protein, carbs: recipe.carbs, fat: recipe.fat };
}

export function getRecipeMacrosForPortions(recipe: Recipe, portions: number): MacroSet {
  return scaleMacros(getRecipeMacros(recipe), portions);
}
export function macroSplit(m: MacroSet): { protein: number; carbs: number; fat: number } {
  const total = m.protein * 4 + m.carbs * 4 + m.fat * 9;
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round(((m.protein * 4) / total) * 100),
    carbs: Math.round(((m.carbs * 4) / total) * 100),
    fat: Math.round(((m.fat * 9) / total) * 100),
  };
}
