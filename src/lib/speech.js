// Speech engines vary in how they read a bare hyphen between digits (some
// say "dash", some pause oddly). Spacing the numbers out reads naturally
// as "seven, five, one" on every engine we've tested.
export function speechFriendly(text) {
  return text.replace(/[()]/g, '').replace(/-/g, ', ');
}

// Some mobile browsers (notably iOS Safari) route speechSynthesis audio
// through an "ambient" session that respects the hardware ringer/silent
// switch, so it stays silent unless real audio has already played. A
// silent audio blip flips the session to a category that isn't affected
// by the silent switch. Cheap enough to fire on every Speak tap.
const SILENT_WAV =
  'data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';

export function unlockAudioSession() {
  try {
    const audio = new Audio(SILENT_WAV);
    audio.play().catch(() => {});
  } catch {
    /* ignore - purely a best-effort mobile audio-routing nudge */
  }
}
