// NotificationsContext — reminder preferences backed by Supabase
// (notification_prefs). Loads on sign-in, persists on change, and (re)schedules
// the local reminders whenever prefs or the app language change.

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import i18n from '../lib/i18n';
import { useAuth } from './AuthContext';
import {
  NotifPrefs,
  NotifCategory,
  DEFAULT_NOTIF_PREFS,
  configureNotificationHandler,
  ensureAndroidChannel,
  getPermissionStatus,
  requestPermission,
  rescheduleReminders,
} from '../services/notifications';
import { getNotifPrefs, saveNotifPrefs } from '../lib/api/notificationPrefs';

interface NotificationsContextType {
  prefs: NotifPrefs;
  ready: boolean;
  permissionGranted: boolean;
  setEnabled: (on: boolean) => Promise<void>;
  toggleCategory: (cat: NotifCategory) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_NOTIF_PREFS);
  const [ready, setReady] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Configure the foreground handler + channel once.
  useEffect(() => {
    configureNotificationHandler();
    ensureAndroidChannel();
    getPermissionStatus().then((status) => setPermissionGranted(status === 'granted'));
  }, []);

  // Load prefs from the backend on sign-in.
  useEffect(() => {
    if (!userId) {
      setPrefs(DEFAULT_NOTIF_PREFS);
      setReady(false);
      return;
    }
    let active = true;
    setReady(false);
    getNotifPrefs().then((p) => {
      if (!active) return;
      if (p) setPrefs({ ...DEFAULT_NOTIF_PREFS, ...p });
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  // Persist + reschedule whenever prefs change (after load).
  useEffect(() => {
    if (!ready) return;
    saveNotifPrefs(prefs);
    rescheduleReminders(prefs);
  }, [prefs, ready]);

  // Reschedule on language change so reminders fire in the active language.
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  useEffect(() => {
    const onLang = () => rescheduleReminders(prefsRef.current);
    i18n.on('languageChanged', onLang);
    return () => i18n.off('languageChanged', onLang);
  }, []);

  const setEnabled = useCallback(async (on: boolean) => {
    if (on) {
      const granted = await requestPermission();
      setPermissionGranted(granted);
      if (!granted) {
        setPrefs((p) => ({ ...p, enabled: false }));
        return;
      }
    }
    setPrefs((p) => ({ ...p, enabled: on }));
  }, []);

  const toggleCategory = useCallback((cat: NotifCategory) => {
    setPrefs((p) => ({ ...p, [cat]: !p[cat] }));
  }, []);

  return (
    <NotificationsContext.Provider
      value={{ prefs, ready, permissionGranted, setEnabled, toggleCategory }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider');
  return ctx;
}
