/**
 * EXTERNAL DISPLAY DETECTION
 * ---------------------------------------------------------------------
 * Goal: notice when a second screen becomes available and offer to open
 * the display window there, instead of making the user remember the
 * Monitor button exists.
 *
 * Read this before changing anything — the honest scope of what this
 * can actually see:
 *
 * - Web (Chrome/Edge desktop; partial on Android Chrome): uses the
 *   Window Management API (`screen.isExtended`, and `getScreenDetails()`
 *   for real geometry once the user opts in). This only sees displays
 *   the OS exposes as an EXTENDED desktop — a wired monitor, or a
 *   wireless display explicitly set to "Extend" rather than
 *   "Duplicate/Mirror". It cannot see OS-level screen mirroring or
 *   casting (Miracast, AirPlay, Chromecast, Smart View) — browsers
 *   deliberately don't expose that to a web page, on any browser.
 *   Not supported at all in Safari or Firefox — this module
 *   feature-detects and quietly no-ops there rather than pretending to
 *   watch for something it can't see.
 * - "Bluetooth" isn't actually a video-output pathway (real screen
 *   mirroring runs over WiFi Direct/Miracast or Chromecast under the
 *   hood, not classic Bluetooth), so there's nothing distinct to check
 *   for there beyond what's covered above.
 * - Native app (Capacitor/Android): a real native plugin can see far
 *   more — HDMI, wireless-display/Miracast routes, and Cast routes,
 *   via Android's DisplayManager + MediaRouter. That plugin is written
 *   in /android-plugin (see its README) but is NOT compiled into a
 *   build yet — it needs Android Studio on a real machine, and Claude's
 *   sandbox can't reach the Android/Gradle tooling to do that or test
 *   it. Until someone wires it in, registerPlugin() below degrades to
 *   a harmless no-op (no native implementation registered → the
 *   addListener call below is caught and simply never fires).
 */
import { Capacitor, registerPlugin } from '@capacitor/core';

const ExternalDisplayNative = registerPlugin('ExternalDisplay');

export function isWindowManagementSupported() {
  return typeof window !== 'undefined' && typeof window.screen?.isExtended === 'boolean';
}

/**
 * Subscribe to external-display connect/disconnect. Calls
 * onChange(true|false) once immediately with the current state, then
 * again on every change. Returns an unsubscribe function.
 */
export function subscribeExternalDisplay(onChange) {
  const cleanups = [];

  if (Capacitor.isNativePlatform()) {
    ExternalDisplayNative.addListener('externalDisplayChanged', ({ connected }) => onChange(connected))
      .then((handle) => cleanups.push(() => handle.remove()))
      .catch(() => {
        /* no native implementation registered yet — expected until
           /android-plugin is built in; not an error the user needs to
           see. */
      });
  }

  if (isWindowManagementSupported()) {
    const report = () => onChange(window.screen.isExtended);
    report();
    window.screen.addEventListener('change', report);
    cleanups.push(() => window.screen.removeEventListener('change', report));
  }

  return () => cleanups.forEach((fn) => fn());
}

/**
 * Ask the browser for real screen geometry — triggers a one-time
 * permission prompt the first time. Only call this from inside a user
 * gesture (e.g. the "Yes, show it there" tap), which is required for
 * this permission to be grantable at all. Returns the first non-primary
 * screen, or null if unsupported/denied/unavailable.
 */
export async function pickExternalScreen() {
  if (typeof window.getScreenDetails !== 'function') return null;
  try {
    const details = await window.getScreenDetails();
    return details.screens.find((s) => !s.isPrimary) || null;
  } catch {
    return null; // permission denied, or no second screen after all
  }
}
