# Neon alley asset provenance

Photographed PBR materials from Poly Haven, CC0:
- Wood Floor — Dimitrios Savva: https://polyhaven.com/a/wood_floor
- Brick Wall 001 — photography Dimitrios Savva, processing Rob Tuytel: https://polyhaven.com/a/brick_wall_001
- License: https://polyhaven.com/license (https://creativecommons.org/publicdomain/zero/1.0/)

Local oak/brick WebP sets contain base colour (sRGB), OpenGL normal and packed ambient occlusion/roughness/metalness (linear). Source JPEG maps downloaded from the asset pages' dl.polyhaven.org links, resized to 2K colour for oak and 1K other maps, WebP quality 88. Materials are tinted and polished in the renderer. No third-party network access is required while playing.

The sofa, foliage, planter, rack, truss, spotlight and neon sign in lounge-kit.glb are original offline-authored models. Rebuild with `node tools/bowling/build-lounge.cjs`. Geometry is merged by material before export. Furniture is visual only and never enters the physics world.

Sign lettering uses Three.js's bundled Helvetiker bold outline font. Font source is retained in tools/bowling/fonts; Three.js distribution license is in ../vendor/three-LICENSE.txt. Font data also contains its original typeface copyright/license metadata.

The supplied reference image is a design reference only: not embedded in the scene or shipped as a background.
