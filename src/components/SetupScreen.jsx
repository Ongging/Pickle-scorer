import { Settings, History as HistoryIcon } from 'lucide-react';
import { SegButton, ToggleRow } from './ui';

export function SetupScreen({ setupConfig, setSetupConfig, onStart, onOpenSettings, onOpenHistory }) {
  const update = (patch) => setSetupConfig((prev) => ({ ...prev, ...patch }));

  return (
    <div className="h-full bg-ink-50 dark:bg-ink-950 text-ink-950 dark:text-ink-50 flex flex-col">
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <div>
          <h1 className="text-xl font-display font-bold">Pickleball Scorer</h1>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">Set up a new game</p>
        </div>
        <div className="flex gap-1">
          <button onClick={onOpenHistory} className="p-2 rounded-full bg-ink-100 dark:bg-ink-800">
            <HistoryIcon size={18} />
          </button>
          <button onClick={onOpenSettings} className="p-2 rounded-full bg-ink-100 dark:bg-ink-800">
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 px-5 py-4 space-y-6 overflow-y-auto">
        <section>
          <div className="text-xs font-display font-medium text-ink-500 dark:text-ink-400 mb-2">Game type</div>
          <div className="grid grid-cols-2 gap-2">
            <SegButton active={setupConfig.type === 'singles'} onClick={() => update({ type: 'singles' })}>
              Singles
            </SegButton>
            <SegButton active={setupConfig.type === 'doubles'} onClick={() => update({ type: 'doubles' })}>
              Doubles
            </SegButton>
          </div>
        </section>

        <section>
          <div className="text-xs font-display font-medium text-ink-500 dark:text-ink-400 mb-2">Scoring mode</div>
          <div className="grid grid-cols-2 gap-2">
            <SegButton active={setupConfig.mode === 'traditional'} onClick={() => update({ mode: 'traditional' })}>
              Traditional
            </SegButton>
            <SegButton active={setupConfig.mode !== 'traditional'} onClick={() => update({ mode: 'rally' })}>
              Simple
            </SegButton>
          </div>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-2">
            {setupConfig.mode === 'traditional'
              ? 'Only the serving team can score. Standard rules.'
              : 'Either team can score when they win a rally.'}
          </p>

          {setupConfig.mode !== 'traditional' && (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <SegButton active={setupConfig.mode === 'rally'} onClick={() => update({ mode: 'rally' })}>
                  Official Rally
                </SegButton>
                <SegButton active={setupConfig.mode === 'casual'} onClick={() => update({ mode: 'casual' })}>
                  Casual
                </SegButton>
              </div>
              {setupConfig.mode === 'rally' && (
                <div className="bg-ink-100 dark:bg-ink-900 rounded-lg p-3">
                  <ToggleRow
                    label="Game point requires serving"
                    description="Official rule: the winning point can only be scored while serving"
                    checked={setupConfig.gamePointMustServe}
                    onChange={(v) => update({ gamePointMustServe: v })}
                  />
                </div>
              )}
            </div>
          )}
        </section>

        <section>
          <div className="text-xs font-display font-medium text-ink-500 dark:text-ink-400 mb-2">Winning score</div>
          <div className="flex items-center gap-2">
            {[11, 15, 21].map((n) => (
              <SegButton key={n} active={setupConfig.winningScore === n} onClick={() => update({ winningScore: n })}>
                {n}
              </SegButton>
            ))}
            <input
              type="number"
              min={1}
              max={99}
              value={setupConfig.winningScore}
              onChange={(e) => {
                const v = Math.min(99, Math.max(1, parseInt(e.target.value, 10) || 1));
                update({ winningScore: v });
              }}
              className="w-16 px-2 py-2 rounded-lg bg-ink-100 dark:bg-ink-800 text-sm text-center"
            />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-display font-medium text-ink-500 dark:text-ink-400">Teams</div>
            <div className="text-[11px] text-ink-400 dark:text-ink-500">Tap a team to have it serve first</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['A', 'B'].map((team) => {
              const nameKey = team === 'A' ? 'teamAName' : 'teamBName';
              const selected = setupConfig.firstServer === team;
              return (
                <div
                  key={team}
                  onClick={() => update({ firstServer: team })}
                  className={`rounded-lg p-3 border-2 cursor-pointer transition-colors ${
                    selected
                      ? 'border-court-500 bg-court-50 dark:bg-court-950/30'
                      : 'border-transparent bg-ink-100 dark:bg-ink-800'
                  }`}
                >
                  <input
                    value={setupConfig[nameKey]}
                    onChange={(e) => update({ [nameKey]: e.target.value })}
                    placeholder={team === 'A' ? 'Team A' : 'Team B'}
                    className="w-full bg-transparent text-sm font-medium outline-none min-w-0"
                  />
                  <div className={`text-[10px] font-medium mt-1 ${selected ? 'text-court-600 dark:text-court-400' : 'text-transparent'}`}>
                    Serves first
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="px-5 pb-6 pt-2">
        <button
          onClick={onStart}
          className="w-full py-3.5 rounded-xl bg-court-600 text-white font-display font-semibold text-base active:scale-[0.98] transition-transform"
        >
          Start game
        </button>
      </div>
    </div>
  );
}
