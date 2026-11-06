# Downhill Blender redesign — development checkpoint, 2026-11-06

Not ready for main: real WebGL visual/play/performance/mobile validation remains blocked.

## Preserved baseline

Source: 9af84e0cf98dc9c46943f5b2cc26775c009ef4cc. Twenty authored courses, eight bicycle options, four modes, seven tricks, checkpoints, route geometry, times and legacy `fp-downhill-v1` records remain. `courses.js` is unchanged. Three.js remains r160; the existing vendored GLTFLoader is reused.

## Implemented

- Blender 4.3.2 generates original editable environment, cyclist/bicycle and wildlife libraries. Runtime uses three GLBs with shared geometry/material ownership. Procedural rigid articulation synchronizes wheels, pedals, steering, tricks and compression. A PedalCycle clip is also retained in the rider GLB.
- Scenery replaces trees, rocks, bridge planks/posts and mountains across existing themes. Vegetation uses colored Blender geometry. Snow/night/canyon/city identities remain, though visual acceptance still needs review. Rabbit, squirrel, blue bird, otter and butterfly use nearby idle/hop/fly/bob behaviors without entering the trail.
- Warm dirt, brighter meadow palette, turquoise animated water, clouds and meadow waterfall placement. Procedural terrain stays aligned to existing course functions. Bridge plank top is height +0.09, matching the riding offset.
- Camera follows centrally with stable horizon, interpolated render pose, speed FOV and jump look-ahead. Jump buffering, stationary steering fix, stable landing and crash combo reset.
- Low/Medium/High, separate music and effect controls, fullscreen and mobile safe-area sizing. Audio is synthesized by original project code, no external recordings introduced.
- Vegetation uses 20% Blender decimation LODs, 32-metre scene chunks and distance visibility/shadow ranges. Actual FPS is not measured.

## Game-development instructions applied

Read directly from https://github.com/gamedev-skills/awesome-gamedev-agent-skills ; no CLI installation claimed.

| Instructions | Concrete application |
| --- | --- |
| router | Identified existing Three.js; retained release and architecture |
| create-game-assets / three-d-pipeline | Reference palette, authored families, .blend sources, GLB export, pivots, named roots, vertex palette, LODs |
| threejs-gltf-loading | Existing loader, asynchronous loading gate, named articulation, shared resources |
| threejs-materials-lighting | PBR roughness, vertex colors, color-space handling and key/fill light changes |
| physics-tuning | Existing fixed 90 Hz integration retained; render interpolation and landing tests |
| input-systems | Jump buffer, repeat suppression, existing multi-touch joystick retained |
| camera-systems | Centered smooth follow, stable horizon, FOV and landing look-ahead |
| game-feel | Controlled compression, jump and landing feedback |
| performance-optimization | Measured CPU geometry counts, then added LOD and chunks; no GPU claim |
| game-ui-ux | Presets, independent audio buttons, fullscreen and small-screen controls |
| audio-design | Independent synthesis buses and quiet bird ambience |
| save-systems | Validated save reads, separate settings key, preserved legacy data |
| game-ai | Simple bounded states, distance-based activation |

Behavior trees/utility AI are unnecessary for these few ambient states; no new framework introduced. Original route generation retained; procedural scenery is deterministic. New shader effect is a small standard-material water modification. Dedicated shader-programming/level-design/scene-setup skills and full art acceptance remain follow-up work, not claimed completed.

## Verification performed

- `node tests/downhill-mechanics.cjs`: all twenty tracks complete with test autopilot at simulated 30/60 render rates with identical results and no crashes; legacy save preservation, invalid saves, jump buffering/repeat, stable landings, stationary steering and combo reset. This is simulation coverage, not proof of human playability.
- Same suite: 2,020 camera transform samples and independent WebAudio routing checks. Not a listening test.
- `node tests/downhill-assets.cjs --quality=low`, medium (default), high: 60 actual scene constructions with real GLTFLoader/GLB imports; 960 articulated pose samples; finite buffers/bounds/transforms/instances; shared material ownership checked.
- CPU geometry estimates before frustum culling/shadow passes: Low maximum about 0.60M triangles, Medium about 2.37M. These are not FPS measurements. Added chunk/LOD system after initial scenes measured up to 7.7M triangles.
- Blender model preview renders inspected for cyclist and five animals. A CPU scene snapshot was rendered in Blender for composition checks; it does not represent final WebGL lighting, textures or shaders.
- Browser: all model downloads/imports completed, quality and independent audio controls operated. Both baseline and modified game failed WebGLRenderer creation in the provided browser (`GL_RENDERER = Disabled`, `BindToCurrentSequence failed`). This is an environment limitation, not a passing gameplay test.

## Outstanding acceptance gates

Real WebGL screenshots vs reference, full-course visual review, shaders and water appearance, mobile portrait/landscape touch play, hardware FPS/load/memory, audio listening, camera obstacle interaction and manual trick/landing tests. The reference match is not yet accepted. Not every remaining city/industrial decorative primitive has been rebuilt in Blender. Do not describe the entire masterprompt as complete. No main deployment or live-site verification performed.
