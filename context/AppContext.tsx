import React, { createContext, useContext, useState, ReactNode } from 'react';
import { animateLayout } from '../constants/animations';
import { usePersistentState } from '../lib/usePersistentState';

/** Free plan limits — premium unlocks everything. */
export const FREE_RECIPE_LIMIT = 3; // recipes a free user can open per day

/** Features gated behind premium. */
export type PremiumFeature = 'scan' | 'mealPlan' | 'shoppingList' | 'dietFilters' | 'recipes';

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  checked: boolean;
}

interface AppContextType {
  isPremium: boolean;
  onboardingDone: boolean;
  setOnboardingDone: (done: boolean) => void;
  setPremium: (premium: boolean) => void;
  /** Display name of the user — shared between profile & plan greeting. */
  userName: string;
  setUserName: (name: string) => void;
  shoppingList: ShoppingItem[];
  addShoppingItem: (name: string, category: string) => void;
  removeShoppingItem: (id: string) => void;
  toggleShoppingItem: (id: string) => void;
  clearCheckedItems: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Default to PREMIUM for testing — set to false to test the gate/paywall flow.
  const [isPremium, setIsPremium] = usePersistentState('app.isPremium', true);
  const [onboardingDone, setOnboardingDone] = usePersistentState('app.onboardingDone', false);
  const [userName, setUserName] = usePersistentState('app.userName', 'Amir Hissein Abakar');
  const [shoppingList, setShoppingList] = usePersistentState<ShoppingItem[]>('app.shoppingList', [
    { id: 's1', name: '3 zucchini', category: '🥬 Fruits & vegetables', checked: true },
    { id: 's2', name: '1 lb tomatoes', category: '🥬 Fruits & vegetables', checked: false },
    { id: 's3', name: '1 bunch of basil', category: '🥬 Fruits & vegetables', checked: false },
    { id: 's4', name: '4 oz goat cheese', category: '🧀 Dairy', checked: false },
    { id: 's5', name: 'Heavy cream', category: '🧀 Dairy', checked: true },
    { id: 's6', name: '1 ball of mozzarella', category: '🧀 Dairy', checked: false },
    { id: 's7', name: 'Basmati rice', category: '🛒 Pantry', checked: true },
    { id: 's8', name: 'Olive oil', category: '🛒 Pantry', checked: false },
  ]);

  const setPremium = (premium: boolean) => setIsPremium(premium);

  const addShoppingItem = (name: string, category: string) => {
    const newItem: ShoppingItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      category,
      checked: false,
    };
    animateLayout();
    setShoppingList(prev => [...prev, newItem]);
  };

  const removeShoppingItem = (id: string) => {
    animateLayout();
    setShoppingList(prev => prev.filter(item => item.id !== id));
  };

  const toggleShoppingItem = (id: string) => {
    setShoppingList(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const clearCheckedItems = () => {
    animateLayout();
    setShoppingList(prev => prev.filter(item => !item.checked));
  };

  return (
    <AppContext.Provider value={{
      isPremium,
      onboardingDone,
      setOnboardingDone,
      setPremium,
      userName,
      setUserName,
      shoppingList,
      addShoppingItem,
      removeShoppingItem,
      toggleShoppingItem,
      clearCheckedItems,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
