// ProfileContext — loads the signed-in user's real profile from Supabase and
// exposes it to the UI (name, email, id…). Email/id come straight from the auth
// session; the rest from the `profiles` row. Editing the name persists to
// Supabase and keeps the local greeting name (AppContext) in sync.

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import { getMyProfile, updateMyProfile, ProfileRow } from '../lib/api/profile';

interface ProfileContextType {
  profile: ProfileRow | null;
  /** Email from the auth session (source of truth). */
  email: string;
  /** Auth user id. */
  userId: string;
  /** Best display name: profile name → auth metadata → ''. */
  displayName: string;
  loading: boolean;
  /** Persist a new display name to Supabase + local greeting. */
  updateName: (name: string) => Promise<void>;
  /** Re-fetch from the backend. */
  refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { setUserName } = useApp();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(false);

  const userId = session?.user?.id ?? '';
  const email = session?.user?.email ?? '';
  const metaName = (session?.user?.user_metadata?.full_name as string | undefined) ?? '';

  const load = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return;
    }
    setLoading(true);
    const p = await getMyProfile();
    setProfile(p);
    if (p?.full_name) setUserName(p.full_name);
    setLoading(false);
  }, [userId, setUserName]);

  useEffect(() => {
    load();
  }, [load]);

  const updateName = useCallback(
    async (name: string) => {
      const updated = await updateMyProfile({ full_name: name });
      if (updated) setProfile(updated);
      setUserName(name);
    },
    [setUserName],
  );

  const displayName = profile?.full_name || metaName || '';

  return (
    <ProfileContext.Provider
      value={{ profile, email, userId, displayName, loading, updateName, refresh: load }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
