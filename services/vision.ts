
import { Colors } from '../constants/colors';

export interface DetectedIngredient {
  id: string;
  name: string;
  emoji: string;
  confidence: number; // 0–100
  bg: string;
  default: boolean; // pre-checked in the review screen
}

const MOCK_DETECTIONS: DetectedIngredient[] = [
  { id: 'd1', emoji: '🍅', name: 'Tomatoes', confidence: 98, bg: Colors.greenLight, default: true },
  { id: 'd2', emoji: '🥚', name: 'Eggs', confidence: 95, bg: Colors.goldLight, default: true },
  { id: 'd3', emoji: '🥬', name: 'Zucchini', confidence: 91, bg: Colors.greenLight, default: true },
  { id: 'd4', emoji: '🧀', name: 'Mozzarella', confidence: 64, bg: '#f0efe9', default: false },
  { id: 'd5', emoji: '🧄', name: 'Garlic', confidence: 88, bg: Colors.goldLight, default: true },
  { id: 'd6', emoji: '🫒', name: 'Olive oil', confidence: 82, bg: Colors.greenLight, default: true },
];

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));


export async function detectIngredients(imageUri?: string): Promise<DetectedIngredient[]> {

  await delay(400);


  return MOCK_DETECTIONS;
}

export type NutriScore = 'A' | 'B' | 'C' | 'D' | 'E';


export interface MealItem {
  id: string;
  key: string;
  name: string;
  emoji: string;
  grams: number;
  kcal: number;
}

export interface DetectedMeal {
  name: string;
  emoji: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  confidence: number;
  nutriScore: NutriScore;
  items: MealItem[];
}


export async function detectMeal(imageUri?: string): Promise<DetectedMeal> {
  await delay(500);
  return {
    name: 'Grilled chicken & veggies',
    emoji: '🍗',
    kcal: 442,
    protein: 38,
    carbs: 26,
    fat: 19,
    fiber: 6,
    sugar: 8,
    confidence: 92,
    nutriScore: 'A',
    items: [
      { id: 'm1', key: 'grilled_chicken', name: 'Grilled chicken', emoji: '🍗', grams: 150, kcal: 220 },
      { id: 'm2', key: 'broccoli', name: 'Broccoli', emoji: '🥦', grams: 80, kcal: 55 },
      { id: 'm3', key: 'basmati_rice', name: 'Basmati rice', emoji: '🍚', grams: 120, kcal: 145 },
      { id: 'm4', key: 'olive_oil', name: 'Olive oil', emoji: '🫒', grams: 5, kcal: 22 },
    ],
  };
}

/** A detected meal scaled to a chosen portion — all numbers ready to display/log. */
export interface ScaledMeal {
  portion: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  items: MealItem[];
}


export function scaleMeal(meal: DetectedMeal, portion: number): ScaledMeal {
  const r = (n: number) => Math.round(n * portion);
  return {
    portion,
    kcal: r(meal.kcal),
    protein: r(meal.protein),
    carbs: r(meal.carbs),
    fat: r(meal.fat),
    fiber: r(meal.fiber),
    sugar: r(meal.sugar),
    items: meal.items.map(it => ({ ...it, grams: r(it.grams), kcal: r(it.kcal) })),
  };
}
