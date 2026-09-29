# Pickleball Scorer

A configurable pickleball scorekeeper — singles or doubles, traditional or
rally scoring, full serve-position tracking, announcer text-to-speech,
game history, and three visual themes. Built with Vite + React, ready to
deploy as a website and to wrap with Capacitor for an Android (or iOS)
app later.

## Running it locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Edit anything in `src/` and it hot-reloads.

`npm install` also copies ~27MB of on-device speech model assets into
`public/tts/` (via the `postinstall` script) — that's the optional
neural voice described further down, not something broken if you see
it happen. It's gitignored and regenerates on every install.

**In VS Code**: this needs nothing special — it's a plain Node project.
Open the folder, use its integrated terminal for the commands above,
and the "ES7+ React/Redux/React-Native snippets" and "Tailwind CSS
IntelliSense" extensions are the two genuinely useful ones for this
codebase. VS Code edits and runs the web app; it doesn't build the
native Android app by itself (see below) — that step goes through
Android Studio (or plain Gradle on the command line) regardless of
which editor you write the code in.

## Running the tests

The scoring rules (serve rotation, position tracking, win conditions,
announcements) are pure functions in `src/engine/rulesEngine.js`, fully
covered by `src/engine/rulesEngine.test.js`. Run them with:

```bash
npm test              # run once
npm run test:watch    # re-run on change while you work
```

If you ever touch the scoring logic, run this first — it's the fastest
way to know you didn't break a rule.

## Building for production

```bash
npm run build
```

Outputs a static site to `dist/`. Preview it locally with `npm run preview`.

## Deploying the website

This is a plain static site (no server required), so it deploys to any
static host with zero configuration:

- **Vercel**: import the repo, framework preset "Vite", nothing else to
  set. Build command `npm run build`, output directory `dist`.
- **Cloudflare Pages**: same — build command `npm run build`, output
  directory `dist`.
- **Netlify / GitHub Pages / any static host**: same idea, just point it
  at `dist/` after running the build.

## Building the Android app (Capacitor)

Capacitor is already installed and configured (`capacitor.config.json`,
`@capacitor/android` included as a dependency). Steps 3 and 4 below have
actually been run and verified to work — `npx cap add android` and
`cap sync` both complete cleanly and produce a real, correctly-populated
Gradle project. Compiling that into an actual APK needs Gradle to
download its distribution from `services.gradle.org` and the Android
SDK from Google's servers — normal on any developer machine with
regular internet access, just not something achievable from a sandboxed
environment with restricted network access, which is why step 5 itself
isn't independently verified here.

1. Install [Android Studio](https://developer.android.com/studio) (sets
   up the Android SDK for you).
2. Change `appId` in `capacitor.config.json` from the placeholder
   `com.example.pickleballscorer` to your own reverse-domain id — this
   is required before publishing to the Play Store.
3. Add the Android platform (one-time):
   ```bash
   npm run cap:add:android
   ```
4. Whenever you make changes and want to rebuild the app:
   ```bash
   npm run cap:sync
   ```
5. Open it in Android Studio to run on a device/emulator or build a
   signed APK/AAB for release:
   ```bash
   npm run cap:open:android
   ```

The app is a single-page app with no URL routing, so there's nothing
Capacitor-unfriendly about it — this should work with no code changes.
iOS works the same way via `@capacitor/ios` if you ever want it, though
that additionally requires a Mac with Xcode.

Real app icons are already in place (`public/icons/`, referenced from
`manifest.webmanifest` and `index.html`) — a simple pickleball mark, good
enough to ship with. Swap them for your own branding whenever you want;
after adding the Android platform, regenerate the native icon set from a
source image with:
```bash
npx @capacitor/assets generate
```
Deliberately run via `npx` rather than kept as a project dependency — at
the time this was set up, `@capacitor/assets` pulled in a critical
vulnerability through its own bundled `tar`/`sharp` versions. `npx` runs
it without adding it to the project. Worth checking if that's been fixed
upstream before you rely on it.

## Project structure

