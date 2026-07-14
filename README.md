<div align="center">

<img src="docs/images/banner.png" alt="Fridos AI — Scan. Track. Eat Smart." width="100%">

<br/><br/>

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

**Scan your fridge, track your calories and eat smart — powered by AI.**

</div>

---

## ✨ Features

- 📷 **AI Scanner** — identifies your ingredients and estimates a meal's calories/macros from a photo (Claude Vision)
- 🍳 **Smart Recipes** — sorted by how well they match what you already have
- 📊 **Nutrition Tracking** — personalized goals (BMR/TDEE), macros, water, steps, weight
- 💡 **Daily Insights** — contextual tips (hydration, protein, calories…)
- 🛒 **Shopping List** — generated from the ingredients you're missing
- 👑 **Premium** — monthly/annual subscription via RevenueCat
- 🌍 **Multilingual** (EN · FR · TR) · 🌗 **Dark / Light**

## 🧱 Stack

**Mobile** React Native 0.81 · Expo SDK 54 · TypeScript strict · Expo Router · Reanimated 4
**Backend** Supabase (Postgres + Auth + Edge Functions) · Claude Vision · RevenueCat
**Tooling** i18next · Sentry · Jest · EAS Build

## 🚀 Getting Started

> A **development build** is required (native modules: camera, RevenueCat) — Expo Go is not enough.

```bash
npm install                 # 1. dependencies
cp .env.example .env        # 2. fill in the keys (see below)
npm run ios                 # 3. build + run (or: npm run android / npm start)
```

### Environment variables

`EXPO_PUBLIC_*` keys are **public by design** (protected server-side by RLS / RevenueCat). Real **secrets** (Anthropic key, service-role) live **only** in Supabase Edge Functions, never in the app bundle.

| Variable                                          | Purpose                                    |
| :------------------------------------------------ | :----------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY`          | Supabase project (anon key, RLS-protected) |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ANDROID_KEY` | RevenueCat SDK keys                        |
| `EXPO_PUBLIC_SENTRY_DSN`                          | Sentry DSN (optional)                      |

## 🗂️ Architecture

Business logic is isolated from the UI and **tested**: `services/` (pure functions — BMR, macros, insights, fridge↔recipe matching) · `components/` (presentation) · `context/` (state per domain) · `app/` (Expo Router screens) · `supabase/` (SQL schema + Edge Functions).

## 🛠️ Backend

- **Database** — `supabase/schema.sql` (single source of truth); **RLS enabled** on every table (each user sees only their own data), cascading deletes.
- **Edge Functions** — AI and privileged operations run server-side: `detect-ingredients`, `detect-meal` (Vision), `delete-account`, `revenuecat-webhook`.

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...   # never in the app
supabase functions deploy detect-ingredients detect-meal delete-account revenuecat-webhook
```

## 🧪 Quality

```bash
npm run validate    # typecheck + lint + tests
npm test            # unit tests (services/ layer)
```

GitHub Actions CI (typecheck · lint · tests) on every push/PR; Husky hooks for pre-commit (lint-staged) and pre-push (typecheck + tests).

## 📦 Build (EAS)

```bash
eas build --profile development --platform ios     # dev
eas build --profile preview     --platform all     # internal preview
eas build --profile production  --platform all && eas submit --profile production --platform all
```

> ⚠️ Mostly tested on **iOS** — validate a full **Android** build before shipping.

<div align="center"><br/>

Built with ❤️ and 🥑 by **Amir Hissein**

</div>
