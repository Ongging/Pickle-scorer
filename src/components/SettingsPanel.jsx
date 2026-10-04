import { useState, useEffect } from 'react';
import { X, Sun, Moon, Monitor } from 'lucide-react';
import { unlockAudioSession } from '../lib/speech';
import { speakTinyTts, warmUpTinyTts, TINY_TTS_VOICE_ID } from '../lib/tinyTts';
import { SegButton, ToggleRow } from './ui';
import { THEME_OPTIONS, hasScenePanel, themeVars } from '../lib/themes';

export function SettingsPanel({ settings, isDark, onChange, onClose, casualTrackerVisible, setCasualTrackerVisible }) {
  const [showExplainer, setShowExplainer] = useState(false);
  const hasScene = hasScenePanel(settings.theme);
  const themed = (sceneClasses, defaultClasses) => (hasScene ? sceneClasses : defaultClasses);
  return (
    <div className="absolute inset-0 bg-black/40 z-30 flex items-end sm:items-center justify-center">
      <div
        style={themeVars(settings.theme, isDark)}
        className={`rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85%] overflow-y-auto overflow-x-hidden ${
          themed('bg-[var(--t-surface)] text-[var(--t-text)]', 'bg-white dark:bg-ink-900')
        }`}
      >
        <div
          className={`flex items-center justify-between px-5 py-4 border-b sticky top-0 z-10 ${
            themed('border-[var(--t-border)] bg-[var(--t-surface)]', 'border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900')
          }`}
        >
          <h2 className="font-display font-semibold">Settings</h2>
          <button onClick={onClose} className={`p-1.5 rounded-full ${themed('bg-[var(--t-surface-alt)]', 'bg-ink-100 dark:bg-ink-800')}`}>
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-6">
          <section>
            <div className="text-xs font-display font-medium text-ink-500 dark:text-ink-400 mb-2">Theme</div>
            <div className="grid grid-cols-2 gap-2">
              {THEME_OPTIONS.map((t) => (
                <SegButton key={t.value} active={settings.theme === t.value} onClick={() => onChange({ theme: t.value })}>
                  {t.label}
                </SegButton>
              ))}
            </div>
          </section>

          <section>
            <div className="text-xs font-display font-medium text-ink-500 dark:text-ink-400 mb-2">Appearance</div>
            <div className="grid grid-cols-3 gap-2">
              <SegButton active={settings.colorMode === 'light'} onClick={() => onChange({ colorMode: 'light' })}>
                <Sun size={14} className="inline mr-1" /> Light
              </SegButton>
              <SegButton active={settings.colorMode === 'dark'} onClick={() => onChange({ colorMode: 'dark' })}>
                <Moon size={14} className="inline mr-1" /> Dark
              </SegButton>
              <SegButton active={settings.colorMode === 'system'} onClick={() => onChange({ colorMode: 'system' })}>
                <Monitor size={14} className="inline mr-1" /> System
              </SegButton>
            </div>
          </section>

          <section>
            <div className="text-xs font-display font-medium text-ink-500 dark:text-ink-400 mb-2">Text size</div>
            <div className="grid grid-cols-3 gap-2">
              <SegButton active={settings.textSize === 'sm'} onClick={() => onChange({ textSize: 'sm' })}>Small</SegButton>
              <SegButton active={settings.textSize === 'md'} onClick={() => onChange({ textSize: 'md' })}>Medium</SegButton>
              <SegButton active={settings.textSize === 'lg'} onClick={() => onChange({ textSize: 'lg' })}>Large</SegButton>
            </div>
          </section>

          <section>
            <div className="text-xs font-display font-medium text-ink-500 dark:text-ink-400 mb-2">Score-to-say size (display)</div>
            <p className="text-xs text-ink-400 dark:text-ink-500 mb-2">
              How big the "7-5-2"-style call shows on the external display window — separate from the score numerals themselves.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <SegButton active={settings.displayAnnounceSize === 'sm'} onClick={() => onChange({ displayAnnounceSize: 'sm' })}>Small</SegButton>
              <SegButton active={settings.displayAnnounceSize === 'md'} onClick={() => onChange({ displayAnnounceSize: 'md' })}>Medium</SegButton>
              <SegButton active={settings.displayAnnounceSize === 'lg'} onClick={() => onChange({ displayAnnounceSize: 'lg' })}>Large</SegButton>
            </div>
          </section>

          <section className="bg-ink-50 dark:bg-ink-800/50 rounded-xl px-3">
            <ToggleRow
              label="Haptic feedback"
              description="Vibrate on invalid actions"
              checked={settings.haptics}
              onChange={(v) => onChange({ haptics: v })}
            />
            <ToggleRow
              label="Casual mode serve tracker"
              description="Default visibility (can also toggle mid-game)"
              checked={casualTrackerVisible}
              onChange={setCasualTrackerVisible}
            />
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-display font-medium text-ink-500 dark:text-ink-400">Announcement format</div>
              <button onClick={() => setShowExplainer((s) => !s)} className="text-[11px] text-court-600 dark:text-court-400 font-medium">
                {showExplainer ? 'Hide' : "What's the difference?"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SegButton active={settings.announcementFormat === 'traditional'} onClick={() => onChange({ announcementFormat: 'traditional' })}>
                Traditional
              </SegButton>
              <SegButton active={settings.announcementFormat === 'custom'} onClick={() => onChange({ announcementFormat: 'custom' })}>
                Custom
              </SegButton>
            </div>
            {showExplainer && (
              <div className="mt-2 text-xs text-ink-500 dark:text-ink-400 space-y-1.5 bg-ink-50 dark:bg-ink-800/50 rounded-lg p-3">
                <p><span className="font-medium text-ink-700 dark:text-ink-300">Traditional:</span> server's score, then receiver's score, then serve number — the official calling order.</p>
                <p><span className="font-medium text-ink-700 dark:text-ink-300">Custom:</span> the score of whichever team just scored, listed first — easier for spectators to follow.</p>
              </div>
            )}
          </section>

          <section>
            <div className="text-xs font-display font-medium text-ink-500 dark:text-ink-400 mb-2">Announcer voice</div>
            <VoicePicker settings={settings} onChange={onChange} />
          </section>

          <section>
            <div className="text-xs font-display font-medium text-ink-500 dark:text-ink-400 mb-2">Keyboard shortcuts (desktop)</div>
            <p className="text-xs text-ink-400 dark:text-ink-500 mb-2">
              Score from the keyboard without touching the buttons — handy while a display window (see the Monitor icon on the scoreboard) is on a second screen.
            </p>
            <KeyBindingsEditor settings={settings} onChange={onChange} />
          </section>
        </div>
      </div>
    </div>
  );
}

const KEY_BINDING_LABELS = {
  pointA: 'Point — Team A',
  pointB: 'Point — Team B',
  fault: 'Fault',
  undo: 'Undo',
};

function keyDisplayName(key) {
  if (!key) return '—';
  const names = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', ' ': 'Space', Enter: 'Enter', Backspace: 'Backspace', Escape: 'Esc' };
  return names[key] || (key.length === 1 ? key.toUpperCase() : key);
}

function KeyBindingsEditor({ settings, onChange }) {
  const [listeningFor, setListeningFor] = useState(null);
  const bindings = settings.keyBindings || {};

  useEffect(() => {
    if (!listeningFor) return;
    const onKeyDown = (e) => {
      e.preventDefault();
      if (e.key === 'Escape') {
        setListeningFor(null);
        return;
      }
      onChange({ keyBindings: { ...bindings, [listeningFor]: e.key } });
      setListeningFor(null);
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listeningFor]);

  return (
    <div className="bg-ink-50 dark:bg-ink-800/50 rounded-xl divide-y divide-ink-100 dark:divide-ink-800">
      {Object.entries(KEY_BINDING_LABELS).map(([action, label]) => (
        <div key={action} className="flex items-center justify-between px-3 py-2.5">
          <span className="text-sm">{label}</span>
          <button
            onClick={() => setListeningFor(action)}
            className={`min-w-[64px] px-3 py-1.5 rounded-lg text-sm font-mono font-medium ${
              listeningFor === action
                ? 'bg-court-600 text-white'
                : 'bg-white dark:bg-ink-900 text-ink-700 dark:text-ink-300'
            }`}
          >
            {listeningFor === action ? 'Press a key…' : keyDisplayName(bindings[action])}
          </button>
        </div>
      ))}
    </div>
  );
}
function VoicePicker({ settings, onChange }) {
  const [voices, setVoices] = useState([]);
  // idle | loading | played | error | silent — 'silent' is specifically
  // "the browser API reported success but no start/end event ever fired,
  // so it almost certainly produced no sound" — different from 'error'
  // (an actual exception), and the far more common failure on Android.
  const [testState, setTestState] = useState('idle');
  const [testDetail, setTestDetail] = useState('');

  useEffect(() => {
    if (!window.speechSynthesis) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const isTinyTts = settings.voiceURI === TINY_TTS_VOICE_ID;
  useEffect(() => {
    if (isTinyTts) warmUpTinyTts();
  }, [isTinyTts]);

  // Reset the "✓ Played" / error feedback a couple seconds after a
  // successful test, so the button doesn't permanently stop saying "Test".
  useEffect(() => {
    if (testState !== 'played') return undefined;
    const t = setTimeout(() => setTestState('idle'), 2500);
    return () => clearTimeout(t);
  }, [testState]);

  const testVoice = async () => {
    unlockAudioSession();
    setTestDetail('');

    if (isTinyTts) {
      setTestState('loading');
      try {
        await speakTinyTts('7, 5, 1');
        setTestState('played');
      } catch (err) {
        console.error('On-device voice failed:', err);
        setTestDetail(err?.message || String(err));
        setTestState('error');
      }
      return;
    }

    if (!window.speechSynthesis) {
      setTestState('error');
      setTestDetail('speechSynthesis is not available in this browser engine at all.');
      return;
    }

    setTestState('loading');
    const utter = new SpeechSynthesisUtterance('7, 5, 1');
    const voice = voices.find((v) => v.voiceURI === settings.voiceURI);
    if (voice) utter.voice = voice;

    // speechSynthesis.speak() doesn't throw when there's no real voice
    // behind it (notably on Android WebView, which is what the
    // Capacitor app runs on) — it just silently does nothing, no error
    // event ever fires. A short timeout is the only way to actually
    // notice that and say so, instead of leaving "Loading…" up forever.
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      setTestState('silent');
    }, 2500);
    utter.onstart = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      setTestState('played');
    };
    utter.onerror = (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      setTestDetail(e?.error || '');
      setTestState('error');
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const noBrowserVoices = window.speechSynthesis && voices.length === 0;

  return (
    <div>
      <div className="flex items-center gap-2 min-w-0">
        <select
          value={settings.voiceURI || ''}
          onChange={(e) => { onChange({ voiceURI: e.target.value || null }); setTestState('idle'); setTestDetail(''); }}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-ink-100 dark:bg-ink-800 text-sm truncate"
          style={{ maxWidth: '100%' }}
        >
          <option value="">Browser default</option>
          <option value={TINY_TTS_VOICE_ID}>On-device voice (offline, experimental)</option>
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
        <button
          onClick={testVoice}
          disabled={testState === 'loading'}
          className="px-3 py-2 rounded-lg bg-ink-100 dark:bg-ink-800 text-sm font-medium shrink-0 disabled:opacity-50"
        >
          {testState === 'loading' ? 'Loading…' : testState === 'played' ? '✓ Played' : 'Test'}
        </button>
      </div>

      {isTinyTts && (
        <p className="text-xs text-ink-500 dark:text-ink-400 mt-2">
          {testState === 'error'
            ? `Couldn't load the on-device voice${testDetail ? ` (${testDetail})` : ''} — falls back to your browser's default when this happens.`
            : testState === 'played'
              ? "That actually ran successfully. If you still didn't hear anything, it's almost certainly the emulator's audio, not the app — check the emulator window's own volume/speaker isn't muted, check your computer's volume, and try a real device if you can; emulator audio pass-through is notoriously unreliable."
              : 'Downloads a small speech model the first time you use it (needs internet then), and keeps working offline after that, even with WiFi off. Built on Piper, a well-established open-source voice engine.'}
        </p>
      )}

      {!isTinyTts && testState === 'silent' && (
        <p className="text-xs text-clay-600 dark:text-clay-100 mt-2">
          Didn't detect it actually starting. This is a known gap in Android's WebView (what the installed app runs on) — it often has no working text-to-speech engine wired up, even though the API itself appears to exist. The on-device voice above is the reliable option on Android.
        </p>
      )}
      {!isTinyTts && testState === 'error' && testDetail && (
        <p className="text-xs text-clay-600 dark:text-clay-100 mt-2">Error: {testDetail}</p>
      )}
      {!isTinyTts && noBrowserVoices && testState === 'idle' && (
        <p className="text-xs text-ink-400 dark:text-ink-500 mt-2">
          No system voices found yet — common on Android. The on-device voice above doesn't depend on this and is the more reliable choice there.
        </p>
      )}
      {!window.speechSynthesis && !isTinyTts && (
        <p className="text-xs text-ink-400 dark:text-ink-500 mt-2">Your browser's built-in speech isn't available, but the on-device voice above still works.</p>
      )}
    </div>
  );
}
