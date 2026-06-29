

export type InsightSeverity = 'success' | 'warning' | 'info' | 'tip';

export interface Insight {

  id: string;
  severity: InsightSeverity;
  icon: string;
  titleKey: string;
  messageKey: string;
  params?: Record<string, string | number>;
  priority: number;
}

export interface InsightInput {
  hour: number;
  consumedKcal: number;
  targetKcal: number;
  consumedProtein: number;
  targetProtein: number;
  waterMl: number;
  waterGoalMl: number;
  steps: number;
  stepsGoal: number;
  meals: { breakfast: number; lunch: number; dinner: number; snack: number };
  weightDeltaKg?: number;
}

const keys = (id: string) => ({
  titleKey: `insights.${id}.title`,
  messageKey: `insights.${id}.message`,
});

export function buildInsights(input: InsightInput): Insight[] {
  const {
    hour,
    consumedKcal,
    targetKcal,
    consumedProtein,
    targetProtein,
    waterMl,
    waterGoalMl,
    steps,
    stepsGoal,
    meals,
    weightDeltaKg,
  } = input;

  const out: Insight[] = [];
  const push = (
    id: string,
    severity: InsightSeverity,
    icon: string,
    priority: number,
    params?: Record<string, string | number>,
  ) => out.push({ id, severity, icon, priority, params, ...keys(id) });

  const anythingLogged = consumedKcal > 0 || waterMl > 0 || steps > 0;

  /* ── Calories ─────────────────────────────────────────────── */
  if (targetKcal > 0 && consumedKcal > 0) {
    if (consumedKcal > targetKcal) {
      push('caloriesOver', 'warning', 'flame', 92, {
        over: Math.round(consumedKcal - targetKcal),
      });
    } else if (consumedKcal >= targetKcal * 0.9) {
      push('caloriesReached', 'success', 'flame', 68);
    }
  }

  /* ── Hydration ────────────────────────────────────────────── */
  if (waterGoalMl > 0) {
    const ratio = waterMl / waterGoalMl;
    const remaining = Math.max(0, Math.round(waterGoalMl - waterMl));
    if (ratio >= 1) {
      push('hydrationReached', 'success', 'water', 60);
    } else if (hour >= 14 && ratio < 0.5) {
      push('hydrationBehind', 'warning', 'water', 82, { remaining });
    } else if (remaining > 0) {
      push('hydrationTip', 'info', 'water', 34, {
        percent: Math.round(ratio * 100),
        remaining,
      });
    }
  }

  /* ── Protein (late-day top-up) ────────────────────────────── */
  if (hour >= 17 && targetProtein > 0 && consumedKcal > 0 && consumedProtein < targetProtein * 0.7) {
    push('proteinLow', 'tip', 'fitness', 48, {
      remaining: Math.max(0, Math.round(targetProtein - consumedProtein)),
    });
  }

  /* ── Steps (evening) ──────────────────────────────────────── */
  if (hour >= 18 && stepsGoal > 0 && steps > 0 && steps < stepsGoal) {
    push('stepsBehind', 'tip', 'walk', 42, {
      remaining: Math.max(0, stepsGoal - steps),
    });
  }

  /* ── Unlogged meals ───────────────────────────────────────── */
  if (hour >= 20 && meals.dinner === 0) {
    push('logDinner', 'tip', 'moon-outline', 58);
  } else if (hour >= 14 && meals.lunch === 0) {
    push('logLunch', 'tip', 'restaurant-outline', 56);
  }

  /* ── Weight progress ──────────────────────────────────────── */
  if (weightDeltaKg != null && weightDeltaKg <= -0.1) {
    push('weightProgress', 'success', 'trending-down', 36, {
      kg: Math.abs(weightDeltaKg).toFixed(1),
    });
  }

  /* ── Empty-day fallback ───────────────────────────────────── */
  if (!anythingLogged) {
    push('startDay', 'info', 'sunny-outline', 20);
  }

  return out.sort((a, b) => b.priority - a.priority);
}
