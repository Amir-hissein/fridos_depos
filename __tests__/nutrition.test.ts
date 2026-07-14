import {
  EMPTY_MACROS,
  addMacros,
  scaleMacros,
  macroSplit,
  getRecipeMacrosForPortions,
} from '../services/nutrition';
import { Recipe } from '../constants/recipes';

describe('EMPTY_MACROS', () => {
  it('is all zeros', () => {
    expect(EMPTY_MACROS).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe('addMacros', () => {
  it('sums two macro sets', () => {
    const a = { kcal: 100, protein: 10, carbs: 20, fat: 5 };
    const b = { kcal: 50, protein: 5, carbs: 10, fat: 2 };
    expect(addMacros(a, b)).toEqual({ kcal: 150, protein: 15, carbs: 30, fat: 7 });
  });
});

describe('scaleMacros', () => {
  it('scales by a factor', () => {
    const m = { kcal: 200, protein: 10, carbs: 20, fat: 5 };
    expect(scaleMacros(m, 0.5)).toEqual({ kcal: 100, protein: 5, carbs: 10, fat: 2.5 });
  });

  it('returns zeros at factor 0', () => {
    expect(scaleMacros({ kcal: 200, protein: 10, carbs: 20, fat: 5 }, 0)).toEqual(EMPTY_MACROS);
  });
});

describe('macroSplit', () => {
  it('returns percentages that sum to ~100', () => {
    const split = macroSplit({ kcal: 390, protein: 25, carbs: 50, fat: 10 });
    expect(split.protein + split.carbs + split.fat).toBeGreaterThanOrEqual(99);
    expect(split.protein + split.carbs + split.fat).toBeLessThanOrEqual(101);
  });

  it('returns zeros for an empty plate', () => {
    expect(macroSplit({ kcal: 0, protein: 0, carbs: 0, fat: 0 })).toEqual({
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });
});

describe('getRecipeMacrosForPortions', () => {
  const recipe = { kcal: 400, protein: 30, carbs: 40, fat: 10 } as unknown as Recipe;

  it('returns the base macros at 1 portion', () => {
    expect(getRecipeMacrosForPortions(recipe, 1)).toEqual({
      kcal: 400,
      protein: 30,
      carbs: 40,
      fat: 10,
    });
  });

  it('doubles the macros at 2 portions', () => {
    expect(getRecipeMacrosForPortions(recipe, 2)).toEqual({
      kcal: 800,
      protein: 60,
      carbs: 80,
      fat: 20,
    });
  });
});
