// SubscriptionContext — RevenueCat integration (premium entitlement).
//
// RevenueCat (`react-native-purchases`) is a NATIVE module: it requires a dev
// build, not Expo Go. The SDK is dynamically imported and every call is guarded,
// so when the keys are absent or the native module is missing the provider
// simply no-ops and the app keeps using AppContext's local `isPremium` (handy
// for dev/testing). When configured, the active "premium" entitlement becomes
// the source of truth and is synced into AppContext for app-wide gating.

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import type { PurchasesOffering, CustomerInfo } from 'react-native-purchases';
import { useApp } from './AppContext';

/** Entitlement identifier configured in the RevenueCat dashboard. */
const ENTITLEMENT_ID = 'premium';

const API_KEY =
  (Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY) ?? '';

export type Plan = 'monthly' | 'annual';

interface SubscriptionContextType {
  /** RevenueCat is set up (keys present + native module available). */
  isConfigured: boolean;
  loading: boolean;
  /** Localized store prices when offerings are loaded. */
  prices: { monthly?: string; annual?: string };
  /** Buy a plan. Returns true if the user is now premium, false if cancelled. */
  purchasePlan: (plan: Plan) => Promise<boolean>;
  /** Restore prior purchases. Returns true if premium was restored. */
  restore: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { setPremium } = useApp();
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(!!API_KEY);
  const [prices, setPrices] = useState<{ monthly?: string; annual?: string }>({});

  // Hold the SDK module + current offering across renders.
  const purchasesRef = useRef<any>(null);
  const offeringRef = useRef<PurchasesOffering | null>(null);

  const applyInfo = useCallback(
    (info: CustomerInfo) => {
      setPremium(!!info.entitlements.active[ENTITLEMENT_ID]);
    },
    [setPremium],
  );

  useEffect(() => {
    if (!API_KEY) {
      setLoading(false);
      return; // no keys → dev mode, leave AppContext.isPremium untouched
    }
    let mounted = true;
    let listener: ((info: CustomerInfo) => void) | null = null;

    (async () => {
      try {
        const mod = await import('react-native-purchases');
        const Purchases = mod.default;
        purchasesRef.current = Purchases;
        Purchases.configure({ apiKey: API_KEY });
        if (!mounted) return;
        setIsConfigured(true);

        const info = await Purchases.getCustomerInfo();
        if (mounted) applyInfo(info);

        const offerings = await Purchases.getOfferings();
        const current = offerings.current ?? null;
        offeringRef.current = current;
        if (mounted && current) {
          setPrices({
            monthly: current.monthly?.product.priceString,
            annual: current.annual?.product.priceString,
          });
        }

        listener = (next: CustomerInfo) => applyInfo(next);
        Purchases.addCustomerInfoUpdateListener(listener);
      } catch (e) {
        if (__DEV__) console.log('[subscription] not configured / unavailable:', e);
        if (mounted) setIsConfigured(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (listener && purchasesRef.current) {
        try {
          purchasesRef.current.removeCustomerInfoUpdateListener(listener);
        } catch {
          // no-op
        }
      }
    };
  }, [applyInfo]);

  const purchasePlan = useCallback(
    async (plan: Plan): Promise<boolean> => {
      const Purchases = purchasesRef.current;
      const offering = offeringRef.current;
      if (!Purchases || !offering) throw new Error('subscription_unavailable');
      const pkg = plan === 'annual' ? offering.annual : offering.monthly;
      if (!pkg) throw new Error('subscription_unavailable');
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        applyInfo(customerInfo);
        return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
      } catch (e: any) {
        if (e?.userCancelled) return false;
        throw e;
      }
    },
    [applyInfo],
  );

  const restore = useCallback(async (): Promise<boolean> => {
    const Purchases = purchasesRef.current;
    if (!Purchases) throw new Error('subscription_unavailable');
    const info = await Purchases.restorePurchases();
    applyInfo(info);
    return !!info.entitlements.active[ENTITLEMENT_ID];
  }, [applyInfo]);

  return (
    <SubscriptionContext.Provider value={{ isConfigured, loading, prices, purchasePlan, restore }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used inside SubscriptionProvider');
  return ctx;
}
