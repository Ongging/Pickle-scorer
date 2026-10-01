/**
 * LIVE DISPLAY SYNC
 * ---------------------------------------------------------------------
 * BroadcastChannel is same-origin, same-browser only — perfect for "a
 * second window on this computer, dragged onto a TV/monitor," not
 * suitable for a genuinely separate device. True separate-device sync
 * (phone controls, a different smart TV or tablet displays) needs the
 * same real-time backend already planned for accounts/cloud sync later
 * (see lib/storage.js) — a subscribe-only version of that same
 * connection would replace this file's internals without changing how
 * DisplayView or ScoreboardScreen use it.
 *
 * Protocol (three message types on the one channel):
 * - 'hello'  — sent once by a display window right after it opens, to
 *              ask "what's the current state?" instead of waiting for
 *              the next point to be scored. Without this, a display
 *              opened mid-game shows nothing until something changes.
 * - 'state'  — sent by the controlling window on every real change,
 *              AND on a fixed heartbeat (HEARTBEAT_MS) regardless of
 *              whether anything changed, AND immediately in reply to
 *              a 'hello'. The heartbeat is what the display's own
 *              staleness check (display-main.jsx) relies on — without
 *              it, a perfectly normal pause between rallies (longer
 *              than the staleness window) was being misread as
 *              "disconnected".
 */
const CHANNEL_NAME = 'pickleball-live-display';
export const HEARTBEAT_MS = 3000;

export function openDisplayChannel() {
  if (typeof BroadcastChannel === 'undefined') return null;
  return new BroadcastChannel(CHANNEL_NAME);
}

export function broadcastGameState(channel, gameState, settings) {
  if (!channel) return;
  try {
    channel.postMessage({ type: 'state', gameState, settings, at: Date.now() });
  } catch {
    /* ignore — e.g. channel already closed */
  }
}

export function requestCurrentState(channel) {
  if (!channel) return;
  try {
    channel.postMessage({ type: 'hello' });
  } catch {
    /* ignore */
  }
}
