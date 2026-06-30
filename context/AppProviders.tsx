// AppProviders — single composition root for every React context in the app.
// Order matters (top = outermost): a provider may read from any provider above
// it. Keeping the list flat here keeps app/_layout.tsx readable.

import React, { ReactNode } from 'react';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { AppProvider } from './AppContext';
import { SubscriptionProvider } from './SubscriptionContext';
import { ProfileProvider } from './ProfileContext';
import { FridgeProvider } from './FridgeContext';
import { AllergenProvider } from './AllergenContext';
import { PlanProvider } from './PlanContext';
import { FavoritesProvider } from './FavoritesContext';
import { CustomRecipesProvider } from './CustomRecipesContext';
import { NotificationsProvider } from './NotificationsContext';
import { FeedbackProvider } from './FeedbackContext';

/** Ordered outermost → innermost. Each provider can depend on the ones before it. */
const PROVIDERS = [
  ThemeProvider,
  AuthProvider,
  AppProvider,
  SubscriptionProvider,
  ProfileProvider,
  FridgeProvider,
  AllergenProvider,
  PlanProvider,
  FavoritesProvider,
  CustomRecipesProvider,
  NotificationsProvider,
  FeedbackProvider,
] as const;

export function AppProviders({ children }: { children: ReactNode }) {
  return PROVIDERS.reduceRight(
    (tree, Provider) => <Provider>{tree}</Provider>,
    children as React.ReactElement,
  );
}
