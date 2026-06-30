<div align="center">

# 🥗 Fridos

**Scanne ton frigo, découvre des recettes, et suis tes calories — le tout propulsé par l'IA.**

Application mobile **iOS & Android** construite avec **React Native + Expo**, **Supabase** et **Claude vision**.

![Expo](https://img.shields.io/badge/Expo-SDK%2054-000?logo=expo) ![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript) ![Tests](https://img.shields.io/badge/tests-jest-C21325?logo=jest)

</div>

---

## ✨ Fonctionnalités

- 📷 **Scan IA du frigo** — photographie tes ingrédients, l'IA les identifie (Claude vision).
- 🍽️ **Scan de repas** — estime calories et macros d'une assiette à partir d'une photo.
- 🍳 **Recettes intelligentes** — triées par taux de correspondance avec ce que tu possèdes.
- 📊 **Suivi nutritionnel** — objectifs personnalisés (BMR/TDEE), macros, eau, pas, poids.
- 💡 **Insights quotidiens** — conseils contextuels (hydratation, protéines, calories…).
- 🛒 **Liste de courses** — générée automatiquement depuis les ingrédients manquants.
- 👑 **Premium** — abonnement géré par RevenueCat (mensuel / annuel) + essai gratuit.
- 🌍 **Multilingue** — Français, Anglais, Turc.
- 🌗 **Thème clair / sombre.**

---

## 🧱 Stack technique

| Domaine | Choix |
|---|---|
| Framework | **Expo SDK 54** (managed workflow + CNG), **React Native 0.81**, **React 19** |
| Langage | **TypeScript** (strict) |
| Architecture native | **New Architecture** (Fabric + TurboModules) |
| Navigation | **Expo Router** (file-based) |
| État | **React Context API** (providers typés) |
| Backend | **Supabase** (Postgres + Auth + Storage + Edge Functions) |
| IA Vision | **Claude** (`claude-opus-4-8`) via Edge Functions |
| Paiements | **RevenueCat** (`react-native-purchases`) |
| Animations | **Reanimated 4**, **Gesture Handler** |
| i18n | **i18next** / **expo-localization** |
| Monitoring | **Sentry** |
| Tests | **Jest** (`jest-expo`) |

---

## 🗂️ Architecture

Découpage en couches, logique métier isolée et testable :

```
app/             # Écrans & navigation (Expo Router, file-based routing)
  (auth)/        #   Connexion / inscription / mot de passe oublié
  (onboarding)/  #   Onboarding & configuration du profil
  (tabs)/        #   Plan · Recettes · Scan · Profil · Pro · Courses
  scan/          #   Caméra & résultats de scan
  recipe/[id]    #   Détail recette
components/      # Composants UI réutilisables (Button, Card, Sheet…)
context/         # État global (1 provider par domaine)
  AppProviders.tsx  #   Composition root de tous les providers
services/        # Logique métier PURE (calculs, filtres) — testée
  plan.ts        #   BMR, TDEE, objectifs caloriques, macros, BMI
  nutrition.ts   #   Agrégation / mise à l'échelle des macros
  insights.ts    #   Génération des conseils quotidiens
  summary.ts     #   Progression & tendance de poids
  shoppingList.ts#   Correspondance frigo ↔ recettes
  recipeFilters.ts#  Filtrage & recommandation de recettes
  vision.ts      #   Pont vers les Edge Functions de vision IA
lib/             # Infrastructure (supabase, api/, image, haptics, i18n)
constants/       # Données & design tokens (couleurs, recettes)
locales/         # Traductions (en / fr / tr)
supabase/        # Schéma SQL, migrations & Edge Functions
__tests__/       # Tests unitaires de la couche services
```

**Principe :** les composants restent présentationnels ; toute la logique de calcul vit dans `services/` (fonctions pures, sans dépendance native → entièrement testables).

---

## 🚀 Démarrage

### Prérequis
- **Node.js** ≥ 18
- **npm**
- **Expo CLI** (via `npx`)
- Un **dev build** (Expo Go ne suffit pas : l'app utilise des modules natifs comme RevenueCat). Voir [Builds](#-builds--déploiement-eas).

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer l'environnement
```bash
cp .env.example .env
# puis renseigner les valeurs réelles (voir ci-dessous)
```

### 3. Lancer l'app
```bash
npm run ios       # build + lance sur simulateur / device iOS
npm run android   # build + lance sur émulateur / device Android
npm start         # serveur Metro (pour un dev build déjà installé)
```

---

## 🔑 Variables d'environnement

Toutes les clés `EXPO_PUBLIC_*` sont **publiques par design** (protégées côté serveur par les RLS Supabase / le backend RevenueCat). Les **secrets** (clé Anthropic, service-role) ne vivent **que** dans les Edge Functions Supabase.

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase (publique, RLS) |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | Clé SDK RevenueCat iOS (`appl_…`) |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | Clé SDK RevenueCat Android (`goog_…`) |
| `EXPO_PUBLIC_SENTRY_DSN` | DSN public Sentry (optionnel) |

---

## 🛠️ Backend (Supabase)

### Base de données
- Schéma : `supabase/schema.sql`
- Migrations : `supabase/migrations/`
- **Sécurité** : RLS activée sur toutes les tables (un utilisateur n'accède qu'à ses propres données), avec contraintes `ON DELETE CASCADE` pour une suppression de compte intègre.

### Edge Functions
Le code IA et les opérations privilégiées tournent **côté serveur** pour ne jamais exposer de secret dans l'app.

| Fonction | Rôle | Secret requis |
|---|---|---|
| `detect-ingredients` | Vision : ingrédients du frigo | `ANTHROPIC_API_KEY` |
| `detect-meal` | Vision : nutrition d'un repas | `ANTHROPIC_API_KEY` |
| `delete-account` | Suppression de compte (cascade) | *(auto : `SUPABASE_*`)* |
| `revenuecat-webhook` | Sync des abonnements | *(config RevenueCat)* |

**Déploiement :**
```bash
# Secret partagé pour la vision (jamais dans l'app)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# (optionnel) reporting d'erreurs serveur
supabase secrets set SENTRY_DSN=https://...

supabase functions deploy detect-ingredients
supabase functions deploy detect-meal
supabase functions deploy delete-account
supabase functions deploy revenuecat-webhook
```

> `supabase.functions.invoke` attache automatiquement le JWT de l'utilisateur connecté → la vérification d'auth par défaut passe sans configuration.

---

## 🧪 Tests

Tests unitaires de la couche `services/` (logique de calcul pure) :

```bash
npm test            # lance toute la suite
npm run test:watch  # mode watch
npm run typecheck   # vérification TypeScript (tsc --noEmit)
```

Couverture actuelle : `plan`, `nutrition`, `summary`, `insights`, `shoppingList`, `recipeFilters`.

---

## 📦 Builds & déploiement (EAS)

Profils définis dans `eas.json` :

```bash
# Dev build (modules natifs, simulateur/device internes)
eas build --profile development --platform ios
eas build --profile development --platform android

# Aperçu interne
eas build --profile preview --platform all

# Production (auto-increment de version)
eas build --profile production --platform all
eas submit --profile production --platform all
```

> ⚠️ L'app n'a pour l'instant été lancée que sur iOS. **Tester un build Android** avant publication (clavier, safe-area / gestes, notifications, achats RevenueCat).

---

## 🧮 Logique de calcul (résumé)

| Calcul | Méthode |
|---|---|
| Métabolisme de base (BMR) | **Mifflin-St Jeor** |
| Dépense énergétique (TDEE) | BMR × facteur d'activité (1.2 / 1.45 / 1.7) |
| Objectif calorique | TDEE − déficit (selon rythme), planché à BMR × 1.1 |
| Macros | Répartition selon le régime (healthy / keto / vegan / …) |
| Objectifs par repas | Split 30 % / 35 % / 25 % / 10 % (petit-déj / déj / dîner / collation) |
| Hydratation | 35 ml/kg de poids corporel |
| Rythme de perte | déficit × 7 / 7700 kcal par kg |
| IMC (BMI) | poids / taille² + catégorisation |

> Ces calculs s'exécutent **côté client** (pas de secret, pas de privilège requis) → instantanés, gratuits et fonctionnels hors-ligne.

---

## 📐 Conventions

- **TypeScript strict**, types partagés.
- **Aucune valeur en dur** : couleurs/espacements via les tokens du thème ; clés via `.env`.
- **i18n systématique** : aucun texte en dur, tout passe par `locales/`.
- **Logique pure dans `services/`**, présentation dans `components/`, état dans `context/`.
- Code spécifique plateforme isolé via `Platform.OS` / `Platform.select`.

---

<div align="center">
Fait avec ❤️ et 🥑
</div>
