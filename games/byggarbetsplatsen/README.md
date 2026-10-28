# Byggarbetsplatsen 3D

Self-contained Swedish construction game integrated through `FPConstruction` in the existing game hub. Uses the site's local Three.js build and a Canvas software fallback, with no remote runtime dependencies, login or tracking.

## Play

WASD / arrows drive; E performs the highlighted operation. Number keys 1–6 select machines. Q/R rotate, T/G raise/lower, Y/H extend/retract the excavator, U/J control the hook, B curls the bucket. C or drag orbits the camera; wheel/pinch changes distance. Touch joystick and machine-specific buttons provide the same functions. Optional driving assistance follows a collision-aware grid route and never performs work.

Six projects unlock in order and share the complete 12-stage construction loop. Villa, playground, bridge, school, fire station and apartment block have different resulting models. Material is conserved between excavation, bucket, dumper and disposal; the truck holds four scoops. Construction has delayed animated commits, preventing double clicks and partial animations from duplicating resources.

Progress is saved after every completed operation. Pause offers restart at the current stage's checkpoint and recovery of vehicles to their parking spaces without losing cargo. Vehicles in the building/road work area are moved aside before walls/rolling to avoid trapping them. Tab visibility and blur pause the game.

## Files

- `core.js`: deterministic rules, save validation, materials, progression and optional route finding.
- `world.js`: procedural models, scene, articulation, collisions, particles, camera and build visualization.
- `game.js`: DOM UI, input, audio, local storage and timed operations.
- `game.css`, `index.html`: responsive interface and local asset references.
- `../../tests/byggarbetsplatsen.test.cjs`: six project playthroughs, end-to-end villa driving through actual world movement, material conservation, save recovery and integration checks.

Run from the repository root: `node --test tests/byggarbetsplatsen.test.cjs`.

## Validation scope

Automated villa playthrough: 107 operations using all six machines, with real movement and collision functions; save/reload invariants after every operation. All six project state machines complete. Existing flight, animal clinic, waterpark and stunt bike regression suites pass. Browser inspection includes UI, excavation, loading, pause and responsive layouts. Physical iOS/Android devices and WebGL performance require device testing; the available remote browser uses the reduced-detail software fallback.
