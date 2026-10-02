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
// Role colors for the rest of the UI (everything outside the score
// panel itself — the app background, the sidebar, buttons, other
// screens). Five roles is intentionally the whole set:
//   bg         — page/app background, behind every panel
//   surface    — a card/panel/modal's own background
//   surfaceAlt — a secondary surface inside a surface (sidebar nav
//                hover, the announce panel inside the scoreboard)
//   text       — primary text on a surface
//   textMuted  — secondary/label text on a surface
//   accent     — primary button background (Point, New game, etc.)
//   accentText — text color ON an accent-colored button
//   border     — dividers, outlines
// Sunset Court is the one light-background theme of the four (the
// other three are all inherently dark concepts — a jumbotron, a night
// sky, a blackboard); its text/accent roles are flipped accordingly.
// Consumed via themeVars() below as CSS custom properties, so any
// component can reference e.g. `bg-[var(--t-surface)]` without needing
// the theme threaded through as a prop everywhere — set once at the
// app root (AppShell) and it cascades.
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
    vars: {
      bg: '#000000', surface: '#0a0a0a', surfaceAlt: '#1a1a1a',
      text: '#fcd34d', textMuted: 'rgba(252,211,77,0.55)',
      accent: '#d97706', accentText: '#000000', border: 'rgba(217,119,6,0.3)',
    },
  },
  chalkboard: {
    label: 'Chalkboard',
    panelClasses: 'bg-[#1e3a2f]',
    nameClasses: 'text-white/70',
    dividerClasses: 'bg-white/15',
    servingClasses: 'bg-white/5',
    vars: {
      bg: '#16281f', surface: '#1e3a2f', surfaceAlt: '#24463a',
      text: '#f5f5f0', textMuted: 'rgba(245,245,240,0.55)',
      accent: '#f5f5f0', accentText: '#16281f', border: 'rgba(245,245,240,0.15)',
    },
  },
  neon: {
    label: 'Neon Night',
    panelClasses: 'bg-gradient-to-br from-[#0a0118] to-[#1a0a2e]',
    nameClasses: 'text-cyan-100/70',
    dividerClasses: 'bg-cyan-400/20',
    servingClasses: 'bg-cyan-400/10',
    vars: {
      bg: '#0a0118', surface: '#140a28', surfaceAlt: '#1d1038',
      text: '#e5e7ff', textMuted: 'rgba(229,231,255,0.5)',
      accent: '#22d3ee', accentText: '#0a0118', border: 'rgba(34,211,238,0.25)',
    },
  },
  sunset: {
    label: 'Sunset Court',
    panelClasses: 'bg-gradient-to-br from-orange-300 via-pink-300 to-purple-400',
    nameClasses: 'text-white/90',
    dividerClasses: 'bg-white/30',
    servingClasses: 'bg-white/15',
    vars: {
      bg: '#ffedd5', surface: '#fff7ed', surfaceAlt: '#ffe4c4',
      text: '#7c2d12', textMuted: 'rgba(124,45,18,0.6)',
      accent: '#ea580c', accentText: '#ffffff', border: 'rgba(124,45,18,0.15)',
    },
  },
};

export const THEME_OPTIONS = Object.entries(THEMES).map(([value, t]) => ({ value, label: t.label }));

// Whether this theme replaces the default ink/court palette (the four
// above) vs. just changing the numeral font on the app's normal
// background (the original three).
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

// CSS custom properties for the role colors above, meant to be spread
// onto a root element's style prop — e.g. <div style={themeVars(theme)}>
// — so every descendant can use bg-[var(--t-surface)] etc. regardless
// of which component it's in. Returns {} for the original three themes
// (which don't touch anything outside the score panel), so spreading
// this is always safe.
export function themeVars(theme) {
  const vars = THEMES[theme]?.vars;
  if (!vars) return {};
  return {
    '--t-bg': vars.bg,
    '--t-surface': vars.surface,
    '--t-surface-alt': vars.surfaceAlt,
    '--t-text': vars.text,
    '--t-text-muted': vars.textMuted,
    '--t-accent': vars.accent,
    '--t-accent-text': vars.accentText,
    '--t-border': vars.border,
  };
}
