// AllergenContext — the user's allergens + warn/hide mode, backed by Supabase
// (user_allergens table + profiles.allergen_mode). Public API unchanged.

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  listAllergens,
  addAllergen,
  removeAllergen,
  setAllergens as apiSetAllergens,
  getAllergenMode,
  setAllergenMode,
} from '../lib/api/allergens';

/** Two ways to handle at-risk recipes. */
export type AllergenMode = 'warn' | 'hide';

interface AllergenContextType {
  userAllergens: string[];
  mode: AllergenMode;
  toggleAllergen: (id: string) => void;
  setAllergens: (ids: string[]) => void;
  setMode: (mode: AllergenMode) => void;
}

const AllergenContext = createContext<AllergenContextType | undefined>(undefined);

export function AllergenProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [mode, setModeState] = useState<AllergenMode>('warn');

  useEffect(() => {
    if (!userId) {
      setUserAllergens([]);
      setModeState('warn');
      return;
    }
    let active = true;
    listAllergens().then((ids) => active && setUserAllergens(ids));
    getAllergenMode().then((m) => active && m && setModeState(m));
    return () => {
      active = false;
    };
  }, [userId]);

  const toggleAllergen = (id: string) => {
    const has = userAllergens.includes(id);
    setUserAllergens((prev) => (has ? prev.filter((a) => a !== id) : [...prev, id]));
    if (has) removeAllergen(id);
    else addAllergen(id);
  };

  const setAllergens = (ids: string[]) => {
    setUserAllergens(ids);
    apiSetAllergens(ids);
  };

  const setMode = (next: AllergenMode) => {
    setModeState(next);
    setAllergenMode(next);
  };

  return (
    <AllergenContext.Provider
      value={{ userAllergens, mode, toggleAllergen, setAllergens, setMode }}
    >
      {children}
    </AllergenContext.Provider>
  );
}

export function useAllergens() {
  const ctx = useContext(AllergenContext);
  if (!ctx) throw new Error('useAllergens must be used inside AllergenProvider');
  return ctx;
}
