/**
 * AUTH STUB
 * ---------------------------------------------------------------------
 * Swap point for future accounts. Today it always returns a guest user
 * with nothing wired up. Later, replace the body of useAuth with real
 * Google/Facebook/X OAuth (Firebase Auth, Supabase Auth, Clerk, or a
 * custom backend all work) — every screen that reads `user` or
 * `isLoggedIn` already works unchanged, since they only depend on this
 * hook's return shape, not how it's implemented.
 */
export function useAuth() {
  return { user: { id: 'guest', name: 'Guest', isGuest: true }, isLoggedIn: false };
}
