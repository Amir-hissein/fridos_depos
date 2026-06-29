// Auth API — thin, typed wrapper around Supabase Auth. Screens call these and
// translate the returned `errorKey` (an i18n key) for display. Keeps Supabase
// specifics out of the UI.

import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../supabase';

// Finishes any pending OAuth session if the app was reopened mid-flow.
WebBrowser.maybeCompleteAuthSession();

export interface AuthResult {
  ok: boolean;
  /** i18n key under `auth.*` to show on failure. */
  errorKey?: string;
  /** Sign-up only: true when email confirmation is required (no session yet). */
  needsConfirm?: boolean;
  /** OAuth only: user closed the browser without finishing (don't show an error). */
  cancelled?: boolean;
}

/** Map a raw Supabase auth error message to a friendly i18n key. */
function mapError(message?: string): string {
  const m = (message ?? '').toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'auth.errInvalidCredentials';
  }
  if (m.includes('already registered') || m.includes('already exists') || m.includes('already in use')) {
    return 'auth.errEmailTaken';
  }
  return 'auth.errGeneric';
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return { ok: false, errorKey: mapError(error.message) };
  return { ok: true };
}

/**
 * Google sign-in via Supabase OAuth, native flow:
 *  1. ask Supabase for the provider URL (no auto browser redirect),
 *  2. open it in the system auth session, redirecting back to `fridos://auth/callback`,
 *  3. complete the session from the returned URL — handles both PKCE (`?code=`)
 *     and implicit (`#access_token=`) so it works whatever the client flow type.
 * Requires the Google provider to be enabled in the Supabase dashboard and
 * `fridos://auth/callback` added to the allowed redirect URLs.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    // Pin the app's native scheme. In dev, Linking.createURL() returns the Metro
    // `exp://<ip>:8081/--/…` URL, which Supabase/Google can't redirect back to.
    // ASWebAuthenticationSession captures the return purely by the `fridos`
    // scheme, so a fixed URL is the robust choice (dev build + production).
    const redirectTo = 'fridos://auth/callback';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) return { ok: false, errorKey: 'auth.errGeneric' };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) {
      return { ok: false, cancelled: true };
    }

    const url = result.url;
    // PKCE flow → exchange the one-time code for a session.
    const code = new URL(url).searchParams.get('code');
    if (code) {
      const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
      if (exErr) return { ok: false, errorKey: 'auth.errGeneric' };
      return { ok: true };
    }
    // Implicit flow → set the session from the URL fragment tokens.
    const fragment = url.includes('#') ? url.split('#')[1] : '';
    const params = new URLSearchParams(fragment);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      const { error: sErr } = await supabase.auth.setSession({ access_token, refresh_token });
      if (sErr) return { ok: false, errorKey: 'auth.errGeneric' };
      return { ok: true };
    }
    return { ok: false, errorKey: 'auth.errGeneric' };
  } catch {
    return { ok: false, errorKey: 'auth.errGeneric' };
  }
}

/**
 * Apple sign-in (iOS native). Uses the system Sign in with Apple sheet to get
 * an identity token, then hands it to Supabase. The Apple provider must be
 * enabled in the Supabase dashboard with `com.fridos.app` as an allowed client
 * ID. iOS only — the button should be hidden elsewhere.
 */
export async function signInWithApple(): Promise<AuthResult> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) return { ok: false, errorKey: 'auth.errGeneric' };

    // Apple only returns the name on the very first authorization — pass it
    // through so the profile can be populated.
    const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
      .filter(Boolean)
      .join(' ')
      .trim();

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) return { ok: false, errorKey: 'auth.errGeneric' };

    if (fullName) {
      await supabase.auth.updateUser({ data: { full_name: fullName } }).catch(() => {});
    }
    return { ok: true };
  } catch (e: any) {
    // User dismissed the native sheet.
    if (e?.code === 'ERR_REQUEST_CANCELED') return { ok: false, cancelled: true };
    return { ok: false, errorKey: 'auth.errGeneric' };
  }
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: fullName.trim() } },
  });
  if (error) return { ok: false, errorKey: mapError(error.message) };
  // When email confirmation is enabled, no session is returned until confirmed.
  return { ok: true, needsConfirm: !data.session };
}

export async function resetPassword(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  if (error) return { ok: false, errorKey: mapError(error.message) };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Permanently delete the signed-in user's account. Calls the `delete-account`
 * Edge Function (service role → removes the auth user; all owned rows cascade),
 * then signs out locally. Irreversible.
 */
export async function deleteAccount(): Promise<AuthResult> {
  const { error } = await supabase.functions.invoke('delete-account');
  if (error) return { ok: false, errorKey: 'auth.errGeneric' };
  await supabase.auth.signOut();
  return { ok: true };
}
