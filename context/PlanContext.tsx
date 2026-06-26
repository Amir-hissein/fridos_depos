import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  PlanTargets,
  computeTargets,
} from '../services/plan';
import { MacroSet, EMPTY_MACROS, addMacros } from '../services/nutrition';

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
  intake: DailyIntake;
  consumedKcal: number;
  /**
   * Macros consumed today. Meals logged with measured macros (e.g. an AI plate
   * scan) count for real; any remaining kcal is estimated from the diet split.
   */
  consumedMacros: MacroSet;
  onboardingComplete: boolean;
  selectedDayIndex: number;
  setSelectedDayIndex: (index: number) => void;
  weeklyIntake: Record<number, DailyIntake>;
  completeOnboarding: (profile: UserProfile) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  /** Log a meal's calories to a slot. Pass `macros` (e.g. from an AI scan) to
   *  track its real protein/carbs/fat instead of the diet-split estimate. */
  logMeal: (slot: MealSlot, kcal: number, macros?: MacroSet) => void;
  /** Add a one-off custom amount of kcal to a meal slot. */
  addCustomKcal: (slot: MealSlot, kcal: number) => void;
  /** Add/remove a specific recipe from a meal slot (additive, tracked by id). */
  toggleMealRecipe: (slot: MealSlot, id: string, kcal: number) => void;
  isRecipeLogged: (slot: MealSlot, id: string) => boolean;
  /** Ids de toutes les recettes ajoutées aux repas de la semaine (dédupliqués). */
  loggedRecipeIds: string[];
  addWater: (ml: number) => void;
  updateSteps: (steps: number) => void;
  resetDay: () => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

/** AsyncStorage key for the persisted tracking state (bump suffix to migrate). */
const STORAGE_KEY = 'plan.state.v1';

const EMPTY_INTAKE: DailyIntake = {
  breakfast: 0,
  lunch: 0,
  dinner: 0,
  snack: 0,
  waterMl: 0,
  steps: 0,
  weight: 75.0,
};

const INITIAL_WEEKLY_INTAKE: Record<number, DailyIntake> = {
  0: { breakfast: 350, lunch: 0, dinner: 0, snack: 0, waterMl: 1200, steps: 4320, weight: 75.0 }, // Mon
  1: { breakfast: 0, lunch: 0, dinner: 0, snack: 0, waterMl: 0, steps: 0, weight: 74.8 },        // Tue
  2: { breakfast: 480, lunch: 520, dinner: 600, snack: 150, waterMl: 2100, steps: 9800, weight: 74.6 }, // Wed
  3: { breakfast: 0, lunch: 0, dinner: 0, snack: 0, waterMl: 0, steps: 0, weight: 74.6 },        // Thu
  4: { breakfast: 0, lunch: 0, dinner: 0, snack: 0, waterMl: 0, steps: 0, weight: 74.5 },        // Fri
  5: { breakfast: 0, lunch: 0, dinner: 0, snack: 0, waterMl: 0, steps: 0, weight: 74.3 },        // Sat
  6: { breakfast: 0, lunch: 0, dinner: 0, snack: 0, waterMl: 0, steps: 0, weight: 74.2 },        // Sun
};