```
src/
  engine/
    rulesEngine.js       - pure scoring logic (no React, no storage)
    rulesEngine.test.js  - its test suite
  lib/
    storage.js           - persistence; localStorage today (see below)
    auth.js               - accounts; a guest stub today (see below)
    entitlements.js       - monetization; everything unlocked today (see below)
    speech.js             - TTS text formatting + the mobile audio-unlock trick
    tinyTts.js             - optional on-device neural voice, lazy-loaded (see below)
    liveDisplay.js         - BroadcastChannel sync for the TV/display window (see below)
    externalDisplay.js     - detects a second screen and offers to open the display window there (see below)
  components/
    AppShell.jsx            - one responsive shell: full-bleed on phones/Capacitor, a centered card on desktop
    ErrorBoundary.jsx       - catches render errors so they don't blank the whole app
    ui.jsx                 - small shared pieces (buttons, toggle, serve number badge, score numeral)
    DisplayView.jsx         - score-only view with no controls, used by presentation mode and the pop-out window
    SetupScreen.jsx
    ScoreboardScreen.jsx
    SettingsPanel.jsx
    HistoryScreen.jsx
  App.jsx                  - screen routing + top-level state
  main.jsx                 - entry point for the controlling app (index.html)
  display-main.jsx         - entry point for the pop-out display window (display.html)
android-plugin/            - native Capacitor plugin source for real external-display
                              detection on Android (HDMI/wireless via DisplayManager);
                              written but not compiled — see its README
```

Every screen is a plain component reading from a few pieces of state in
`App.jsx`; nothing is tied to a specific rendering environment, which is
why the same code already worked as a single-file chat artifact and now
works as this normal multi-file project unchanged.

### Design system

Colors and type live entirely in `tailwind.config.js` as named tokens,
not Tailwind's stock palette — deliberately, since the stock
zinc/emerald combination is one of the more recognizable "generated by
an AI" tells. Everything is grounded in the actual sport instead:

- `ink` — a teal-tinted neutral scale (replaces `zinc`). `ink-950` is
  the literal shadowed teal of a court surface at dusk, not a generic
  near-black.
- `court` — the court surface's teal (replaces `emerald`); the primary
  interactive/serving-highlight color.
- `optic` — the ball's actual yellow-green. Reserved for exactly one
  job in the whole app: the live serve-number badge. Don't reach for it
  as a general accent — that's what dilutes it.
- `clay` — a baseline/out-of-bounds red (replaces `red`/`amber`) for
  faults and errors.

Two-typeface system: Space Grotesk (`font-display`) for structural UI —
labels, buttons, nav, headers, and (in the Minimalist theme) the score
numerals themselves — and Manrope (`font-sans`, Tailwind's default
here) for longer descriptive text. `font-led` (JetBrains Mono) and
`font-flip` (Oswald) are the Digital-clock and Flip-card themes'
numeral typefaces respectively, set in `ui.jsx`'s `ScoreNumeral`.

### One codebase, three targets

There's no separate "PC version" and "mobile version" — that's a single
concern, not two apps: `AppShell.jsx` is the one place that decides how
much of the screen the app claims. Below Tailwind's `sm` breakpoint
(phones, and the Capacitor WebView, which is always phone-sized) it's
invisible — full-bleed, same as before. At `sm` and up, i.e. any desktop
browser, it centers a fixed-width card with rounded corners and a
shadow, so a PC browser gets an intentional-looking app instead of a
phone layout stretched edge to edge. Every screen fills whatever
`AppShell` gives it (`h-full`, not `min-h-screen`); modals use
`absolute inset-0` so they're scoped to the shell too. Change the
breakpoint or the card's max width in one file, and it affects every
screen at once — that's the point of it living in one place.

### TV / second-screen display

The Monitor icon on the scoreboard opens `display.html` as a second
browser window (its own tiny Vite entry point, see `vite.config.js`),
showing team names, giant numerals, the serve position/count indicator
as an actual number badge, and the exact score-to-say text (e.g.
`7-5-2`) — the same thing the scorekeeper sees in the "Announce this"
panel, so anyone standing near the display can read the call too — with
no controls. Drag it onto a TV or monitor connected to the same
computer, in extended-desktop mode, and fullscreen it there. The window
you're actually scoring from is unaffected and keeps every control. The
two windows stay in sync live via `BroadcastChannel`
(`src/lib/liveDisplay.js`) — same-origin, same-browser only, which is
exactly the "second window on this computer" case and needs no backend.

**Auto-detect**: `src/lib/externalDisplay.js` watches for a second
screen becoming available (Window Management API on the web; a native
`DisplayManager` listener on Android once `android-plugin/` is wired
in) and shows an in-app prompt on the scoreboard — "External display
detected — show the scoreboard there?" — instead of relying on someone
noticing the Monitor button. Accepting it also positions the new window
directly on that screen when the browser exposes real screen geometry
(`getScreenDetails()`), rather than opening a default-positioned popup.
Read the comment block at the top of `externalDisplay.js` before
touching it — it spells out exactly what each platform can and can't
see, which is narrower than "any external screen" (see Known
limitations below).

