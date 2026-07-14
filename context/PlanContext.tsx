import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
import {
  UserProfile,
  PlanTargets,
  computeTargets,
  computeMealTargets,
  MealTarget,
} from '../services/plan';
import { MacroSet, EMPTY_MACROS, addMacros } from '../services/nutrition';
import { useAuth } from './AuthContext';
import { getMyProfile, updateMyProfile, ProfileRow } from '../lib/api/profile';
import { weekDates, getWeek, upsertDayLog, syncSlot, Slot } from '../lib/api/tracking';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface DailyIntake {
  breakfast: number;
  lunch: number;
  dinner: number;
  snack: number;
  waterMl: number;
  steps: number;
  weight: number;
}

const DEFAULT_PROFILE: UserProfile = {
  sex: 'male',
  height: 170,
  age: 25,
  weight: 75,
  targetWeight: 70,
  activity: 'active',
  goalPace: 'medium',
  dailySteps: 8000,
  diet: 'healthy',
};

interface PlanContextType {
  profile: UserProfile;
  targets: PlanTargets;
  /** Per-meal kcal + macro targets, derived from `targets` (30/35/25/10 split). */
  mealTargets: Record<MealSlot, MealTarget>;
  intake: DailyIntake;
  consumedKcal: number;
  consumedMacros: MacroSet;
  /** Consumed macros for one meal slot (real tracked + target-split estimate). */
  mealMacrosFor: (slot: MealSlot) => MacroSet;
  onboardingComplete: boolean;
  selectedDayIndex: number;
  setSelectedDayIndex: (index: number) => void;
  weeklyIntake: Record<number, DailyIntake>;
  completeOnboarding: (profile: UserProfile) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  logMeal: (slot: MealSlot, kcal: number, macros?: MacroSet) => void;
  addCustomKcal: (slot: MealSlot, kcal: number) => void;
  toggleMealRecipe: (slot: MealSlot, id: string, kcal: number) => void;
  isRecipeLogged: (slot: MealSlot, id: string) => boolean;
  loggedRecipeIds: string[];
  addWater: (ml: number) => void;
  updateSteps: (steps: number) => void;
  resetDay: () => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

const EMPTY_INTAKE: DailyIntake = {
  breakfast: 0,
  lunch: 0,
  dinner: 0,
  snack: 0,
  waterMl: 0,
  steps: 0,
  weight: 0,
};

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const emptyWeek = (weight: number): Record<number, DailyIntake> => {
  const w: Record<number, DailyIntake> = {};
  for (let i = 0; i < 7; i++) w[i] = { ...EMPTY_INTAKE, weight };
  return w;
};

/* ── profiles row ↔ UserProfile mapping ─────────────────────────── */
function profileFromRow(row: ProfileRow | null, fallback: UserProfile): UserProfile {
  if (!row) return fallback;
  return {
    sex: (row.sex as UserProfile['sex']) ?? fallback.sex,
    height: row.height_cm ?? fallback.height,
    age: row.age ?? fallback.age,
    weight: row.current_weight_kg ?? fallback.weight,
    targetWeight: row.target_weight_kg ?? fallback.targetWeight,
    activity: (row.activity as UserProfile['activity']) ?? fallback.activity,
    goalPace: (row.goal_pace as UserProfile['goalPace']) ?? fallback.goalPace,
    dailySteps: row.daily_steps_goal ?? fallback.dailySteps,
    diet: (row.diet as UserProfile['diet']) ?? fallback.diet,
  };
}
function profileToRow(p: Partial<UserProfile>): Partial<ProfileRow> {
  const r: Partial<ProfileRow> = {};
  if (p.sex !== undefined) r.sex = p.sex;
  if (p.height !== undefined) r.height_cm = p.height;
  if (p.age !== undefined) r.age = p.age;
  if (p.weight !== undefined) r.current_weight_kg = p.weight;
  if (p.targetWeight !== undefined) r.target_weight_kg = p.targetWeight;
  if (p.activity !== undefined) r.activity = p.activity;
  if (p.goalPace !== undefined) r.goal_pace = p.goalPace;
  if (p.dailySteps !== undefined) r.daily_steps_goal = p.dailySteps;
  if (p.diet !== undefined) r.diet = p.diet;
  return r;
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    () => (new Date().getDay() + 6) % 7,
  );
  const [weeklyIntake, setWeeklyIntake] = useState<Record<number, DailyIntake>>(() =>
    emptyWeek(DEFAULT_PROFILE.weight),
  );
  // day → slot → { recipeId: kcal }
  const [loggedRecipes, setLoggedRecipes] = useState<
    Record<number, Partial<Record<MealSlot, Record<string, number>>>>
  >({});
  // day → slot → measured macros
  const [mealMacros, setMealMacros] = useState<Record<number, Partial<Record<MealSlot, MacroSet>>>>(
    {},
  );

