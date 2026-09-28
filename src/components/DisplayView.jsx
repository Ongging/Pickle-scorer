import { ScoreNumeral, ServeDots } from './ui';
import { sideFor } from '../engine/rulesEngine';

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
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-500 font-display text-xl">
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

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen w-full bg-zinc-100 dark:bg-zinc-950 flex flex-col items-center justify-center gap-[3vh] px-[4vw] relative">
        {!connected && (
          <div className="absolute top-6 right-6 text-xs font-medium text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full">
            Reconnecting…
          </div>
        )}
        <div className="grid grid-cols-2 gap-[4vw] w-full max-w-[1400px]">
          {['A', 'B'].map((team) => {
            const data = team === 'A' ? teamA : teamB;
            const isServing = servingTeam === team;
            return (
              <div
                key={team}
                className={`rounded-[2vw] py-[4vh] flex flex-col items-center gap-[1vh] border-4 transition-colors ${
                  isServing
                    ? 'border-emerald-500/70 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-transparent bg-white dark:bg-zinc-900'
                }`}
              >
                <div className="font-sans font-semibold text-zinc-500 dark:text-zinc-400 truncate max-w-[90%]" style={{ fontSize: '2.2vw' }}>
                  {data.name}
                  {isServing && <span className="ml-3 inline-block w-3 h-3 rounded-full bg-emerald-500 align-middle" />}
                </div>
                <div style={{ fontSize: 'min(20vw, 26vh)', lineHeight: 1 }}>
                  <ScoreNumeral value={data.score} theme={theme} sizeClass="" />
                </div>
              </div>
            );
          })}
        </div>

        {!gameOver && config && (
          <div
            className="flex items-center gap-3 px-6 py-3 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium"
            style={{ fontSize: '1.6vw' }}
          >
            {isDoublesTraditional && servingTeam === 'A' && <ServeDots active={serverNumber} />}
            <span>Serving · {position === 'right' ? 'Right' : 'Left'}</span>
            {isDoublesTraditional && servingTeam === 'B' && <ServeDots active={serverNumber} />}
          </div>
        )}

        {gameOver && (
          <div className="font-display font-bold text-emerald-600 dark:text-emerald-400" style={{ fontSize: '3vw' }}>
            {(winner === 'A' ? teamA.name : teamB.name)} wins!
          </div>
        )}
      </div>
    </div>
  );
}
