# Stuntcykel graphics upgrade — 2026-11-02

## Implementation

- Authored procedural Three.js models and 256 px PBR albedo, normal and roughness textures for asphalt, concrete, brick, wood, metal, rust, rubber, fabric, grass and gravel. No remote asset downloads or new runtime dependencies.
- PMREM environment lighting, ACES tone mapping, sRGB colour textures, linear normal/roughness maps, adaptive shadow resolution and soft local contact occlusion. This is contact occlusion, not full-screen SSAO.
- Rounded bike panels, detailed wheels, spokes, brake discs, engine, spring, articulated swingarm/forks and blended joint positions with anchored hands/feet.
- Structural ramp supports, pavement joints, varied building materials, shop fronts, street furniture, harbour containers, cranes, moving background traffic and a textured sky.
- LOW/MEDIUM/HIGH and manual override; low keeps PBR textures. Automatic mode reduces quality after sustained slow frames. Instanced geometry, quantized geometry cache, pooled particles and explicit disposal.
- Collision geometry, track generation, physics and scoring are unchanged. Tall scenery stays behind the riding plane. No motion blur, depth of field or added camera shake.

## Passed checks

`node --check js/stunt-bike.js`

`node tests/stunt-bike.test.cjs`: all seven courses complete; idle, acceleration, braking, reverse, both flip directions, double flip, crash scoring and checkpoints pass.

`node tests/stunt-bike-visual.test.cjs`: real Three.js scene geometry checked at seven levels, four camera aspect ratios, three quality profiles and three bike poses, twice. Finite vertex/instance/world matrices, texture presence, instance batching, bounded particles, resource reuse and cleanup pass. GPU/Canvas drawing is stubbed in this test.

Browser layout checked using 390, 768, 1024 and 1366 px iframe viewports. Controls do not overflow; mobile buttons are 46 × 57 px. Start and gas pointer input respond in the Canvas fallback.

## Unverified

The available browser reports `GL_RENDERER = Disabled` and cannot create a WebGL context. Therefore the final WebGL appearance, shader compilation, GPU frame rate, real-device multitouch, and graphical sightlines during full playthroughs have NOT been verified. The scene tests are not substitutes for these checks. No claim of a measured stable FPS or a completed visual acceptance test is made.
