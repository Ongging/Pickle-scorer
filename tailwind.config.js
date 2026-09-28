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
      },
    },
  },
  plugins: [],
}
