const fs = require('fs');
const path = require('path');

const recipeFile = path.join(__dirname, '..', 'constants', 'recipes.ts');
let content = fs.readFileSync(recipeFile, 'utf8');

// Define the updated, highly detailed gourmet recipes
const detailedGfRecipes = [
  {
    id: 'gf_1',
    name: 'Bademli Güç Pankeki',
    time: 20,
    difficulty: 'Orta',
    kcal: 340,
    protein: 16,
    carbs: 22,
    fat: 20,
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
      { name: 'Olgun Muz', quantity: 'Yarım (Ezilmiş)', owned: true },
      { name: 'Badem Sütü', quantity: 'Yarım Su Bardağı', owned: true },
      { name: 'Kabartma Tozu', quantity: '1 Tatlı Kaşığı', owned: true },
      { name: 'Vanilya Özütü', quantity: '1 Çay Kaşığı', owned: true },
      { name: 'Süzme Bal', quantity: '1 Yemek Kaşığı', owned: false },
      { name: 'Hindistan Cevizi Yağı', quantity: '1 Tatlı Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Badem unu ve kabartma tozunu geniş bir kapta harmanlayın.' },
      { text: 'Ayrı bir kapta muzu ezin; yumurta, badem sütü, vanilya ve süzme balı ekleyip mikserle pürüzsüzleşene kadar çırpın.' },
      { text: 'Sıvı karışımı kuru malzemelere ekleyip spatula yardımıyla homojen bir kıvam alana kadar yavaşça karıştırın.' },
      { text: 'Yapışmaz tavayı hindistan cevizi yağı ile hafifçe yağlayın. Orta ateşte, harçtan birer kepçe dökerek arkalı önlü altın sarısı olana kadar pişirin.' }
    ]
  },
  {
    id: 'gf_2',
    name: 'Dengeli Hurma Kasesi',
    time: 8,
    difficulty: 'Kolay',
    kcal: 310,
    protein: 10,
    carbs: 45,
    fat: 12,
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
      { name: 'Medine Hurması', quantity: '3 Adet (Çekirdeksiz)', owned: true },
      { name: 'Çiğ Ceviz İçi', quantity: '1 Avuç', owned: false },
      { name: 'Chia Tohumu', quantity: '1 Tatlı Kaşığı', owned: true },
      { name: 'Hindistan Cevizi Rendesi', quantity: '1 Tatlı Kaşığı', owned: true },
      { name: 'Glutensiz Granola', quantity: '2 Yemek Kaşığı', owned: true },
      { name: 'Toz Tarçın', quantity: '1 Tutam', owned: true }
    ],
    steps: [
      { text: 'Yoğurdu derin bir kaseye alın, pürüzsüz ve kremsi bir kıvama gelene kadar çırpın.' },
      { text: 'Hurmaları boyuna ince şeritler halinde dilimleyin. Cevizleri bıçak yardımıyla hafifçe irice kıyın.' },
      { text: 'Kasedeki yoğurdun üzerine sırasıyla glutensiz granolayı, hurma dilimlerini ve kırık cevizleri yerleştirin.' },
      { text: 'En son chia tohumu, hindistan cevizi rendesi ve hafif toz tarçın serpiştirerek bekletmeden servis yapın.' }
    ]
  },
  {
    id: 'gf_3',
    name: 'Kinoa & Avokadolu Kahvaltı Salatası',
    time: 15,
    difficulty: 'Kolay',
    kcal: 360,
    protein: 14,
    carbs: 25,
    fat: 24,
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
      { name: 'Haşlanmış Kinoa', quantity: '5 Yemek Kaşığı', owned: true },
      { name: 'Hass Avokado', quantity: 'Yarım (Olgun)', owned: true },
      { name: 'Çeri Domates', quantity: '6 Adet', owned: true },
      { name: 'Salatalık', quantity: '1 Adet (Küçük)', owned: true },
      { name: 'Organik Yumurta', quantity: '1 Adet', owned: true },
      { name: 'Taze Maydanoz ve Dereotu', quantity: 'Yarım Demet', owned: true },
      { name: 'Soğuk Sıkım Zeytinyağı', quantity: '1.5 Yemek Kaşığı', owned: true },
      { name: 'Taze Limon Suyu', quantity: '1 Yemek Kaşığı', owned: true },
      { name: 'Deniz Tuzu & Karabiber', quantity: '1 Tutam', owned: true }
    ],
    steps: [
      { text: 'Yumurtayı kayısı kıvamında kalacak şekilde tam 6 dakika haşlayın ve hemen soğuk suya alıp kabuğunu soyun.' },
      { text: 'Domatesleri ikiye bölün, salatalığı ve avokadoyu küp şeklinde doğrayın. Yeşillikleri ince ince kıyın.' },
      { text: 'Haşlanmış ve soğumuş kinoayı doğradığınız sebzeler ve yeşilliklerle karıştırma kabına aktarın.' },
      { text: 'Zeytinyağı, limon suyu, tuz ve karabiberi çırparak salataya ekleyin ve ezmeden harmanlayın.' },
      { text: 'Salatayı servis tabağına alın, üzerine ikiye bölünmüş yumurtayı yerleştirip servis yapın.' }
    ]
  },
  {
    id: 'gf_4',
    name: 'Avokadolu Lor Peynirli Glutensiz Tost',
    time: 10,
    difficulty: 'Kolay',
    kcal: 320,
    protein: 15,
    carbs: 20,
    fat: 20,
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
      { name: 'Glutensiz Karabuğday Ekmeği', quantity: '2 Dilim', owned: true },
      { name: 'Tatlı Lor Peyniri', quantity: '3 Yemek Kaşığı', owned: true },
      { name: 'Olgun Avokado', quantity: 'Yarım', owned: true },
      { name: 'Çörek Otu & Pul Biber', quantity: '1er Çay Kaşığı', owned: true },
      { name: 'Sızma Zeytinyağı', quantity: '1 Tatlı Kaşığı', owned: true },
      { name: 'Limon Suyu', quantity: '1 Çay Kaşığı', owned: true },
      { name: 'Tuz', quantity: '1 Tutam', owned: true }
    ],
    steps: [
      { text: 'Glutensiz ekmek dilimlerini tost makinesinde hafif çıtır olana kadar kızartın.' },
      { text: 'Avokadoyu bir kasede ezip üzerine limon suyu, zeytinyağı ve tuz ekleyerek püre haline getirin.' },
      { text: 'Kızarmış sıcak ekmeklerin üzerine avokado ezmesini eşit şekilde sürün.' },
      { text: 'Üzerine lor peynirini cömertçe paylaştırın, pul biber ve çörek otu serpip dilimleyerek servis edin.' }
    ]
  },
  {
    id: 'gf_5',
    name: 'Yumuşak Tavuk & Patates Püresi',
    time: 35,
    difficulty: 'Orta',
    kcal: 490,
    protein: 42,
    carbs: 32,
    fat: 16,
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
      { name: 'Tavuk Göğsü', quantity: '180 gram', owned: true },
      { name: 'Patates', quantity: '2 Adet (Orta Boy)', owned: true },
      { name: 'Taze Sarımsak', quantity: '1 Diş (Ezilmiş)', owned: true },
      { name: 'Taze Biberiye & Kekik', quantity: '1er Dal', owned: false },
      { name: 'Tereyağı', quantity: '1 Tatlı Kaşığı', owned: false },
      { name: 'Ilık Süt', quantity: 'Yarım Çay Bardağı', owned: true },
      { name: 'Muskat Cevizi Rendesi', quantity: '1 Tutam', owned: true },
      { name: 'Zeytinyağı', quantity: '1 Yemek Kaşığı', owned: true },
      { name: 'Tuz & Karabiber', quantity: '1 Tutam', owned: true }
    ],
    steps: [
      { text: 'Tavukları zeytinyağı, ezilmiş sarımsak, kekik, tuz ve karabiberle soslayıp 15 dakika marine edin.' },
      { text: 'Patatesleri soyup küp küp doğrayın, tuzlu suda yumuşayana kadar haşlayıp süzün.' },
      { text: 'Sıcak patatesleri ezerken tereyağı, ılık süt ve bir tutam muskat cevizi rendesi ekleyerek kadifemsi bir püre yapın.' },
      { text: 'Yapışmaz tavayı ısıtın, tavukları arkalı önlü 4-5 dakika (suyunu kaybetmeden) pişirin.' },
      { text: 'Servis tabağının tabanına sıcak patates püresini yayın, üzerine dilimlenmiş tavukları ekleyip taze biberiye ile süsleyin.' }
    ]
  },
  {
    id: 'gf_6',
    name: 'Lezzetli Balık Menüsü',
    time: 25,
    difficulty: 'Orta',
    kcal: 410,
    protein: 36,
    carbs: 10,
    fat: 24,
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
      { name: 'Temizlenmiş Levrek Fileto', quantity: '1 Adet', owned: true },
      { name: 'Akdeniz Yeşillikleri', quantity: '1 Kase', owned: true },
      { name: 'Çeri Domates', quantity: '4 Adet', owned: true },
      { name: 'Kapari', quantity: '1 Tatlı Kaşığı', owned: false },
      { name: 'Sarımsak', quantity: '1 Diş (Doğranmış)', owned: true },
      { name: 'Zeytinyağı', quantity: '1.5 Yemek Kaşığı', owned: true },
      { name: 'Limon Kabuğu Rendesi', quantity: 'Yarım Limondan', owned: true },
      { name: 'Taze Dereotu', quantity: 'Yarım Demet', owned: true }
    ],
    steps: [
      { text: 'Fırını 200 dereceye ısıtın. Levrek filetoyu kurulayıp zeytinyağı, sarımsak, limon kabuğu rendesi, tuz ve ince kıyılmış dereotu ile marine edin.' },
      { text: 'Balığı yağlı kağıt serili fırın tepsisine derisi üstte kalacak şekilde yerleştirin ve 15 dakika fırınlayın.' },
      { text: 'Yeşillikleri yıkayıp kurulayın, ikiye bölünmüş domates ve kapari ile karıştırıp limon-zeytinyağı sosuyla tatlandırın.' },
      { text: 'Fırından çıkan sıcak çıtır balığı yeşillik yatağı üzerinde servis edin.' }
    ]
  },
  {
    id: 'gf_7',
    name: 'Gurme Çipura Tabağı',
    time: 40,
    difficulty: 'Zor',
    kcal: 470,
    protein: 38,
    carbs: 12,
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
      { name: 'Taze Çipura (Bütün)', quantity: '1 Adet', owned: true },
      { name: 'Bebek Patates', quantity: '4 Adet (Kabuklu)', owned: true },
      { name: 'Limon Dilimleri', quantity: '4 Adet', owned: true },
      { name: 'Taze Biberiye', quantity: '2 Dal', owned: false },
      { name: 'Sarımsak', quantity: '2 Diş (Ezilmiş)', owned: true },
      { name: 'Zeytinyağı', quantity: '2 Yemek Kaşığı', owned: true },
      { name: 'Kaya Tuzu & Tane Karabiber', quantity: '1er Tutam', owned: true }
    ],
    steps: [
      { text: 'Çipuranın pullarını temizleyip yıkayın, havlu kağıtla kurulayın. İki yanına bıçakla derin çizikler atın.' },
      { text: 'Balığın içini ve dışını zeytinyağı, tuz ve karabiberle ovalayın. Karın boşluğuna limon dilimleri, biberiye ve sarımsak yerleştirin.' },
      { text: 'Bebek patatesleri yıkayıp ortadan bölün, zeytinyağı ve tuzla soslayıp balığın yanına tepsiye dizin.' },
      { text: 'Önceden ısıtılmış 200 derece fırında, balığın derisi çıtırlaşana ve patatesler yumuşayana kadar yaklaşık 30-35 dakika pişirin.' }
    ]
  }
];

