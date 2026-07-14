import { Recipe } from '../constants/recipes';

export interface MacroSet {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const round = (n: number): number => Math.round(n);
const round1 = (n: number): number => Math.round(n * 10) / 10;

export const EMPTY_MACROS: MacroSet = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

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

function getRecipeMacros(recipe: Recipe): MacroSet {
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
