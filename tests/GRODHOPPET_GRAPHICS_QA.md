# Grodhoppet visual upgrade — 2026-11-02

## Scope

`visuals.js` owns scene construction, material maps, models, lighting and quality.
`game.js` retains level definitions, collision widths, speeds, scoring, unlocking,
controls, save key and movement timing. It calls the visual update after simulation.

- Deterministic, local 256px albedo/bump maps: grass, asphalt, wood, gravel,
  paving, skin, foliage and water. These remain enabled at every WebGL quality tier.
- ACES + sRGB, filtered sky environment, sunlight, hemisphere fill, moving shadows,
  contact-shadow sprite, animated water normals and dusk streetlights.
- Smooth frog geometry, jointed legs/toes, breathing, hop, blink, landing and loss.
- Car/SUV/van/bus/truck bodies with glass, lights, trim and rotating wheels.
- Bark logs with end rings and shaped lily pads; visual bob does not change bounds.
- Continuous surroundings, vegetation instances, static geometry batched by material,
  distance culling after the fog limit. Explicit and automatic quality selection.
- Portrait camera follows the lateral edges. Controls retain pointer/keyboard/swipe
  support and stay below the frog in portrait and landscape layouts.

## Automated verification

Run `node --test tests/grodhoppet.test.cjs` (7 tests).
Uses the real Three.js geometry and game code with a DOM/renderer shim:

- All 9 adventure selections × 3 difficulties: start, safe arrivals, checkpoints,
  scoring and completion. Hazards are deliberately positioned to isolate progression;
  these are not claims of 27 manual end-to-end playthroughs.
- Traffic collision boundaries and difficulty-scaled platform support boundaries.
- Hop queue, fly collection without double counting, pause/resume and respawn.
- All quality tiers and characters, finite mesh coordinates and transforms.
- Camera projection in 390×844, 844×390, 768×1024, 1365×936 and both lateral edges.

`node --check` passed for both game scripts; `git diff --check` passed.

## Browser verification and limits

Preview starts; level menu, start and pointer movement exercised. Portrait 390×844
and landscape 844×390 inspected. Controls are centered, separate from the frog.
The provided cloud browser reports WebGL disabled, so browser testing used the
existing software fallback. That fallback intentionally has base-colour substitutes
for mapped surfaces. It is distinct from LOW WebGL quality.

Actual GPU shader compilation, final PBR/reflection/shadow appearance, FPS on physical
phones/Chromebooks/tablets, and native mobile touch remain unverified here. Do not
report the software-renderer preview as proof of final GPU graphics or performance.
