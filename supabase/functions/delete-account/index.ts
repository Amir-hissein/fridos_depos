// @ts-nocheck — Deno runtime (Supabase Edge Functions); not part of the RN tsconfig.
// Edge Function: delete-account
// Permanently deletes the CALLING user's account. The user is identified from
// their JWT (Authorization header); the service-role key (server secret) is used
// to delete the auth user. All owned rows are removed automatically by the
// ON DELETE CASCADE foreign keys in schema.sql.
//
// Deploy:  supabase functions deploy delete-account
// Secrets are provided automatically by Supabase: SUPABASE_URL,
//          SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from 'npm:@supabase/supabase-js@^2';

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return json({ error: 'unauthorized' }, 401);

    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) return json({ error: 'server_not_configured' }, 500);

    // Admin client (service role) — bypasses RLS, can manage auth users.
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Identify the caller from their JWT.
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: 'unauthorized' }, 401);

    const userId = userData.user.id;

    // Delete the auth user → profiles & all owned rows cascade (schema.sql FKs).
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) return json({ error: 'delete_failed', detail: delErr.message }, 500);

    return json({ ok: true }); 
    
  } catch (e) {
    return json({ error: 'unexpected', detail: String(e) }, 500);
  }
});
