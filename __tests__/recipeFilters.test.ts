import {
  parseCalorieRange,
  recipeInCalorieRange,
  sortByKcal,
} from '../services/recipeFilters';
import { Recipe } from '../constants/recipes';

const mk = (id: string, kcal: number) => ({ id, kcal }) as unknown as Recipe;

describe('parseCalorieRange', () => {
  it('parses a "min-max" label', () => {
    expect(parseCalorieRange('300-500')).toEqual({ min: 300, max: 500 });
  });

  it('tolerates spaces around the dash', () => {
    expect(parseCalorieRange('300 - 500 kcal')).toEqual({ min: 300, max: 500 });
  });

  it('returns null for an unparseable label', () => {
    expect(parseCalorieRange('all')).toBeNull();
  });
});

describe('recipeInCalorieRange', () => {
  const range = { min: 300, max: 500 };

  it('includes the bounds', () => {
    expect(recipeInCalorieRange(mk('a', 300), range)).toBe(true);
    expect(recipeInCalorieRange(mk('b', 500), range)).toBe(true);
  });

  it('excludes out-of-range recipes', () => {
    expect(recipeInCalorieRange(mk('c', 299), range)).toBe(false);
    expect(recipeInCalorieRange(mk('d', 501), range)).toBe(false);
  });
});

describe('sortByKcal', () => {
  const recipes = [mk('a', 500), mk('b', 200), mk('c', 350)];

  it('sorts ascending by default', () => {
    expect(sortByKcal(recipes).map(r => r.kcal)).toEqual([200, 350, 500]);
  });

  it('sorts descending when asked', () => {
    expect(sortByKcal(recipes, 'desc').map(r => r.kcal)).toEqual([500, 350, 200]);
  });

  it('does not mutate the input array', () => {
    const input = [mk('a', 500), mk('b', 200)];
    sortByKcal(input);
    expect(input.map(r => r.kcal)).toEqual([500, 200]);
  });
});
