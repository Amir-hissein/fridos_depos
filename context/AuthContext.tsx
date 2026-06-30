// AuthContext — exposes the current Supabase session/user and keeps it in sync
// via onAuthStateChange. `loading` is true until the initial session is read,
// so the splash/route guard can wait before deciding where to send the user.

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { signOut as apiSignOut } from '../lib/api/auth';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  /** True until the initial session check completes. */
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      // Read any persisted session once on mount.
      const { data } = await supabase.auth.getSession();

      // Validate it against the server: if the refresh token is gone/expired
      // (refresh_token_not_found), scrub the stale session so we route to
      // login cleanly instead of flashing a broken "signed-in" state.
      if (data.session) {
        const { error } = await supabase.auth.getUser();
        if (error) {
          await supabase.auth.signOut().catch(() => {});
          if (mounted) {
            setSession(null);
            setLoading(false);
          }
          return;
        }
      }

      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    })();

    // Keep in sync with sign-in / sign-out / token refresh.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (mounted) setSession(next);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await apiSignOut();
    // onAuthStateChange will clear the session.
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
