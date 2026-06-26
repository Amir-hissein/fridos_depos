// usePersistentState — a useState that hydrates from AsyncStorage and persists
// on change. A `hydrated` guard prevents writing defaults back over stored data
// before the first read completes. All storage access is wrapped so it never
// crashes (web / unsupported / malformed JSON).

import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  // Load once on mount (or if the key changes).
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(key)
      .then(raw => {
        if (active && raw != null) {
          try {
            setState(JSON.parse(raw));
          } catch {
            // ignore malformed storage
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, [key]);

  // Persist after hydration whenever the value changes.
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(key, JSON.stringify(state)).catch(() => {});
  }, [key, hydrated, state]);

  return [state, setState, hydrated];
}
