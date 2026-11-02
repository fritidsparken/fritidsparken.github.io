# Minigolf rendering

The rendering update keeps `courses.mjs`, `physics.mjs`, state, input handling, scoring and menus unchanged. All collision geometry remains analytical and independent of scenery.

## Materials and light

Local CC0 ambientCG albedo, OpenGL normal and roughness maps, resized to 512px WebP; see assets/materials/CREDITS.md. Albedo is sRGB; data maps are linear. Putting turf uses a brighter derived albedo. MeshStandardMaterial/PhysicalMaterial, ACES, directional/hemisphere light and a PMREM-filtered equirectangular environment provide the WebGL pipeline. A procedural sky provides horizon, clouds and sun. Soft contact decals provide inexpensive ambient contact shading at every quality level (not screen-space SSAO).

## Geometry and performance

Terrain is continuous displaced geometry, conservatively lowered under course surfaces. Trees use curved trunk and branch meshes, folded leaf meshes and per-tree instancing. Palms use curved fronds. Rocks have smoothly weathered geometry. Water has normal detail, waves and environment response; lava has emissive fissures. Scene decorations keep a wide corridor clear; the camera additionally hides bounding volumes that obscure the ball or aiming corridor, including instanced foliage.

Boundary marching squares construct the union of course surfaces, including rounded ends. Moving bridges use 17 cached contour states matching the moving deck and fixed landings; no per-frame geometry allocations. Rails are batched into one mesh. Intentional launch gaps remain separate closed islands.

High/medium/low retain textures. Quality controls pixel ratio, shadows, vegetation density and mesh subdivision; automatic mode lowers resolution after sustained slow frames. The no-WebGL fallback supports textures, instancing and depth buffering at reduced resolution; it cannot reproduce GPU PBR reflections/shadows.

## Checks

Run `node games/minigolf/tests/graphics-regression.mjs` for closed contours at three bridge positions and deterministic automated completion of all 18 holes. Review start/middle/green for every course in browser. Changes to menus/input/physics should remain absent from the rendering diff.
