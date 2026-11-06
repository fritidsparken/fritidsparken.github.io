# Downhill MTB Challenge 2 — 2026-11-06

This revision follows the user's requested thicker MTB tires, broader forward-facing rider, ten triple-length routes, harder tricks/landings and more vivid colors. It supersedes the initial 20-course Blender redesign. Real WebGL visual/mobile/performance verification remains limited by the provided browser's disabled renderer; CPU tests and Blender previews are not presented as GPU gameplay proof.

## Models and art

Original Blender 4.3.2 sources generate the cyclist/bicycle, scenery and wildlife GLBs. Rider tires have three rows of chunky tread, an enlarged .425m outer radius, and at least .16m width across every bicycle variant. Torso and limb cross sections are about 25% wider. Rear helmet decorative eyes are removed; the actual pupils are on the forward -Z face. Frame/fork clearance and wheel rotation match the new tires. Front and rear Blender renders are in this directory.

Scenery has more saturated greens, blues, flowers, warm dirt and turquoise water. The renderer uses sRGB output and Reinhard tone mapping. Color textures are tagged as sRGB. There is no indexed or reduced-color palette: the normal RGB output already supports 8 bits per RGB channel (16,777,216 combinations); this revision changes art direction, not an imaginary color-count switch.

## Ten longer routes

Each route retains a stable original identity for artwork. `c.index` is now the menu position; `c.id` remains its legacy identity. Original layout data is retained in source. New records use `long-v2:` keys inside the same save object, preserving legacy times/ghosts without applying a short-route ghost to a different track.

| Route | Previous progress length | New progress length |
| --- | ---: | ---: |
| Gröna dalen | 256 m | 768 m |
| Pine Forest | 315 m | 945 m |
| Rocky Mountains | 380 m | 1,140 m |
| Tropical Jungle | 369 m | 1,107 m |
| Desert Canyon | 288 m | 864 m |
| Alpine Snow | 350 m | 1,050 m |
| Bike Park Extreme | 410 m | 1,230 m |
| Waterfall Valley | 320 m | 960 m |
| Neon Bike Park | 410 m | 1,230 m |
| Northern Lights | 369 m | 1,107 m |

Lengths are authored progress units, as used by the existing game; the curving world-space centerline is longer. Three sectors retain original control-point spacing, with mirrored/varied lateral paths and reordered obstacles. Each has three times the original events, slightly narrower paths and stronger speed-dependent drift.

## Flight and tricks

Flight position and momentum are integrated in world space. Route projection only queries underlying terrain; it does not move or turn the airborne bicycle. The rider and camera use the takeoff heading with limited explicit input correction. Heading eases toward the road after landing. Airborne interpolation is used only across two airborne samples, preventing stale takeoff coordinates from pulling the rider toward the origin.

Bunny-hop impulse is 3.3m/s before bike modifiers; gravity is 22m/s². A bunny hop preserves the approach vertical velocity from the ground slope, avoiding artificial extra airtime downhill. Measured neutral hops are about 0.289s: 2.86m at 10m/s and 5.73m at 20m/s on both flat ground and a −15% grade. Ramp impulse depends on speed and actual ramp grade, bounded before modifiers. Bicycle pitch, rather than the flight trajectory angle, controls landing orientation so a stationary hop remains stable. Trick difficulty, variation bonuses and repeat penalties replace automatic escalating score for repetitions. Points are banked only after a valid landing. Incomplete tricks, bad heading, bad bicycle pitch, excessive impact or leaving the route produce explicit feedback. Landings and tire offset match the riding surface.

## Verification

- `node tests/downhill-mechanics.cjs`: ten routes, fixed-step simulation at 30/60 render rates; world-space momentum/projection; short-hop duration/range; trick scoring and failure cases; legacy save preservation; airborne camera and first-takeoff rendering checks.
- `node tests/downhill-assets.cjs --quality=low` (and medium/high): all ten scenes per quality, real project GLTFLoader and GLBs, finite geometry/bounds/matrices, tire/body dimensions, forward pupil positions, and 320 rider poses across eight bicycle variants per run.
- Blender front/rear rider renders inspected.
- Shared assets remain cached across courses; 32m scenery chunks, 20% vegetation LODs and bounded distance activation remain. No hardware FPS claim is made.

## Instructions applied

Read directly from `gamedev-skills/awesome-gamedev-agent-skills` (revision 19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9), without claiming CLI installation: router, create-game-assets/three-d-pipeline, threejs-gltf-loading, threejs-materials-lighting, physics-tuning, input-systems, camera-systems, game-feel, performance-optimization, game-ui-ux, audio-design, save-systems and game-ai. The existing Three.js r160 and vendored loader remain. No new third-party assets, audio recordings or dependencies are introduced.