export function PlanProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    // Default to today's index: 0 = Mon, ..., 6 = Sun
    return (new Date().getDay() + 6) % 7;
  });
  const [weeklyIntake, setWeeklyIntake] = useState<Record<number, DailyIntake>>(INITIAL_WEEKLY_INTAKE);
  // Recipes explicitly added to a meal: day → slot → { recipeId: kcal }.
  const [loggedRecipes, setLoggedRecipes] =
    useState<Record<number, Partial<Record<MealSlot, Record<string, number>>>>>({});
  // Measured macros for meals logged with real data (AI scans): day → slot → macros.
  const [mealMacros, setMealMacros] =
    useState<Record<number, Partial<Record<MealSlot, MacroSet>>>>({});

  // True once persisted state has loaded — gates saving so we never overwrite
  // storage with defaults before the first read completes.
  const [hydrated, setHydrated] = useState(false);

  // Load persisted tracking state on first mount.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (!active || !raw) return;
        const saved = JSON.parse(raw);
        if (saved.profile) setProfile(saved.profile);
        if (typeof saved.onboardingComplete === 'boolean') setOnboardingComplete(saved.onboardingComplete);
        if (saved.weeklyIntake) setWeeklyIntake(saved.weeklyIntake);
        if (saved.loggedRecipes) setLoggedRecipes(saved.loggedRecipes);
        if (saved.mealMacros) setMealMacros(saved.mealMacros);
      })
      .catch(() => {})
      .finally(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, []);

  // Persist whenever any tracking slice changes (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    const payload = JSON.stringify({ profile, onboardingComplete, weeklyIntake, loggedRecipes, mealMacros });
    AsyncStorage.setItem(STORAGE_KEY, payload).catch(() => {});
  }, [hydrated, profile, onboardingComplete, weeklyIntake, loggedRecipes, mealMacros]);

  const targets = useMemo(() => computeTargets(profile), [profile]);

  // Tous les ids de recettes ajoutées aux repas (toute la semaine), dédupliqués.
  const loggedRecipeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const day of Object.values(loggedRecipes)) {
      for (const slot of Object.values(day ?? {})) {
        Object.keys(slot ?? {}).forEach(id => ids.add(id));
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

  // Real macros from measured meals, plus a diet-split estimate for the rest of
  // the day's calories (legacy/custom entries that carry no macro breakdown).
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

  const completeOnboarding = (next: UserProfile) => {
    setProfile(next);
    setOnboardingComplete(true);
    // Seed weight to empty days
    setWeeklyIntake(prev => {
      const updated = { ...prev };
      for (let i = 0; i < 7; i++) {
        if (!updated[i]) {
          updated[i] = { ...EMPTY_INTAKE, weight: next.weight };
        } else {
          updated[i].weight = next.weight;
        }
      }
      return updated;
    });
  };

  const updateProfile = (patch: Partial<UserProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...patch };
      if (patch.weight !== undefined) {
        // Also update empty slot weight
        setWeeklyIntake(w => {
          const updated = { ...w };
          for (let i = 0; i < 7; i++) {
            if (updated[i]) updated[i].weight = patch.weight!;
          }
          return updated;
        });
      }
      return next;
    });
  };

  const logMeal = (slot: MealSlot, kcal: number, macros?: MacroSet) => {
    // Same value already in the slot → tapping again clears it (toggle).
    const toggleOff = kcal !== 0 && (weeklyIntake[selectedDayIndex]?.[slot] ?? 0) === kcal;

    setWeeklyIntake(prev => {
      const currentDay = prev[selectedDayIndex] || { ...EMPTY_INTAKE, weight: profile.weight };
      return {
        ...prev,
        [selectedDayIndex]: {
          ...currentDay,
          [slot]: toggleOff ? 0 : kcal,
        },
      };
    });

    // Keep measured macros in sync with the slot's value.
    setMealMacros(prev => {
      const day = { ...(prev[selectedDayIndex] ?? {}) };
      if (toggleOff || !macros) delete day[slot];
      else day[slot] = macros;
      return { ...prev, [selectedDayIndex]: day };
    });
  };

  const addCustomKcal = (slot: MealSlot, kcal: number) => {
    setWeeklyIntake(prev => {
      const currentDay = prev[selectedDayIndex] || { ...EMPTY_INTAKE, weight: profile.weight };
      return {
        ...prev,
        [selectedDayIndex]: {
          ...currentDay,
          [slot]: Math.max(0, currentDay[slot] + kcal),
        },
      };
    });
  };

  const isRecipeLogged = (slot: MealSlot, id: string): boolean =>
    loggedRecipes[selectedDayIndex]?.[slot]?.[id] != null;

  const toggleMealRecipe = (slot: MealSlot, id: string, kcal: number) => {
    const slotMap = loggedRecipes[selectedDayIndex]?.[slot] ?? {};
    const already = slotMap[id] != null;
    const delta = already ? -slotMap[id] : kcal;

    setLoggedRecipes(prev => {
      const day = { ...(prev[selectedDayIndex] ?? {}) };
      const sMap = { ...(day[slot] ?? {}) };
      if (already) delete sMap[id];
      else sMap[id] = kcal;
      day[slot] = sMap;
      return { ...prev, [selectedDayIndex]: day };
    });

    setWeeklyIntake(prev => {
      const currentDay = prev[selectedDayIndex] || { ...EMPTY_INTAKE, weight: profile.weight };
      return {
        ...prev,
        [selectedDayIndex]: {
          ...currentDay,
          [slot]: Math.max(0, currentDay[slot] + delta),
        },
      };
    });
  };

  const addWater = (ml: number) => {
    setWeeklyIntake(prev => {
      const currentDay = prev[selectedDayIndex] || { ...EMPTY_INTAKE, weight: profile.weight };
      return {
        ...prev,
        [selectedDayIndex]: {
          ...currentDay,
          waterMl: Math.max(0, currentDay.waterMl + ml),
        },
      };
    });
  };

  const updateSteps = (steps: number) => {
    setWeeklyIntake(prev => {
      const currentDay = prev[selectedDayIndex] || { ...EMPTY_INTAKE, weight: profile.weight };
      return {
        ...prev,
        [selectedDayIndex]: {
          ...currentDay,
          steps: Math.max(0, steps),
        },
      };
    });
  };

  const resetDay = () => {
    setWeeklyIntake(prev => ({
      ...prev,
      [selectedDayIndex]: { ...EMPTY_INTAKE, weight: profile.weight },
    }));
    setMealMacros(prev => ({ ...prev, [selectedDayIndex]: {} }));
  };

  return (
    <PlanContext.Provider
      value={{
        profile,
        targets,
        intake,
        consumedKcal,
        consumedMacros,
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