// Stringify gfRecipes array nicely
const gfRecipesStr = detailedGfRecipes.map(r => `  {
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
// First, we remove any previous gf_ recipes
const match = content.match(/export const RECIPES: Recipe\[\] = \[([\s\S]*?)\];/);
if (!match) {
  console.error("Could not find RECIPES array");
  process.exit(1);
}

// Filter out any existing gf_ lines
let oldRecipes = match[1].trim().split(/\n\s*},\s*\n/);
let filteredRecipes = oldRecipes.filter(r => !r.includes("id: 'gf_"));

// Rejoin and format clean
let cleanedBody = filteredRecipes.join('\n  },\n');
// Make sure it ends correctly if it has an empty trailing item
if (cleanedBody.trim().endsWith(',')) {
  cleanedBody = cleanedBody.trim().slice(0, -1);
}

// We will inject the new highly detailed gluten free recipes at the beginning of the RECIPES array
const updatedRecipesStr = `export const RECIPES: Recipe[] = [\n${gfRecipesStr},\n  ${cleanedBody}\n];`;

content = content.replace(/export const RECIPES: Recipe\[\] = \[([\s\S]*?)\];/, updatedRecipesStr);

fs.writeFileSync(recipeFile, content);
console.log("Successfully updated and detailed the 7 gluten-free recipes in constants/recipes.ts");
