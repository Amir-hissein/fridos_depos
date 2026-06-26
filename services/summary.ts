// Summary service — turns raw daily/weekly intake into the progress figures the
// UI shows (consumed vs goal, remaining, %, weight trend, adherence).
// Pure & deterministic. Screens consume these instead of computing inline.

import { PlanTargets } from './plan';
import { MacroSet, scaleMacros } from './nutrition';

/** A single value measured against a goal. */
export interface Progress {
  value: number;
  goal: number;
  /** goal − value, clamped to ≥ 0. */
  remaining: number;
  /** value / goal, clamped to 0..1 (for progress bars). */
  ratio: number;
  /** Raw percentage (can exceed 100). */
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

/** Minimal daily inputs (avoids depending on the context's DailyIntake type). */
export interface DayInputs {
  consumedKcal: number;
  waterMl: number;
  steps: number;
}

export interface DaySummary {
  kcal: Progress;
  water: Progress;
  steps: Progress;
  /** Macros consumed, estimated by scaling target macros to the consumed kcal. */
  consumedMacros: MacroSet;
  targetMacros: MacroSet;
}

const targetMacroSet = (t: PlanTargets): MacroSet => ({
  kcal: t.kcal,
  protein: t.protein,
  carbs: t.carbs,
  fat: t.fat,
});

/**
 * Estimate macros consumed from the day's kcal. Meals are logged as kcal only,
 * so we distribute them along the planned macro ratio. (When real per-meal
 * macros become available, swap this for an exact sum.)
 */
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

/* ── Weekly aggregates ──────────────────────────────────────────────────── */

export interface WeightTrend {
  start: number;
  current: number;
  /** current − start (negative = loss). */
  delta: number;
  /** Weight series across the week (one entry per logged day). */
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
  /** Days with any logged kcal. */
  daysLogged: number;
  avgKcal: number;
  /** Days whose kcal landed within ±10% of the target. */
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
