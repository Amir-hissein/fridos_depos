// @ts-nocheck — Deno runtime (Supabase Edge Functions); not part of the RN tsconfig.
// Edge Function: detect-meal
// Receives a plated-meal photo (base64) and returns a structured estimate of the
// dish, its per-item breakdown, calories and macros — at portion = 1×.
//
// The Anthropic API key lives ONLY here (Supabase secret), never in the app.
// Deploy:  supabase functions deploy detect-meal
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Runtime: Deno (Supabase Edge Functions). Excluded from the app's tsconfig.

import Anthropic from 'npm:@anthropic-ai/sdk@^2';

const MODEL = 'claude-opus-4-8';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// JSON shape Claude must return — mirrors DetectedMeal (ids added client-side).
const MEAL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    emoji: { type: 'string' },
    kcal: { type: 'integer' },
    protein: { type: 'integer' },
    carbs: { type: 'integer' },
    fat: { type: 'integer' },
    fiber: { type: 'integer' },
    sugar: { type: 'integer' },
    confidence: { type: 'integer' },
    nutriScore: { type: 'string', enum: ['A', 'B', 'C', 'D', 'E'] },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          key: { type: 'string' },
          name: { type: 'string' },
          emoji: { type: 'string' },
          grams: { type: 'integer' },
          kcal: { type: 'integer' },
        },
        required: ['key', 'name', 'emoji', 'grams', 'kcal'],
      },
    },
  },
  required: [
    'name', 'emoji', 'kcal', 'protein', 'carbs', 'fat',
    'fiber', 'sugar', 'confidence', 'nutriScore', 'items',
  ],
};

const PROMPT = `You are a nutrition vision assistant. Identify the plated meal in the image and estimate its nutrition for a SINGLE serving (portion = 1×).

Rules:
- "name": short dish name in English.
- "emoji": one emoji that best represents the dish.
- "items": 1–6 main components. For each: "key" = lowercase snake_case English id (e.g. "grilled_chicken"), "name" = English label, "emoji", "grams" (estimated), "kcal" (estimated for that gram amount).
- "kcal"/"protein"/"carbs"/"fat"/"fiber"/"sugar": totals for the whole plate (grams for macros, kcal for energy). Totals should be consistent with the items.
- "nutriScore": one of A,B,C,D,E (A = healthiest).
- "confidence": 0–100, how confident you are in the identification.
Estimate realistically; if unsure, give your best estimate rather than refusing.`;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const { image, mediaType } = await req.json();
    if (!image || typeof image !== 'string') return json({ error: 'missing_image' }, 400);

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) return json({ error: 'server_not_configured' }, 500);

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      output_config: { format: { type: 'json_schema', schema: MEAL_SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType ?? 'image/jpeg', data: image },
            },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });

    const text = message.content.find((b: any) => b.type === 'text')?.text ?? '{}';
    const meal = JSON.parse(text);
    return json(meal, 200);
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
