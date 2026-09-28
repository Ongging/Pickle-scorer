/**
 * STORAGE ADAPTER
 * ---------------------------------------------------------------------
 * Every read/write in the app goes through these two functions. Today
 * they wrap the browser's localStorage. When this grows into a real
 * account-backed app, replace ONLY the bodies of get/set below (e.g.
 * with Firebase/Supabase/your own API calls) — nothing else in the app
 * needs to change, since every caller just does storage.get/storage.set.
 *
 * A natural next step: make get/set branch on whether a user is signed
 * in (see lib/auth.js) — signed-out keeps using localStorage, signed-in
 * reads/writes to the cloud instead.
 */
export const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
};
