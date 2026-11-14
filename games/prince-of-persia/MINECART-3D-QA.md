# Flöjtens eko — true 3D rebuild

This branch replaces the reference-image backdrop and sprite animation with Three.js geometry: a continuous cave, sloping curved rail graph, seated Navid/cart, animated mesh cape and wheels, a physical destination door and deep open chasms. The reference images supply material textures and the original door artwork. The previous generated `floor.webp` and `cart*.webp` are not loaded by this implementation.

## Validation completed

Run `node games/prince-of-persia/tests/minecart.cjs` and `node games/prince-of-persia/tests/cave-geometry.mjs`.

The geometry suite passes all five caves, including 1,548 rail-centre ground samples within 3 cm, absent floor faces at pit centres, 55-metre chasm walls, destination door placement and resource disposal.

- Five courses reach their destination using safe choices and intended jumps.
- Actual arc-length travel; continuous route joins/tangents.
- Latest valid left/right choice wins; choice locks after junction.
- Acceleration/braking return smoothly to base speed.
- Jumps are rejected outside intended jump windows.
- Wrong tracks and missed jumps fall under gravity and respawn at checkpoints.
- Checkpoint serialization/restoration and manual restart.
- Rail gauge ±0.78 matches wheel centers; wheel base is placed at rail top 0.16.
- Physics updates at 90 Hz; render interpolates snapshots. Camera and cart share one smoothed orientation to avoid a side-view lag.

## Required before merge / public deployment

Do not merge until browser visual and device checks pass. This is the user's explicit acceptance condition.

1. Review all three video references. They were opened and retried on 2026-11-14, but all players remained at time 0 / readyState 0. Their camera/motion were **not analyzed**:
   - https://youtube.com/shorts/wbUrR7aaaOQ
   - https://youtube.com/shorts/cpBJysAFAw4
   - https://youtube.com/shorts/GUgNX1fFYhU
2. Run the game in a WebGL 2 browser. The available test browser failed at context creation with `GL_VENDOR = Disabled; GL_RENDERER = Disabled; BindToCurrentSequence failed`. This prevented in-browser inspection of the new scene, graphics performance and motion.
3. Visually verify every cave: rear-centered Navid, natural ground/rail contact, passing geometry, approaching door, branch transitions, jump lips and chasm depth/fall camera.
4. Test desktop keyboard controls and simultaneous mobile pointer inputs in portrait and landscape. Verify layout does not cover cart/track, no selection/zoom/scroll, no sticky acceleration/brake after pointer cancellation.
5. Measure frame pacing on mobile and desktop; check context loss, texture loading errors, pause/resume and world3 intro entry.

The public main branch is intentionally unchanged until these acceptance checks can be completed.

## Offline appearance check

A Blender rendering of the exported actual mesh scene confirmed the centred rear view and volumetric cave, but does not verify Three.js lighting, frame pacing or browser input. The character is a newly modelled procedural mesh; its visual fidelity still requires review against the approved character reference, especially cloth and hair. Do not describe this as a reference-matched or performance-verified final release.
