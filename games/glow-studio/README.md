# Glow Studio — first vertical slice (DRAFT)

Original browser-local makeup and nail painting game for Fritidsparken. This is a development vertical slice, **not the completed high-end game described in the brief**. Do not merge to production until the visual and device gates below are passed.

## Included implementation

- Independent full-viewport game, embedded by `FPGlowStudio` into the existing game hub. The Standard home and game hub each gain a cover and launch control. Removing the iframe disposes the game context.
- One original procedurally modeled customer, Mira, with a continuous sculpted face, separate convex lips, almond eye surfaces, iris fibres, hair locks, eyelids and subtle breathing/head motion.
- Original 3D salon, PBR materials, procedural PMREM environment, key/fill/rim lights and a shadow-casting key light.
- One hand with five separate curved nail surfaces and independently paintable textures.
- Raycast/UV painting on face, lips and nails. Interpolated brush stamps, named ordered layers, bounded stroke undo (24 MiB budget), mouse and Pointer Event support; two-pointer pinch stops painting.
- Makeup tools, polish colors, simple nail finish settings, star stamps, nail-shape toggle, brief curing-lamp transition.
- Studio → face → nails → result flow; repeated visits with three rotating wishes for the SAME customer pending art approval. Completion requires actual face and nail painting. Reward is for creative activity, not beauty scores.
- Local versioned progression, settings and six reduced-size portfolio images. Storage failures are caught. No accounts, camera permission, purchases or external runtime requests.
- Original SVG tool icons, Web Audio tones/ambient notes, mute/visibility handling.
- Automatic resolution/shadow quality with cooldown and measured frame-time hysteresis. `?debug` shows renderer statistics; texture memory is only a rough estimate.
- Dedicated responsive layouts, reduced-motion camera handling, keyboard-accessible UI and readable error state.

## Critical validation status

The provided cloud Chrome instance cannot create ANY WebGL context (`GL_RENDERER = Disabled`, `BindToCurrentSequence failed`). This happened before scene construction. The error UI was observed in the browser; no rendered gameplay was observed. No Safari, Firefox, iPhone, iPad or Android device was available. The code's successful CPU tests DO NOT verify GPU shaders, rendered appearance, frame rate or real touch feel.

Do not claim high-end visual fidelity, mobile compatibility, 60 FPS, or full end-to-end browser testing from this draft. The first customer must be rendered and critically reviewed before adding more customers.

## Known scope gaps and compromises

- Procedural geometry is original and real 3D, but has not passed the requested premium art gate. No artist-refined/rigged GLB character, sculpted skin normal maps, subsurface scattering, facial morph rig or groom-quality hair yet.
- Mascara/liner paint pigment in eye zones; mascara does not build individual coated lash geometry.
- Brush is a shared 3D brush with contact compression, not a separate detailed physical tool for each product.
- Nail finish controls currently affect the nail's material globally; pigment application is local. Per-texel roughness/metalness/top-coat maps and physically raised gel require further work.
- Nail filing is a form toggle, not freehand filing. Star stickers are texture stamps, not individually selectable 3D gems. No dedicated gradient tool (colors can overlap freehand).
- Curing moves the hand through an arch with light; must be visually checked for intersections.
- One hand, one customer. Repeated visits rotate wishes; they do not introduce new people. Progression tracks XP and studio names only, with no unlockable content or changing salon yet.
- Camera uses eased station transitions and pinch zoom. No two-finger rotation in styling, no separate eye/single-nail framing presets, no photo-background picker. Result rotation is available.
- No depth-of-field pass, dynamic planar mirrors, advanced glitter shader, texture compression or GLB pipeline. Reflection comes from the procedural environment; mirror objects are reflective panels, not live reflected scenes.
- Music and effects are simple original synthesized audio, not a professionally produced soundtrack.
- Geometry and textures are created on demand at game launch; the hand is not lazy-loaded separately. Painting composites CPU canvas textures, not a GPU render-target brush system. Measure upload cost on actual mobile hardware.
- WebGL is the renderer path (r160 supports WebGL2 with WebGL1 fallback). There is no WebGPU path. No-WebGL devices get an honest error instead of a fake 3D image.
- Keyboard supports navigation and tool selection; canvas painting remains pointer-based.

## Files

`modules/engine.js`: renderer, framing, quality control, salon, brush.
`modules/character.js`: original face/hair/eyes/hand meshes.
`modules/paint.js`: texture layers, interpolation, undo.
`modules/input.js`: raycasting, Pointer Events, gestures.
`modules/app.js`: session flow and UI binding.
`modules/storage.js`: versioned browser save.
`modules/audio.js`: generated sound.
`modules/icons.js`: original vector icon paths.

The game reuses `../../js/vendor/three.min.js` and its existing MIT license. No package installation is needed at runtime. Serve over HTTP, not `file:`.

## Tests

`node --check` on all game modules, launcher and modified integration JS.

CPU tests require Node and `@napi-rs/canvas` as a **test-only** dependency:

```sh
node --test tests/glow-studio.test.mjs
```

Coverage: local paint vs untouched pixels, smooth stroke coverage/UV orientation, exact layer undo, finite character geometry, face/lip ray hits, five front-facing nail UVs, corrupt/versioned/quota-limited storage, pointer cancellation, two-finger paint suppression, bounded undo memory.

Before release: run actual desktop Chrome/Firefox/Safari and iOS/Android tests; inspect skin/eyes/hair/hand closeups; complete at least three visits; verify all tools/undo/portfolio/reload; test portrait and landscape and controls not obscuring targets; check page navigation after closing the iframe; background audio and resume; context loss/restore; measure frame times and memory. Fix results before broadening content.
