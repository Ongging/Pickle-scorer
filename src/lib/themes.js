/**
 * THEME REGISTRY
 * ---------------------------------------------------------------------
 * Single source of truth for every score-numeral theme, shared by
 * ScoreboardScreen, DisplayView, and SettingsPanel's picker — so the
 * scoreboard and the external display can never drift apart on what a
 * given theme looks like, and so adding a theme later is a one-file
 * change plus one new case in ScoreNumeral (src/components/ui.jsx).
 *
 * Minimalist / Digital clock / Flip card only ever changed the numeral
 * itself and left the panel on the app's normal light/dark background.
 * The four below are a bigger swing — an actual scene (background,
 * divider, serving highlight), not just a different number font — so
 * their panelClasses REPLACE the panel's default background rather
 * than sitting next to it.
 *
 * All four are intentionally fixed-palette regardless of the app's own
 * light/dark setting (a jumbotron doesn't have a "light mode") — they
 * read as a self-contained scoreboard scene, the same way a video
 * player keeps its own dark chrome regardless of the page around it.
 * That's a deliberate scope cut: giving each of these a second,
 * light-mode-aware palette would roughly double this file for a case
 * none of the four conceptually call for.
 */
export const THEMES = {
  minimalist: { label: 'Minimalist' },
  digital: { label: 'Digital clock' },
  flip: { label: 'Flip card' },
  stadium: {
    label: 'Stadium',
    panelClasses: 'bg-black border-[6px] border-amber-600/80',
    nameClasses: 'text-amber-200/80',
    dividerClasses: 'bg-amber-600/40',
    servingClasses: 'bg-amber-500/10',
  },
  chalkboard: {
    label: 'Chalkboard',
    panelClasses: 'bg-[#1e3a2f]',
    nameClasses: 'text-white/70',
    dividerClasses: 'bg-white/15',
    servingClasses: 'bg-white/5',
  },
  neon: {
    label: 'Neon Night',
    panelClasses: 'bg-gradient-to-br from-[#0a0118] to-[#1a0a2e]',
    nameClasses: 'text-cyan-100/70',
    dividerClasses: 'bg-cyan-400/20',
    servingClasses: 'bg-cyan-400/10',
  },
  sunset: {
    label: 'Sunset Court',
    panelClasses: 'bg-gradient-to-br from-orange-300 via-pink-300 to-purple-400',
    nameClasses: 'text-white/90',
    dividerClasses: 'bg-white/30',
    servingClasses: 'bg-white/15',
  },
};

export const THEME_OPTIONS = Object.entries(THEMES).map(([value, t]) => ({ value, label: t.label }));

// Whether this theme replaces the panel's background (the four above)
// vs. just changing the numeral font on the app's normal background
// (the original three).
export function hasScenePanel(theme) {
  return Boolean(THEMES[theme]?.panelClasses);
}

export function themePanelClasses(theme) {
  return THEMES[theme]?.panelClasses || '';
}
export function themeNameClasses(theme) {
  return THEMES[theme]?.nameClasses || '';
}
export function themeDividerClasses(theme) {
  return THEMES[theme]?.dividerClasses || '';
}
export function themeServingClasses(theme) {
  return THEMES[theme]?.servingClasses || '';
}
