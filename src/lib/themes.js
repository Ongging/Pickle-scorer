/**
 * THEME REGISTRY
 * ---------------------------------------------------------------------
 * Single source of truth for every score-numeral theme, shared by
 * ScoreboardScreen, DisplayView, SettingsPanel's picker, and ui.jsx's
 * ScoreNumeral — so the scoreboard and the external display can never
 * drift apart on what a given theme looks like, and so adding a theme
 * later is a one-file change.
 *
 * Minimalist / Digital clock / Flip card only ever changed the numeral
 * itself and left the panel on the app's normal light/dark background
 * (its colors already come from the ink/court tokens' own dark: variants,
 * so the Appearance setting always worked for these three — nothing
 * about them changes below).
 *
 * The four scene themes (Stadium/Chalkboard/Neon Night/Sunset Court)
 * are a bigger swing — an actual scene (background, divider, serving
 * highlight), not just a different number font. EACH has its own dark
 * AND light variant below, so the Appearance (Light/Dark/System)
 * setting stays meaningful no matter which theme is active — e.g.
 * Stadium's dark variant is a night game (black, glowing amber);
 * its light variant is a day game (bright sky, bold amber-on-white,
 * no glow — glow effects only read against a dark background, so each
 * light variant drops them rather than leaving a faint smudge).
 * Sunset Court's existing warm-gradient look IS its light variant;
 * its dark variant is that same sunset after the sun's gone down
 * (deeper, more saturated tones, same gradient idea).
 */
// Role colors for the rest of the UI (everything outside the score
// panel itself — the app background, the sidebar, buttons, other
// screens). Eight roles is intentionally the whole set:
//   bg         — page/app background, behind every panel
//   surface    — a card/panel/modal's own background
//   surfaceAlt — a secondary surface inside a surface (sidebar nav
//                hover, the announce panel inside the scoreboard)
//   text       — primary text on a surface
//   textMuted  — secondary/label text on a surface
//   accent     — primary button background (Point, New game, etc.)
//   accentText — text color ON an accent-colored button
//   border     — dividers, outlines
// Consumed via themeVars() below as CSS custom properties, so any
// component can reference e.g. `bg-[var(--t-surface)]` without needing
// the theme threaded through as a prop everywhere — set once at the
// app root (AppShell) and it cascades. Score-panel treatment (the
// gradient/thick-border "hero" look) and the numeral's own color/glow
// stay as their own per-variant fields below rather than vars, since a
// gradient or a text-shadow glow can't be expressed as one CSS color.
export const THEMES = {
  minimalist: { label: 'Minimalist' },
  digital: { label: 'Digital clock' },
  flip: { label: 'Flip card' },
  stadium: {
    label: 'Stadium',
    dark: {
      panelClasses: 'bg-black border-[6px] border-amber-600/80',
      nameClasses: 'text-amber-200/80',
      dividerClasses: 'bg-amber-600/40',
      servingClasses: 'bg-amber-500/10',
      numeral: { color: '#fbbf24', glow: '0 0 6px rgba(251,191,36,0.85), 0 0 24px rgba(251,191,36,0.45)' },
      vars: {
        bg: '#000000', surface: '#0a0a0a', surfaceAlt: '#1a1a1a',
        text: '#fcd34d', textMuted: 'rgba(252,211,77,0.55)',
        accent: '#d97706', accentText: '#000000', border: 'rgba(217,119,6,0.3)',
      },
    },
    light: {
      panelClasses: 'bg-white border-[6px] border-amber-600',
      nameClasses: 'text-amber-800/80',
      dividerClasses: 'bg-amber-600/40',
      servingClasses: 'bg-amber-500/10',
      numeral: { color: '#92400e', glow: 'none' },
      vars: {
        bg: '#fffbeb', surface: '#ffffff', surfaceAlt: '#fef3c7',
        text: '#78350f', textMuted: 'rgba(120,53,15,0.6)',
        accent: '#d97706', accentText: '#ffffff', border: 'rgba(217,119,6,0.35)',
      },
    },
  },
  chalkboard: {
    label: 'Chalkboard',
    dark: {
      panelClasses: 'bg-[#1e3a2f]',
      nameClasses: 'text-white/70',
      dividerClasses: 'bg-white/15',
      servingClasses: 'bg-white/5',
      numeral: { color: '#f5f5f0', glow: '1px 1px 2px rgba(0,0,0,0.3)' },
      vars: {
        bg: '#16281f', surface: '#1e3a2f', surfaceAlt: '#24463a',
        text: '#f5f5f0', textMuted: 'rgba(245,245,240,0.55)',
        accent: '#f5f5f0', accentText: '#16281f', border: 'rgba(245,245,240,0.15)',
      },
    },
    light: {
      // The whiteboard flip side of the same blackboard idea — same
      // handwritten font, same "casual court-side note" concept.
      panelClasses: 'bg-white',
      nameClasses: 'text-[#1e3a2f]/70',
      dividerClasses: 'bg-[#1e3a2f]/15',
      servingClasses: 'bg-[#1e3a2f]/5',
      numeral: { color: '#1e3a2f', glow: '1px 1px 1px rgba(0,0,0,0.08)' },
      vars: {
        bg: '#f5f5f0', surface: '#ffffff', surfaceAlt: '#e8e8e0',
        text: '#1e3a2f', textMuted: 'rgba(30,58,47,0.6)',
        accent: '#1e3a2f', accentText: '#ffffff', border: 'rgba(30,58,47,0.15)',
      },
    },
  },
  neon: {
    label: 'Neon Night',
    dark: {
      panelClasses: 'bg-gradient-to-br from-[#0a0118] to-[#1a0a2e]',
      nameClasses: 'text-cyan-100/70',
      dividerClasses: 'bg-cyan-400/20',
      servingClasses: 'bg-cyan-400/10',
      numeral: { color: '#22d3ee', glow: '0 0 6px rgba(34,211,238,0.9), 0 0 20px rgba(34,211,238,0.6), 0 0 40px rgba(34,211,238,0.3)' },
      vars: {
        bg: '#0a0118', surface: '#140a28', surfaceAlt: '#1d1038',
        text: '#e5e7ff', textMuted: 'rgba(229,231,255,0.5)',
        accent: '#22d3ee', accentText: '#0a0118', border: 'rgba(34,211,238,0.25)',
      },
    },
    light: {
      // A literal neon glow doesn't read against a light background, so
      // this swaps the glow for bold, fully-saturated flat color instead
      // — same vivid identity, daylight-readable.
      panelClasses: 'bg-gradient-to-br from-violet-50 to-fuchsia-50',
      nameClasses: 'text-violet-900/70',
      dividerClasses: 'bg-cyan-600/25',
      servingClasses: 'bg-cyan-600/10',
      numeral: { color: '#0e7490', glow: 'none' },
      vars: {
        bg: '#f5f3ff', surface: '#ffffff', surfaceAlt: '#ede9fe',
        text: '#3b0764', textMuted: 'rgba(59,7,100,0.6)',
        accent: '#0891b2', accentText: '#ffffff', border: 'rgba(8,145,178,0.25)',
      },
    },
  },
  sunset: {
    label: 'Sunset Court',
    dark: {
      // The same sunset, after the sun's gone down — deeper and more
      // saturated rather than a different scene.
      panelClasses: 'bg-gradient-to-br from-orange-700 via-pink-700 to-purple-900',
      nameClasses: 'text-white/80',
      dividerClasses: 'bg-white/20',
      servingClasses: 'bg-white/10',
      numeral: { color: '#fed7aa', glow: '0 2px 6px rgba(0,0,0,0.3)' },
      vars: {
        bg: '#1e1033', surface: '#2a1645', surfaceAlt: '#36205a',
        text: '#fed7aa', textMuted: 'rgba(254,215,170,0.6)',
        accent: '#fb923c', accentText: '#1e1033', border: 'rgba(251,146,60,0.25)',
      },
    },
    light: {
      panelClasses: 'bg-gradient-to-br from-orange-300 via-pink-300 to-purple-400',
      nameClasses: 'text-white/90',
      dividerClasses: 'bg-white/30',
      servingClasses: 'bg-white/15',
      numeral: { color: '#ffffff', glow: '0 2px 6px rgba(0,0,0,0.2)' },
      vars: {
        bg: '#ffedd5', surface: '#fff7ed', surfaceAlt: '#ffe4c4',
        text: '#7c2d12', textMuted: 'rgba(124,45,18,0.6)',
        accent: '#ea580c', accentText: '#ffffff', border: 'rgba(124,45,18,0.15)',
      },
    },
  },
};

