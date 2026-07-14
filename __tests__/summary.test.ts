import { progress, computeWeightTrend } from '../services/summary';

describe('progress', () => {
  it('computes ratio/percent/remaining below goal', () => {
    const p = progress(50, 100);
    expect(p).toMatchObject({ value: 50, goal: 100, remaining: 50, percent: 50, reached: false });
    expect(p.ratio).toBeCloseTo(0.5, 5);
  });

  it('clamps ratio to 1 but keeps the real percent above goal', () => {
    const p = progress(120, 100);
    expect(p.ratio).toBe(1);
    expect(p.percent).toBe(120);
    expect(p.remaining).toBe(0);
    expect(p.reached).toBe(true);
  });

  it('is safe with a zero goal', () => {
    const p = progress(10, 0);
    expect(p.ratio).toBe(0);
    expect(p.reached).toBe(false);
  });
});

describe('computeWeightTrend', () => {
  it('reports start/current/delta of a series', () => {
    const trend = computeWeightTrend([80, 79.5, 79]);
    expect(trend.start).toBe(80);
    expect(trend.current).toBe(79);
    expect(trend.delta).toBe(-1);
  });

  it('ignores zero/unset entries', () => {
    const trend = computeWeightTrend([80, 0, 79]);
    expect(trend.series).toEqual([80, 79]);
    expect(trend.delta).toBe(-1);
  });

  it('handles an empty series', () => {
    const trend = computeWeightTrend([]);
    expect(trend).toMatchObject({ start: 0, current: 0, delta: 0 });
  });
});
