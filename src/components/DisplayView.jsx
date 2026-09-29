import { ScoreNumeral, ServeNumber } from './ui';
import { sideFor, buildAnnouncement } from '../engine/rulesEngine';

/**
 * Pure presentation — no buttons, no state mutation. Used two ways:
 * 1. In-place "Presentation Mode" on the same device (ScoreboardScreen
 *    swaps to this + the Fullscreen API when you just want a clean big
 *    score on the device in front of you).
 * 2. In the pop-out display window (display.html), fed live by
 *    BroadcastChannel messages from the controlling window — the actual
 *    "TV shows only the score, my phone/laptop keeps the controls" case.
 */
export function DisplayView({ gameState, settings, connected = true }) {
  if (!gameState) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-ink-950 text-ink-500 font-display text-xl">
        Waiting for the scoreboard…
      </div>
    );
  }

  const { teamA, teamB, servingTeam, serverNumber, gameOver, winner, config } = gameState;
  const isDark = settings?.colorMode === 'dark' || settings?.colorMode === undefined
    ? true
    : settings.colorMode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : settings.colorMode === 'dark';
  const theme = settings?.theme || 'minimalist';
  const isDoublesTraditional = config?.type === 'doubles' && config?.mode === 'traditional';
  const servingScore = (servingTeam === 'A' ? teamA : teamB).score;
  const position = config?.type === 'singles' ? sideFor(servingScore) : gameState.position;
  const announcement = config ? buildAnnouncement(gameState, settings?.announcementFormat || 'traditional') : null;

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen w-full bg-ink-100 dark:bg-ink-950 flex flex-col items-center justify-center gap-[2.5vh] px-[4vw] relative">
        {!connected && (
          <div className="absolute top-6 right-6 text-xs font-display font-medium text-clay-600 bg-clay-50 px-3 py-1.5 rounded-full">
            Reconnecting…
          </div>
        )}
        <div className="w-full max-w-[1400px] rounded-[1.5vw] bg-white dark:bg-ink-900 relative overflow-hidden">
          <div className="absolute inset-y-[3vh] left-1/2 w-px bg-ink-200 dark:bg-ink-700 -translate-x-1/2" />
          <div className="grid grid-cols-2">
            {['A', 'B'].map((team) => {
              const data = team === 'A' ? teamA : teamB;
              const isServing = servingTeam === team;
              return (
                <div
                  key={team}
                  className={`py-[4vh] flex flex-col items-center gap-[1vh] transition-colors ${
                    isServing ? 'bg-court-50 dark:bg-court-950/30' : ''
                  }`}
                >
                  <div
                    className="font-display font-semibold text-ink-500 dark:text-ink-400 truncate max-w-[90%] flex items-center gap-[0.6vw]"
                    style={{ fontSize: '2.2vw' }}
                  >
                    {isServing && <span className="inline-block rounded-full bg-court-500 shrink-0" style={{ width: '0.8vw', height: '0.8vw' }} />}
                    {data.name}
                  </div>
                  <div style={{ fontSize: 'min(20vw, 26vh)', lineHeight: 1 }}>
                    <ScoreNumeral value={data.score} theme={theme} sizeClass="" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!gameOver && config && (
          <div
            className="flex items-center gap-[0.8vw] px-6 py-3 rounded-full bg-ink-950 dark:bg-ink-100 text-white dark:text-ink-950 font-display font-medium"
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
            anyone can read the call straight off the display too. */}
        {!gameOver && announcement && (
          <div
            className="font-display font-bold tabular-nums text-ink-400 dark:text-ink-500"
            style={{ fontSize: '1.3vw', letterSpacing: '0.02em' }}
          >
            {announcement}
          </div>
        )}

        {gameOver && (
          <div className="font-display font-bold text-court-600 dark:text-court-400" style={{ fontSize: '3vw' }}>
            {(winner === 'A' ? teamA.name : teamB.name)} wins!
          </div>
        )}
      </div>
    </div>
  );
}
