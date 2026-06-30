import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
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

/** Length of the free trial granted to every new account (no card required). */
export const TRIAL_DAYS = 3;
const DAY_MS = 86_400_000;

/** Features gated behind premium. */
export type PremiumFeature = 'scan' | 'mealPlan' | 'shoppingList' | 'dietFilters' | 'recipes';

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  checked: boolean;
}

interface AppContextType {
  /** Effective access: active subscription OR ongoing free trial (OR dev override). */
  isPremium: boolean;
  /** A paid subscription is active (RevenueCat entitlement). */
  isSubscriptionActive: boolean;
  /** The free trial is still running. */
  isTrialActive: boolean;
  /** Whole days left in the trial (0 once expired). */
  trialDaysLeft: number;
  /** Epoch ms when the trial ends, or null if unknown (not signed in). */
  trialEndsAt: number | null;
  /** Set by the subscription layer (RevenueCat). */
  setSubscriptionActive: (active: boolean) => void;
  onboardingDone: boolean;
  setOnboardingDone: (done: boolean) => void;
  /** Dev/testing override of premium access (null = no override). */
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

  // onboarding/userName stay local for now; shopping list is backed by Supabase.
  const [onboardingDone, setOnboardingDone] = usePersistentState('app.onboardingDone', false);
  const [userName, setUserName] = usePersistentState('app.userName', '');
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);

  // ── Premium access = subscription OR free trial (with a dev override) ──
  const [isSubscriptionActive, setSubscriptionActive] = useState(false);
  const [devOverride, setDevOverride] = useState<boolean | null>(null);

  // Trial runs for TRIAL_DAYS from the account's creation (server timestamp).
  const trialEndsAt = useMemo(() => {
    const created = session?.user?.created_at;
    return created ? new Date(created).getTime() + TRIAL_DAYS * DAY_MS : null;
  }, [session?.user?.created_at]);

  const now = Date.now();
  const isTrialActive = trialEndsAt != null && now < trialEndsAt;
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt - now) / DAY_MS)) : 0;

  // In production the source of truth is ALWAYS the subscription/trial — the dev
  // override is ignored so it can never be a backdoor or break a real sub.
  const isPremium =
    __DEV__ && devOverride !== null ? devOverride : isSubscriptionActive || isTrialActive;

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

  // Dev/testing toggle — forces premium on/off regardless of subscription/trial.
  // No-op in production builds (see isPremium above).
  const setPremium = (premium: boolean) => {
    if (__DEV__) setDevOverride(premium);
  };

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
      isSubscriptionActive,
      isTrialActive,
      trialDaysLeft,
      trialEndsAt,
      setSubscriptionActive,
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
