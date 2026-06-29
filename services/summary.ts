
import { PlanTargets } from './plan';
import { MacroSet, scaleMacros } from './nutrition';


export interface Progress {
  value: number;
  goal: number;
  remaining: number;
  ratio: number;
  percent: number;
  reached: boolean;
}

export function progress(value: number, goal: number): Progress {
  const safeGoal = goal > 0 ? goal : 0;
  const raw = safeGoal > 0 ? value / safeGoal : 0;
  return {
    value: Math.round(value),
    goal: Math.round(safeGoal),
    remaining: Math.max(0, Math.round(safeGoal - value)),
    ratio: Math.max(0, Math.min(1, raw)),
    percent: Math.round(Math.max(0, raw) * 100),
    reached: safeGoal > 0 && value >= safeGoal,
  };
}


export interface DayInputs {
  consumedKcal: number;
  waterMl: number;
  steps: number;
}

export interface DaySummary {
  kcal: Progress;
  water: Progress;
  steps: Progress;
  consumedMacros: MacroSet;
  targetMacros: MacroSet;
}

const targetMacroSet = (t: PlanTargets): MacroSet => ({
  kcal: t.kcal,
  protein: t.protein,
  carbs: t.carbs,
  fat: t.fat,
});


export function estimateConsumedMacros(consumedKcal: number, targets: PlanTargets): MacroSet {
  const ratio = targets.kcal > 0 ? consumedKcal / targets.kcal : 0;
  return scaleMacros(targetMacroSet(targets), ratio);
}

export function computeDaySummary(
  day: DayInputs,
  targets: PlanTargets,
  stepGoal: number,
): DaySummary {
  return {
    kcal: progress(day.consumedKcal, targets.kcal),
    water: progress(day.waterMl, targets.waterMl),
    steps: progress(day.steps, stepGoal),
    consumedMacros: estimateConsumedMacros(day.consumedKcal, targets),
    targetMacros: targetMacroSet(targets),
  };
}


export interface WeightTrend {
  start: number;
  current: number;
  delta: number;
  series: number[];
}

export function computeWeightTrend(weights: number[]): WeightTrend {
  const series = weights.filter(w => w > 0);
  const start = series[0] ?? 0;
  const current = series[series.length - 1] ?? start;
  return {
    start: Math.round(start * 10) / 10,
    current: Math.round(current * 10) / 10,
    delta: Math.round((current - start) * 10) / 10,
    series,
  };
}

export interface WeeklyStats {
  daysLogged: number;
  avgKcal: number;
  daysOnTarget: number;
  adherencePercent: number;
  totalWaterMl: number;
  avgSteps: number;
  weight: WeightTrend;
}

export function computeWeeklyStats(
  days: DayInputs[],
  weights: number[],
  targets: PlanTargets,
): WeeklyStats {
  const logged = days.filter(d => d.consumedKcal > 0);
  const daysLogged = logged.length;
  const avgKcal = daysLogged > 0
    ? Math.round(logged.reduce((s, d) => s + d.consumedKcal, 0) / daysLogged)
    : 0;

  const tolerance = targets.kcal * 0.1;
  const daysOnTarget = logged.filter(
    d => Math.abs(d.consumedKcal - targets.kcal) <= tolerance,
  ).length;

  const totalWaterMl = days.reduce((s, d) => s + d.waterMl, 0);
  const stepsDays = days.filter(d => d.steps > 0);
  const avgSteps = stepsDays.length > 0
    ? Math.round(stepsDays.reduce((s, d) => s + d.steps, 0) / stepsDays.length)
    : 0;

  return {
    daysLogged,
    avgKcal,
    daysOnTarget,
    adherencePercent: daysLogged > 0 ? Math.round((daysOnTarget / daysLogged) * 100) : 0,
    totalWaterMl,
    avgSteps,
    weight: computeWeightTrend(weights),
  };
}
