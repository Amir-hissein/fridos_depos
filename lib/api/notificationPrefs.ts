// Notification prefs API — the user's reminder preferences (notification_prefs,
// 1:1 row created by the signup trigger).

import { supabase } from '../supabase';
import type { NotifPrefs } from '../../services/notifications';

export async function getNotifPrefs(): Promise<NotifPrefs | null> {
  const { data, error } = await supabase
    .from('notification_prefs')
    .select('enabled,hydration,meals,recap')
    .maybeSingle();
  if (error) {
    if (__DEV__) console.log('[notifPrefs] get error:', error.message);
    return null;
  }
  return data as NotifPrefs | null;
}

export async function saveNotifPrefs(prefs: NotifPrefs): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return;
  const { error } = await supabase.from('notification_prefs').upsert({ user_id: uid, ...prefs });
  if (error && __DEV__) console.log('[notifPrefs] save error:', error.message);
}
