// Supabase client — the single entry point to the backend (DB, Auth, Storage).
// Session is persisted in AsyncStorage and auto-refreshed while the app is
// foregrounded. The anon key is public by design (protected by RLS).

import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { LargeSecureStore } from './secureStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] Missing env vars — set EXPO_PUBLIC_SUPABASE_URL and ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY in .env (see .env.example).',
  );
}

// Dev-only request logger — prints every Supabase call (method, path, status,
// duration) in the Metro terminal so the network is visible while debugging.
const loggingFetch: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : (input as Request).url;
  const method = init?.method ?? (typeof input !== 'string' ? (input as Request).method : 'GET');
  const path = (supabaseUrl ? url.replace(supabaseUrl, '') : url).split('?')[0];
  const start = Date.now();
  try {
    const res = await fetch(input as any, init);
    if (__DEV__) {
      let extra = '';
      if (!res.ok) {
        // Surface the real error body (error_code / msg) without consuming it.
        try {
          extra = ' ' + (await res.clone().text()).slice(0, 300);
        } catch {
          // ignore
        }
      }
      // A failed token refresh (expired/rotated/revoked refresh token) is an
      // expected, self-healing case — Supabase clears the session and emits
      // SIGNED_OUT. Log it as info, not as a scary error.
      const benignRefresh =
        path.includes('/auth/v1/token') && extra.includes('refresh_token_not_found');
      const tag = benignRefresh ? '[supabase] (session expired)' : '[supabase]';
      console.log(`${tag} ${method} ${path} → ${res.status} (${Date.now() - start}ms)${extra}`);
    }
    return res;
  } catch (e) {
    if (__DEV__) console.log(`[supabase] ${method} ${path} → NETWORK ERROR`, e);
    throw e;
  }
};

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    // Session (JWT) is encrypted at rest via SecureStore + AES.
    storage: new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    // No URL-based session detection in a native app.
    detectSessionInUrl: false,
  },
  global: { fetch: loggingFetch },
});

// Auto-refresh the auth token only while the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
