import { recipeOwnership, generateFromRecipes } from '../services/shoppingList';
import { Recipe } from '../constants/recipes';

const recipe = {
  ingredients: [
    { name: 'Tomatoes', quantity: '2', owned: false },
    { name: 'Mozzarella', quantity: '100g', owned: false },
    { name: 'Basil', quantity: '5 leaves', owned: false },
  ],
} as unknown as Recipe;

describe('recipeOwnership', () => {
  it('marks owned ingredients (fuzzy, singular/plural tolerant)', () => {
    const result = recipeOwnership(recipe, ['tomato', 'basil']);
    const owned = result.ingredients.filter((i) => i.owned).map((i) => i.name);
    expect(owned).toEqual(expect.arrayContaining(['Tomatoes', 'Basil']));
    expect(result.missingCount).toBe(1);
    expect(result.tag).toBe('missing');
  });

  it('tags a fully covered recipe as complete', () => {
    const result = recipeOwnership(recipe, ['tomato', 'mozzarella', 'basil']);
    expect(result.missingCount).toBe(0);
    expect(result.tag).toBe('complete');
  });
});

describe('generateFromRecipes', () => {
  it('returns only the missing ingredients', () => {
    const items = generateFromRecipes([recipe], ['tomato']);
    const names = items.map((i) => i.name);
    expect(names).toEqual(expect.arrayContaining(['Mozzarella', 'Basil']));
    expect(names).not.toContain('Tomatoes');
  });

  it('deduplicates across recipes', () => {
    const items = generateFromRecipes([recipe, recipe], []);
    const names = items.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('assigns a category to each item', () => {
    const items = generateFromRecipes([recipe], []);
    items.forEach((i) => expect(typeof i.category).toBe('string'));
  });
});
