/**
 * EXTERNAL DISPLAY
 * ---------------------------------------------------------------------
 * Goal: notice when a second screen becomes available, and actually
 * show the scoreboard there — on native, a REAL second window via
 * Android's Presentation API (see android-plugin/ExternalDisplayPlugin.java),
 * not just a detection signal.
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
 * - Native app (Capacitor/Android): the plugin in /android-plugin sees
 *   HDMI and most wireless-display ("extend") routes via Android's
 *   DisplayManager, and present() opens a real second window there —
 *   controls stay on the phone, a clean view shows on the TV at the
 *   same time. Written and reasoned carefully against Capacitor's own
 *   source and Android's documented APIs, but NOT compiled or run by
 *   Claude — this sandbox can't reach the Android/Gradle tooling, and
 *   it needs a real external display to actually confirm. See its
 *   README for wiring it in. Until that's done, registerPlugin() below
 *   degrades to a harmless no-op (no native implementation registered →
 *   every call below is caught and the caller falls back accordingly —
 *   see ScoreboardScreen's use of present()/dismiss()).
 */
import { Capacitor, registerPlugin } from '@capacitor/core';

const ExternalDisplayNative = registerPlugin('ExternalDisplay');

/**
 * Opens a real second window on the external display (native only).
 * Resolves true on success, false if there's no native plugin wired in
 * yet or no external display is actually connected right now — callers
 * should fall back to in-app Presentation Mode in that case.
 */
export async function presentOnNativeDisplay() {
  try {
    await ExternalDisplayNative.present();
    return true;
  } catch {
    return false;
  }
}

/** Closes the native second window, if one is open. Safe to call anytime. */
export async function dismissNativeDisplay() {
  try {
    await ExternalDisplayNative.dismiss();
  } catch {
    /* no native window open, or plugin not wired in — nothing to do */
  }
}

/**
 * Pushes the latest game state into the native second window, if one is
 * currently open. Safe (and cheap) to call on every state change
 * regardless of whether present() ever succeeded — the native side
 * silently no-ops when nothing's being presented.
 */
export function pushStateToNative(gameState, settings) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    ExternalDisplayNative.updateState({ json: JSON.stringify({ gameState, settings }) });
  } catch {
    /* plugin not wired in yet — harmless no-op */
  }
}

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