export const THEME_OPTIONS = Object.entries(THEMES).map(([value, t]) => ({ value, label: t.label }));

function variant(theme, isDark) {
  const entry = THEMES[theme];
  if (!entry || (!entry.dark && !entry.light)) return null;
  return (isDark ? entry.dark : entry.light) || entry.dark || entry.light;
}

// Whether this theme replaces the default ink/court palette (the four
// scene themes) vs. just changing the numeral font on the app's normal
// background (the original three). Doesn't need isDark — every scene
// theme has both variants, so this is purely "which kind of theme is
// this," not "which variant."
export function hasScenePanel(theme) {
  return Boolean(THEMES[theme]?.dark || THEMES[theme]?.light);
}

export function themePanelClasses(theme, isDark) {
  return variant(theme, isDark)?.panelClasses || '';
}
export function themeNameClasses(theme, isDark) {
  return variant(theme, isDark)?.nameClasses || '';
}
export function themeDividerClasses(theme, isDark) {
  return variant(theme, isDark)?.dividerClasses || '';
}
export function themeServingClasses(theme, isDark) {
  return variant(theme, isDark)?.servingClasses || '';
}

// The numeral's own color + text-shadow glow, for ScoreNumeral (ui.jsx)
// to apply directly as inline style — {color: '#fff', glow: 'none'}.
export function themeNumeralStyle(theme, isDark) {
  return variant(theme, isDark)?.numeral || null;
}

// CSS custom properties for the role colors above, meant to be spread
// onto a root element's style prop — e.g. <div style={themeVars(theme)}>
// — so every descendant can use bg-[var(--t-surface)] etc. regardless
// of which component it's in. Returns {} for the original three themes
// (which don't touch anything outside the score panel), so spreading
// this is always safe.
export function themeVars(theme, isDark) {
  const vars = variant(theme, isDark)?.vars;
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
