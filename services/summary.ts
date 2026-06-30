// Lightweight day/weight helpers for the dashboard. Pure functions, no state.

export interface Progress {
  value: number;
  goal: number;
  remaining: number;
  ratio: number;
  percent: number;
  reached: boolean;
}

/** Normalise a value against a goal into ratios/percent/remaining for the UI. */
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

export interface WeightTrend {
  start: number;
  current: number;
  delta: number;
  series: number[];
}

/** Start/current/delta of a weight series (ignoring zero/unset entries). */
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
