# Crazy Bowling

Open `games/crazy-bowling/index.html` through any static HTTP server. No build,
API, account, remote font, model, texture or audio download is required.

- Three.js uses the site's existing locally hosted MIT-licensed distribution.
- Cannon-es 0.20.0 is vendored in `js/vendor/cannon-es.mjs` with its MIT license.
- All lanes, pin meshes, materials, cover illustration and sounds are procedural
  original game assets. The Canvas fallback projects the same physics world.
- Ten levels; a ten-frame tenpin series on each, including tenth-frame bonus rolls.
- Completing a series unlocks the next level. Stars: completion / 60 / 120 points.
- Six balls unlock at 0 / 3 / 6 / 10 / 16 / 24 total stars.
- Progress is stored under `fritidsparken.crazy-bowling.v1` in localStorage.
- Mouse/touch Pointer Events, position/aim sliders, spin buttons and a one-tap
  throw button. Keyboard: arrows to position, A/D to aim, Space to throw, Esc pause.
- Physics uses fixed 120 Hz substeps with bounded catch-up and an 8.5-second
  simulation watchdog. Pausing or hiding the page stops gameplay and rolling audio.
- Pixel ratio is capped; sustained slow frames turn off shadows. Reduced-motion
  preference disables camera shake, slow-motion and confetti.

## Checks

`node --test tests/crazy-bowling.test.mjs`

Tests cover perfect games, spares, deferred bonus scores, tenth-frame racks and
statistics, persistence sanitization, every lane's physical route, stationary pins,
strikes, clearing fallen pins, extreme throws, special balls and spin on ice.

Browser QA uses the actual UI and synthetic touch Pointer Events at desktop,
390×844, 320×568, 844×390 and tablet layouts. The available cloud browser disables
WebGL; its checks cover the Canvas fallback. Its animation callbacks are heavily
throttled, so the full-series QA fixture schedules the same loop with timers.
The WebGL rendering path and performance on physical Chromebooks/iOS/Android
have not been measured in this environment.
