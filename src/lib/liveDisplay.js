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
 */
const CHANNEL_NAME = 'pickleball-live-display';

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
