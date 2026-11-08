# Rymdäventyret asset credits

## Original models

Original meshes, material parameters and pilot rig/animation created procedurally in Blender 4.3.2 for Fritidsparken. Reproducible source: `tools/blender/space/build_assets.py`; editable compressed Blender originals: `assets/space/blender/`. GLB exports preserve original material names and transforms. Studio renders and Saturn model study are Blender outputs, not screenshots of the game.

## Planet maps

Planet, Sun, Moon and ring textures by **Solar System Scope**, https://www.solarsystemscope.com/textures/ . Licensed under **Creative Commons Attribution 4.0 International**, https://creativecommons.org/licenses/by/4.0/ . Retrieved 2026-11-08. Files renamed from the original 2k downloads; pixel data is unchanged. Color/material effects are applied at runtime. Moon imagery is reused as artistic terrain for Europa and Enceladus; those two surfaces are illustrative, not satellite maps. The source notes that unmapped areas may include fictional terrain.

Original names and corresponding local files are preserved in `tools/space/fetch-textures.py`. Attribution is also visible in the game's settings.

## Code and sound

Three.js r160 and GLTFLoader/BufferGeometryUtils: MIT, Copyright Three.js Authors. Three.js license: `js/vendor/three-LICENSE.txt`. Loaders retained from the repository's existing vendor distribution.

Procedural nebula, atmospheric shading, engine effects, terrain and synthesized music/sounds are original game code. Music plays a slow original sequence; no third-party recordings are included.

## Astronomy

Planet descriptions and approximate facts checked against NASA Science's planet overview and linked world pages: https://science.nasa.gov/solar-system/planets/ . Distances, orbital motion and sizes in the game are compressed for play. Station locations, resources and missions are fictional. Gas giants are not landable. Moon counts use named examples rather than a changing total.
