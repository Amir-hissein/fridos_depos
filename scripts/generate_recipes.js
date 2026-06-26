const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'constants', 'recipes.ts');
let content = fs.readFileSync(file, 'utf8');

// The new categories
const allKeys = [
  'sana-uygun', 'bes-yildizli', 'light-dinner', 'breakfast-goodies',
  'high-protein', 'fit-desserts', 'high-calorie', 'chef-recommended',
  'low-calorie', 'practical', 'breakfast-stars', 'popular-bowls',
  'fruits', 'keto', 'gut-friendly', 'vegan', 'gluten-free'
];

// Extract the RECIPES array
const match = content.match(/export const RECIPES: Recipe\[\] = \[([\s\S]*?)\];/);
if (!match) {
  console.error("Could not find RECIPES array");
  process.exit(1);
}

// Very simple JS eval to get the recipes
const recipesStr = match[1];
// We will replace the categories of the first 14 recipes, then duplicate them
// to have 34 recipes, ensuring each category has about 6 recipes.

const baseRecipes = [
  { id: '1', name: 'Çilek & Fındıklı Yulaf Bowl', time: 3, kcal: 764, difficulty: 'Kolay', mealType: 'Kahvaltı', fat: 29, protein: 24, carbs: 101, emoji: '🍓', image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=80' },
  { id: '2', name: 'Yüksek Proteinli Keto Tabağı', time: 15, kcal: 1004, difficulty: 'Kolay', mealType: 'Kahvaltı', fat: 84, protein: 48, carbs: 12, emoji: '🍳', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80' },
  { id: '3', name: 'Mor Protein Pankeki', time: 20, kcal: 740, difficulty: 'Orta', mealType: 'Kahvaltı', fat: 18, protein: 35, carbs: 85, emoji: '🥞', image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=800&q=80' },
  { id: '4', name: 'Tropikal Probiyotik Şölen', time: 5, kcal: 503, difficulty: 'Kolay', mealType: 'Ara Öğünler', fat: 12, protein: 15, carbs: 60, emoji: '🥭', image: 'https://images.unsplash.com/photo-1620067664448-b4b1a4cb9911?auto=format&fit=crop&w=800&q=80' },
  { id: '5', name: 'Ketojenik Yaz Omleti', time: 12, kcal: 499, difficulty: 'Kolay', mealType: 'Kahvaltı', fat: 38, protein: 28, carbs: 5, emoji: '🍳', image: 'https://images.unsplash.com/photo-1606850584439-d3e70ff227eb?auto=format&fit=crop&w=800&q=80' },
  { id: '6', name: 'Elmalı Turta Yulaf Şöleni', time: 10, kcal: 497, difficulty: 'Kolay', mealType: 'Ara Öğünler', fat: 14, protein: 12, carbs: 75, emoji: '🍎', image: 'https://images.unsplash.com/photo-1514516854124-4f2ee132e48d?auto=format&fit=crop&w=800&q=80' },
  { id: '7', name: 'Kabak Çekirdekli Tavuk Salatası', time: 20, kcal: 487, difficulty: 'Kolay', mealType: 'Akşam Yemeği', fat: 26, protein: 42, carbs: 15, emoji: '🥗', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80' },
  { id: '8', name: 'Harnup Pekmezli Atom Omlet', time: 15, kcal: 754, difficulty: 'Kolay', mealType: 'Kahvaltı', fat: 45, protein: 30, carbs: 40, emoji: '🍳', image: 'https://images.unsplash.com/photo-1510693062635-f0270a3c2678?auto=format&fit=crop&w=800&q=80' },
  { id: '9', name: 'Bademli Güç Pankeki', time: 25, kcal: 758, difficulty: 'Orta', mealType: 'Kahvaltı', fat: 30, protein: 38, carbs: 80, emoji: '🥞', image: 'https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?auto=format&fit=crop&w=800&q=80' },
  { id: '10', name: 'Avokadolu Tost Şöleni', time: 10, kcal: 520, difficulty: 'Kolay', mealType: 'Kahvaltı', fat: 35, protein: 15, carbs: 45, emoji: '🥑', image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=800&q=80' },
  { id: '11', name: 'Fıstıklı Muz Rüyası', time: 5, kcal: 249, difficulty: 'Kolay', mealType: 'Kahvaltı', fat: 10, protein: 8, carbs: 35, emoji: '🍌', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80' },
  { id: '12', name: 'Glutensiz Bagel & Labne', time: 10, kcal: 974, difficulty: 'Kolay', mealType: 'Kahvaltı', fat: 45, protein: 25, carbs: 110, emoji: '🥯', image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f6f5b4?auto=format&fit=crop&w=800&q=80' },
  { id: '13', name: 'Harnup Şölenli Yulaf', time: 10, kcal: 507, difficulty: 'Kolay', mealType: 'Kahvaltı', fat: 18, protein: 15, carbs: 70, emoji: '🥣', image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=80' },
  { id: '14', name: 'Hafif Sporcu Kasesi', time: 20, kcal: 498, difficulty: 'Kolay', mealType: 'Ana Öğün', fat: 12, protein: 45, carbs: 50, emoji: '🍛', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80' }
];

let expandedRecipes = [];
let idCounter = 1;

for (let i = 0; i < 4; i++) { // duplicate base recipes 4 times (56 recipes)
  for (const br of baseRecipes) {
    let rec = { ...br };
    rec.id = String(idCounter++);
    rec.servings = 1;
    rec.tag = 'complete';
    rec.missingCount = 0;
    rec.bgColor = '#1E1E1E';
    rec.filters = [];
    rec.ingredients = [];
    rec.steps = [];
    // Randomize categories
    // Pick 3-4 random categories
    let shuffledKeys = allKeys.sort(() => 0.5 - Math.random());
    rec.categories = shuffledKeys.slice(0, 4);
    
    // Convert to string representation
    expandedRecipes.push(`
  {
    id: '${rec.id}',
    name: '${rec.name} ${i > 0 ? "V"+i : ""}',
    time: ${rec.time},
    difficulty: '${rec.difficulty}',
    kcal: ${rec.kcal},
    protein: ${rec.protein},
    carbs: ${rec.carbs},
    fat: ${rec.fat},
    mealType: '${rec.mealType}',
    servings: ${rec.servings},
    tag: '${rec.tag}',
    missingCount: ${rec.missingCount},
    bgColor: '${rec.bgColor}',
    emoji: '${rec.emoji}',
    image: '${rec.image}',
    filters: [],
    categories: ${JSON.stringify(rec.categories)},
    ingredients: [],
    steps: []
  }`);
  }
}

const finalRecipesStr = `export const RECIPES: Recipe[] = [${expandedRecipes.join(',')}\n];`;

content = content.replace(/export const RECIPES: Recipe\[\] = \[([\s\S]*?)\];/, finalRecipesStr);

// Update categories type definition
content = content.replace(/categories: Array<[^>]+>;/, `categories: Array<'sana-uygun' | 'bes-yildizli' | 'light-dinner' | 'breakfast-goodies' | 'high-protein' | 'fit-desserts' | 'high-calorie' | 'chef-recommended' | 'low-calorie' | 'practical' | 'breakfast-stars' | 'popular-bowls' | 'fruits' | 'keto' | 'gut-friendly' | 'vegan' | 'gluten-free'>;`);

fs.writeFileSync(file, content);
console.log("Updated constants/recipes.ts successfully with 56 recipes.");
