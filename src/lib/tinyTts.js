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

/**
 * PLAYBACK — why this doesn't just do `new Audio(url).play()`
 * ---------------------------------------------------------------------
 * That was the original approach, and it's the cause of the reported
 * "three" → "-ree" clipping. Traced this by reading vits-web's source
 * directly: the model's raw waveform goes straight into a WAV Blob with
 * no fade or padding applied anywhere in the library — so the missing
 * audio isn't being trimmed by vits-web. It's being eaten by playback
 * startup: browsers (this is especially well-documented on Android
 * WebView, which is exactly where Capacitor runs this app) can drop or
 * ramp-fade the first ~100–300ms of a freshly-started audio element
 * while the playback pipeline spins up, which lands right on top of
 * the first phoneme of a short clip like this.
 *
 * Fix has two parts:
 * 1. Decode through the Web Audio API instead of an <audio> element —
 *    full decode happens up front, then playback starts from a buffer
 *    that's already 100% in memory, sidestepping the streaming/startup
 *    quirk entirely.
 * 2. Also pad the front with a short stretch of true silence, so that
 *    IF something still eats the first moment of playback on some
 *    device, it eats silence rather than the first phoneme. Belt and
 *    suspenders — (1) alone should fix it, (2) is what makes it robust
 *    on hardware we can't personally test against.
 *
 * Caveat, stated plainly: this is reasoned from reading the library's
 * source and from well-documented platform behavior, not confirmed
 * against real playback in this environment (no speakers/mic here).
 * Please try it on your actual device — if "three" still comes out
 * short, that's useful signal that LEAD_SILENCE_SECONDS below needs to
 * go up, not that the approach is wrong.
 */
const LEAD_SILENCE_SECONDS = 0.22;

let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

function padWithLeadingSilence(ctx, buffer, seconds) {
  const padSamples = Math.round(seconds * buffer.sampleRate);
  const out = ctx.createBuffer(buffer.numberOfChannels, buffer.length + padSamples, buffer.sampleRate);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    // New Float32Array channels are zero-filled by default — that's
    // our silence. copy the real audio in starting after it.
    out.getChannelData(ch).set(buffer.getChannelData(ch), padSamples);
  }
  return out;
}

let currentSource = null;

/**
 * Speak text through the on-device model. Throws on failure (offline on
 * a first-ever use, or the browser can't run the WASM engine) - callers
 * should catch this and fall back to the Web Speech API, which is what
 * the announcer's Speak button does.
 */
export async function speakTinyTts(text, onProgress) {
  // Stop any still-playing utterance first, so a fast double-press can't
  // result in an older utterance finishing after a newer one.
  if (currentSource) {
    try { currentSource.stop(); } catch { /* already stopped/ended */ }
    currentSource = null;
  }

  const wavBlob = await predict({ text, voiceId: VOICE_ID }, onProgress);
  const arrayBuffer = await wavBlob.arrayBuffer();

  // Created/resumed inside this call, which only ever runs from a
  // button tap — that user gesture is what lets a browser's autoplay
  // policy allow this to make sound at all.
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume();

  const decoded = await ctx.decodeAudioData(arrayBuffer);
  const padded = padWithLeadingSilence(ctx, decoded, LEAD_SILENCE_SECONDS);

  const source = ctx.createBufferSource();
  source.buffer = padded;
  source.connect(ctx.destination);
  currentSource = source;

  try {
    await new Promise((resolve, reject) => {
      source.onended = resolve;
      try {
        source.start();
      } catch (err) {
        reject(err);
      }
    });
  } finally {
    if (currentSource === source) currentSource = null;
  }
}

/**
 * LATENCY — why this exists
 * ---------------------------------------------------------------------
 * Also traced by reading the source: every speakTinyTts() call rebuilds
 * the ONNX inference session from scratch (`InferenceSession.create()`
 * runs fresh every time — vits-web doesn't cache it across calls), on
 * top of phonemizing the text through a separate WASM module. Neither
 * step is something this app can cache from the outside, since predict()
 * fully encapsulates both. What this app CAN do is pay some of that
 * cost ahead of time instead of at the moment someone wants to hear the
 * score: call this once when the on-device voice becomes the active
 * one (see ScoreboardScreen), which fetches+caches the model file (only
 * matters the very first time) and spins up the WASM runtimes, so
 * they're already warm in memory by the time a real speakTinyTts() call
 * happens. It does NOT eliminate the per-call inference session cost —
 * that's inherent to the library as written — so some latency will
 * remain even after warming. Safe to call repeatedly; only does real
 * work once per page load. Never throws, never plays audio.
 */
let warmupStarted = false;
export function warmUpTinyTts() {
  if (warmupStarted) return;
  warmupStarted = true;
  predict({ text: '.', voiceId: VOICE_ID }).catch(() => {
    warmupStarted = false; // offline or failed — let a real call retry and surface the error there
  });
}

