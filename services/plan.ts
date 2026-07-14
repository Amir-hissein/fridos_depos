export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'active' | 'cardio';
export type GoalPace = 'easy' | 'medium' | 'hard';
export type DietPref = 'healthy' | 'keto' | 'vegan' | 'glutenfree' | 'vegetarian';
export interface UserProfile {
  sex: Sex;
  height: number;
  age: number;
  weight: number;
  targetWeight: number;
  activity: Activity;
  goalPace: GoalPace;
  dailySteps: number;
  diet?: DietPref;
}
export interface PlanTargets {
  bmr: number;
  tdee: number;
  deficit: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
}

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  active: 1.45,
  cardio: 1.7,
};

const PACE_DEFICIT: Record<GoalPace, number> = {
  easy: 300,
  medium: 500,
  hard: 750,
};

const MACRO_SPLIT: Record<DietPref, { p: number; c: number; f: number }> = {
  healthy: { p: 0.25, c: 0.5, f: 0.25 },
  keto: { p: 0.25, c: 0.05, f: 0.7 },
  vegan: { p: 0.2, c: 0.55, f: 0.25 },
  glutenfree: { p: 0.25, c: 0.45, f: 0.3 },
  vegetarian: { p: 0.22, c: 0.53, f: 0.25 },
};

export function computeBMR(profile: UserProfile): number {
  const base = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
  return profile.sex === 'male' ? base + 5 : base - 161;
}

export function computeTDEE(profile: UserProfile): number {
  return computeBMR(profile) * ACTIVITY_FACTOR[profile.activity];
}

export function computeTargets(profile: UserProfile): PlanTargets {
  const bmr = computeBMR(profile);
  const tdee = computeTDEE(profile);
  const losing = profile.targetWeight < profile.weight;
  const deficit = losing ? PACE_DEFICIT[profile.goalPace] : 0;
  const kcal = Math.max(Math.round(tdee - deficit), Math.round(bmr * 1.1));

  const split = MACRO_SPLIT[profile.diet ?? 'healthy'] ?? MACRO_SPLIT.healthy;
  const protein = Math.round((kcal * split.p) / 4);
  const carbs = Math.round((kcal * split.c) / 4);
  const fat = Math.round((kcal * split.f) / 9);
  const waterMl = Math.round((profile.weight * 35) / 50) * 50;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    deficit,
    kcal,
    protein,
    carbs,
    fat,
    waterMl,
  };
}

/* ── Per-meal targets ──────────────────────────────────────────────
 * Splits the daily plan across the four meal slots so each meal carries
 * its share of the kcal + macro goals. Default split: breakfast 30 %,
 * lunch 35 %, dinner 25 %, snack 10 % (sums to 100 %).
 */
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealTarget {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const MEAL_SPLIT: Record<MealSlot, number> = {
  breakfast: 0.3,
  lunch: 0.35,
  dinner: 0.25,
  snack: 0.1,
};

export function computeMealTargets(targets: PlanTargets): Record<MealSlot, MealTarget> {
  const slots = Object.keys(MEAL_SPLIT) as MealSlot[];
  return slots.reduce(
    (acc, slot) => {
      const share = MEAL_SPLIT[slot];
      acc[slot] = {
        kcal: Math.round(targets.kcal * share),
        protein: Math.round(targets.protein * share),
        carbs: Math.round(targets.carbs * share),
        fat: Math.round(targets.fat * share),
      };
      return acc;
    },
    {} as Record<MealSlot, MealTarget>,
  );
}

/** Expected weekly weight change (kg) for a given pace. ~7700 kcal per kg. */
export function weeklyRateKg(pace: GoalPace): number {
  return (PACE_DEFICIT[pace] * 7) / 7700;
}

export function weeksToGoal(profile: UserProfile): number {
  const diff = Math.abs(profile.weight - profile.targetWeight);
  if (diff < 0.1) return 0;
  const weeklyLossKg = weeklyRateKg(profile.goalPace);
  return Math.max(1, Math.ceil(diff / weeklyLossKg));
}

export type BMICategory = 'Underweight' | 'Healthy' | 'Overweight' | 'Obese';

export interface BMIResult {
  value: number;
  category: BMICategory;
  position: number;
}

export function computeBMI(weightKg: number, heightCm: number): BMIResult {
  const m = heightCm / 100;
  const value = m > 0 ? weightKg / (m * m) : 0;
  let category: BMICategory = 'Healthy';
  if (value < 18.5) category = 'Underweight';
  else if (value < 25) category = 'Healthy';
  else if (value < 30) category = 'Overweight';
  else category = 'Obese';

  const position = Math.min(1, Math.max(0, (value - 15) / 25));
  return { value: Math.round(value * 10) / 10, category, position };
}
