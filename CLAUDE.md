Voici un transcript technique détaillé pour développer le frontend de Fridos en React Native + Expo. 
---

# Spécification Frontend — Fridos (React Native + Expo)

## 1. Stack technique

- **Framework** : React Native via **Expo** (SDK récent, managed workflow)
- **Langage** : TypeScript (strict)
- **Navigation** : Expo Router (file-based routing) — ou React Navigation si tu préfères
- **State management** : Zustand (léger, parfait pour cette taille d'app) + React Query (TanStack Query) pour les appels API/cache
- **Styling** : NativeWind (Tailwind pour React Native) — cohérent avec ton habitude Tailwind
- **Animations** : React Native Reanimated + Moti
- **Icônes** : lucide-react-native
- **Formulaires** : react-hook-form + zod (validation)
- **Stockage local** : expo-secure-store (tokens) + AsyncStorage (préférences)
- **Caméra** : expo-camera + expo-image-picker
- **Paiements** : RevenueCat (`react-native-purchases`) pour gérer les abonnements iOS/Android
- **Auth** : Supabase JS client (`@supabase/supabase-js`)


---

## 2. Design system (tokens)

Crée un fichier `theme/tokens.ts` :

```typescript
export const colors = {
  primary: '#2E7D52',
  primaryDark: '#256544',
  primaryLight: '#E8F3EC',
  accent: '#FF7A45',
  accentDark: '#E5602E',
  gold: '#F4B740',
  bg: '#FAFAF7',
  surface: '#FFFFFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#6B6B6B',
  success: '#2E7D52',
  warning: '#FF7A45',
  error: '#E63946',
  border: '#ECECEC',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 16, lg: 20, xl: 24, xxl: 32 };
export const fontSize = {
  caption: 13, body: 15, card: 16, section: 20, title: 28,
};
export const shadow = {
  card: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
};
```

Polices : charge **Poppins** (titres) et **Inter** (corps) via `expo-font` / `@expo-google-fonts`.

---

## 3. Structure des dossiers

```
/app                      # Expo Router (écrans)
  /(onboarding)
    index.tsx
  /(auth)
    login.tsx
    signup.tsx
  /(tabs)
    _layout.tsx           # Tab bar
    index.tsx             # Home
    recipes.tsx           # Liste recettes
    mealplan.tsx          # Plan repas (premium)
    shopping.tsx          # Liste courses
    profile.tsx           # Profil/réglages
  /recipe/[id].tsx        # Détail recette
  /scan.tsx               # Caméra scan
  /paywall.tsx            # Premium
  _layout.tsx             # Root layout
/components
  /ui                     # Button, Card, Pill, Input, Badge...
  /recipe                 # RecipeCard, IngredientTag...
/theme
  tokens.ts
/store                    # Zustand stores
  useIngredients.ts
  useAuth.ts
  useSubscription.ts
/lib
  supabase.ts
  api.ts                  # appels backend
/hooks
/types
```

---

## 4. Composants UI réutilisables à créer

**Button** — props : `variant` ('primary' | 'secondary' | 'accent'), `label`, `icon?`, `onPress`, `loading?`, `fullWidth?`. Hauteur 52px, radius 12, état pressé assombri, spinner si loading.

**IngredientTag (Pill)** — pastille arrondie, fond `primaryLight`, texte vert, croix "×" pour retirer. Variante sélectionnée : fond plein vert.

**RecipeCard** — photo héro (ratio 16:9, radius 16), titre, ligne meta (⏱ temps · 👥 portions · niveau), badge de matching ("Tu as tout ✓" vert / "Il manque X" orange).

**Badge** — petit label coloré (success/warning/premium).

**Input** — champ texte avec icône optionnelle, autocomplétion pour les ingrédients.

**Card** — conteneur blanc, radius 16, ombre douce, padding 16.

**EmptyState** — illustration + texte + bouton (ex. frigo vide).

**Fab** — bouton flottant rond orange, icône "+", position absolue bas-droite.

**Sheet/Modal** — feuille modale (radius haut 24) pour les filtres et confirmations.

---

## 5. Écrans à développer (détaillé)

**Onboarding** (`/(onboarding)/index.tsx`)
3 slides swipables (FlatList horizontal + pagination dots), illustration + titre + sous-titre par slide, bouton "Commencer" sur le dernier. Skip en haut à droite. Stocke un flag `onboarding_done` en AsyncStorage.

**Auth** (`login.tsx` / `signup.tsx`)
Formulaires email/mot de passe via Supabase, validation zod, bouton "Continuer avec Google" (optionnel). Gestion des erreurs inline.

**Home** (`(tabs)/index.tsx`)
- Header de salutation dynamique.
- Gros bouton accent "📷 Scanner mon frigo" → navigue vers `/scan`.
- Input "Ajouter un ingrédient" avec autocomplétion (liste locale d'ingrédients).
- Zone scrollable des IngredientTags ajoutés (depuis le store Zustand `useIngredients`).
- Bouton primary sticky en bas "Voir les recettes (N)" → `/recipes`, désactivé si 0 ingrédient.

**Scan** (`scan.tsx`)
- `expo-camera` plein écran + bouton capture rond.
- Après capture : envoie l'image au backend (qui appelle l'IA vision), affiche un loader.
- Résultat : liste des ingrédients détectés avec checkboxes, bouton "Ajouter au frigo".

**Recipes** (`(tabs)/recipes.tsx`)
- Barre de filtres horizontale (pastilles : Rapide, Végétarien, Halal, Sans gluten).
- FlatList de RecipeCard, pull-to-refresh, infinite scroll.
- Données via React Query depuis le backend (envoie la liste d'ingrédients, reçoit les recettes triées par taux de matching).

**Détail recette** (`recipe/[id].tsx`)
- Photo héro + bouton retour en overlay.
- Titre, meta (temps/portions/calories).
- Liste ingrédients : cochés vert si possédés, gris si manquants.
- Étapes numérotées.
- Bouton "Ajouter les manquants à ma liste de courses".

**Plan de repas** (`(tabs)/mealplan.tsx`) — **gated premium**
Vue semaine (7 jours), slots par repas. Si non-premium : overlay flou + bouton "Débloquer avec Premium" → `/paywall`.

**Liste de courses** (`(tabs)/shopping.tsx`)
Items cochables groupés par rayon, bouton partager (expo-sharing), bouton vider.

**Paywall** (`paywall.tsx`)
Dégradé vert→crème, couronne dorée, liste d'avantages avec coches, toggle mensuel ($5) / annuel (badge "-40%"), bouton "Essai gratuit". Intègre RevenueCat (`Purchases.getOfferings()` + `purchasePackage()`).

**Profil** (`(tabs)/profile.tsx`)
Préférences alimentaires (halal, végétarien, allergies — multi-select), équipement, niveau, nombre de personnes, statut abonnement, déconnexion. Persiste dans Supabase + store local.

---

## 6. State management (Zustand)

**useIngredients** : `ingredients: Ingredient[]`, `addIngredient`, `removeIngredient`, `clear`. Persiste en AsyncStorage.

**useAuth** : `session`, `user`, `signIn`, `signUp`, `signOut`, `loading`. Synchronisé avec Supabase `onAuthStateChange`.

**useSubscription** : `isPremium: boolean`, `offerings`, `purchase()`, `restore()`. Alimenté par RevenueCat.

**usePreferences** : régimes, allergies, équipement, portions.

---

## 7. Navigation (tab bar)

Tab bar en bas avec 5 onglets : Accueil 🏠 · Recettes 🍳 · Plan 📅 · Courses 🛒 · Profil 👤. Onglet actif en vert `#2E7D52`, inactif en gris. Style arrondi, fond blanc avec ombre haute légère.

---

## 8. Bonnes pratiques à respecter

- TypeScript strict, types partagés dans `/types` (Ingredient, Recipe, User, Subscription).
- Tous les appels réseau via React Query (cache, retry, loading states).
- Skeletons de chargement plutôt que spinners pleins écran sur les listes.
- Gestion des états vides partout (EmptyState).
- Accessibilité : `accessibilityLabel` sur les boutons, contraste suffisant.
- Pas de valeurs en dur : tout passe par les tokens du thème.
- Variables d'environnement (`.env` + `expo-constants`) pour les clés Supabase/RevenueCat — jamais en dur.

---

## 9. Ordre de développement suggéré

1. Setup projet Expo + TypeScript + NativeWind + tokens du thème.
2. Composants UI de base (Button, Card, Pill, Input).
3. Navigation (tabs + stack) avec écrans vides.
4. Auth + Supabase.
5. Home + gestion des ingrédients (store).
6. Liste recettes + détail (avec données mockées d'abord).
7. Scan caméra.
8. Liste de courses + plan de repas.
9. Paywall + RevenueCat.
10. Profil/préférences + polish (animations, états vides, dark mode).

---

Tu peux donner ce document directement à Claude Code en lui demandant de commencer par l'étape 1. Veux-tu que je te prépare le **prompt de démarrage exact pour Claude Code** (commande d'init + première tâche), ou que je détaille une partie précise comme l'intégration **RevenueCat** ou le **client Supabase** ?