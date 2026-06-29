// Resolve one real, licence-clear food photo per recipe via the Pexels API,
// then print a ready-to-paste `RECIPE_IMAGES` map (stable CDN URLs).
//
// Pexels licence: free for commercial use, no attribution required.
// The API key is used ONLY here (resolve-time) — it is never shipped in the app,
// because we bake the resulting CDN URLs into constants/recipes.ts.
//
// Usage:
//   PEXELS_API_KEY=xxxx node scripts/resolve-recipe-images.mjs
//
// It writes:
//   - /tmp/recipe-images.json   (raw id -> url)
//   - prints the TS map to stdout (paste into constants/recipes.ts)

const KEY = process.env.PEXELS_API_KEY;
if (!KEY) {
  console.error('Missing PEXELS_API_KEY. Get a free key at https://www.pexels.com/api/');
  process.exit(1);
}

// id -> English search query (matches the dish in constants/recipes.ts).
// The 4 premium recipes keep their bundled local images, so they are not here.
const QUERIES = {
  gf_1: 'almond pancakes',          gf_2: 'date oatmeal bowl',
  gf_3: 'quinoa avocado salad',     gf_4: 'avocado cottage cheese toast',
  gf_5: 'roast chicken mashed potato', gf_6: 'grilled fish plate',
  gf_7: 'grilled sea bream fish',
  '1': 'salmon avocado toast',      '2': 'cheese omelette',
  '3': 'blueberry pancakes',        '4': 'peanut butter oatmeal',
  '5': 'breakfast bowl',            '6': 'sauteed mushrooms scrambled eggs',
  '7': 'grilled salmon asparagus',  '8': 'chicken caesar salad',
  '9': 'baked chicken wings',       '10': 'tuna quinoa salad',
  '11': 'beef mushroom stir fry',   '12': 'buddha bowl',
  '13': 'tropical smoothie bowl',   '14': 'green detox soup',
  '15': 'roasted chickpeas',        '16': 'chocolate avocado pudding',
  '17': 'apple cinnamon oatmeal',   '18': 'strawberry protein bowl',
  '19': 'watermelon mint salad',    '20': 'gourmet burger',
  '21': 'creamy mushroom pasta',    '22': 'grilled steak eggplant',
  '23': 'grilled sea bass lemon',   '24': 'chicken curry',
  '25': 'salmon skewers',           '26': 'spinach goat cheese omelette',
  '27': 'mediterranean bowl',       '28': 'spinach pomegranate salad',
  '29': 'crispy tofu cubes',        '30': 'quinoa avocado salad bowl',
  '31': 'yogurt berry parfait',     '32': 'banana oatmeal',
  '33': 'green detox juice',        '34': 'mango smoothie',
  '35': 'poached eggs yogurt',
};

async function search(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`;
  const r = await fetch(url, { headers: { Authorization: KEY } });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.photos ?? []).map(p => p.src?.large).filter(Boolean);
}

const out = {};
const used = new Set();

for (const [id, q] of Object.entries(QUERIES)) {
  const photos = await search(q);
  let pick = photos.find(u => !used.has(u)) ?? photos[0];
  if (!pick) { console.error(`  ! no photo for ${id} (${q})`); continue; }
  used.add(pick);
  out[id] = pick;
  console.error(`  ✓ ${id.padEnd(7)} ${q}`);
}

const fs = await import('node:fs');
fs.writeFileSync('/tmp/recipe-images.json', JSON.stringify(out, null, 2));

// Print the TS map body.
console.log('\n// ── paste into RECIPE_IMAGES in constants/recipes.ts ──');
for (const [id, url] of Object.entries(out)) {
  console.log(`  '${id}': '${url}',`);
}
console.error(`\nResolved ${Object.keys(out).length}/${Object.keys(QUERIES).length} · unique: ${new Set(Object.values(out)).size}`);
