# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (choose platform)
npm run start       # opens Expo Go QR code
npm run ios         # launch on iOS simulator
npm run android     # launch on Android emulator
npm run web         # launch in browser
```

There is no linter or test suite configured.

## Architecture

Fridos is a React Native / Expo app (SDK 54, expo-router v6) for fridge management and recipe suggestions. The UI language is French.

### Navigation structure

Expo Router file-based routing with three nested navigators:

- `app/index.tsx` — redirects immediately to `/(onboarding)/welcome`
- `app/(onboarding)/` — 3-step onboarding flow (welcome → recipes-intro → zero-waste), gestures disabled
- `app/(tabs)/` — main 5-tab shell (home, recipes, plan, shopping, profile)
- `app/scan/camera` — full-screen modal (fade), camera scanning
- `app/scan/result` — modal (slide from bottom), scan results
- `app/recipe/[id]` — recipe detail, slides from right
- `app/paywall` — modal (slide from bottom)

The root layout (`app/_layout.tsx`) wraps everything in `GestureHandlerRootView → AppProvider → FridgeProvider`.

### State management

Two React Context providers, no external state library:

- **`AppContext`** (`context/AppContext.tsx`) — `isPremium` (defaults `true`), `onboardingDone`, `shopItems` (Record<id, checked>). Access via `useApp()`.
- **`FridgeContext`** (`context/FridgeContext.tsx`) — `ingredients` string array (seeded from `INGREDIENTS_DEFAULT`), mutations: `addIngredient`, `removeIngredient`, `addBulkIngredients`. Access via `useFridge()`.

All data is in-memory only; nothing persists across sessions.

### Data / constants

`constants/recipes.ts` holds all mock data:
- `RECIPES: Recipe[]` — 4 recipes with ingredients, steps, filters (`rapide`/`vege`/`halal`), and a `tag: 'complete' | 'missing'` derived from fridge contents
- `MEAL_PLAN: Record<number, Meal[]>` — weekly plan keyed by day index (0–5)
- `SHOPPING_CATEGORIES` — grouped shopping list with item ids matching `AppContext.shopItems`
- `INGREDIENTS_DEFAULT` — initial fridge contents seeded into `FridgeContext`

### Design system

- **Colors**: `constants/colors.ts` → `Colors` object. Brand: `Colors.green` (`#2E7D52`), accent `Colors.orange`, premium `Colors.gold`. Background is off-white `#FAFAF7`.
- **Typography**: `constants/typography.ts` → `Typography` object with preset `TextStyle` entries. Poppins (700/600/500) for headings, Inter (400/500/600/700) for body/UI. Fonts are loaded in the root layout before the splash screen hides.
- **Screen wrapper**: `components/layout/Screen.tsx` — wraps content in `SafeAreaView`, supports `scroll` and `dark` props (dark mode uses `Colors.scanBg`).
- **UI primitives**: `components/ui/` — `Button`, `Chip`, `RecipeCard`, `MealCard`, `ShopItem`, `DetectedItem`.

### Fonts

Both font families are loaded via `useFonts` in `app/_layout.tsx` and the splash screen is held until they resolve. Always reference font families by their exact name strings (e.g. `'Poppins_700Bold'`, `'Inter_400Regular'`).
