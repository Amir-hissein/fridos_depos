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

/**
 * Mots-clés (TR + EN) par allergène. Un ingrédient déclenche l'allergène si son nom
 * contient l'un de ces mots-clés (matching robuste sur les données turques).
 */
export const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  gluten: ['unu', 'hamur', 'ekmek', 'makarna', 'tagliatelle', 'spaghetti', 'buğday', 'galeta', 'kraker', 'flour', 'bread', 'pasta', 'wheat'],
  dairy: ['süt', 'peynir', 'krema', 'yoğurt', 'tereyağ', 'kaşar', 'mozzarella', 'parmesan', 'milk', 'cheese', 'cream', 'butter', 'yogurt'],
  egg: ['yumurta', 'egg'],
  peanut: ['yer fıstığı', 'fıstık ezmesi', 'peanut'],
  tree_nuts: ['fındık', 'ceviz', 'badem', 'antep fıstığı', 'kaju', 'almond', 'walnut', 'hazelnut'],
  soy: ['soya', 'soy', 'tofu', 'edamame'],
  fish: ['somon', 'balık', 'ton balığı', 'levrek', 'hamsi', 'salmon', 'fish', 'tuna'],
  shellfish: ['karides', 'midye', 'istiridye', 'yengeç', 'kalamar', 'shrimp', 'mussel', 'crab', 'shellfish'],
};

export function allergenById(id: string): Allergen | undefined {
  return ALLERGENS.find(a => a.id === id);
}
