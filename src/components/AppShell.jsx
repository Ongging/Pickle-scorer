import { Plus, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';
import { hasScenePanel, themeVars } from '../lib/themes';

/**
 * APP SHELL
 * ---------------------------------------------------------------------
 * Three tiers, not two:
 * - Below `sm` (phones, and the Capacitor WebView, which is always
 *   phone-sized): invisible — full-bleed, exactly as always. The
 *   native app only ever renders at this width, so none of the
 *   desktop work below touches it.
 * - `sm` to `lg` (a browser window around tablet width or narrower):
 *   centers a fixed-width card, same as before — "an app, scaled
 *   down" reads fine at this size.
 * - `lg` and up (an actual desktop browser window): a real sidebar +
 *   stage layout, so the app reads as something built for a desktop
 *   screen rather than a phone layout centered on empty gray space.
 *
 * `children` is rendered exactly once — the sidebar is a sibling, not
 * a second copy of the content, which matters because the content is
 * a live component (BroadcastChannel listeners, keyboard shortcuts,
 * timers); rendering it twice would double all of that up.
 *
 * Every screen keeps using `h-full`, not `min-h-screen` — the shell
 * owns viewport sizing now, screens just fill whatever it gives them.
 * Modals (Settings, the game-over sheet) use `absolute inset-0` rather
 * than `fixed inset-0` for the same reason: scoped to the shell, which
 * is the full screen on mobile, the card on tablet, and the main panel
 * on desktop, automatically.
 *
 * Theme scope: Stadium/Chalkboard/Neon Night/Sunset Court set CSS
 * custom properties (see themeVars in lib/themes.js) on THIS root —
 * every descendant, in every screen, can reference e.g.
 * `bg-[var(--t-surface)]` and get that theme's color without the theme
 * needing to be threaded down as a prop everywhere. Minimalist/Digital
 * clock/Flip card leave the vars unset, so the normal ink/court classes
 * (which every element keeps as its non-themed fallback) apply as
 * before.
 */
export function AppShell({
  children, screen, gameState, theme, showSettings, onNewGame, onOpenHistory, onOpenSettings,
}) {
  const hasScene = hasScenePanel(theme);
  return (
    <div
      style={themeVars(theme)}
      className={`min-h-screen sm:flex sm:items-center sm:justify-center sm:p-6 lg:items-stretch lg:justify-start lg:p-0 ${
        hasScene ? 'bg-[var(--t-bg)]' : 'bg-ink-100 dark:bg-ink-900'
      }`}
    >
      <DesktopSidebar
        screen={screen}
        gameState={gameState}
        hasScene={hasScene}
        showSettings={showSettings}
        onNewGame={onNewGame}
        onOpenHistory={onOpenHistory}
        onOpenSettings={onOpenSettings}
      />

      <div className="lg:flex-1 lg:flex lg:items-center lg:justify-center lg:p-10 lg:overflow-y-auto">
        <div
          className={`relative w-full h-screen overflow-hidden
                     sm:h-[min(860px,calc(100vh-3rem))] sm:max-w-[430px] sm:rounded-[2rem]
                     sm:shadow-2xl sm:ring-1 sm:ring-black/5 dark:sm:ring-white/10
                     lg:h-[min(860px,calc(100vh-5rem))] lg:max-w-[640px] lg:rounded-[1.5rem]
                     lg:shadow-xl ${
                       hasScene ? 'bg-[var(--t-surface)] text-[var(--t-text)]' : 'bg-ink-50 dark:bg-ink-950 text-ink-950 dark:text-ink-50'
                     }`}
        >
          <div className="h-full">{children}</div>
        </div>
      </div>
    </div>
  );
}

function DesktopSidebar({ screen, gameState, hasScene, showSettings, onNewGame, onOpenHistory, onOpenSettings }) {
  const itemClass = (active) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display font-medium transition-colors ${
      active
        ? (hasScene ? 'bg-[var(--t-accent)] text-[var(--t-accent-text)]' : 'bg-court-600 text-white')
        : (hasScene
            ? 'text-[var(--t-text-muted)] hover:bg-[var(--t-surface-alt)]'
            : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800')
    }`;

  return (
    <div
      className={`hidden lg:flex lg:flex-col w-64 shrink-0 border-r ${
        hasScene
          ? 'bg-[var(--t-surface)] text-[var(--t-text)] border-[var(--t-border)]'
          : 'bg-white dark:bg-ink-900 border-ink-100 dark:border-ink-800'
      }`}
    >
      <div className="px-5 pt-7 pb-5 flex items-center gap-2.5">
        <svg viewBox="0 0 48 48" className="w-7 h-7 shrink-0" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#0F6E68" />
          <circle cx="16" cy="14" r="2.4" fill="#D6DE22" />
          <circle cx="28" cy="10" r="2.4" fill="#D6DE22" />
          <circle cx="38" cy="18" r="2.4" fill="#D6DE22" />
          <circle cx="10" cy="26" r="2.4" fill="#D6DE22" />
          <circle cx="22" cy="30" r="2.4" fill="#D6DE22" />
          <circle cx="35" cy="33" r="2.4" fill="#D6DE22" />
          <circle cx="14" cy="40" r="2.4" fill="#D6DE22" />
          <circle cx="30" cy="42" r="2.4" fill="#D6DE22" />
        </svg>
        <span className="font-display font-bold">Pickleball Scorer</span>
      </div>

      <nav className="px-3 space-y-1">
        <button onClick={onNewGame} className={itemClass(screen === 'setup')}>
          <Plus size={17} /> New game
        </button>
        <button onClick={onOpenHistory} className={itemClass(screen === 'history')}>
          <HistoryIcon size={17} /> History
        </button>
        <button onClick={onOpenSettings} className={itemClass(showSettings)}>
          <SettingsIcon size={17} /> Settings
        </button>
      </nav>

      {screen === 'play' && gameState && (
        <div
          className={`mt-auto mx-3 mb-5 px-4 py-3.5 rounded-xl ${
            hasScene ? 'bg-[var(--t-surface-alt)]' : 'bg-ink-50 dark:bg-ink-800/60'
          }`}
        >
          <div className={`text-[11px] mb-2 ${hasScene ? 'text-[var(--t-text-muted)]' : 'text-ink-400 dark:text-ink-500'}`}>
            Now playing
          </div>
          {['A', 'B'].map((team) => {
            const data = gameState[team === 'A' ? 'teamA' : 'teamB'];
            const isServing = gameState.servingTeam === team;
            return (
              <div key={team} className="flex items-center justify-between py-0.5">
                <span
                  className={`text-sm font-display font-medium truncate flex items-center gap-1.5 min-w-0 ${
                    hasScene ? 'text-[var(--t-text)]' : 'text-ink-950 dark:text-ink-50'
                  }`}
                >
                  {isServing && (
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasScene ? 'bg-[var(--t-accent)]' : 'bg-court-500'}`} />
                  )}
                  <span className="truncate">{data.name}</span>
                </span>
                <span
                  className={`text-sm font-display font-bold tabular-nums shrink-0 ml-2 ${
                    hasScene ? 'text-[var(--t-text)]' : 'text-ink-950 dark:text-ink-50'
                  }`}
                >
                  {data.score}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
