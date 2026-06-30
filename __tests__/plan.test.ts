import {
  computeBMR,
  computeTDEE,
  computeTargets,
  computeMealTargets,
  weeklyRateKg,
  weeksToGoal,
  computeBMI,
  UserProfile,
} from '../services/plan';

const baseProfile: UserProfile = {
  sex: 'male',
  height: 180,
  age: 30,
  weight: 80,
  targetWeight: 75,
  activity: 'active',
  goalPace: 'medium',
  dailySteps: 8000,
  diet: 'healthy',
};

describe('computeBMR (Mifflin-St Jeor)', () => {
  it('uses the +5 constant for males', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(computeBMR(baseProfile)).toBe(1780);
  });

  it('uses the -161 constant for females', () => {
    // 1780 - 5 - 161 = 1614
    expect(computeBMR({ ...baseProfile, sex: 'female' })).toBe(1614);
  });
});

describe('computeTDEE', () => {
  it('multiplies BMR by the activity factor', () => {
    expect(computeTDEE(baseProfile)).toBeCloseTo(1780 * 1.45, 5);
  });
});

describe('computeTargets', () => {
  const t = computeTargets(baseProfile);

  it('applies the pace deficit when losing weight', () => {
    // round(2581 - 500) = 2081
    expect(t.kcal).toBe(2081);
    expect(t.deficit).toBe(500);
  });

  it('never goes below BMR * 1.1 (safety floor)', () => {
    const aggressive = computeTargets({
      ...baseProfile,
      activity: 'sedentary',
      goalPace: 'hard',
    });
    expect(aggressive.kcal).toBeGreaterThanOrEqual(Math.round(computeBMR(baseProfile) * 1.1));
  });

  it('has no deficit when gaining/maintaining', () => {
    const gain = computeTargets({ ...baseProfile, targetWeight: 85 });
    expect(gain.deficit).toBe(0);
  });

  it('splits macros by the healthy diet ratio (25/50/25)', () => {
    expect(t.protein).toBe(Math.round((t.kcal * 0.25) / 4));
    expect(t.carbs).toBe(Math.round((t.kcal * 0.5) / 4));
    expect(t.fat).toBe(Math.round((t.kcal * 0.25) / 9));
  });

  it('computes hydration from body weight (35 ml/kg, rounded to 50)', () => {
    expect(t.waterMl).toBe(2800);
  });
});

describe('computeMealTargets', () => {
  it('splits the daily plan 30/35/25/10 across meals', () => {
    const t = computeTargets(baseProfile);
    const m = computeMealTargets(t);
    expect(m.breakfast.kcal).toBe(Math.round(t.kcal * 0.3));
    expect(m.lunch.kcal).toBe(Math.round(t.kcal * 0.35));
    expect(m.dinner.kcal).toBe(Math.round(t.kcal * 0.25));
    expect(m.snack.kcal).toBe(Math.round(t.kcal * 0.1));
  });
});

describe('weeklyRateKg & weeksToGoal', () => {
  it('derives the weekly rate from the deficit (~7700 kcal/kg)', () => {
    expect(weeklyRateKg('medium')).toBeCloseTo((500 * 7) / 7700, 5);
  });

  it('returns 0 weeks when already at goal', () => {
    expect(weeksToGoal({ ...baseProfile, targetWeight: 80 })).toBe(0);
  });

  it('estimates weeks from the 5 kg gap', () => {
    // 5 / 0.4545 ≈ 11
    expect(weeksToGoal(baseProfile)).toBe(11);
  });
});

describe('computeBMI', () => {
  it('classifies a healthy BMI', () => {
    const bmi = computeBMI(80, 180);
    expect(bmi.value).toBe(24.7);
    expect(bmi.category).toBe('Healthy');
    expect(bmi.position).toBeGreaterThan(0);
    expect(bmi.position).toBeLessThan(1);
  });

  it('classifies the boundaries', () => {
    expect(computeBMI(50, 180).category).toBe('Underweight');
    expect(computeBMI(85, 180).category).toBe('Overweight');
    expect(computeBMI(110, 180).category).toBe('Obese');
  });

  it('guards against a zero height', () => {
    expect(computeBMI(80, 0).value).toBe(0);
  });
});
