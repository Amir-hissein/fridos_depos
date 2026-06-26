import React, { createContext, useContext, ReactNode } from 'react';
import { usePersistentState } from '../lib/usePersistentState';

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
  const [userAllergens, setUserAllergens] = usePersistentState<string[]>('allergens.list', ['peanut']);
  const [mode, setMode] = usePersistentState<AllergenMode>('allergens.mode', 'warn');

  const toggleAllergen = (id: string) => {
    setUserAllergens(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const setAllergens = (ids: string[]) => setUserAllergens(ids);

  return (
    <AllergenContext.Provider value={{ userAllergens, mode, toggleAllergen, setAllergens, setMode }}>
      {children}
    </AllergenContext.Provider>
  );
}

export function useAllergens() {
  const ctx = useContext(AllergenContext);
  if (!ctx) throw new Error('useAllergens must be used inside AllergenProvider');
  return ctx;
}
