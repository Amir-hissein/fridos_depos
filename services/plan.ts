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
  healthy:    { p: 0.25, c: 0.50, f: 0.25 },
  keto:       { p: 0.25, c: 0.05, f: 0.70 },
  vegan:      { p: 0.20, c: 0.55, f: 0.25 },
  glutenfree: { p: 0.25, c: 0.45, f: 0.30 },
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
