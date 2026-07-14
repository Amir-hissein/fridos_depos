import { Recipe } from '../constants/recipes';

type TFunc = (key: string, opts?: Record<string, unknown>) => unknown;

export function localizeRecipeName(recipe: Recipe, t: TFunc): string {
  return t(`recipeData.${recipe.id}.name`, { defaultValue: recipe.name }) as string;
}

export function localizeRecipe(recipe: Recipe, t: TFunc): Recipe {
  const base = `recipeData.${recipe.id}`;
  const ingNames = t(`${base}.ingNames`, { returnObjects: true });
  const ingQty = t(`${base}.ingQty`, { returnObjects: true });
  const steps = t(`${base}.steps`, { returnObjects: true });

  const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);
  const tn = arr(ingNames);
  const tq = arr(ingQty);
  const ts = arr(steps);

  return {
    ...recipe,
    name: localizeRecipeName(recipe, t),
    ingredients: recipe.ingredients.map((ing, i) => ({
      ...ing,
      name: tn[i] ?? ing.name,
      quantity: tq[i] ?? ing.quantity,
    })),
    steps: recipe.steps.map((s, i) => ({
      ...s,
      text: ts[i] ?? s.text,
    })),
  };
}
