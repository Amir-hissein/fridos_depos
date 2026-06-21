// Major allergens (EU/US regulation) + ingredient → allergen mapping.
// Mirrors future Supabase tables `allergens` / `ingredient_allergens`.

import { Ionicons } from '@expo/vector-icons';

type IName = React.ComponentProps<typeof Ionicons>['name'];

export interface Allergen {
  id: string;
  name: string;
  icon: IName;
}

export const ALLERGENS: Allergen[] = [
  { id: 'gluten', name: 'Gluten', icon: 'restaurant-outline' },
  { id: 'dairy', name: 'Dairy', icon: 'water-outline' },
  { id: 'egg', name: 'Egg', icon: 'ellipse-outline' },
  { id: 'peanut', name: 'Peanuts', icon: 'leaf-outline' },
  { id: 'tree_nuts', name: 'Tree nuts', icon: 'leaf-outline' },
  { id: 'soy', name: 'Soy', icon: 'nutrition-outline' },
  { id: 'fish', name: 'Fish', icon: 'fish-outline' },
  { id: 'shellfish', name: 'Shellfish', icon: 'fish-outline' },
];

/** Keyed by normalized (lowercase, trimmed) ingredient name → allergen ids. */
export const INGREDIENT_ALLERGENS: Record<string, string[]> = {
  eggs: ['egg'],
  'goat cheese log': ['dairy'],
  'heavy cream': ['dairy'],
  mozzarella: ['dairy'],
};

export function allergenById(id: string): Allergen | undefined {
  return ALLERGENS.find(a => a.id === id);
}
