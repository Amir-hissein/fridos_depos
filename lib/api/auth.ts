// Auth API — thin, typed wrapper around Supabase Auth. Screens call these and
// translate the returned `errorKey` (an i18n key) for display. Keeps Supabase
// specifics out of the UI.

import { supabase } from '../supabase';

export interface AuthResult {
  ok: boolean;
  /** i18n key under `auth.*` to show on failure. */
  errorKey?: string;
  /** Sign-up only: true when email confirmation is required (no session yet). */
  needsConfirm?: boolean;
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
