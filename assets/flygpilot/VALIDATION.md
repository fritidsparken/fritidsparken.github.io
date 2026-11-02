# Flygpilot redesign – verification

Upgraded: Gröna dalen, Bergsäventyret, Kustflygningen, Solnedgången, Molnäventyret.

Shared renderer additions: procedural terrain/wood detail, layered distant hills, instanced irregular clustered crowns, distance reduction of distant crowns, rocks/reeds, cottage trim/chimneys, wooden dock, coast lighthouse, sky gradient and cloud sprites, reflective animated water normals, aircraft control surfaces and propeller blur, near/far chase camera, three quality profiles. Original collision terrain within the playable flight corridor, routes, coins, progression and landing logic remain intact.

UI/audio: dark HUD panels, speed readout, four separate volume controls at 65/30/20/35%, camera control, compact lower-left touch control, locally hosted licensed music, dynamic synthesized engine/wind. Audio starts after interaction, pauses with the game, and is disposed on leaving.

Checks: `node --test tests/flight-*.test.cjs`: 10 passing tests. Includes automatic input-driven takeoff and manual touchdown on all five courses, collision/landing grades, coin altitude, save migration/spending, pause/resume, stage progression, multitouch and joystick. Renderer test builds all 15 course/quality combinations and checks finite geometry/instance matrices and camera changes. This renderer test uses a mocked GPU renderer; it does not verify shader compilation or measure FPS.

Browser: Chrome preview successfully loaded the game, started and climbed under keyboard input. Browser has no WebGL; only CPU fallback can be inspected. Full WebGL visual matching, GPU shader execution, mobile-device performance and the 30–60 FPS target are NOT verified. The generated reference images are more photorealistic than this procedural renderer; exact visual parity is not claimed. Engine/environment sound is synthesized, not location-recorded. HDR photographic lighting and screen-space AO are not implemented.
