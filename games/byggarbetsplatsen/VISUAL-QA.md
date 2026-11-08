# Blender graphics upgrade — validation, 8 November 2026

## Delivered

Six original articulated Blender vehicles, a scenery kit and nine installable parts for each of the six projects. High and reduced GLB exports share their node contracts. The source `.blend` is organized into named asset collections; only the excavator collection is initially visible. Six Cycles thumbnails and the title/card illustration are rendered from these same models.

The playable world loads GLB models before entering the game. Hydraulic endpoints, track treads, axle rotations, loader articulation, dumper cargo, vertical crane cable, project cargo and mixer chute are connected to the existing work cycle. Work commits retain the existing delayed state transition. Tracked dumper collision clearance is increased in both movement and route planning. State schema and storage keys are unchanged.

Warm sunlight, sky fill, environment reflections, individual material roughness, soft GPU shadows, soil grain, clay excavation walls and timber edging replace the old presentation. Static scenery is batched by material. Low geometry exports total approximately 2.3 MB; full exports approximately 7.4 MB. Geometry is shared across clones. Lighting is dynamic: this version does not include baked lightmaps, so no baked vehicle shadow follows or remains behind a moving machine.

## Automated verification

`node --test tests/byggarbetsplatsen.test.cjs tests/byggarbetsplatsen-assets.test.cjs`

Nine passing tests cover:

- All six project state machines, 107 actions each, conservation of soil and saved-state round trips.
- Full Villa driving, work animation and collision cycle with both the original fallback fixture and the real Blender vehicle integration.
- Wrong vehicle/distance/full truck rejection and corrupt-save recovery.
- Actual high and low GLB parsing, required pivot nodes, hydraulic endpoints, finite transforms and vertical crane cable orientation.
- All project installation nodes and downward-sloping house roofs.
- Local script, stylesheet, font and cover references.

## Observed browser checks

Cloud Chromium on Linux, desktop viewport approximately 1348 × 935. This browser exposes no WebGL context, so it exercises the reduced CPU renderer. Verified game start, first excavation (25 points), transfer to dumper (50 points / 25% cargo), driving assistance to the soil pile, dumping (75 points), machine switching, and saved progress after reloading (75 points / 8%). Inspected gameplay screenshots and the finished Villa roof after correcting its slope. The separate test preview never writes game saves or unlocks projects.

Local cached model loading observed at 67–120 ms. CPU rendering observed around 12–14 fps with reduced assets, versus about 7 fps with full assets. These are local test-environment measurements, not Internet loading times or GPU/mobile benchmarks. The CPU fallback omits shadows, reflection maps and glass surfaces on cabs; it is visibly simpler than the intended WebGL presentation.

## Verification limits

No physical phone, tablet, Chromebook or hardware-accelerated desktop was available. Touch input and hardware GPU frame rate were not measured. GPU lighting/reflection code has not been visually verified in a WebGL browser here. Blender renders validate asset forms/materials but do not prove identical in-game lighting. The concept image remains a style target, not a pixel-identical reproduction.
