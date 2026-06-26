// NotificationsContext — owns the user's reminder preferences, persists them
// (AsyncStorage), keeps OS permission state, and (re)schedules the local
// reminders whenever prefs or the app language change.

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../lib/i18n';
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

const STORAGE_KEY = 'app.notifications';

interface NotificationsContextType {
  prefs: NotifPrefs;
  /** True once stored prefs + permission status have loaded. */
  ready: boolean;
  /** OS-level permission was granted. */
  permissionGranted: boolean;
  /** Flip the master switch — requests OS permission when turning on. */
  setEnabled: (on: boolean) => Promise<void>;
  /** Toggle a single reminder category. */
  toggleCategory: (cat: NotifCategory) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_NOTIF_PREFS);
  const [ready, setReady] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Configure the foreground handler once, up front.
  useEffect(() => {
    configureNotificationHandler();
    ensureAndroidChannel();
  }, []);

  // Load persisted prefs + current permission status on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      const [saved, status] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY).catch(() => null),
        getPermissionStatus(),
      ]);
      if (!active) return;
      if (saved) {
        try {
          setPrefs({ ...DEFAULT_NOTIF_PREFS, ...JSON.parse(saved) });
        } catch {
          // ignore malformed storage
        }
      }
      setPermissionGranted(status === 'granted');
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist + reschedule whenever prefs change (after initial load).
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)).catch(() => {});
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
        setPrefs(p => ({ ...p, enabled: false }));
        return;
      }
    }
    setPrefs(p => ({ ...p, enabled: on }));
  }, []);

  const toggleCategory = useCallback((cat: NotifCategory) => {
    setPrefs(p => ({ ...p, [cat]: !p[cat] }));
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
