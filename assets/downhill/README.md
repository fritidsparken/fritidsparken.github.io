# Original Downhill Blender library

Created with Blender 4.3.2 from the supplied Downhill art brief. Original generated geometry; no downloaded third-party models/textures/audio. Existing project Three.js and loader licenses remain in their original vendor directories.

- `models/environment.glb`: named vegetation, stones, timber, mountains, clouds and vegetation `_lod` meshes. Y-up metres, ground pivots except normalized timber/mountains.
- `models/wildlife.glb`: rabbit/squirrel/bird/otter/butterfly, ground origin, front +Z. Wing pivots animate around local Z.
- `characters/rider.glb`: Y-up, forward -Z, named rigid parts, PedalCycle clip. Runtime uses the same pivots for responsive procedural animation.
- `blender/*.blend`: editable source scenes.
- `../../tools/blender/downhill/*.py`: reproducible source generators, run from Blender background CLI.

Revision MTB Challenge 2: wider knobby tires, broader rider, forward-only face, more saturated scenery palette. Runtime uses full RGB/sRGB rendering, not an indexed or reduced-color palette.

Runtime collision is supplied by existing course geometry; detailed scenery never becomes the physics mesh. Sources are authored for this project; the supplied image guides palette/forms and is not shipped as game geometry. Visual/WebGL acceptance remains pending; see docs/downhill-skill-usage.md.