  // ISO dates (Mon..Sun) for the current week — stable for the session.
  const weekISO = useMemo(() => weekDates(), []);
  const dateFor = (index: number) => weekISO[index];

  /* ── Hydrate from Supabase on sign-in ─────────────────────────── */
  useEffect(() => {
    if (!userId) {
      setProfile(DEFAULT_PROFILE);
      setOnboardingComplete(false);
      setWeeklyIntake(emptyWeek(DEFAULT_PROFILE.weight));
      setLoggedRecipes({});
      setMealMacros({});
      return;
    }
    let active = true;
    (async () => {
      const [profileRow, week] = await Promise.all([getMyProfile(), getWeek(weekISO)]);
      if (!active) return;

      const nextProfile = profileFromRow(profileRow, DEFAULT_PROFILE);
      setProfile(nextProfile);
      setOnboardingComplete(!!profileRow?.onboarding_done);

      const intake = emptyWeek(nextProfile.weight);
      const recipes: Record<number, Partial<Record<MealSlot, Record<string, number>>>> = {};
      const macros: Record<number, Partial<Record<MealSlot, MacroSet>>> = {};

      for (const log of week.logs) {
        const i = weekISO.indexOf(log.log_date);
        if (i < 0) continue;
        intake[i].waterMl = log.water_ml ?? 0;
        intake[i].steps = log.steps ?? 0;
        if (log.weight_kg != null) intake[i].weight = log.weight_kg;
      }
      for (const e of week.entries) {
        const i = weekISO.indexOf(e.log_date);
        if (i < 0) continue;
        const slot = e.slot as MealSlot;
        intake[i][slot] = (intake[i][slot] ?? 0) + (e.kcal ?? 0);
        if (e.source === 'recipe' && e.recipe_id) {
          recipes[i] = recipes[i] ?? {};
          recipes[i]![slot] = { ...(recipes[i]![slot] ?? {}), [e.recipe_id]: e.kcal };
        }
        if ((e.protein_g ?? 0) + (e.carbs_g ?? 0) + (e.fat_g ?? 0) > 0) {
          macros[i] = macros[i] ?? {};
          macros[i]![slot] = addMacros(macros[i]![slot] ?? { ...EMPTY_MACROS }, {
            kcal: e.kcal,
            protein: e.protein_g,
            carbs: e.carbs_g,
            fat: e.fat_g,
          });
        }
      }
      setWeeklyIntake(intake);
      setLoggedRecipes(recipes);
      setMealMacros(macros);
    })();
    return () => {
      active = false;
    };
  }, [userId, weekISO]);

  const targets = useMemo(() => computeTargets(profile), [profile]);
  const mealTargets = useMemo(() => computeMealTargets(targets), [targets]);

