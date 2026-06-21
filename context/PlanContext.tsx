import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import {
  UserProfile,
  PlanTargets,
  computeTargets,
} from '../services/plan';

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
};

interface PlanContextType {
  profile: UserProfile;
  targets: PlanTargets;
  intake: DailyIntake;
  consumedKcal: number;
  onboardingComplete: boolean;
  selectedDayIndex: number;
  setSelectedDayIndex: (index: number) => void;
  weeklyIntake: Record<number, DailyIntake>;
  completeOnboarding: (profile: UserProfile) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  logMeal: (slot: MealSlot, kcal: number) => void;
  addWater: (ml: number) => void;
  updateSteps: (steps: number) => void;
  updateWeight: (weight: number) => void;
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

  const targets = useMemo(() => computeTargets(profile), [profile]);

  const intake = useMemo(() => {
    return weeklyIntake[selectedDayIndex] || { ...EMPTY_INTAKE, weight: profile.weight };
  }, [weeklyIntake, selectedDayIndex, profile.weight]);

  const consumedKcal = useMemo(() => {
    return intake.breakfast + intake.lunch + intake.dinner + intake.snack;
  }, [intake]);

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

  const logMeal = (slot: MealSlot, kcal: number) => {
    setWeeklyIntake(prev => {
      const currentDay = prev[selectedDayIndex] || { ...EMPTY_INTAKE, weight: profile.weight };
      return {
        ...prev,
        [selectedDayIndex]: {
          ...currentDay,
          [slot]: currentDay[slot] === kcal ? 0 : kcal,
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

  const updateWeight = (weight: number) => {
    setWeeklyIntake(prev => {
      const currentDay = prev[selectedDayIndex] || { ...EMPTY_INTAKE, weight: profile.weight };
      return {
        ...prev,
        [selectedDayIndex]: {
          ...currentDay,
          weight: Math.max(0, weight),
        },
      };
    });
  };

  const resetDay = () => {
    setWeeklyIntake(prev => ({
      ...prev,
      [selectedDayIndex]: { ...EMPTY_INTAKE, weight: profile.weight },
    }));
  };

  return (
    <PlanContext.Provider
      value={{
        profile,
        targets,
        intake,
        consumedKcal,
        onboardingComplete,
        selectedDayIndex,
        setSelectedDayIndex,
        weeklyIntake,
        completeOnboarding,
        updateProfile,
        logMeal,
        addWater,
        updateSteps,
        updateWeight,
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