There used to also be a "Fullscreen this device" option that swapped
the *same* device to the score-only view in place. It's gone now — it
turned out genuinely broken on a real phone (the giant score numerals
overflowed their card, team names got cut off, and it looked broken
because in a real sense it was: score-only-with-no-controls on the one
device you're actually scoring from doesn't have a good use case, since
you'd need the controls back within seconds anyway). What replaced it:
**configurable keyboard shortcuts** (Settings → "Keyboard shortcuts") -
Point A, Point B, Fault, Side Out, and Undo can each be bound to any
key. This is what actually makes solo scorekeeping-to-a-TV work: put
the display window on the TV, then score from the keyboard on the
laptop in front of you without touching the mouse. Defaults to the
arrow keys + Enter + Backspace; rebind by clicking a binding and
pressing the key you want (Esc cancels). Desktop-only by design — it's
a `window.addEventListener('keydown', ...)` in `ScoreboardScreen.jsx`,
which doesn't apply to touch devices.

**What this doesn't do**: sync across two genuinely separate devices
(a phone controlling, a different smart TV or tablet displaying). That
needs real-time state shared over a network, not `BroadcastChannel` —
which is exactly the cloud-sync backend already planned in
`lib/storage.js`. Once that exists, `DisplayView` could subscribe to
the same live game document instead of a BroadcastChannel message, with
no changes to `DisplayView` itself.

## Where each future feature plugs in

This was built with these specifically in mind — each has one file that's
the whole seam:

**User accounts (Google/Facebook/X)** - `src/lib/auth.js`. It's a single
`useAuth()` hook currently returning a guest user. Swap its internals for
Firebase Auth, Supabase Auth, Clerk, or a custom backend; every screen
that reads `user`/`isLoggedIn` already works unchanged, since none of
them know how auth is actually implemented.

**Cloud database** - `src/lib/storage.js`. Two functions, `get`/`set`,
currently backed by `localStorage`. Point them at Firestore, Supabase, or
your own API instead, and everything that persists (settings, game
history) moves to the cloud with no changes anywhere else. A natural
next step once accounts exist: branch on `isLoggedIn` - signed-out stays
local, signed-in syncs to the cloud.

**Hosting on Vercel/Cloudflare/etc.** - already covered above; this is a
static Vite build, so there's nothing host-specific to change.

**Monetization (ads, subscriptions)** - `src/lib/entitlements.js`. A
single `useEntitlements()` hook currently returning "everything
unlocked, no ads." Wire in Stripe + your backend (web) or Google Play
Billing (Android build) and gate premium themes or render an ad slot
based on what it returns. On offline behavior: any real ad SDK (AdMob,
etc.) already can't fetch a new ad with no network, so "no WiFi = no
ads" is the default behavior, not something to build — no need to
detect connectivity yourself. Don't fight this by aggressively
pre-caching ads to force them to show offline; that's a worse experience
for a marginal revenue gain.

**Android APK** - covered above; Capacitor is already installed and
configured, the one-time Android Studio setup is the only remaining
step.

**On-device neural TTS** - implemented, as an opt-in extra voice, not
the default. The app's main voice is still the browser's built-in Web
Speech API (`src/lib/speech.js`) - zero setup, works everywhere. The
voice picker in Settings also offers "On-device voice (offline,
experimental)", backed by
[@diffusionstudio/vits-web](https://github.com/diffusionstudio/vits-web)
— a browser port of [Piper](https://github.com/rhasspy/piper), a
well-established open-source neural TTS engine (`src/lib/tinyTts.js`).

This replaced an earlier choice (a fork of a different, tiny project)
after it turned out unreliable in real testing — both a build/dev-server
issue and, separately, audio that didn't reliably match the requested
text. This package has a meaningfully stronger track record: 240+
GitHub stars, dozens of forks (including from other real open-source
projects), an actively maintained organization behind it, and a public
demo — verified by actually installing it and reading the source rather
than trusting any of that at face value. Still labeled "experimental" in
the UI, since it's newer to this app than the rest of the codebase, but
resting on much sturdier ground.

**Trade-off worth knowing**: this package fetches its model files from
Hugging Face (and `onnxruntime-web` from a CDN) the *first* time a given
voice is used, caching them afterward via the browser's Origin Private
File System — so the first use needs a network connection, and it's
offline (including with WiFi off) from then on. That's different from
the original design goal of "fully offline from the very first use" —
this package doesn't expose a supported way to point it at self-hosted
files instead, and downloading the actual model weights to bundle them
the old way wasn't possible from this environment (Hugging Face isn't a
reachable host here). Given the alternative was unreliable, this seemed
like the right trade — flagged here and in Settings so it's not a
surprise.

The `onnxruntime-web` bundling quirks investigated earlier (the
duplicate-WASM production bug, the `npm run dev`-only import crash) come
from `onnxruntime-web` itself, so the same mitigations still apply and
still matter: `resolve.conditions: ['onnxruntime-web-use-extern-wasm']`
and `server.hmr.overlay: false` in `vite.config.js`. Same advice as
before: **test this feature with `npm run build && npm run preview`,
not `npm run dev`**, for its real behavior. I still don't have a real
browser to confirm actual audio plays end to end - only that the
loading mechanics and a clean build are confirmed.

If the trade-off (or the "experimental" label) gives you pause, the
on-device voice is safe to leave unselected entirely — nothing else in
the app depends on it, and removing `@diffusionstudio/vits-web` plus
`src/lib/tinyTts.js`, the `resolve.conditions` line, and the
voice-picker option would cleanly lift it back out.

## Known limitations, honestly

- **TTS clipping/latency fix, not yet confirmed on real hardware**: the
  reported "three" → "-ree" clipping and slow announcer were traced by
  reading `@diffusionstudio/vits-web`'s source directly (no fade/padding
  exists in the library — the model's raw waveform goes straight into a
  WAV Blob). `src/lib/tinyTts.js` now decodes through the Web Audio API
  instead of an `<audio>` element and pads the front with true silence,
  plus a `warmUpTinyTts()` call that primes the model as soon as the
  on-device voice is selected rather than at the moment you tap Speak.
  This is reasoned from the source and well-documented platform
  behavior (especially Android WebView audio startup quirks), not
  confirmed against real playback — there's no speaker in this sandbox.
  If it's still clipped on your device, that's a signal to raise
  `LEAD_SILENCE_SECONDS` in that file, not that the approach is wrong.
