// Notifications service — local (on-device) scheduled reminders.
// Pure infrastructure: permission handling, Android channel, and daily
// reminder (re)scheduling. Content is localized at schedule time via i18n so
// reminders always fire in the user's current language. All calls are wrapped
// so they never crash on web / unsupported environments.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import i18n from '../lib/i18n';

export type NotifCategory = 'hydration' | 'meals' | 'recap';

export interface NotifPrefs {
  /** Master switch — when off, nothing is scheduled. */
  enabled: boolean;
  hydration: boolean;
  meals: boolean;
  recap: boolean;
}

export const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  enabled: false,
  hydration: true,
  meals: true,
  recap: true,
};

export const NOTIF_CATEGORIES: NotifCategory[] = ['hydration', 'meals', 'recap'];

const ANDROID_CHANNEL = 'reminders';

/** Daily reminders. `key` maps to `notifications.push.<key>` i18n content. */
const REMINDERS: { category: NotifCategory; hour: number; minute: number; key: string }[] = [
  { category: 'hydration', hour: 11, minute: 0, key: 'hydration' },
  { category: 'hydration', hour: 16, minute: 0, key: 'hydration' },
  { category: 'meals', hour: 14, minute: 0, key: 'lunch' },
  { category: 'meals', hour: 20, minute: 30, key: 'dinner' },
  { category: 'recap', hour: 21, minute: 0, key: 'recap' },
];

let handlerConfigured = false;

/** Foreground presentation — show a banner, no sound/badge. Idempotent. */
export function configureNotificationHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch {
    // no-op
  }
}

/** Current OS permission: 'granted' | 'denied' | 'undetermined'. */
export async function getPermissionStatus(): Promise<string> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch {
    return 'undetermined';
  }
}

/** Ask the OS for permission. Returns whether it was granted. */
export async function requestPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Cancel everything and re-schedule the reminders enabled in `prefs`, localized
 * to the current language. Call on prefs change and on language change.
 */
export async function rescheduleReminders(prefs: NotifPrefs): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!prefs.enabled) return;
    await ensureAndroidChannel();
    const t = i18n.t.bind(i18n);
    for (const r of REMINDERS) {
      if (!prefs[r.category]) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t(`notifications.push.${r.key}.title`),
          body: t(`notifications.push.${r.key}.body`),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: r.hour,
          minute: r.minute,
          channelId: ANDROID_CHANNEL,
        },
      });
    }
  } catch {
    // no-op — scheduling unsupported (e.g. web) or transient failure.
  }
}
