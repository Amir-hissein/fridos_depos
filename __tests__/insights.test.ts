import { buildInsights, InsightInput } from '../services/insights';

const base: InsightInput = {
  hour: 12,
  consumedKcal: 0,
  targetKcal: 2000,
  consumedProtein: 0,
  targetProtein: 130,
  waterMl: 0,
  waterGoalMl: 2500,
  steps: 0,
  stepsGoal: 8000,
  meals: { breakfast: 0, lunch: 0, dinner: 0, snack: 0 },
};

const ids = (input: InsightInput) => buildInsights(input).map(i => i.id);

describe('buildInsights', () => {
  it('flags a calorie overshoot with the overage', () => {
    const out = buildInsights({ ...base, consumedKcal: 2200 });
    const over = out.find(i => i.id === 'caloriesOver');
    expect(over).toBeDefined();
    expect(over?.params?.over).toBe(200);
    expect(over?.severity).toBe('warning');
  });

  it('celebrates a reached hydration goal', () => {
    expect(ids({ ...base, waterMl: 2500 })).toContain('hydrationReached');
  });

  it('warns when hydration is far behind in the afternoon', () => {
    expect(ids({ ...base, hour: 15, waterMl: 500 })).toContain('hydrationBehind');
  });

  it('falls back to a start-of-day prompt when nothing is logged', () => {
    expect(ids(base)).toContain('startDay');
  });

  it('sorts insights by descending priority', () => {
    const out = buildInsights({ ...base, hour: 15, consumedKcal: 2200, waterMl: 300 });
    const priorities = out.map(i => i.priority);
    expect(priorities).toEqual([...priorities].sort((a, b) => b - a));
  });
});
