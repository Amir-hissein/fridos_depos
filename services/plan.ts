// Nutrition plan service — derives calorie & macro targets from a user profile.
// Pure & deterministic (Mifflin-St Jeor BMR + activity TDEE + goal deficit).
// Later this is where a Supabase `user_plans` row would be read/written.

export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'active' | 'cardio';
export type GoalPace = 'easy' | 'medium' | 'hard';

export interface UserProfile {
  sex: Sex;
  height: number; // cm
  age: number;
  weight: number; // kg
  targetWeight: number; // kg
  activity: Activity;
  goalPace: GoalPace;
  dailySteps: number;
}

export interface PlanTargets {
  bmr: number;
  tdee: number;
  deficit: number;
  kcal: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
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

/** Mifflin-St Jeor basal metabolic rate. */
export function computeBMR(profile: UserProfile): number {
  const base = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
  return profile.sex === 'male' ? base + 5 : base - 161;
}

/** Total daily energy expenditure (BMR × activity). */
export function computeTDEE(profile: UserProfile): number {
  return computeBMR(profile) * ACTIVITY_FACTOR[profile.activity];
}

/** Full calorie + macro targets. Macro split 25% protein / 50% carbs / 25% fat. */
export function computeTargets(profile: UserProfile): PlanTargets {
  const bmr = computeBMR(profile);
  const tdee = computeTDEE(profile);
  const losing = profile.targetWeight < profile.weight;
  const deficit = losing ? PACE_DEFICIT[profile.goalPace] : 0;
  // Never go below 1.1× BMR for safety.
  const kcal = Math.max(Math.round(tdee - deficit), Math.round(bmr * 1.1));

  const protein = Math.round((kcal * 0.25) / 4);
  const carbs = Math.round((kcal * 0.5) / 4);
  const fat = Math.round((kcal * 0.25) / 9);
  const waterMl = Math.round((profile.weight * 35) / 50) * 50; // ~35 ml/kg, rounded

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

/** Estimated number of weeks to reach the target weight at the chosen pace. */
export function weeksToGoal(profile: UserProfile): number {
  const diff = Math.abs(profile.weight - profile.targetWeight);
  if (diff < 0.1) return 0;
  const deficit = PACE_DEFICIT[profile.goalPace];
  const weeklyLossKg = (deficit * 7) / 7700; // ~7700 kcal per kg
  return Math.max(1, Math.ceil(diff / weeklyLossKg));
}

export type BMICategory = 'Underweight' | 'Healthy' | 'Overweight' | 'Obese';

export interface BMIResult {
  value: number;
  category: BMICategory;
  /** Position 0–1 along the underweight→obese scale, for the UI gauge. */
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
  // Map 15→0 and 40→1 for the gauge.
  const position = Math.min(1, Math.max(0, (value - 15) / 25));
  return { value: Math.round(value * 10) / 10, category, position };
}
