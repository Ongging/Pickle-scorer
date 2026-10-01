/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './display.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'ui-sans-serif', 'sans-serif'],
        led: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        flip: ['Oswald', 'ui-sans-serif', 'sans-serif'],
        chalk: ['Caveat', 'cursive'],
        neon: ['Orbitron', 'ui-sans-serif', 'sans-serif'],
        sunset: ['Fredoka', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        // Teal-tinted neutral scale (replaces Tailwind's default zinc) —
        // the darkest step, ink-950, is the actual shadowed teal of a
        // court surface at dusk, not a generic near-black.
        ink: {
          50: '#F4F7F6',
          100: '#E6EBEA',
          200: '#CFD9D7',
          300: '#AAB9B6',
          400: '#7E918D',
          500: '#5C706C',
          600: '#46605C', // WCAG AA on ink-50 (>4.5:1); use for secondary text
          700: '#374544',
          800: '#25302F',
          900: '#16211F',
          950: '#0E2426',
        },
        // Court-surface teal — the primary interactive/accent color
        // (replaces the default emerald).
        court: {
          50: '#E9F5F3',
          100: '#CDEBE7',
          400: '#2E9D93',
          500: '#16847A',
          600: '#0F6E68',
          700: '#0B5450',
          950: '#06302D',
        },
        // Optic-yellow — the ball's actual color. Reserved for exactly
        // one job: marking which serve number is live. Not a general
        // accent.
        optic: {
          400: '#E2E94D',
          500: '#D6DE22',
          600: '#B9C11B',
        },
        // Baseline clay-red — fault/error states (replaces red/amber).
        clay: {
          50: '#FBEEE9',
          100: '#F5D9CE',
          500: '#C1502E',
          600: '#A63F21',
        },
      },
    },
  },
  plugins: [],
}
