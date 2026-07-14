// FavoritesContext — favourite recipe ids, backed by Supabase. Public API
// unchanged; loads on sign-in, mutations are optimistic + written through.

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { animateLayout } from '../constants/animations';
import { useAuth } from './AuthContext';
import { listFavorites, addFavorite, removeFavorite } from '../lib/api/favorites';

interface FavoritesContextType {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) {
      setFavorites([]);
      return;
    }
    let active = true;
    listFavorites().then((ids) => active && setFavorites(ids));
    return () => {
      active = false;
    };
  }, [userId]);

  const isFavorite = (id: string) => favorites.includes(id);

  const toggleFavorite = (id: string) => {
    const has = favorites.includes(id);
    animateLayout();
    setFavorites((prev) => (has ? prev.filter((f) => f !== id) : [...prev, id]));
    if (has) removeFavorite(id);
    else addFavorite(id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider');
  return ctx;
}
