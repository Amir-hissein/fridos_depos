import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  shoppingList: ShoppingItem[];
  addShoppingItem: (name: string, category: string) => void;
  removeShoppingItem: (id: string) => void;
  toggleShoppingItem: (id: string) => void;
  clearCheckedItems: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Default to PREMIUM for testing — set to false to test the gate/paywall flow.
  const [isPremium, setIsPremium] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([
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
    setShoppingList(prev => [...prev, newItem]);
  };

  const removeShoppingItem = (id: string) => {
    setShoppingList(prev => prev.filter(item => item.id !== id));
  };

  const toggleShoppingItem = (id: string) => {
    setShoppingList(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const clearCheckedItems = () => {
    setShoppingList(prev => prev.filter(item => !item.checked));
  };

  return (
    <AppContext.Provider value={{
      isPremium,
      onboardingDone,
      setOnboardingDone,
      setPremium,
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
