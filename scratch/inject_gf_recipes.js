const fs = require('fs');
const path = require('path');

const recipeFile = path.join(__dirname, '..', 'constants', 'recipes.ts');
let content = fs.readFileSync(recipeFile, 'utf8');

const gfRecipes = [
  {
    id: 'gf_1',
    name: 'Bademli Güç Pankeki',
    time: 25,
    difficulty: 'Orta',
    kcal: 320,
    protein: 14,
    carbs: 25,
    fat: 18,
    mealType: 'Kahvaltı',
    servings: 1,
    tag: 'complete',
    missingCount: 0,
    bgColor: '#1E1E1E',
    emoji: '🥞',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
    filters: [],
    categories: ['gluten-free', 'breakfast-stars', 'high-protein', 'practical'],
    ingredients: [
      { name: 'Badem Unu', quantity: '1 Su Bardağı', owned: true },
      { name: 'Yumurta', quantity: '2 Adet', owned: true },
      { name: 'Badem Sütü', quantity: 'Yarım Su Bardağı', owned: true },
      { name: 'Bal', quantity: '1 Yemek Kaşığı', owned: false },
      { name: 'Kabartma Tozu', quantity: '1 Tatlı Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Badem unu ve kabartma tozunu derin bir kapta karıştırın.' },
      { text: 'Yumurta, süt ve balı ekleyip pürüzsüz bir kıvam alana kadar çırpın.' },
      { text: 'Tavayı hafifçe tereyağı ile yağlayıp hamuru dökün, arkalı önlü altın sarısı olana kadar pişirin.' }
    ]
  },
  {
    id: 'gf_2',
    name: 'Dengeli Hurma Kasesi',
    time: 10,
    difficulty: 'Kolay',
    kcal: 290,
    protein: 8,
    carbs: 48,
    fat: 10,
    mealType: 'Ara Öğün',
    servings: 1,
    tag: 'complete',
    missingCount: 0,
    bgColor: '#1E1E1E',
    emoji: '🥣',
    image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80',
    filters: [],
    categories: ['gluten-free', 'fit-desserts', 'fruits', 'gut-friendly', 'popular-bowls'],
    ingredients: [
      { name: 'Süzme Yoğurt', quantity: '1 Su Bardağı', owned: true },
      { name: 'Hurma', quantity: '3 Adet', owned: true },
      { name: 'Ceviz İçi', quantity: '1 Avuç', owned: false },
      { name: 'Chia Tohumu', quantity: '1 Tatlı Kaşığı', owned: true },
      { name: 'Hindistan Cevizi Rende', quantity: '1 Tatlı Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Süzme yoğurdu geniş bir servis kasesine alın ve pürüzsüzleşene kadar karıştırın.' },
      { text: 'Çekirdeği çıkarılmış hurmaları ince ince doğrayıp yoğurdun üzerine serpiştirin.' },
      { text: 'Ceviz içi, chia tohumu ve hindistan cevizi rendesini ekleyip servis edin.' }
    ]
  },
  {
    id: 'gf_3',
    name: 'Kinoa & Avokadolu Kahvaltı Salatası',
    time: 15,
    difficulty: 'Kolay',
    kcal: 340,
    protein: 12,
    carbs: 28,
    fat: 22,
    mealType: 'Kahvaltı',
    servings: 1,
    tag: 'complete',
    missingCount: 0,
    bgColor: '#1E1E1E',
    emoji: '🥗',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    filters: [],
    categories: ['gluten-free', 'breakfast-stars', 'gut-friendly', 'sana-uygun'],
    ingredients: [
      { name: 'Haşlanmış Kinoa', quantity: '4 Yemek Kaşığı', owned: true },
      { name: 'Olgun Avokado', quantity: 'Yarım', owned: true },
      { name: 'Çeri Domates', quantity: '5 Adet', owned: true },
      { name: 'Haşlanmış Yumurta', quantity: '1 Adet', owned: true },
      { name: 'Sızma Zeytinyağı', quantity: '1 Yemek Kaşığı', owned: true },
      { name: 'Limon Suyu', quantity: '1 Tatlı Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Çeri domatesleri ve avokadoyu küp küp doğrayıp karıştırma kabına alın.' },
      { text: 'Önceden haşlanmış kinoayı ekleyip zeytinyağı, tuz ve limon suyuyla soslayın.' },
      { text: 'Kaseye aldıktan sonra üzerine haşlanmış yumurtayı dilimleyerek servis edin.' }
    ]
  },
  {
    id: 'gf_4',
    name: 'Avokadolu Lor Peynirli Glutensiz Tost',
    time: 10,
    difficulty: 'Kolay',
    kcal: 310,
    protein: 14,
    carbs: 22,
    fat: 18,
    mealType: 'Kahvaltı',
    servings: 1,
    tag: 'complete',
    missingCount: 0,
    bgColor: '#1E1E1E',
    emoji: '🥪',
    image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=800&q=80',
    filters: [],
    categories: ['gluten-free', 'breakfast-goodies', 'practical', 'sana-uygun'],
    ingredients: [
      { name: 'Glutensiz Ekmek', quantity: '2 Dilim', owned: true },
      { name: 'Lor Peyniri', quantity: '3 Yemek Kaşığı', owned: true },
      { name: 'Olgun Avokado', quantity: 'Yarım', owned: true },
      { name: 'Çörek Otu', quantity: '1 Çay Kaşığı', owned: true },
      { name: 'Zeytinyağı', quantity: '1 Tatlı Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Glutensiz ekmek dilimlerini tost makinesinde hafif çıtır olana kadar kızartın.' },
      { text: 'Avokadoyu çukur bir tabakta ezin, zeytinyağı ve tuz ekleyip pürüzsüz yapın.' },
      { text: 'Avokado ezmesini ekmeğe sürün, üzerine lor peyniri ve çörek otu serpip kapatarak servis yapın.' }
    ]
  },
  {
    id: 'gf_5',
    name: 'Yumuşak Tavuk & Patates Püresi',
    time: 35,
    difficulty: 'Orta',
    kcal: 480,
    protein: 38,
    carbs: 35,
    fat: 15,
    mealType: 'Akşam Yemeği',
    servings: 1,
    tag: 'complete',
    missingCount: 0,
    bgColor: '#1E1E1E',
    emoji: '🍗',
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
    filters: [],
    categories: ['gluten-free', 'high-protein', 'bes-yildizli'],
    ingredients: [
      { name: 'Tavuk Göğsü', quantity: '150 gram', owned: true },
      { name: 'Patates', quantity: '2 Adet', owned: true },
      { name: 'Süt', quantity: 'Yarım Çay Bardağı', owned: true },
      { name: 'Tereyağı', quantity: '1 Tatlı Kaşığı', owned: false },
      { name: 'Kuru Kekik', quantity: '1 Çay Kaşığı', owned: true },
      { name: 'Zeytinyağı', quantity: '1 Yemek Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Tavuk göğsünü zeytinyağı, kekik, tuz ve karabiberle soslayıp tavada lokum kıvamında pişirin.' },
      { text: 'Patatesleri soyup haşlayın, sıcakken tereyağı ve süt ilave ederek püre kıvamına getirin.' },
      { text: 'Püreyi servis tabağına yayın, üzerine tavuk göğsünü dilimleyip sıcak servis edin.' }
    ]
  },
  {
    id: 'gf_6',
    name: 'Lezzetli Balık Menüsü',
    time: 25,
    difficulty: 'Orta',
    kcal: 420,
    protein: 34,
    carbs: 12,
    fat: 26,
    mealType: 'Akşam Yemeği',
    servings: 1,
    tag: 'complete',
    missingCount: 0,
    bgColor: '#1E1E1E',
    emoji: '🐟',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    filters: [],
    categories: ['gluten-free', 'light-dinner', 'bes-yildizli', 'chef-recommended'],
    ingredients: [
      { name: 'Levrek veya Somon Fileto', quantity: '180 gram', owned: true },
      { name: 'Akdeniz Yeşillikleri', quantity: '1 Kase', owned: true },
      { name: 'Limon', quantity: 'Yarım', owned: false },
      { name: 'Zeytinyağı', quantity: '1 Yemek Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Balık filetoyu hafifçe yağlayıp fırında 200 derecede 15-20 dakika pişirin.' },
      { text: 'Mevsim yeşilliklerini yıkayıp süzün, limon ve zeytinyağı ile tatlandırın.' },
      { text: 'Fırından çıkan balığı yeşilliklerle birlikte tabağa alıp servis yapın.' }
    ]
  },
  {
    id: 'gf_7',
    name: 'Gurme Çipura Tabağı',
    time: 40,
    difficulty: 'Zor',
    kcal: 460,
    protein: 36,
    carbs: 10,
    fat: 28,
    mealType: 'Akşam Yemeği',
    servings: 1,
    tag: 'complete',
    missingCount: 0,
    bgColor: '#1E1E1E',
    emoji: '🐟',
    image: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=800&q=80',
    filters: [],
    categories: ['gluten-free', 'chef-recommended', 'bes-yildizli', 'light-dinner'],
    ingredients: [
      { name: 'Taze Çipura (Temizlenmiş)', quantity: '1 Adet', owned: true },
      { name: 'Bebek Patates', quantity: '4 Adet', owned: true },
      { name: 'Sarımsak', quantity: '2 Diş', owned: true },
      { name: 'Taze Biberiye', quantity: '2 Dal', owned: false },
      { name: 'Zeytinyağı', quantity: '2 Yemek Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Çipuranın üzerine hafif çizikler atıp sarımsak, tuz ve zeytinyağıyla soslayın.' },
      { text: 'Bebek patatesleri ikiye bölüp çipura ile beraber fırın tepsisine dizin ve biberiye ekleyin.' },
      { text: '200 derecede ısıtılmış fırında yaklaşık 25-30 dakika altın sarısı olana kadar fırınlayın.' }
    ]
  }
];

