/**
 * APP SHELL
 * ---------------------------------------------------------------------
 * This is the one piece that makes "one codebase, adapts to where it's
 * running" true rather than aspirational. Below the `sm` breakpoint
 * (phones, and the Capacitor WebView, which is always phone-sized) it's
 * invisible — full-bleed, exactly as before. At `sm` and up (any desktop
 * browser) it centers a fixed-width card with its own rounded corners
 * and shadow, so the app reads as an intentional app on a big screen
 * instead of a phone layout stretched edge-to-edge.
 *
 * Every screen keeps using `h-full`, not `min-h-screen` — the shell
 * owns viewport sizing now, screens just fill whatever it gives them.
 * Modals (Settings, the game-over sheet) use `absolute inset-0` rather
 * than `fixed inset-0` for the same reason: scoped to the shell, which
 * is the full screen on mobile and the card on desktop, automatically.
 */
export function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-900 sm:flex sm:items-center sm:justify-center sm:p-6">
      <div
        className="relative w-full h-screen overflow-hidden bg-ink-50 dark:bg-ink-950
                   text-ink-950 dark:text-ink-50
                   sm:h-[min(860px,calc(100vh-3rem))] sm:max-w-[430px] sm:rounded-[2rem]
                   sm:shadow-2xl sm:ring-1 sm:ring-black/5 dark:sm:ring-white/10"
      >
        <div className="h-full">{children}</div>
      </div>
    </div>
  );
}
