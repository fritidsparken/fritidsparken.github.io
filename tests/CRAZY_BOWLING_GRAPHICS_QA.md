# Crazy Bowling graphics candidate — 2026-11-02

## Publication gate: NOT APPROVED

The supplied cloud browser does not provide WebGL. The actual game's
`#world[data-renderer]` reports `canvas`; screenshots show the existing Canvas
fallback, not the new PBR scene. Do not treat those screenshots as approval of
the GLB assets, lighting, shadows, environment reflections or High post pass.
Do not merge to main until a WebGL-capable browser has rendered and passed the
user's visual acceptance criteria. Physical device performance is unmeasured.

## Completed checks

- All eleven original physics/scoring/progression tests pass.
- Three asset tests pass: GLB byte ranges/indices/normals, pin/ball scale and
  recessed bores, aggregate model/texture payload under 3 MB.
- Physics and core modules are byte-identical to the starting main revision.
- Browser loads the GLB and every WebP; game reaches its home screen without
  application errors. Asset readiness is exposed as `data-assets="ready"`.
- Starting a game and pressing KASTA changes the UI to rolling and disables
  controls as expected in the Canvas fallback.
- 390×844 mobile layout inspected: controls fit the viewport. 844×390 pause and
  resume exercised. This does not verify touch gestures on actual hardware.
- Syntax checks pass for changed modules.

## Still required before publication

1. Inspect real WebGL renders at ready, mid-roll, pin impact and reset.
2. Inspect maple orientation/scale, pin rings and bores at close range.
3. Compare High, Medium and Low; all must retain models and textured materials.
4. Check shader compilation, framebuffer support, color management, AO halos,
   shadow acne, probe capture and reflection brightness on actual GPUs.
5. Check every themed lane, all balls, strike/spare and full-series transitions.
6. Finish tablet and Chromebook viewport QA; measure hardware frame times,
   draw calls, triangles, context restoration and repeated-rebuild memory use.
7. Confirm environment composition matches the requested commercial quality.
8. Only then publish to main and verify the Pages deployment.

## Known limits of the current implementation

- Canvas fallback retains the old visual style. Low WebGL is a separate path.
- Environment reflections are a static prefiltered hall probe; no dynamic ball
  reflection is rendered into the opaque lane.
- Exported assets are original parametric surface models, not externally
  purchased or photogrammetry assets. Textures are authored, not photo scans.
- No Draco/Meshopt/KTX2 or geometry LOD yet. GLB/WebP and background pin
  instancing reduce cost; real-device measurement must guide further work.
- Spare has fewer particles; the sweep/reset sequence is visual only.
