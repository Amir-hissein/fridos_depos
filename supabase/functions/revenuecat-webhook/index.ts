// @ts-nocheck — Deno runtime (Supabase Edge Functions); not part of the RN tsconfig.
// Edge Function: revenuecat-webhook
// Server-side source of truth for the premium subscription. RevenueCat calls
// this endpoint on every subscription event (purchase, renewal, cancellation,
// expiration…). We verify a shared secret, then upsert the user's row in
// `subscriptions` and cache the flag on `profiles.is_premium` — using the
// service-role key so the client can never forge premium access.
//
// Setup:
//   1. Deploy:  supabase functions deploy revenuecat-webhook
//   2. Secret:  set REVENUECAT_WEBHOOK_SECRET in the project's Edge Function
//      secrets (any long random string).
//   3. In the RevenueCat dashboard → Integrations → Webhooks:
//        URL          = https://<project>.supabase.co/functions/v1/revenuecat-webhook
//        Authorization = the SAME value as REVENUECAT_WEBHOOK_SECRET
//
// IMPORTANT: the client must identify the user to RevenueCat with their Supabase
// auth id (Purchases.logIn(userId)), so `event.app_user_id` equals the user id.

import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
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

// Event types that grant access (until expiry) vs. revoke it.
const REVOKING = new Set(['EXPIRATION', 'SUBSCRIPTION_PAUSED']);

function planFromProduct(id?: string): string | null {
  const s = (id ?? '').toLowerCase();
  if (s.includes('annual') || s.includes('year') || s.includes('yıl')) return 'annual';
  if (s.includes('month') || s.includes('ay')) return 'monthly';
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // 1. Authenticate the caller — must match our shared secret.
  const expected = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  const got = req.headers.get('Authorization') ?? '';
  if (!expected || got !== expected) return json({ error: 'unauthorized' }, 401);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'server_not_configured' }, 500);

  try {
    const payload = await req.json();
    const event = payload?.event;
    if (!event) return json({ error: 'no_event' }, 400);

    const userId = event.app_user_id as string | undefined;
    // Anonymous RevenueCat ids ($RCAnonymousID:...) aren't our users — ignore.
    if (!userId || userId.startsWith('$RCAnonymousID')) {
      return json({ ok: true, skipped: 'anonymous' });
    }

    const type = event.type as string;
    const expMs = event.expiration_at_ms as number | undefined;
    const now = Date.now();
    const notExpired = expMs ? expMs > now : true;
    const isActive = !REVOKING.has(type) && notExpired;

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const expiresAt = expMs ? new Date(expMs).toISOString() : null;
    const plan = planFromProduct(event.product_id);

    // Upsert the authoritative subscription row.
    const { error: subErr } = await admin.from('subscriptions').upsert(
      {
        user_id: userId,
        is_active: isActive,
        plan,
        provider: 'revenuecat',
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (subErr) return json({ error: 'db_error', detail: subErr.message }, 500);

    // Cache the flag on the profile for cheap app-side gating.
    await admin.from('profiles').update({ is_premium: isActive }).eq('id', userId);

    return json({ ok: true, user: userId, active: isActive, type });
  } catch (e) {
    await reportToSentry('revenuecat-webhook', e);
    return json({ error: 'unexpected', detail: String((e as Error)?.message ?? e) }, 500);
  }
});
