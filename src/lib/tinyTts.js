/**
 * ON-DEVICE NEURAL TTS (optional, additional voice)
 * ---------------------------------------------------------------------
 * Wraps @diffusionstudio/vits-web — a browser port of Piper (VITS-based
 * neural TTS). This is intentionally never the default voice: it's one
 * extra option in the voice picker, chosen explicitly, so nothing
 * changes for anyone who doesn't pick it.
 *
 * Trust/provenance (see README for the full writeup): this replaced an
 * earlier choice (a zero-star, three-month-old fork) after it turned out
 * unreliable in practice. This package is a meaningfully different
 * profile — 240+ GitHub stars, dozens of forks including from other
 * real open-source projects, an actively maintained org behind it, and
 * a public demo — verified by installing it and reading the source
 * directly rather than trusting any of that at face value.
 *
 * Honest trade-off from the previous choice: this one fetches its model
 * files from Hugging Face (and onnxruntime-web from a CDN) the first
 * time a given voice is used, caching them in the browser's Origin
 * Private File System after that — so the *first* use needs a network
 * connection, and it's offline (including with WiFi off) from then on.
 * That's different from before (fully offline from the very first use,
 * since the model shipped bundled in the app) — this package doesn't
 * expose a supported way to point it at self-hosted files instead, and
 * downloading the actual model weights to bundle them the way the
 * previous package did wasn't possible from this environment (Hugging
 * Face isn't a reachable host here). Given the alternative was an
 * unreliable, unvetted package, this seemed like the right trade to
 * make — flagged clearly here and in Settings so it's not a surprise.
 */
import { predict } from '@diffusionstudio/vits-web';

export const TINY_TTS_VOICE_ID = '__tiny-tts-en__';
const VOICE_ID = 'en_US-hfc_female-medium';

let currentAudio = null;

/**
 * Speak text through the on-device model. Throws on failure (offline on
 * a first-ever use, or the browser can't run the WASM engine) - callers
 * should catch this and fall back to the Web Speech API, which is what
 * the announcer's Speak button does.
 */
export async function speakTinyTts(text, onProgress) {
  // Stop any still-playing utterance first, so a fast double-press can't
  // result in an older utterance finishing after a newer one.
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  const wav = await predict({ text, voiceId: VOICE_ID }, onProgress);
  const url = URL.createObjectURL(wav);
  const audio = new Audio(url);
  currentAudio = audio;

  try {
    await new Promise((resolve, reject) => {
      audio.onended = resolve;
      audio.onerror = () => reject(new Error('On-device voice playback failed'));
      audio.play().catch(reject);
    });
  } finally {
    URL.revokeObjectURL(url);
    if (currentAudio === audio) currentAudio = null;
  }
}
