import React, { createContext, useContext, useState, ReactNode } from 'react';
import { INGREDIENTS_DEFAULT } from '../constants/recipes';

interface FridgeContextType {
  ingredients: string[];
  addIngredient: (item: string) => void;
  removeIngredient: (item: string) => void;
  addBulkIngredients: (items: string[]) => void;
}

const FridgeContext = createContext<FridgeContextType | undefined>(undefined);

export function FridgeProvider({ children }: { children: ReactNode }) {
  const [ingredients, setIngredients] = useState<string[]>(INGREDIENTS_DEFAULT);

  const addIngredient = (item: string) => {
    const trimmed = item.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients(prev => [...prev, trimmed]);
    }
  };

  const removeIngredient = (item: string) => {
    setIngredients(prev => prev.filter(i => i !== item));
  };

  const addBulkIngredients = (items: string[]) => {
    setIngredients(prev => {
      const merged = [...prev];
      items.forEach(i => {
        if (!merged.includes(i)) merged.push(i);
      });
      return merged;
    });
  };

  return (
    <FridgeContext.Provider value={{ ingredients, addIngredient, removeIngredient, addBulkIngredients }}>
      {children}
    </FridgeContext.Provider>
  );
}

export function useFridge() {
  const ctx = useContext(FridgeContext);
  if (!ctx) throw new Error('useFridge must be used inside FridgeProvider');
  return ctx;
}
