import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { animateLayout } from '../constants/animations';
import { usePersistentState } from '../lib/usePersistentState';
import { useAuth } from './AuthContext';
import {
  listShopping,
  addShoppingItem as apiAddShopping,
  setShoppingChecked,
  removeShoppingItem as apiRemoveShopping,
  clearCheckedShopping,
} from '../lib/api/shopping';

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
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';

  // These stay local for now: premium → RevenueCat later; onboarding/userName →
  // profiles later. Shopping list is fully backed by Supabase.
  const [isPremium, setIsPremium] = usePersistentState('app.isPremium', true);
  const [onboardingDone, setOnboardingDone] = usePersistentState('app.onboardingDone', false);
  const [userName, setUserName] = usePersistentState('app.userName', 'Amir Hissein Abakar');
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);

  // Load the shopping list from Supabase on sign-in; clear on sign-out.
  useEffect(() => {
    if (!userId) {
      setShoppingList([]);
      return;
    }
    let active = true;
    listShopping().then(rows => active && setShoppingList(rows));
    return () => {
      active = false;
    };
  }, [userId]);

  const setPremium = (premium: boolean) => setIsPremium(premium);

  const addShoppingItem = async (name: string, category: string) => {
    animateLayout();
    const row = await apiAddShopping(name, category);
    if (row) setShoppingList(prev => [...prev, row]);
  };

  const removeShoppingItem = (id: string) => {
    animateLayout();
    setShoppingList(prev => prev.filter(item => item.id !== id));
    apiRemoveShopping(id);
  };

  const toggleShoppingItem = (id: string) => {
    let nextChecked = false;
    setShoppingList(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        nextChecked = !item.checked;
        return { ...item, checked: nextChecked };
      }),
    );
    setShoppingChecked(id, nextChecked);
  };

  const clearCheckedItems = () => {
    animateLayout();
    setShoppingList(prev => prev.filter(item => !item.checked));
    clearCheckedShopping();
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
