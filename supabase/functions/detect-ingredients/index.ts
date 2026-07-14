// @ts-nocheck — Deno runtime (Supabase Edge Functions); not part of the RN tsconfig.
// Edge Function: detect-ingredients
// Receives a fridge/pantry photo (base64) and returns the list of food
// ingredients it can identify, with a confidence score each.
//
// The Anthropic API key lives ONLY here (Supabase secret), never in the app.
// Deploy:  supabase functions deploy detect-ingredients
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import Anthropic from 'npm:@anthropic-ai/sdk@0.106.0';

const MODEL = 'claude-opus-4-8';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          emoji: { type: 'string' },
          confidence: { type: 'integer' },
        },
        required: ['name', 'emoji', 'confidence'],
      },
    },
  },
  required: ['items'],
};

const PROMPT = `You are a kitchen vision assistant. Look at this photo of a fridge, pantry, or grocery haul and list the distinct FOOD ingredients you can identify.

Rules:
- "name": short English ingredient name, singular where natural (e.g. "Tomato", "Mozzarella", "Olive oil").
- "emoji": one emoji that represents it.
- "confidence": 0–100, how sure you are it's present.
- Only include edible food/ingredients. Skip containers, utensils, and non-food.
- If you cannot identify any food, return an empty "items" array.
- Do not invent items that aren't visible.`;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// Minimal Sentry reporter via the HTTP envelope API — no SDK dependency, so it
// can't break the bundle. No-op unless the SENTRY_DSN secret is set.
async function reportToSentry(fn: string, err: unknown) {
  const dsn = Deno.env.get('SENTRY_DSN');
  if (!dsn) return;
  try {
    const m = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(\d+)$/);
    if (!m) return;
    const [, key, host, projectId] = m;
    const id = crypto.randomUUID().replace(/-/g, '');
    const item = {
      event_id: id,
      timestamp: Date.now() / 1000,
      platform: 'javascript',
      level: 'error',
      tags: { fn },
      exception: { values: [{ type: (err as Error)?.name ?? 'Error', value: String((err as Error)?.message ?? err) }] },
    };
    const envelope =
      JSON.stringify({ event_id: id, sent_at: new Date().toISOString() }) + '\n' +
      JSON.stringify({ type: 'event' }) + '\n' +
      JSON.stringify(item);
    await fetch(`https://${host}/api/${projectId}/envelope/?sentry_key=${key}&sentry_version=7`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
      body: envelope,
    });
  } catch {
    // never let reporting break the function
  }
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
      output_config: { format: { type: 'json_schema', schema: RESULT_SCHEMA } },
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

    const text = message.content.find((b: any) => b.type === 'text')?.text ?? '{"items":[]}';
    const parsed = JSON.parse(text);
    return json(parsed, 200);
  } catch (e) {
    await reportToSentry('detect-ingredients', e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
