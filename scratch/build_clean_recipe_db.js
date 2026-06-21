const fs = require('fs');
const path = require('path');

const recipeFile = path.join(__dirname, '..', 'constants', 'recipes.ts');
let content = fs.readFileSync(recipeFile, 'utf8');

// 1. Split the file content by the recipe block initiator
const blocks = content.split('\n  {');
const header = blocks[0]; // Imports, types, and 'export const RECIPES: Recipe[] = ['
const recipeBlocks = blocks.slice(1);

// 2. Keep only the original 22 unique recipes (IDs '1' to '22')
const originalRecipeBlocks = recipeBlocks.filter(block => {
  const idMatch = block.match(/id:\s*['"](\w+)['"]/);
  if (!idMatch) return false;
  const id = idMatch[1];
  const numId = parseInt(id, 10);
  return !isNaN(numId) && numId >= 1 && numId <= 22;
});

// Reconstruct the clean original recipes string
let originalsStr = originalRecipeBlocks.map(block => '  {' + block.trim()).join(',\n');
// Clean up any trailing brackets/commas
originalsStr = originalsStr.replace(/,?\s*\];\s*$/, '');
if (originalsStr.endsWith(',')) {
  originalsStr = originalsStr.slice(0, -1);
}

// 3. Define the 7 refined gluten-free recipes
const gfRecipes = [
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
      { text: 'En son chia tohumu, hindistan cevizi rendesi and hafif toz tarçın serpiştirerek bekletmeden servis yapın.' }
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
      { text: 'Üzerine lor peynirini cömertçe paylaştırın, pul biber and çörek otu serpip dilimleyerek servis edin.' }
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
      { text: 'Yeşillikleri yıkayıp kurulayın, ikiye bölünmüş domates and kapari ile karıştırıp limon-zeytinyağı sosuyla tatlandırın.' },
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

// 4. Define the 20 clean real recipes
const realRecipes = [
  {
    id: 'real_1',
    name: 'Somonlu Kinoa Kasesi',
    time: 25, difficulty: 'Orta', kcal: 620, protein: 42, carbs: 45, fat: 28, mealType: 'Ana Yemek', emoji: '🥗',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    categories: ['gluten-free', 'popular-bowls', 'sana-uygun', 'high-protein', 'bes-yildizli', 'light-dinner'],
    ingredients: [
      { name: 'Izgara Somon', quantity: '150 gram', owned: true },
      { name: 'Haşlanmış Kinoa', quantity: '4 Yemek Kaşığı', owned: true },
      { name: 'Avokado', quantity: 'Yarım', owned: false },
      { name: 'Roka', quantity: '1 Avuç', owned: true },
      { name: 'Zeytinyağı', quantity: '1 Yemek Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Somon filetoyu zeytinyağı, tuz ve karabiberle marine edip tavada 10 dakika pişirin.' },
      { text: 'Kinoayı önceden haşlayın ve soğumaya bırakın.' },
      { text: 'Geniş bir kaseye roka, dilimlenmiş avokado and kinoayı alın.' },
      { text: 'Pişen somonu üzerine ekleyin ve limon sıkarak servis yapın.' }
    ]
  },
  {
    id: 'real_2',
    name: 'Fıstık Ezmeli Yulaf Lapası',
    time: 10, difficulty: 'Kolay', kcal: 450, protein: 18, carbs: 60, fat: 15, mealType: 'Kahvaltı', emoji: '🥣',
    image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=80',
    categories: ['breakfast-goodies', 'practical', 'high-protein', 'gut-friendly'],
    ingredients: [
      { name: 'Yulaf Ezmesi', quantity: '5 Yemek Kaşığı', owned: true },
      { name: 'Badem Sütü', quantity: '1 Su Bardağı', owned: false },
      { name: 'Şekersiz Fıstık Ezmesi', quantity: '1 Tatlı Kaşığı', owned: true },
      { name: 'Muz', quantity: 'Yarım', owned: false },
      { name: 'Chia Tohumu', quantity: '1 Çay Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Yulafı ve badem sütünü küçük bir tencereye alın.' },
      { text: 'Orta ateşte kıvam alana kadar yaklaşık 5 dakika pişirin.' },
      { text: 'Lapayı kaseye aktarıp üzerine muz dilimleri ekleyin.' },
      { text: 'Fıstık ezmesi ve chia tohumu ile süsleyerek servis yapın.' }
    ]
  },
  {
    id: 'real_3',
    name: 'Izgara Tavuklu Sezar Salata',
    time: 20, difficulty: 'Kolay', kcal: 510, protein: 55, carbs: 12, fat: 25, mealType: 'Öğle Yemeği', emoji: '🥗',
    image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80',
    categories: ['light-dinner', 'high-protein', 'practical', 'low-calorie'],
    ingredients: [
      { name: 'Tavuk Göğsü', quantity: '200 gram', owned: true },
      { name: 'Marul', quantity: '1 Büyük Kase', owned: true },
      { name: 'Parmesan Peyniri', quantity: '2 Yemek Kaşığı', owned: false },
      { name: 'Sezar Sos (Hafif)', quantity: '2 Yemek Kaşığı', owned: true },
      { name: 'Kruton Ekmek', quantity: '1 Avuç', owned: true }
    ],
    steps: [
      { text: 'Tavuk göğsünü ızgarada her iki tarafı kızarana kadar pişirin.' },
      { text: 'Marulları yıkayıp büyük bir kaseye doğrayın.' },
      { text: 'Üzerine hafif sezar sosunu ve parmesan peynirini ekleyip karıştırın.' },
      { text: 'Dilimlenmiş ızgara tavukları ve krutonları ekleyerek servis yapın.' }
    ]
  },
  {
    id: 'real_4',
    name: 'Fit Çikolatalı Puding',
    time: 15, difficulty: 'Kolay', kcal: 320, protein: 12, carbs: 45, fat: 10, mealType: 'Ara Öğün', emoji: '🍫',
    image: 'https://images.unsplash.com/photo-1590080874088-eec64895b423?auto=format&fit=crop&w=800&q=80',
    categories: ['fit-desserts', 'practical', 'low-calorie', 'vegan'],
    ingredients: [
      { name: 'Avokado', quantity: 'Yarım', owned: true },
      { name: 'Ham Kakao', quantity: '2 Yemek Kaşığı', owned: true },
      { name: 'Bal veya Akçaağaç Şurubu', quantity: '1 Yemek Kaşığı', owned: false },
      { name: 'Badem Sütü', quantity: 'Yarım Çay Bardağı', owned: true },
      { name: 'Hindistan Cevizi Tozu', quantity: 'Üzeri için', owned: true }
    ],
    steps: [
      { text: 'Olgunlaşmış avokadoyu ortadan ikiye bölüp çekirdeğini çıkarın.' },
      { text: 'Blenderın içine avokado, ham kakao, bal and badem sütünü ekleyin.' },
      { text: 'Pürüzsüz bir kıvam alana kadar yüksek devirde karıştırın.' },
      { text: 'Kaselere paylaştırıp buzdolabında 10 dakika dinlendirin ve hindistan cevizi ile servis yapın.' }
    ]
  },
  {
    id: 'real_5',
    name: 'Glutensiz Karabuğday Pankeki',
    time: 20, difficulty: 'Orta', kcal: 410, protein: 16, carbs: 55, fat: 14, mealType: 'Kahvaltı', emoji: '🥞',
    image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=800&q=80',
    categories: ['gluten-free', 'breakfast-stars', 'fit-desserts', 'practical'],
    ingredients: [
      { name: 'Karabuğday Unu', quantity: '1 Su Bardağı', owned: true },
      { name: 'Yumurta', quantity: '1 Adet', owned: true },
      { name: 'Süt', quantity: '1 Su Bardağı', owned: false },
      { name: 'Kabartma Tozu', quantity: '1 Çay Kaşığı', owned: true },
      { name: 'Orman Meyveleri', quantity: 'Yarım Çay Bardağı', owned: true }
    ],
    steps: [
      { text: 'Derin bir kapta karabuğday unu, yumurta ve sütü çırpın.' },
      { text: 'Kabartma tozunu ekleyip hamurun homojen olmasını sağlayın.' },
      { text: 'Hafif yağlanmış tavaya kepçe yardımıyla döküp iki tarafını da pişirin.' },
      { text: 'Üzerine orman meyveleri ekleyerek servis yapın.' }
    ]
  },
  {
    id: 'real_6',
    name: 'Fırınlanmış Sebze Tabağı',
    time: 35, difficulty: 'Kolay', kcal: 280, protein: 8, carbs: 35, fat: 12, mealType: 'Akşam Yemeği', emoji: '🥦',
    image: 'https://images.unsplash.com/photo-1593122485547-7988bd78d523?auto=format&fit=crop&w=800&q=80',
    categories: ['vegan', 'gut-friendly', 'low-calorie', 'practical', 'light-dinner'],
    ingredients: [
      { name: 'Kabak', quantity: '1 Adet', owned: true },
      { name: 'Havuç', quantity: '2 Adet', owned: true },
      { name: 'Kırmızı Biber', quantity: '1 Adet', owned: true },
      { name: 'Brokoli', quantity: '1 Küçük Baş', owned: false },
      { name: 'Zeytinyağı', quantity: '2 Yemek Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Tüm sebzeleri yıkayın ve iri parçalar halinde doğrayın.' },
      { text: 'Fırın tepsisine dizin ve üzerine zeytinyağı, tuz, karabiber gezdirin.' },
      { text: 'Önceden ısıtılmış 200 derece fırında 25-30 dakika kızarana kadar pişirin.' },
      { text: 'İsteğe bağlı olarak yoğurt sos ile sıcak servis yapın.' }
    ]
  },
  {
    id: 'real_7',
    name: 'Ketojenik Avokado Kayıkları',
    time: 15, difficulty: 'Kolay', kcal: 540, protein: 22, carbs: 12, fat: 48, mealType: 'Kahvaltı', emoji: '🥑',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    categories: ['keto', 'high-protein', 'breakfast-goodies', 'practical'],
    ingredients: [
      { name: 'Avokado', quantity: '1 Büyük Boy', owned: true },
      { name: 'Yumurta', quantity: '2 Adet', owned: true },
      { name: 'Füme Hindi', quantity: '2 Dilim', owned: false },
      { name: 'Frenk Soğanı', quantity: 'Üzeri için', owned: true }
    ],
    steps: [
      { text: 'Avokadoyu ikiye bölün, çekirdeğini çıkarın ve çukurunu biraz genişletin.' },
      { text: 'Her bir yarımın içine birer yumurta kırın.' },
      { text: 'Üzerine ufalanmış füme hindi ekleyin.' },
      { text: 'Fırında 200 derecede yumurtalar pişene kadar yaklaşık 12 dakika pişirin.' }
    ]
  },
  {
    id: 'real_8',
    name: 'Yüksek Proteinli Et Fajita Bowl',
    time: 30, difficulty: 'Orta', kcal: 680, protein: 52, carbs: 30, fat: 38, mealType: 'Akşam Yemeği', emoji: '🥩',
    image: 'https://images.unsplash.com/photo-1600850056064-a8b380df8395?auto=format&fit=crop&w=800&q=80',
    categories: ['high-protein', 'popular-bowls', 'bes-yildizli', 'high-calorie'],
    ingredients: [
      { name: 'Dana Biftek', quantity: '200 gram', owned: true },
      { name: 'Renkli Biberler', quantity: '2 Adet', owned: true },
      { name: 'Kırmızı Soğan', quantity: '1 Adet', owned: true },
      { name: 'Fajita Baharatı', quantity: '1 Yemek Kaşığı', owned: false },
      { name: 'Meksika Fasulyesi', quantity: '3 Yemek Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Biftekleri ince şeritler halinde doğrayın ve baharatla marine edin.' },
      { text: 'Biberleri ve soğanı jülyen doğrayın.' },
      { text: 'Yüksek ateşte tavada eti mühürleyin, ardından sebzeleri ekleyip soteleyin.' },
      { text: 'Kasenin tabanına Meksika fasulyesini koyup üzerine etli fajita karışımını ekleyin.' }
    ]
  },
  {
    id: 'real_9',
    name: 'Narlı Ispanak Salatası',
    time: 10, difficulty: 'Kolay', kcal: 210, protein: 6, carbs: 24, fat: 12, mealType: 'Ara Öğün', emoji: '🥗',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    categories: ['vegan', 'low-calorie', 'fruits', 'practical', 'gut-friendly'],
    ingredients: [
      { name: 'Bebek Ispanak', quantity: '2 Avuç', owned: true },
      { name: 'Nar Taneleri', quantity: '4 Yemek Kaşığı', owned: true },
      { name: 'Ceviz İçi', quantity: '1 Avuç', owned: false },
      { name: 'Nar Ekşisi', quantity: '1 Yemek Kaşığı', owned: true },
      { name: 'Zeytinyağı', quantity: '1 Yemek Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Bebek ıspanakları iyice yıkayıp kuruladıktan sonra kaseye alın.' },
      { text: 'Üzerine nar tanelerini ve hafif kavrulmuş cevizleri ekleyin.' },
      { text: 'Zeytinyağı ve nar ekşisini bir kapta karıştırıp salatanın üzerine gezdirin.' },
      { text: 'Taze ve serin servis yapın.' }
    ]
  },
  {
    id: 'real_10',
    name: 'Vegan Mercimek Köftesi',
    time: 40, difficulty: 'Orta', kcal: 350, protein: 14, carbs: 55, fat: 8, mealType: 'Öğle Yemeği', emoji: '🥙',
    image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=800&q=80',
    categories: ['vegan', 'practical', 'gut-friendly', 'low-calorie'],
    ingredients: [
      { name: 'Kırmızı Mercimek', quantity: '1 Su Bardağı', owned: true },
      { name: 'İnce Bulgur', quantity: '1.5 Su Bardağı', owned: true },
      { name: 'Kuru Soğan', quantity: '1 Adet', owned: true },
      { name: 'Biber Salçası', quantity: '1 Yemek Kaşığı', owned: false },
      { name: 'Taze Soğan ve Maydanoz', quantity: 'Yarım Demet', owned: true }
    ],
    steps: [
      { text: 'Mercimeği sıcak suyla yumuşayana kadar haşlayın.' },
      { text: 'İnce bulguru haşlanmış mercimeğin içine ekleyip şişmesi için kapağını kapatın.' },
      { text: 'Ayrı bir tavada soğanı kavurun, salçayı ekleyip karışıma dökün.' },
      { text: 'Yeşillikleri ince ince doğrayıp ekleyin, yoğurarak köfte şekli verin.' }
    ]
  },
  {
    id: 'real_11',
    name: 'Chia Pudingli Orman Meyveleri',
    time: 15, difficulty: 'Kolay', kcal: 290, protein: 8, carbs: 25, fat: 16, mealType: 'Kahvaltı', emoji: '🫐',
    image: 'https://images.unsplash.com/photo-1495461199391-8c39ab674295?auto=format&fit=crop&w=800&q=80',
    categories: ['fit-desserts', 'fruits', 'breakfast-goodies', 'low-calorie', 'gut-friendly'],
    ingredients: [
      { name: 'Chia Tohumu', quantity: '3 Yemek Kaşığı', owned: true },
      { name: 'Badem Sütü', quantity: '1 Su Bardağı', owned: true },
      { name: 'Orman Meyveleri Mix', quantity: '1 Avuç', owned: false },
      { name: 'Bal', quantity: '1 Tatlı Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Chia tohumu and badem sütünü cam bir kavanozda iyice karıştırın.' },
      { text: 'Buzdolabında en az 2 saat (veya bir gece) jelleşmesi için bekletin.' },
      { text: 'Üzerine taze orman meyveleri ve isteğe bağlı biraz bal gezdirerek servis yapın.' }
    ]
  },
  {
    id: 'real_12',
    name: 'Fırında Baharatlı Nohut Cipsi',
    time: 30, difficulty: 'Kolay', kcal: 220, protein: 12, carbs: 32, fat: 6, mealType: 'Ara Öğün', emoji: '🥣',
    image: 'https://images.unsplash.com/photo-1585238259689-566b6c00685d?auto=format&fit=crop&w=800&q=80',
    categories: ['vegan', 'gluten-free', 'practical', 'gut-friendly'],
    ingredients: [
      { name: 'Haşlanmış Nohut', quantity: '2 Su Bardağı', owned: true },
      { name: 'Tatlı Toz Biber', quantity: '1 Çay Kaşığı', owned: true },
      { name: 'Zeytinyağı', quantity: '1 Yemek Kaşığı', owned: true },
      { name: 'Sarımsak Tozu', quantity: '1 Çay Kaşığı', owned: false }
    ],
    steps: [
      { text: 'Haşlanmış nohutları bir kağıt havlu yardımıyla tamamen kurulayın.' },
      { text: 'Bir kasede zeytinyağı ve baharatlarla iyice harmanlayın.' },
      { text: 'Yağlı kağıt serili fırın tepsisine tek sıra halinde yayın.' },
      { text: '200 derece fırında kıtırlaşana kadar yaklaşık 25-30 dakika fırınlayın.' }
    ]
  },
  {
    id: 'real_13',
    name: 'Sebzeli Karabuğday Risotto',
    time: 40, difficulty: 'Zor', kcal: 380, protein: 14, carbs: 62, fat: 10, mealType: 'Akşam Yemeği', emoji: '🥘',
    image: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&q=80',
    categories: ['gluten-free', 'gut-friendly', 'light-dinner', 'bes-yildizli'],
    ingredients: [
      { name: 'Karabuğday', quantity: '1 Su Bardağı', owned: true },
      { name: 'Mantar', quantity: '200 gram', owned: true },
      { name: 'Kuru Soğan', quantity: '1 Adet', owned: true },
      { name: 'Sebze Suyu', quantity: '3 Su Bardağı', owned: false },
      { name: 'Parmesan', quantity: '2 Yemek Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Soğanları zeytinyağında pembeleşene kadar kavurun.' },
      { text: 'Mantarları ekleyip suyunu salıp çekene kadar soteleyin.' },
      { text: 'Yıkanmış karabuğdayı ekleyin ve sebze suyunu azar azar yedirerek pişirin.' },
      { text: 'Kremamsı bir kıvam alınca ocaktan alıp parmesan ekleyerek servis yapın.' }
    ]
  },
  {
    id: 'real_14',
    name: 'Mangolu Taze Smoothie',
    time: 5, difficulty: 'Kolay', kcal: 180, protein: 4, carbs: 42, fat: 2, mealType: 'Ara Öğün', emoji: '🥤',
    image: 'https://images.unsplash.com/photo-1620067664448-b4b1a4cb9911?auto=format&fit=crop&w=800&q=80',
    categories: ['fruits', 'vegan', 'low-calorie', 'practical'],
    ingredients: [
      { name: 'Taze Mango', quantity: '1 Adet', owned: true },
      { name: 'Taze Nane', quantity: '3-4 Yaprak', owned: true },
      { name: 'Hindistan Cevizi Suyu', quantity: '1 Su Bardağı', owned: false },
      { name: 'Buz', quantity: 'Yarım Su Bardağı', owned: true }
    ],
    steps: [
      { text: 'Mangoyu soyup iri küpler halinde doğrayın.' },
      { text: 'Blenderın içine mango, nane yaprakları and hindistan cevizi suyunu ekleyin.' },
      { text: 'Buz küplerini ilave edin.' },
      { text: 'Tüm malzemeler tamamen pürüzsüz olana kadar karıştırın ve soğuk için.' }
    ]
  },
  {
    id: 'real_15',
    name: 'Tam Buğday Unlu Krep',
    time: 20, difficulty: 'Orta', kcal: 260, protein: 12, carbs: 35, fat: 8, mealType: 'Kahvaltı', emoji: '🥞',
    image: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=800&q=80',
    categories: ['breakfast-goodies', 'practical'],
    ingredients: [
      { name: 'Tam Buğday Unu', quantity: '1 Su Bardağı', owned: true },
      { name: 'Yumurta', quantity: '1 Adet', owned: true },
      { name: 'Süt', quantity: '1 Su Bardağı', owned: true },
      { name: 'Zeytinyağı', quantity: '1 Tatlı Kaşığı', owned: false }
    ],
    steps: [
      { text: 'Yumurta ve sütü bir çırpma kabında pürüzsüz olana kadar çırpın.' },
      { text: 'Tam buğday ununu yavaş yavaş ekleyerek akışkan bir hamur elde edin.' },
      { text: 'Yağlanmış sıcak krep tavasına ince bir katman dökerek iki tarafını da pişirin.' },
      { text: 'İçine peynir veya hafif reçel sürerek tüketebilirsiniz.' }
    ]
  },
  {
    id: 'real_16',
    name: 'Hindistan Cevizli Kurabiye',
    time: 25, difficulty: 'Kolay', kcal: 320, protein: 4, carbs: 38, fat: 18, mealType: 'Ara Öğün', emoji: '🍪',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
    categories: ['fit-desserts', 'practical', 'gluten-free'],
    ingredients: [
      { name: 'Hindistan Cevizi Tozu', quantity: '2 Su Bardağı', owned: true },
      { name: 'Yumurta Akı', quantity: '3 Adet', owned: true },
      { name: 'Bal veya Tatlandırıcı', quantity: '2 Yemek Kaşığı', owned: false },
      { name: 'Vanilya Özütü', quantity: '1 Çay Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Yumurta aklarını mikserle kar beyazı olana kadar çırpın.' },
      { text: 'Bal ve vanilyayı ekleyip nazikçe karıştırın.' },
      { text: 'Hindistan cevizi tozunu ekleyip bir spatula yardımıyla yedirin.' },
      { text: 'Yağlı kağıt serili tepsiye top şeklinde dizip 170 derecede 15 dk pişirin.' }
    ]
  },
  {
    id: 'real_17',
    name: 'Yeşil Detoks Suyu',
    time: 5, difficulty: 'Kolay', kcal: 90, protein: 2, carbs: 20, fat: 0, mealType: 'Ara Öğün', emoji: '🍏',
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80',
    categories: ['fruits', 'vegan', 'low-calorie', 'gut-friendly', 'practical'],
    ingredients: [
      { name: 'Yeşil Elma', quantity: '1 Adet', owned: true },
      { name: 'Kereviz Sapı', quantity: '2 Adet', owned: true },
      { name: 'Limon', quantity: 'Yarım', owned: false },
      { name: 'Zencefil', quantity: '1 Fındık Büyüklüğünde', owned: true },
      { name: 'Su', quantity: '1 Su Bardağı', owned: true }
    ],
    steps: [
      { text: 'Tüm malzemeleri yıkayın ve iri parçalara bölün.' },
      { text: 'Katı meyve sıkacağından geçirin veya biraz su ekleyerek blenderda çekip süzün.' },
      { text: 'Bekletmeden taze olarak tüketin.' }
    ]
  },
  {
    id: 'real_18',
    name: 'Cevizli ve İncirli Yulaf Kasesi',
    time: 10, difficulty: 'Kolay', kcal: 510, protein: 12, carbs: 72, fat: 22, mealType: 'Kahvaltı', emoji: '🥣',
    image: 'https://images.unsplash.com/photo-1495461199391-8c39ab674295?auto=format&fit=crop&w=800&q=80',
    categories: ['breakfast-goodies', 'fruits', 'gut-friendly'],
    ingredients: [
      { name: 'Yulaf', quantity: '4 Yemek Kaşığı', owned: true },
      { name: 'Sıcak Su veya Süt', quantity: '1 Su Bardağı', owned: true },
      { name: 'Kuru İncir', quantity: '2 Adet', owned: false },
      { name: 'Ceviz', quantity: '1 Avuç', owned: true },
      { name: 'Tarçın', quantity: 'Yarım Çay Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Yulafı sıcak süt ile şişmesi için 5 dakika bekletin.' },
      { text: 'İncirleri küçük küpler halinde doğrayın.' },
      { text: 'Yulafın üzerine incir, ceviz and tarçın ekleyerek karıştırın.' }
    ]
  },
  {
    id: 'real_19',
    name: 'Karışık Deniz Ürünleri Salatası',
    time: 20, difficulty: 'Zor', kcal: 340, protein: 48, carbs: 10, fat: 12, mealType: 'Akşam Yemeği', emoji: '🍤',
    image: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=800&q=80',
    categories: ['light-dinner', 'high-protein', 'bes-yildizli', 'gluten-free'],
    ingredients: [
      { name: 'Karides', quantity: '100 gram', owned: true },
      { name: 'Kalamar', quantity: '100 gram', owned: false },
      { name: 'Akdeniz Yeşillikleri', quantity: 'Bolca', owned: true },
      { name: 'Zeytinyağı ve Limon', quantity: 'Göz Kararı', owned: true }
    ],
    steps: [
      { text: 'Karides ve kalamarları çok az yağda tavada soteleyin.' },
      { text: 'Yeşillikleri kaseye yerleştirin.' },
      { text: 'Üzerine deniz ürünlerini ekleyip bol limon sıkarak servis yapın.' }
    ]
  },
  {
    id: 'real_20',
    name: 'Acılı Tofu Küpleri',
    time: 25, difficulty: 'Orta', kcal: 310, protein: 28, carbs: 12, fat: 18, mealType: 'Öğle Yemeği', emoji: '🌶️',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    categories: ['vegan', 'high-protein', 'practical', 'low-calorie'],
    ingredients: [
      { name: 'Sert Tofu', quantity: '200 gram', owned: true },
      { name: 'Soya Sosu', quantity: '2 Yemek Kaşığı', owned: true },
      { name: 'Acı Sos veya Pul Biber', quantity: '1 Yemek Kaşığı', owned: false },
      { name: 'Susam Yağı', quantity: '1 Tatlı Kaşığı', owned: true }
    ],
    steps: [
      { text: 'Tofunun suyunu iyice peçete ile alıp küp küp doğrayın.' },
      { text: 'Soya sosu, acı sos and susam yağı ile marine edin.' },
      { text: 'Fırında veya yapışmaz tavada dışı çıtır olana kadar pişirin.' }
    ]
  }
];

// Convert gfRecipes array to string representation
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

// Convert realRecipes array to string representation
const realRecipesStr = realRecipes.map(r => `  {
    id: '${r.id}',
    name: '${r.name}',
    time: ${r.time},
    difficulty: '${r.difficulty}',
    kcal: ${r.kcal},
    protein: ${r.protein},
    carbs: ${r.carbs},
    fat: ${r.fat},
    mealType: '${r.mealType}',
    servings: 1,
    tag: 'complete',
    missingCount: 0,
    bgColor: '#1E1E1E',
    emoji: '${r.emoji}',
    image: '${r.image}',
    filters: [],
    categories: ${JSON.stringify(r.categories)},
    ingredients: ${JSON.stringify(r.ingredients)},
    steps: ${JSON.stringify(r.steps)}
  }`).join(',\n');

// Reconstruct the final RECIPES string
const finalRecipesStr = `export const RECIPES: Recipe[] = [\n${originalsStr},\n${gfRecipesStr},\n${realRecipesStr}\n];`;

// Write it to content
content = content.replace(/export const RECIPES: Recipe\[\] = \[([\s\S]*?)\];/, finalRecipesStr);

fs.writeFileSync(recipeFile, content);
console.log("Successfully rebuilt recipe database with clean categories and removed duplicates.");