// Stringify gfRecipes array nicely
const gfRecipesStr = gfRecipes.map(r => `  {
    id: '${r.id}',
    name: '${r.name}',
    time: ${r.time},
    difficulty: '${r.difficulty}',
    kcal: ${r.kcal},
    protein: ${r.protein},
    carbs: ${r.carbs},
    fat: ${r.fat},
    mealType: '${r.mealType}',
    servings: ${r.servings},
    tag: '${r.tag}',
    missingCount: ${r.missingCount},
    bgColor: '${r.bgColor}',
    emoji: '${r.emoji}',
    image: '${r.image}',
    filters: [],
    categories: ${JSON.stringify(r.categories)},
    ingredients: ${JSON.stringify(r.ingredients)},
    steps: ${JSON.stringify(r.steps)}
  }`).join(',\n');

// Find the start of the RECIPES array in content
const match = content.match(/export const RECIPES: Recipe\[\] = \[([\s\S]*?)\];/);
if (!match) {
  console.error("Could not find RECIPES array");
  process.exit(1);
}

// We will inject the new gluten free recipes at the beginning of the RECIPES array
const updatedRecipesStr = `export const RECIPES: Recipe[] = [\n${gfRecipesStr},\n${match[1].trim()}\n];`;

content = content.replace(/export const RECIPES: Recipe\[\] = \[([\s\S]*?)\];/, updatedRecipesStr);

fs.writeFileSync(recipeFile, content);
console.log("Successfully injected 7 gluten-free recipes into constants/recipes.ts");
