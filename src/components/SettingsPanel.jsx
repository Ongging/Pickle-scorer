import { useState, useEffect } from 'react';
import { X, Sun, Moon, Monitor } from 'lucide-react';
import { unlockAudioSession } from '../lib/speech';
import { speakTinyTts, warmUpTinyTts, TINY_TTS_VOICE_ID } from '../lib/tinyTts';
import { SegButton, ToggleRow } from './ui';

export function SettingsPanel({ settings, onChange, onClose, casualTrackerVisible, setCasualTrackerVisible }) {
  const [showExplainer, setShowExplainer] = useState(false);
  return (
    <div className="absolute inset-0 bg-black/40 z-30 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-ink-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85%] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 dark:border-ink-800 sticky top-0 z-10 bg-white dark:bg-ink-900">
          <h2 className="font-display font-semibold">Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-full bg-ink-100 dark:bg-ink-800">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-6">
          <section>
            <div className="text-xs font-display font-medium text-ink-500 dark:text-ink-400 mb-2">Theme</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'minimalist', label: 'Minimalist' },
                { id: 'digital', label: 'Digital clock' },
                { id: 'flip', label: 'Flip card' },
              ].map((t) => (
                <SegButton key={t.id} active={settings.theme === t.id} onClick={() => onChange({ theme: t.id })}>
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
  const [tinyTtsState, setTinyTtsState] = useState('idle'); // idle | loading | error

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

  const testVoice = async () => {
    unlockAudioSession();
    if (isTinyTts) {
      setTinyTtsState('loading');
      try {
        await speakTinyTts('7, 5, 1');
        setTinyTtsState('idle');
      } catch (err) {
        console.error('On-device voice failed:', err);
        setTinyTtsState('error');
      }
      return;
    }
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance('7, 5, 1');
    const voice = voices.find((v) => v.voiceURI === settings.voiceURI);
    if (voice) utter.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  return (
    <div>
      <div className="flex items-center gap-2 min-w-0">
        <select
          value={settings.voiceURI || ''}
          onChange={(e) => { onChange({ voiceURI: e.target.value || null }); setTinyTtsState('idle'); }}
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
          disabled={tinyTtsState === 'loading'}
          className="px-3 py-2 rounded-lg bg-ink-100 dark:bg-ink-800 text-sm font-medium shrink-0 disabled:opacity-50"
        >
          {tinyTtsState === 'loading' ? 'Loading…' : 'Test'}
        </button>
      </div>
      {isTinyTts && (
        <p className="text-xs text-ink-500 dark:text-ink-400 mt-2">
          {tinyTtsState === 'error'
            ? "Couldn't load the on-device voice — falls back to your browser's default when this happens."
            : 'Downloads a small speech model the first time you use it (needs internet then), and keeps working offline after that, even with WiFi off. Built on Piper, a well-established open-source voice engine.'}
        </p>
      )}
      {!window.speechSynthesis && !isTinyTts && (
        <p className="text-xs text-ink-400 dark:text-ink-500 mt-2">Your browser's built-in speech isn't available, but the on-device voice above still works.</p>
      )}
    </div>
  );
}
