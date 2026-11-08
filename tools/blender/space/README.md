# Rymdäventyret original Blender library

Rebuild with `blender -b -t 4 -P tools/blender/space/build_assets.py`.
Append `-- --render` for the five neutral studio renders. Blender 4.3.2
was used and all exports were produced by Blender's glTF exporter.

Source coordinates are +Y forward and +Z up. The exported GLB models face
-Z and use +Y up, in metres. All geometry and material design is original.
All `.blend` files are saved with compression. Texture attribution is
maintained separately by the game integration.

## Asset contracts

| File | Contract |
| --- | --- |
| `rocket/rocket-high.glb` | Curved open-cockpit hull, separate translucent canopy, two engines, solid wings, weighted astronaut rig and looped head/hand animation |
| `rocket/rocket-low.glb` | Same names/rig, reduced triangle count |
| `asteroids/asteroid-library.glb` | 18 unique named meshes `asteroid_00` to `asteroid_17`, each centered at the origin; instantiate individual meshes rather than displaying the whole group |
| `materials/crystal.glb` | Three golden facets in one collectible group |
| `stations/orbital-station.glb` | Orbital habitat, solar wings, antenna and forward docking ring |
| `vehicles/moon-rover.glb` | Six wheels, articulated-looking suspension, seat, instrument screen, stereo camera |
| `terrain/landing-base.glb` | 14m landing platform and adjoining research habitat; base at ground level |
| `satellites/research-probe.glb` | Gold satellite bus, solar arrays, antenna and signal beacon |

Rocket glow material is `Ion cyan emission`, red enamel is `Crimson enamel`,
and the canopy is `Cockpit blue glass`. `EngineCoreLeft/Right` remain named
for engine effects. `PilotRig` has torso, head, handL and handR bones. Use
an AnimationMixer for the exported animation clip. Static disconnected
parts are joined by material to reduce draw calls.

## Visual review

The reference is `Red Rocket Through Saturn’s Rings-3.png`: white rounded
body, red swept wings, transparent bubble canopy, seated forward-facing
astronaut, blue rear engines, warm rim lighting. The first render exposed
a gap at the cockpit rim; the hull was rebuilt with cross-sections following
the elliptical rim. Rear, front, side, top and cockpit views were then rendered again.
The optional `render_saturn.py` creates an offline composition study using
the same Blender assets; it is not a screenshot from the game.

Studio renders verify model shape only. They are **not** proof of WebGL
rendering, game performance, or visual equivalence to the reference image.

## Release finishing pass

After the base build, run `blender -b -t 4 -P tools/blender/space/finish_rocket.py`.
This writes packed original color/roughness maps, adds a separate `LandingGear` group, and re-exports both LODs. Append `-- --render` to produce `rocket-release.png`, an offline Blender review image. The game hides the gear in flight and aligns its feet with the landing platform. The verifier decodes embedded images to reject empty/black texture exports.
