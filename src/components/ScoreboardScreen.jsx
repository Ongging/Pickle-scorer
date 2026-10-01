import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, History as HistoryIcon, Settings, Plus,
  AlertTriangle, Volume2, Loader2, RotateCcw, RefreshCw, Monitor, X,
} from 'lucide-react';
import { sideFor, buildAnnouncement } from '../engine/rulesEngine';
import { speechFriendly, unlockAudioSession } from '../lib/speech';
import { speakTinyTts, warmUpTinyTts, TINY_TTS_VOICE_ID } from '../lib/tinyTts';
import { subscribeExternalDisplay, pickExternalScreen } from '../lib/externalDisplay';
import { hasScenePanel, themePanelClasses, themeNameClasses, themeDividerClasses, themeServingClasses } from '../lib/themes';
import { ScoreNumeral, ServeNumber } from './ui';

const SCORE_SIZE = { sm: 'text-6xl', md: 'text-7xl', lg: 'text-8xl' };
const LABEL_SIZE = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

export function ScoreboardScreen({
  gameState, dispatch, settings, casualTrackerVisible,
  invalidFlash, onPoint, onFault, onUndo, onReset, onNewGame,
  onOpenSettings, onOpenHistory,
}) {
  const { config } = gameState;
  const isDoublesTraditional = config.type === 'doubles' && config.mode === 'traditional';
  const showFaultButtons = config.mode === 'traditional';
  const trackerActive = config.mode !== 'casual' || casualTrackerVisible;

  // Singles derives position from the server's own score parity (no
  // partner to reference); doubles tracks explicit position state since
  // it always restarts from the right at a side-out (see rules engine).
  const servingScore = gameState[gameState.servingTeam === 'A' ? 'teamA' : 'teamB'].score;
  const position = config.type === 'singles' ? sideFor(servingScore) : gameState.position;
  const manualScore = gameState[gameState.manualServingTeam === 'A' ? 'teamA' : 'teamB'].score;
  const manualPosition = config.type === 'singles' ? sideFor(manualScore) : gameState.manualPosition;

  const [format, setFormat] = useState(settings.announcementFormat);
  useEffect(() => setFormat(settings.announcementFormat), [settings.announcementFormat]);

  // Pay the on-device model's warm-up cost (fetch/cache + spin up the
  // WASM runtimes) as soon as it's the active voice, rather than at the
  // moment someone actually wants to hear the score. See tinyTts.js.
  useEffect(() => {
    if (settings.voiceURI === TINY_TTS_VOICE_ID) warmUpTinyTts();
  }, [settings.voiceURI]);

  const [speaking, setSpeaking] = useState(false);
  const speak = async () => {
    unlockAudioSession();
    const text = speechFriendly(buildAnnouncement(gameState, format));

    if (settings.voiceURI === TINY_TTS_VOICE_ID) {
      setSpeaking(true);
      try {
        await speakTinyTts(text);
      } catch (err) {
        console.error('On-device voice failed, falling back to browser speech:', err);
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
        }
      } finally {
        setSpeaking(false);
      }
      return;
    }

    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    if (settings.voiceURI && settings.voiceURI !== TINY_TTS_VOICE_ID) {
      const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === settings.voiceURI);
      if (voice) utter.voice = voice;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const scoreSize = SCORE_SIZE[settings.textSize];
  const labelSize = LABEL_SIZE[settings.textSize];
  const hasScene = hasScenePanel(settings.theme);

  // Kept so the game-over prompt below can offer to close the window it
  // opened — window.open()'s return value isn't stored anywhere else.
  const displayWindowRef = useRef(null);
  const openDisplayWindow = (targetScreen) => {
    if (targetScreen) {
      const { availLeft, availTop, availWidth, availHeight } = targetScreen;
      displayWindowRef.current = window.open(
        '/display.html',
        'pickleball-display',
        `left=${availLeft},top=${availTop},width=${availWidth},height=${availHeight},menubar=no,toolbar=no,location=no,status=no`,
      );
      return;
    }
    displayWindowRef.current = window.open(
      '/display.html',
      'pickleball-display',
      'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no',
    );
  };

  // Offer to close the display window once the game it was showing has
  // ended — only when one is actually still open (not closed by hand
  // already), and only once per game-over (wasGameOver guards against
  // re-showing this on every re-render while gameOver stays true).
  const [showCloseDisplayPrompt, setShowCloseDisplayPrompt] = useState(false);
  const wasGameOver = useRef(false);
  useEffect(() => {
    if (gameState.gameOver && !wasGameOver.current) {
      if (displayWindowRef.current && !displayWindowRef.current.closed) {
        setShowCloseDisplayPrompt(true);
      }
    }
    if (!gameState.gameOver) setShowCloseDisplayPrompt(false);
    wasGameOver.current = gameState.gameOver;
  }, [gameState.gameOver]);
  const closeDisplayWindow = () => {
    displayWindowRef.current?.close();
    displayWindowRef.current = null;
    setShowCloseDisplayPrompt(false);
  };

  // External-display auto-detect: offer to open the display window the
  // moment a second screen shows up, instead of relying on someone to
  // notice the Monitor button. See lib/externalDisplay.js for exactly
  // what this can and can't see.
  const [showExternalPrompt, setShowExternalPrompt] = useState(false);
  const wasConnected = useRef(false);
  useEffect(() => {
    const unsub = subscribeExternalDisplay((connected) => {
      if (connected && !wasConnected.current) setShowExternalPrompt(true);
      if (!connected) setShowExternalPrompt(false);
      wasConnected.current = connected;
    });
    return unsub;
  }, []);
  const acceptExternalDisplay = async () => {
    setShowExternalPrompt(false);
    openDisplayWindow(await pickExternalScreen());
  };

  // Desktop keyboard shortcuts, configurable in Settings. This is what
  // makes "Open display window" actually useful for solo scorekeeping:
  // put the display window on a TV/second monitor, then score from the
  // keyboard on the controlling laptop without touching the mouse.
  // Never active while typing in a form field.
  useEffect(() => {
    const bindings = settings.keyBindings || {};
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === bindings.pointA) onPoint('A');
      else if (e.key === bindings.pointB) onPoint('B');
      else if (e.key === bindings.fault && showFaultButtons) onFault();
      else if (e.key === bindings.undo) onUndo();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settings.keyBindings, showFaultButtons, onPoint, onFault, onUndo]);

  return (
    <div className="h-full bg-ink-50 dark:bg-ink-950 text-ink-950 dark:text-ink-50 flex flex-col">
      <div className="flex items-center justify-between px-5 pt-6 pb-1">
        <button onClick={onNewGame} className="p-2 -ml-2 rounded-full bg-ink-100 dark:bg-ink-800 lg:hidden">
          <ArrowLeft size={18} />
        </button>
        <div className={`${labelSize} font-display font-medium text-ink-500 dark:text-ink-400`}>
          {config.type === 'singles' ? 'Singles' : 'Doubles'},{' '}
          {config.mode === 'traditional' ? 'traditional' : config.mode === 'rally' ? 'rally scoring' : 'casual'}
        </div>
        <div className="flex gap-1">
          <button onClick={() => openDisplayWindow()} className="p-2 rounded-full bg-ink-100 dark:bg-ink-800" title="Open display window">
            <Monitor size={18} />
          </button>
          <button onClick={onOpenHistory} className="p-2 rounded-full bg-ink-100 dark:bg-ink-800 lg:hidden">
            <HistoryIcon size={18} />
          </button>
          <button onClick={onOpenSettings} className="p-2 rounded-full bg-ink-100 dark:bg-ink-800 lg:hidden">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {showExternalPrompt && (
        <div className="mx-5 mt-2 rounded-lg bg-court-50 dark:bg-court-950/50 px-3 py-2.5 flex items-center gap-2">
          <Monitor size={15} className="text-court-600 dark:text-court-400 shrink-0" />
          <p className="flex-1 text-xs text-ink-700 dark:text-ink-200">External display detected — show the scoreboard there?</p>
          <button onClick={acceptExternalDisplay} className="text-xs font-display font-semibold text-court-600 dark:text-court-400 px-1 shrink-0">
            Show
          </button>
          <button onClick={() => setShowExternalPrompt(false)} className="p-1 text-ink-400 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Score panel — one unified panel with a center divider standing
          in for the net, rather than two separate floating cards.
          Stadium/Chalkboard/Neon Night/Sunset Court replace this panel's
          background with their own fixed scene instead (see
          lib/themes.js) — that's what hasScene below branches on. */}
      <div className={`mx-5 mt-4 rounded-2xl relative overflow-hidden ${hasScene ? themePanelClasses(settings.theme) : 'bg-white dark:bg-ink-900'}`}>
        <div className={`absolute inset-y-4 left-1/2 w-px -translate-x-1/2 ${hasScene ? themeDividerClasses(settings.theme) : 'bg-ink-200 dark:bg-ink-700'}`} />
        <div className="grid grid-cols-2">
          {['A', 'B'].map((team) => {
            const data = gameState[team === 'A' ? 'teamA' : 'teamB'];
            const isServing = gameState.servingTeam === team;
            return (
              <div
                key={team}
                className={`py-5 flex flex-col items-center gap-1 transition-colors duration-300 ${
                  isServing ? (hasScene ? themeServingClasses(settings.theme) : 'bg-court-50 dark:bg-court-950/30') : ''
                } ${invalidFlash === team ? 'pb-shake' : ''}`}
              >
                <div
                  className={`${labelSize} font-display font-medium truncate max-w-[90%] flex items-center gap-1.5 ${
                    hasScene ? themeNameClasses(settings.theme) : 'text-ink-500 dark:text-ink-400'
                  }`}
                >
                  {isServing && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasScene ? 'bg-current' : 'bg-court-500'}`} />}
                  {data.name}
                </div>
                <ScoreNumeral value={data.score} theme={settings.theme} sizeClass={scoreSize} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Serve tracker */}
      {trackerActive && (
        <div className="relative w-full px-5 mt-3" style={{ height: '46px' }}>
          <div
            className="absolute top-0 w-1/2 flex justify-center transition-all duration-500 ease-out"
            style={{
              left: (config.mode === 'casual' ? gameState.manualServingTeam : gameState.servingTeam) === 'A' ? '20px' : '50%',
            }}
          >
            <div className="px-3 py-1.5 rounded-full bg-ink-950 dark:bg-ink-100 text-white dark:text-ink-950 text-xs font-display font-medium flex items-center gap-2 shadow-sm">
              {config.mode === 'casual' ? (
                <>
                  {config.type === 'doubles' && gameState.manualServingTeam === 'A' && (
                    <ServeNumber active={gameState.manualServerNumber} className="w-5 h-5 text-[11px]" />
                  )}
                  <span>Serving, {manualPosition === 'right' ? 'right' : 'left'}</span>
                  {config.type === 'doubles' && gameState.manualServingTeam === 'B' && (
                    <ServeNumber active={gameState.manualServerNumber} className="w-5 h-5 text-[11px]" />
                  )}
                </>
              ) : (
                <>
                  {isDoublesTraditional && gameState.servingTeam === 'A' && (
                    <ServeNumber active={gameState.serverNumber} className="w-5 h-5 text-[11px]" />
                  )}
                  <span>Serving, {position === 'right' ? 'right' : 'left'}</span>
                  {isDoublesTraditional && gameState.servingTeam === 'B' && (
                    <ServeNumber active={gameState.serverNumber} className="w-5 h-5 text-[11px]" />
                  )}
                </>
              )}
            </div>
          </div>
          {config.mode === 'casual' && (
            <button
              onClick={() => dispatch({ type: 'MANUAL_TOGGLE' })}
              className="absolute right-2 top-0 p-1.5 rounded-full bg-ink-100 dark:bg-ink-800"
              title="Advance manual serve tracker"
            >
              <RefreshCw size={13} />
            </button>
          )}
        </div>
      )}
      {config.mode === 'casual' && !trackerActive && <div className="h-2" />}

      {/* Score / Fault buttons. Traditional mode: only the serving team
          can ever act, so there's exactly one Point and one Fault
          button, targeting whoever is currently serving — a fault on
          the second serve now side-outs immediately (see rulesEngine's
          FAULT case), no separate confirmation tap. Rally/Casual: both
          teams can genuinely score independently, so they keep their
          own buttons. */}
      {config.mode === 'traditional' ? (
        <div className="px-5 mt-3">
          <button
            onClick={() => onPoint(gameState.servingTeam)}
            className="w-full py-3.5 rounded-xl bg-court-600 text-white font-display font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
          >
            <Plus size={16} />
            <span className="truncate">
              Point — {(gameState.servingTeam === 'A' ? gameState.teamA : gameState.teamB).name}
            </span>
          </button>
          <button
            onClick={onFault}
            className="w-full mt-2 py-2.5 rounded-xl bg-clay-50 dark:bg-clay-600/20 text-clay-600 dark:text-clay-100 text-sm font-display font-medium"
          >
            Fault
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5 mt-3">
          {['A', 'B'].map((team) => (
            <button
              key={team}
              onClick={() => onPoint(team)}
              className="py-3.5 rounded-xl bg-court-600 text-white font-display font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-1"
            >
              <Plus size={16} /> Point
            </button>
          ))}
        </div>
      )}

      {invalidFlash && (
        <div className="px-5 mt-3">
          <div className="flex items-center gap-2 text-xs text-clay-600 dark:text-clay-100 bg-clay-50 dark:bg-clay-600/20 rounded-lg px-3 py-2">
            <AlertTriangle size={14} /> Only the serving team can score in Traditional mode.
          </div>
        </div>
      )}

      {/* Announcement */}
      <div className="px-5 mt-4">
        <div className="bg-ink-100 dark:bg-ink-900 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className={`${labelSize} text-ink-500 dark:text-ink-400 font-display font-medium`}>Announce this</span>
            <div className="flex gap-1">
              <button
                onClick={() => setFormat('traditional')}
                className={`text-[11px] px-2 py-0.5 rounded-full ${format === 'traditional' ? 'bg-court-600 text-white' : 'text-ink-500 dark:text-ink-400'}`}
              >
                Traditional
              </button>
              <button
                onClick={() => setFormat('custom')}
                className={`text-[11px] px-2 py-0.5 rounded-full ${format === 'custom' ? 'bg-court-600 text-white' : 'text-ink-500 dark:text-ink-400'}`}
              >
                Custom
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xl font-display font-bold tabular-nums">{buildAnnouncement(gameState, format)}</span>
            <button onClick={speak} disabled={speaking} className="p-2 rounded-full bg-white dark:bg-ink-800 disabled:opacity-60">
              {speaking ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1" />

      {/* Undo / Reset */}
      <div className="px-5 pb-6 pt-4 grid grid-cols-2 gap-3">
        <button
          onClick={onUndo}
          disabled={gameState.past.length === 0}
          className="py-3 rounded-xl bg-ink-100 dark:bg-ink-800 text-sm font-display font-medium flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <RotateCcw size={15} /> Undo
        </button>
        <button
          onClick={onReset}
          className="py-3 rounded-xl bg-ink-100 dark:bg-ink-800 text-sm font-display font-medium flex items-center justify-center gap-2"
        >
          <RefreshCw size={15} /> Reset
        </button>
      </div>

      {gameState.gameOver && (
        <div className="absolute inset-0 bg-black/50 flex items-end sm:items-center justify-center p-5 z-20">
          <div className="bg-white dark:bg-ink-900 rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="text-xs font-display font-medium text-court-600 dark:text-court-400 mb-1">Game over</div>
            <div className="text-2xl font-display font-bold mb-1">
              {gameState.winner === 'A' ? gameState.teamA.name : gameState.teamB.name} wins
            </div>
            <div className="text-lg tabular-nums text-ink-500 dark:text-ink-400 mb-5">
              {gameState.teamA.score} – {gameState.teamB.score}
            </div>
            {showCloseDisplayPrompt && (
              <button
                onClick={closeDisplayWindow}
                className="w-full mb-3 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 text-sm font-display font-medium flex items-center justify-center gap-2 text-ink-600 dark:text-ink-300"
              >
                <Monitor size={15} /> Close the display window
              </button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onOpenHistory}
                className="py-2.5 rounded-xl bg-ink-100 dark:bg-ink-800 text-sm font-display font-medium"
              >
                View history
              </button>
              <button
                onClick={onNewGame}
                className="py-2.5 rounded-xl bg-court-600 text-white text-sm font-display font-medium"
              >
                New game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
