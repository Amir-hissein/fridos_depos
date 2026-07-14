// FridgeContext — the user's fridge ingredients, backed by Supabase.
// Public API is unchanged (screens don't change). State loads on sign-in and
// every mutation is optimistic + written through to the backend.

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { animateLayout } from '../constants/animations';
import { useAuth } from './AuthContext';
import { listFridge, addFridgeItems, removeFridgeItem } from '../lib/api/fridge';

interface FridgeContextType {
  ingredients: string[];
  addIngredient: (item: string) => void;
  removeIngredient: (item: string) => void;
  addBulkIngredients: (items: string[]) => void;
}

const FridgeContext = createContext<FridgeContextType | undefined>(undefined);

export function FridgeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';
  const [ingredients, setIngredients] = useState<string[]>([]);

  // Load from the backend on sign-in; clear on sign-out.
  useEffect(() => {
    if (!userId) {
      setIngredients([]);
      return;
    }
    let active = true;
    listFridge().then((items) => {
      if (active) setIngredients(items);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const addIngredient = (item: string) => {
    const trimmed = item.trim();
    if (!trimmed || ingredients.includes(trimmed)) return;
    animateLayout();
    setIngredients((prev) => [...prev, trimmed]);
    addFridgeItems([trimmed]);
  };

  const removeIngredient = (item: string) => {
    animateLayout();
    setIngredients((prev) => prev.filter((i) => i !== item));
    removeFridgeItem(item);
  };

  const addBulkIngredients = (items: string[]) => {
    const fresh = items.map((i) => i.trim()).filter((i) => i && !ingredients.includes(i));
    if (!fresh.length) return;
    animateLayout();
    setIngredients((prev) => [...prev, ...fresh]);
    addFridgeItems(fresh);
  };

  return (
    <FridgeContext.Provider
      value={{ ingredients, addIngredient, removeIngredient, addBulkIngredients }}
    >
      {children}
    </FridgeContext.Provider>
  );
}

export function useFridge() {
  const ctx = useContext(FridgeContext);
  if (!ctx) throw new Error('useFridge must be used inside FridgeProvider');
  return ctx;
}
