// Localisation du CONTENU des recettes (nom, ingrédients, étapes) via i18n.
// Les données sources restent en turc dans constants/recipes.ts ; ce helper
// remplace nom/ingrédients/étapes par leur traduction (clé `recipeData.<id>.*`),
// avec repli automatique sur le turc d'origine si une traduction manque.
//
// (À terme, ce contenu viendra de la base Supabase, traduit par langue.)

import { Recipe } from '../constants/recipes';

type TFunc = (key: string, opts?: Record<string, unknown>) => unknown;

/** Nom traduit d'une recette (repli sur le nom d'origine). */
export function localizeRecipeName(recipe: Recipe, t: TFunc): string {
  return t(`recipeData.${recipe.id}.name`, { defaultValue: recipe.name }) as string;
}

/** Recette entièrement localisée : nom + ingrédients (nom/quantité) + étapes. */
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
