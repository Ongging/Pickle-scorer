import { useState, useEffect } from 'react';
import {
  ArrowLeft, History as HistoryIcon, Settings, Plus, ChevronRight,
  AlertTriangle, Volume2, RotateCcw, RefreshCw, Monitor,
} from 'lucide-react';
import { sideFor, buildAnnouncement } from '../engine/rulesEngine';
import { speechFriendly, unlockAudioSession } from '../lib/speech';
import { speakTinyTts, TINY_TTS_VOICE_ID } from '../lib/tinyTts';
import { ScoreNumeral, ServeDots } from './ui';

const SCORE_SIZE = { sm: 'text-6xl', md: 'text-7xl', lg: 'text-8xl' };
const LABEL_SIZE = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

export function ScoreboardScreen({
  gameState, dispatch, settings, casualTrackerVisible,
  invalidFlash, onPoint, onFault, onSideOut, onUndo, onReset, onNewGame,
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

  const speak = async () => {
    unlockAudioSession();
    const text = speechFriendly(buildAnnouncement(gameState, format));

    if (settings.voiceURI === TINY_TTS_VOICE_ID) {
      try {
        await speakTinyTts(text);
        return;
      } catch (err) {
        console.error('On-device voice failed, falling back to browser speech:', err);
        // fall through to Web Speech below
      }
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

  const openDisplayWindow = () => {
    window.open(
      '/display.html',
      'pickleball-display',
      'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no',
    );
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
      else if (e.key === bindings.sideOut && gameState.awaitingSideOut) onSideOut();
      else if (e.key === bindings.undo) onUndo();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settings.keyBindings, showFaultButtons, gameState.awaitingSideOut, onPoint, onFault, onSideOut, onUndo]);

  return (
    <div className="h-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col">
      <div className="flex items-center justify-between px-5 pt-6 pb-1">
        <button onClick={onNewGame} className="p-2 -ml-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <ArrowLeft size={18} />
        </button>
        <div className={`${labelSize} font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide`}>
          {config.type === 'singles' ? 'Singles' : 'Doubles'} ·{' '}
          {config.mode === 'traditional' ? 'Traditional' : config.mode === 'rally' ? 'Rally Scoring' : 'Casual'}
        </div>
        <div className="flex gap-1">
          <button onClick={openDisplayWindow} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800" title="Open display window">
            <Monitor size={18} />
          </button>
          <button onClick={onOpenHistory} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <HistoryIcon size={18} />
          </button>
          <button onClick={onOpenSettings} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-3 px-5 pt-4">
        {['A', 'B'].map((team) => {
          const data = gameState[team === 'A' ? 'teamA' : 'teamB'];
          const isServing = gameState.servingTeam === team;
          return (
            <div
              key={team}
              className={`rounded-2xl py-5 flex flex-col items-center gap-1 border-2 transition-all duration-300 ${
                isServing
                  ? 'border-emerald-500/70 bg-emerald-50 dark:bg-emerald-950/30 shadow-[0_0_0_4px_rgba(16,185,129,0.08)]'
                  : 'border-transparent bg-white dark:bg-zinc-900 shadow-sm'
              } ${invalidFlash === team ? 'pb-shake' : ''}`}
            >
              <div className={`${labelSize} font-medium text-zinc-500 dark:text-zinc-400 truncate max-w-[90%]`}>
                {data.name}
              </div>
              <ScoreNumeral value={data.score} theme={settings.theme} sizeClass={scoreSize} />
            </div>
          );
        })}
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
            <div className="px-3 py-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium flex items-center gap-1.5 shadow-sm">
              {config.mode === 'casual' ? (
                <>
                  {config.type === 'doubles' && gameState.manualServingTeam === 'A' && (
                    <ServeDots active={gameState.manualServerNumber} />
                  )}
                  <span>Serving · {manualPosition === 'right' ? 'Right' : 'Left'}</span>
                  {config.type === 'doubles' && gameState.manualServingTeam === 'B' && (
                    <ServeDots active={gameState.manualServerNumber} />
                  )}
                </>
              ) : (
                <>
                  {isDoublesTraditional && gameState.servingTeam === 'A' && (
                    <ServeDots active={gameState.serverNumber} />
                  )}
                  <span>Serving · {position === 'right' ? 'Right' : 'Left'}</span>
                  {isDoublesTraditional && gameState.servingTeam === 'B' && (
                    <ServeDots active={gameState.serverNumber} />
                  )}
                </>
              )}
            </div>
          </div>
          {config.mode === 'casual' && (
            <button
              onClick={() => dispatch({ type: 'MANUAL_TOGGLE' })}
              className="absolute right-2 top-0 p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800"
              title="Advance manual serve tracker"
            >
              <RefreshCw size={13} />
            </button>
          )}
        </div>
      )}
      {config.mode === 'casual' && !trackerActive && <div className="h-2" />}

      {/* Score / Fault buttons */}
      <div className="grid grid-cols-2 gap-3 px-5 mt-3">
        {['A', 'B'].map((team) => {
          const isServing = gameState.servingTeam === team;
          // Once the Side Out button is showing, both serves for this team
          // are exhausted — nothing can score until it's confirmed.
          const pointActive = !gameState.awaitingSideOut;
          const faultActive = showFaultButtons && isServing && !gameState.awaitingSideOut;
          return (
            <div key={team} className="flex flex-col gap-2">
              <button
                onClick={() => onPoint(team)}
                disabled={!pointActive}
                className={`py-3.5 rounded-xl font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-1 ${
                  pointActive
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                }`}
              >
                <Plus size={16} /> Point
              </button>
              {showFaultButtons && (
                <button
                  onClick={() => faultActive && onFault()}
                  disabled={!faultActive}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    faultActive
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                  }`}
                >
                  Fault
                </button>
              )}
            </div>
          );
        })}
      </div>

      {gameState.awaitingSideOut && (
        <div className="px-5 mt-3">
          <button
            onClick={onSideOut}
            className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold flex items-center justify-center gap-2"
          >
            Side Out <ChevronRight size={16} />
          </button>
        </div>
      )}

      {invalidFlash && (
        <div className="px-5 mt-3">
          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">
            <AlertTriangle size={14} /> Only the serving team can score in Traditional mode.
          </div>
        </div>
      )}

      {/* Announcement */}
      <div className="px-5 mt-4">
        <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className={`${labelSize} text-zinc-500 dark:text-zinc-400 font-medium`}>Announce this</span>
            <div className="flex gap-1">
              <button
                onClick={() => setFormat('traditional')}
                className={`text-[11px] px-2 py-0.5 rounded-full ${format === 'traditional' ? 'bg-emerald-600 text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
              >
                Traditional
              </button>
              <button
                onClick={() => setFormat('custom')}
                className={`text-[11px] px-2 py-0.5 rounded-full ${format === 'custom' ? 'bg-emerald-600 text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
              >
                Custom
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold tabular-nums">{buildAnnouncement(gameState, format)}</span>
            <button onClick={speak} className="p-2 rounded-full bg-white dark:bg-zinc-800">
              <Volume2 size={16} />
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
          className="py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <RotateCcw size={15} /> Undo
        </button>
        <button
          onClick={onReset}
          className="py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm font-medium flex items-center justify-center gap-2"
        >
          <RefreshCw size={15} /> Reset
        </button>
      </div>

      {gameState.gameOver && (
        <div className="absolute inset-0 bg-black/50 flex items-end sm:items-center justify-center p-5 z-20">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">Game over</div>
            <div className="text-2xl font-bold mb-1">
              {gameState.winner === 'A' ? gameState.teamA.name : gameState.teamB.name} wins
            </div>
            <div className="text-lg tabular-nums text-zinc-500 dark:text-zinc-400 mb-5">
              {gameState.teamA.score} – {gameState.teamB.score}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onOpenHistory}
                className="py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm font-medium"
              >
                View history
              </button>
              <button
                onClick={onNewGame}
                className="py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium"
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
