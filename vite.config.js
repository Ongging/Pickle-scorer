import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      // The on-device voice's underlying library (onnxruntime-web)
      // dynamically imports one of its own WASM glue files at runtime.
      // In `npm run dev` specifically, Vite's dev-server transform layer
      // refuses this because the resolved path lives in /public (a
      // dev-only restriction — verified via `npm run build && npm run
      // preview`, which serves the same file with no issue at all, since
      // preview mode has no transform layer to intercept it). Disabling
      // the overlay stops that dev-only failure from blocking the whole
      // page; the app's own try/catch around this voice still falls back
      // to the browser's built-in speech gracefully either way.
      overlay: false,
    },
  },
  resolve: {
    // onnxruntime-web's default "bundle" build auto-locates its own WASM
    // glue files via import.meta.url, which both breaks under Vite's dev
    // server (can't import from /public) and gets redundantly bundled
    // into the production build. This condition switches it to the
    // "extern" build, which instead relies entirely on the wasmPaths we
    // configure in src/lib/tinyTts.js, fetched as plain static assets.
    conditions: ['onnxruntime-web-use-extern-wasm'],
  },
  optimizeDeps: {
    // onnxruntime-web (a dependency of @dittli/tts-core) does internal
    // import.meta.url-based asset resolution that Vite's bundler
    // otherwise statically picks up and duplicates into the build
    // output. Excluding it here is the standard mitigation.
    exclude: ['onnxruntime-web'],
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        // Separate entry for the pop-out TV/second-screen display window
        // (see src/components/DisplayView.jsx + src/lib/liveDisplay.js) -
        // its own tiny bundle, no controls, no game logic.
        display: resolve(import.meta.dirname, 'display.html'),
      },
    },
  },
})
