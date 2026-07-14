import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Recipe } from '../constants/recipes';
import { Colors } from '../constants/colors';
import { animateLayout } from '../constants/animations';
import { useAuth } from './AuthContext';
import {
  listCustomRecipes,
  createCustomRecipe,
  deleteCustomRecipe,
} from '../lib/api/customRecipes';

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
      .filter((i) => i.name.trim())
      .map((i) => ({ name: i.name.trim(), quantity: i.quantity.trim() || '-', owned: true })),
    steps: input.steps.filter((s) => s.trim()).map((text) => ({ text: text.trim() })),
  };
}

export function CustomRecipesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);

  // Load the user's custom recipes on sign-in; clear on sign-out.
  useEffect(() => {
    if (!userId) {
      setCustomRecipes([]);
      return;
    }
    let active = true;
    listCustomRecipes().then((rows) => active && setCustomRecipes(rows));
    return () => {
      active = false;
    };
  }, [userId]);

  const addCustomRecipe = (input: NewRecipeInput): Recipe => {
    const recipe = buildRecipe(input);
    animateLayout();
    setCustomRecipes((prev) => [recipe, ...prev]);
    createCustomRecipe(recipe);
    return recipe;
  };

  const getCustomRecipe = (id: string) => customRecipes.find((r) => r.id === id);

  const removeCustomRecipe = (id: string) => {
    animateLayout();
    setCustomRecipes((prev) => prev.filter((r) => r.id !== id));
    deleteCustomRecipe(id);
  };

  return (
    <CustomRecipesContext.Provider
      value={{ customRecipes, addCustomRecipe, getCustomRecipe, removeCustomRecipe }}
    >
      {children}
    </CustomRecipesContext.Provider>
  );
}

export function useCustomRecipes() {
  const ctx = useContext(CustomRecipesContext);
  if (!ctx) throw new Error('useCustomRecipes must be used inside CustomRecipesProvider');
  return ctx;
}
