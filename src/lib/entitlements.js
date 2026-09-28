/**
 * ENTITLEMENTS STUB
 * ---------------------------------------------------------------------
 * Swap point for future monetization. Today everything is unlocked and
 * no ads are shown. Later, check a real subscription status here (Stripe
 * + your backend for web, RevenueCat or Google Play Billing for the
 * Capacitor/Android build) and gate premium themes or show an <AdSlot />
 * based on what this returns — components that read isPremium/showAds
 * don't need to change when the real logic lands.
 */
export function useEntitlements() {
  return { isPremium: true, showAds: false };
}
