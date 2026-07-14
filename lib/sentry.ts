// Sentry — crash & error reporting for the app.
//
// The DSN is public by design (an ingest address, not a secret), so it lives in
// EXPO_PUBLIC_SENTRY_DSN. Native crash reporting requires a dev/EAS build
// (@sentry/react-native is a native module) — in Expo Go it degrades to JS-only.
// Everything is guarded so a missing DSN or unavailable native module is a no-op.

import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

let initialized = false;

/** Initialise Sentry once, as early as possible in the app lifecycle. */
export function initSentry() {
  if (initialized || !DSN) return;
  try {
    Sentry.init({
      dsn: DSN,
      // Keep noise low in dev; capture everything in production builds.
      enabled: !__DEV__,
      // Performance tracing — light sampling.
      tracesSampleRate: 0.2,
      // Don't send default PII (emails, etc.).
      sendDefaultPii: false,
    });
    initialized = true;
  } catch {
    // Native module missing (e.g. Expo Go) or init failed — stay silent.
  }
}

/** Manually report a caught error (used by the root ErrorBoundary). */
export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!initialized) return;
  try {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  } catch {
    // ignore
  }
}

export { Sentry };