- **TTS on mobile (separate issue)**: some mobile browsers (notably iOS
  Safari) route speech synthesis audio through a channel that respects
  the phone's ringer/silent switch. `unlockAudioSession()` in
  `src/lib/speech.js` plays a silent clip first to work around this for
  the Web Speech API path, which helps but isn't guaranteed on every
  device/browser combination.
- **External display auto-detect is web-limited by design, not by
  effort**: `src/lib/externalDisplay.js` uses the Window Management API
  (`screen.isExtended`), which only exists in Chrome/Edge desktop and
  only sees genuine extended-desktop connections (a wired monitor, or a
  wireless display explicitly set to "Extend"). No browser on any
  platform exposes OS-level screen mirroring/casting (Miracast, AirPlay,
  Chromecast) to a web page — that's a deliberate privacy boundary, not
  a gap I could code around. The native Android plugin in
  `android-plugin/` sees real HDMI/wireless-display connections via
  `DisplayManager`, but is written and read against Capacitor's actual
  source, not compiled or run — see `android-plugin/README.md` for
  what's left to do.
- **Visual redesign, not yet seen rendered**: same constraint as
  everything else here — I can verify the build compiles and lint is
  clean, not what it actually looks like on a screen. Run `npm run dev`
  and look at all three themes (Settings → Theme) in both light and
  dark mode before trusting it.
- **App icon PNGs still show the old palette** (`public/icons/*.png`) —
  I retinted `favicon.svg` and the web manifest colors, but the
  pre-rendered PNG icons (192/512/maskable) need regenerating from
  scratch, which needs actual image generation, not just a find/replace.
- **Never tested in an actual browser by me** — I can verify it compiles
  and the logic is correct (`npm test`), but I have no way to open a
  real browser myself. Run `npm run dev` and click through every mode
  before trusting this fully; a chat-artifact version of this same UI
  code had real device-specific bugs that only surfaced that way.
- **No UI/component tests** — only `src/engine/rulesEngine.js` is
  covered. The screens themselves (`src/components/`) have no automated
  tests yet; that's the next thing worth adding if this keeps growing.
- **Capacitor's `appId` is still the placeholder** `com.example.pickleballscorer`
  — must be changed before any real Android build (see above).
- **No CI** — tests and the build only run when you run them locally.
  A simple GitHub Actions workflow running `npm test && npm run build`
  on every push would be a cheap, worthwhile addition.
- **TypeScript**: this is plain JS/JSX throughout, matching everything
  built and tested so far. Migrating to TypeScript later is a reasonable
  option if the codebase grows, but wasn't necessary to get here.