  const loggedRecipeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const day of Object.values(loggedRecipes)) {
      for (const slot of Object.values(day ?? {})) {
        Object.keys(slot ?? {}).forEach((id) => ids.add(id));
      }
    }
    return Array.from(ids);
  }, [loggedRecipes]);

  const intake = useMemo(() => {
    return weeklyIntake[selectedDayIndex] || { ...EMPTY_INTAKE, weight: profile.weight };
  }, [weeklyIntake, selectedDayIndex, profile.weight]);

  const consumedKcal = useMemo(() => {
    return intake.breakfast + intake.lunch + intake.dinner + intake.snack;
  }, [intake]);

  const consumedMacros = useMemo<MacroSet>(() => {
    const dayMacros = mealMacros[selectedDayIndex] ?? {};
    let tracked: MacroSet = { ...EMPTY_MACROS };
    for (const m of Object.values(dayMacros)) {
      if (m) tracked = addMacros(tracked, m);
    }
    const untrackedKcal = Math.max(0, consumedKcal - tracked.kcal);
    const ratio = targets.kcal > 0 ? untrackedKcal / targets.kcal : 0;
    return addMacros(tracked, {
      kcal: untrackedKcal,
      protein: targets.protein * ratio,
      carbs: targets.carbs * ratio,
      fat: targets.fat * ratio,
    });
  }, [mealMacros, selectedDayIndex, consumedKcal, targets]);

  // Per-meal consumed macros — same model as the daily total: use the real
  // measured macros for the slot (e.g. from a scan) and estimate the rest of the
  // slot's kcal with the profile's macro split. Keeps every screen consistent.
  const mealMacrosFor = (slot: MealSlot): MacroSet => {
    const tracked = mealMacros[selectedDayIndex]?.[slot] ?? { ...EMPTY_MACROS };
    const slotKcal = weeklyIntake[selectedDayIndex]?.[slot] ?? 0;
    const untrackedKcal = Math.max(0, slotKcal - tracked.kcal);
    const ratio = targets.kcal > 0 ? untrackedKcal / targets.kcal : 0;
    return addMacros(tracked, {
      kcal: untrackedKcal,
      protein: targets.protein * ratio,
      carbs: targets.carbs * ratio,
      fat: targets.fat * ratio,
    });
  };

  /* ── Persist one meal slot as normalized entries ──────────────── */
  const persistSlot = (
    dayIndex: number,
    slot: MealSlot,
    slotKcal: number,
    recipeMap: Record<string, number>,
    macros?: MacroSet,
  ) => {
    const date = dateFor(dayIndex);
    if (!date) return;
    const entries = Object.entries(recipeMap).map(([recipe_id, kcal]) => ({
      source: 'recipe',
      recipe_id,
      kcal,
    }));
    const recipeSum = Object.values(recipeMap).reduce((s, k) => s + k, 0);
    const remainder = Math.max(0, slotKcal - recipeSum);
    if (remainder > 0) {
      entries.push({
        source: macros ? 'scan' : 'quick',
        recipe_id: null as any,
        kcal: remainder,
        ...(macros
          ? { macros: { protein: macros.protein, carbs: macros.carbs, fat: macros.fat } }
          : {}),
      } as any);
    }
    syncSlot(date, slot as Slot, entries as any);
  };

  const completeOnboarding = (next: UserProfile) => {
    setProfile(next);
    setOnboardingComplete(true);
    setWeeklyIntake((prev) => {
      const updated = { ...prev };
      for (let i = 0; i < 7; i++) {
        updated[i] = updated[i]
          ? { ...updated[i], weight: next.weight }
          : { ...EMPTY_INTAKE, weight: next.weight };
      }
      return updated;
    });
    updateMyProfile({ ...profileToRow(next), onboarding_done: true }).catch(() => {});
  };

  const updateProfile = (patch: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
    if (patch.weight !== undefined) {
      setWeeklyIntake((w) => {
        const updated = { ...w };
        for (let i = 0; i < 7; i++) {
          if (updated[i]) updated[i] = { ...updated[i], weight: patch.weight! };
        }
        return updated;
      });
      upsertDayLog(dateFor(selectedDayIndex), { weight_kg: patch.weight });
    }
    updateMyProfile(profileToRow(patch)).catch(() => {});
  };

  const logMeal = (slot: MealSlot, kcal: number, macros?: MacroSet) => {
    const toggleOff = kcal !== 0 && (weeklyIntake[selectedDayIndex]?.[slot] ?? 0) === kcal;
    const nextKcal = toggleOff ? 0 : kcal;
    const nextMacros = toggleOff || !macros ? undefined : macros;
    const recipeMap = loggedRecipes[selectedDayIndex]?.[slot] ?? {};

    setWeeklyIntake((prev) => {
      const currentDay = prev[selectedDayIndex] || { ...EMPTY_INTAKE, weight: profile.weight };
      return { ...prev, [selectedDayIndex]: { ...currentDay, [slot]: nextKcal } };
    });
    setMealMacros((prev) => {
      const day = { ...(prev[selectedDayIndex] ?? {}) };
      if (!nextMacros) delete day[slot];
      else day[slot] = nextMacros;
      return { ...prev, [selectedDayIndex]: day };
    });
    persistSlot(selectedDayIndex, slot, nextKcal, recipeMap, nextMacros);
  };

  const addCustomKcal = (slot: MealSlot, kcal: number) => {
    const nextKcal = Math.max(0, (weeklyIntake[selectedDayIndex]?.[slot] ?? 0) + kcal);
    const recipeMap = loggedRecipes[selectedDayIndex]?.[slot] ?? {};
    const macros = mealMacros[selectedDayIndex]?.[slot];
    setWeeklyIntake((prev) => {
      const currentDay = prev[selectedDayIndex] || { ...EMPTY_INTAKE, weight: profile.weight };
      return { ...prev, [selectedDayIndex]: { ...currentDay, [slot]: nextKcal } };
    });
    persistSlot(selectedDayIndex, slot, nextKcal, recipeMap, macros);
  };

  const isRecipeLogged = (slot: MealSlot, id: string): boolean =>
    loggedRecipes[selectedDayIndex]?.[slot]?.[id] != null;

  const toggleMealRecipe = (slot: MealSlot, id: string, kcal: number) => {
    const slotMap = loggedRecipes[selectedDayIndex]?.[slot] ?? {};
    const already = slotMap[id] != null;
    const delta = already ? -slotMap[id] : kcal;
    const nextMap = { ...slotMap };
    if (already) delete nextMap[id];
    else nextMap[id] = kcal;
    const nextKcal = Math.max(0, (weeklyIntake[selectedDayIndex]?.[slot] ?? 0) + delta);
    const macros = mealMacros[selectedDayIndex]?.[slot];

    setLoggedRecipes((prev) => {
      const day = { ...(prev[selectedDayIndex] ?? {}) };
      day[slot] = nextMap;
      return { ...prev, [selectedDayIndex]: day };
    });
    setWeeklyIntake((prev) => {
      const currentDay = prev[selectedDayIndex] || { ...EMPTY_INTAKE, weight: profile.weight };
      return { ...prev, [selectedDayIndex]: { ...currentDay, [slot]: nextKcal } };
    });
    persistSlot(selectedDayIndex, slot, nextKcal, nextMap, macros);
  };

  const addWater = (ml: number) => {
    const next = Math.max(0, (weeklyIntake[selectedDayIndex]?.waterMl ?? 0) + ml);
    setWeeklyIntake((prev) => {
      const currentDay = prev[selectedDayIndex] || { ...EMPTY_INTAKE, weight: profile.weight };
      return { ...prev, [selectedDayIndex]: { ...currentDay, waterMl: next } };
    });
    upsertDayLog(dateFor(selectedDayIndex), { water_ml: next });
  };

  const updateSteps = (steps: number) => {
    const next = Math.max(0, steps);
    setWeeklyIntake((prev) => {
      const currentDay = prev[selectedDayIndex] || { ...EMPTY_INTAKE, weight: profile.weight };
      return { ...prev, [selectedDayIndex]: { ...currentDay, steps: next } };
    });
    upsertDayLog(dateFor(selectedDayIndex), { steps: next });
  };

  const resetDay = () => {
    setWeeklyIntake((prev) => ({
      ...prev,
      [selectedDayIndex]: { ...EMPTY_INTAKE, weight: profile.weight },
    }));
    setMealMacros((prev) => ({ ...prev, [selectedDayIndex]: {} }));
    setLoggedRecipes((prev) => ({ ...prev, [selectedDayIndex]: {} }));
    const date = dateFor(selectedDayIndex);
    upsertDayLog(date, { water_ml: 0, steps: 0 });
    SLOTS.forEach((slot) => syncSlot(date, slot as Slot, []));
  };

  return (
    <PlanContext.Provider
      value={{
        profile,
        targets,
        mealTargets,
        intake,
        consumedKcal,
        consumedMacros,
        mealMacrosFor,
        onboardingComplete,
        selectedDayIndex,
        setSelectedDayIndex,
        weeklyIntake,
        completeOnboarding,
        updateProfile,
        logMeal,
        addCustomKcal,
        toggleMealRecipe,
        isRecipeLogged,
        loggedRecipeIds,
        addWater,
        updateSteps,
        resetDay,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used inside PlanProvider');
  return ctx;
}
