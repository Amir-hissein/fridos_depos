import React, { createContext, useContext, ReactNode } from 'react';
import { Recipe } from '../constants/recipes';
import { Colors } from '../constants/colors';
import { animateLayout } from '../constants/animations';
import { usePersistentState } from '../lib/usePersistentState';

export interface NewRecipeInput {
  name: string;
  kcal: number;
  image?: string;
  ingredients: { name: string; quantity: string }[];
  steps: string[];
}

interface CustomRecipesContextType {
  customRecipes: Recipe[];
  addCustomRecipe: (input: NewRecipeInput) => Recipe;
  getCustomRecipe: (id: string) => Recipe | undefined;
  removeCustomRecipe: (id: string) => void;
}

const CustomRecipesContext = createContext<CustomRecipesContextType | undefined>(undefined);

/** Build a full Recipe from the create-recipe form, filling sensible defaults. */
function buildRecipe(input: NewRecipeInput): Recipe {
  const kcal = input.kcal > 0 ? input.kcal : 0;
  // Estimate macros from kcal (25% protein / 50% carbs / 25% fat) when not given.
  const protein = Math.round((kcal * 0.25) / 4);
  const carbs = Math.round((kcal * 0.5) / 4);
  const fat = Math.round((kcal * 0.25) / 9);

  return {
    id: `custom_${Date.now()}`,
    name: input.name.trim(),
    time: 15,
    difficulty: 'Kolay',
    kcal,
    protein,
    carbs,
    fat,
    mealType: 'Kahvaltı',
    servings: 1,
    tag: 'complete',
    missingCount: 0,
    bgColor: Colors.surface,
    emoji: '🍽️',
    image: input.image,
    filters: [],
    categories: [],
    ingredients: input.ingredients
      .filter(i => i.name.trim())
      .map(i => ({ name: i.name.trim(), quantity: i.quantity.trim() || '-', owned: true })),
    steps: input.steps.filter(s => s.trim()).map(text => ({ text: text.trim() })),
  };
}

export function CustomRecipesProvider({ children }: { children: ReactNode }) {
  const [customRecipes, setCustomRecipes] = usePersistentState<Recipe[]>('customRecipes.list', [
    buildRecipe({
      name: 'Ev Yapımı Granola',
      kcal: 320,
      image: 'https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?auto=format&fit=crop&w=400&q=80',
      ingredients: [],
      steps: [],
    }),
  ]);

  const addCustomRecipe = (input: NewRecipeInput): Recipe => {
    const recipe = buildRecipe(input);
    animateLayout();
    setCustomRecipes(prev => [recipe, ...prev]);
    return recipe;
  };

  const getCustomRecipe = (id: string) => customRecipes.find(r => r.id === id);

  const removeCustomRecipe = (id: string) => {
    animateLayout();
    setCustomRecipes(prev => prev.filter(r => r.id !== id));
  };

  return (
    <CustomRecipesContext.Provider value={{ customRecipes, addCustomRecipe, getCustomRecipe, removeCustomRecipe }}>
      {children}
    </CustomRecipesContext.Provider>
  );
}

export function useCustomRecipes() {
  const ctx = useContext(CustomRecipesContext);
  if (!ctx) throw new Error('useCustomRecipes must be used inside CustomRecipesProvider');
  return ctx;
}
