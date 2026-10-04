import { ScoreNumeral, ServeNumber } from './ui';
import { sideFor, buildAnnouncement } from '../engine/rulesEngine';
import { hasScenePanel, themePanelClasses, themeNameClasses, themeDividerClasses, themeServingClasses, themeVars } from '../lib/themes';

const ANNOUNCE_SIZE_VW = { sm: '1.8vw', md: '2.4vw', lg: '3.2vw' };

/**
 * Pure presentation — no buttons, no state mutation. Used two ways:
 * 1. In-place "Presentation Mode" on the same device (ScoreboardScreen
 *    swaps to this + the Fullscreen API when you just want a clean big
 *    score on the device in front of you).
 * 2. In the pop-out display window (display.html), fed live by
 *    BroadcastChannel messages from the controlling window — the actual
 *    "TV shows only the score, my phone/laptop keeps the controls" case.
 */
export function DisplayView({ gameState, settings, connected = true, onExit }) {
  const theme = settings?.theme || 'minimalist';
  const hasScene = hasScenePanel(theme);
  const themed = (sceneClasses, defaultClasses) => (hasScene ? sceneClasses : defaultClasses);
  const isDark = settings?.colorMode === 'dark' || settings?.colorMode === undefined
    ? true
    : settings.colorMode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : settings.colorMode === 'dark';

  if (!gameState) {
    return (
      <div
        style={themeVars(theme, isDark)}
        className={`min-h-screen w-full flex items-center justify-center font-display text-xl ${
          themed('bg-[var(--t-bg)] text-[var(--t-text-muted)]', 'bg-ink-950 text-ink-500')
        }`}
      >
        Connecting to the scoreboard…
      </div>
    );
  }

  const { teamA, teamB, servingTeam, serverNumber, gameOver, winner, config } = gameState;
  const isDoublesTraditional = config?.type === 'doubles' && config?.mode === 'traditional';
  const servingScore = (servingTeam === 'A' ? teamA : teamB).score;
  const position = config?.type === 'singles' ? sideFor(servingScore) : gameState.position;
  const announcement = config ? buildAnnouncement(gameState, settings?.announcementFormat || 'traditional') : null;
  const announceSize = ANNOUNCE_SIZE_VW[settings?.displayAnnounceSize] || ANNOUNCE_SIZE_VW.md;

  return (
    <div className={isDark ? 'dark' : ''} style={themeVars(theme, isDark)}>
      <div
        className={`min-h-screen w-full flex flex-col items-center justify-center gap-[2.5vh] px-[4vw] relative ${
          themed('bg-[var(--t-bg)]', 'bg-ink-100 dark:bg-ink-950')
        }`}
      >
        {!connected && (
          <div className="absolute top-6 right-6 text-xs font-display font-medium text-clay-600 bg-clay-50 px-3 py-1.5 rounded-full">
            Reconnecting…
          </div>
        )}
        {/* Only set when this is the in-app "Presentation mode" view
            (ScoreboardScreen swapping itself out, not the pop-out
            display.html window, which has no onExit and stays clean —
            there's nothing to exit back to there). Low-key on purpose:
            this is for the phone screen you're mirroring, not something
            spectators looking at the mirrored output need to notice. */}
        {onExit && (
          <button
            onClick={onExit}
            className="absolute top-6 left-6 w-9 h-9 rounded-full bg-black/20 text-white/70 flex items-center justify-center text-lg active:bg-black/30"
            aria-label="Exit presentation mode"
          >
            ×
          </button>
        )}
        <div className={`w-full max-w-[1400px] rounded-[1.5vw] relative overflow-hidden ${hasScene ? themePanelClasses(theme, isDark) : 'bg-white dark:bg-ink-900'}`}>
          <div className={`absolute inset-y-[3vh] left-1/2 w-px -translate-x-1/2 ${hasScene ? themeDividerClasses(theme, isDark) : 'bg-ink-200 dark:bg-ink-700'}`} />
          <div className="grid grid-cols-2">
            {['A', 'B'].map((team) => {
              const data = team === 'A' ? teamA : teamB;
              const isServing = servingTeam === team;
              return (
                <div
                  key={team}
                  className={`py-[4vh] flex flex-col items-center gap-[1vh] transition-colors ${
                    isServing ? (hasScene ? themeServingClasses(theme, isDark) : 'bg-court-50 dark:bg-court-950/30') : ''
                  }`}
                >
                  <div
                    className={`font-display font-semibold truncate max-w-[90%] flex items-center gap-[0.6vw] ${
                      hasScene ? themeNameClasses(theme, isDark) : 'text-ink-500 dark:text-ink-400'
                    }`}
                    style={{ fontSize: '2.2vw' }}
                  >
                    {isServing && (
                      <span
                        className={`inline-block rounded-full shrink-0 ${hasScene ? 'bg-current' : 'bg-court-500'}`}
                        style={{ width: '0.8vw', height: '0.8vw' }}
                      />
                    )}
                    {data.name}
                  </div>
                  <div style={{ fontSize: 'min(20vw, 26vh)', lineHeight: 1 }}>
                    <ScoreNumeral value={data.score} theme={theme} sizeClass="" isDark={isDark} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!gameOver && config && (
          <div
            className={`flex items-center gap-[0.8vw] px-6 py-3 rounded-full font-display font-medium ${
              themed('bg-[var(--t-accent)] text-[var(--t-accent-text)]', 'bg-ink-950 dark:bg-ink-100 text-white dark:text-ink-950')
            }`}
            style={{ fontSize: '1.6vw' }}
          >
            {isDoublesTraditional && servingTeam === 'A' && (
              <ServeNumber active={serverNumber} style={{ width: '1.9vw', height: '1.9vw', fontSize: '1.1vw' }} />
            )}
            <span>Serving, {position === 'right' ? 'right' : 'left'}</span>
            {isDoublesTraditional && servingTeam === 'B' && (
              <ServeNumber active={serverNumber} style={{ width: '1.9vw', height: '1.9vw', fontSize: '1.1vw' }} />
            )}
          </div>
        )}

        {/* What to call out loud — same panel a scorekeeper sees, so
            anyone can read the call straight off the display too. Given
            its own high-contrast pill (matching the serve capsule above
            it) rather than bare muted text, which was too faint to
            actually read from across a court. */}
        {!gameOver && announcement && (
          <div
            className={`px-6 py-2.5 rounded-full font-display font-bold tabular-nums ${
              themed('bg-[var(--t-surface)] text-[var(--t-text)]', 'bg-white dark:bg-ink-900 text-ink-950 dark:text-white')
            }`}
            style={{ fontSize: announceSize, letterSpacing: '0.01em' }}
          >
            {announcement}
          </div>
        )}

        {gameOver && (
          <div
            className={`px-10 py-4 rounded-full font-display font-bold ${
              themed('bg-[var(--t-accent)] text-[var(--t-accent-text)]', 'bg-court-600 text-white')
            }`}
            style={{ fontSize: '3vw' }}
          >
            {(winner === 'A' ? teamA.name : teamB.name)} wins!
          </div>
        )}
      </div>
    </div>
  );
}
