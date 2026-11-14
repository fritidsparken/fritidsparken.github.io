# Coins, cave atmosphere and ending verification

## Implemented

- 419 deterministic collectible sun coins across ten minecart courses, using the established gold palette, bob, attraction, rise/pulse, sparkle, HUD flight and count bounce. Pickup identity persists through checkpoint resets and reloads.
- 67 coins in the ten aqueduct rooms using the original shared treasure renderer and pickup feedback/chime.
- Junction text/countdown overlay removed. Track choice remains visible on direction controls and chosen rails; jump warnings retained.
- Original dark-haired Navid image is unlit and excluded from tone mapping. The cape uses independent gust/wave frequencies and a smooth speed envelope, with pause and slowdown handling.
- Doors open on physical hinges on all ten courses, revealing a lit 18 metre passage.
- Speed-dependent rolling and wind, metre-spaced axle rhythm, jumps, landings, coin and door effects.
- Three recorded Swedish ElevenLabs ending cues with ducked original score and locally animated characters/water/light. At completion, 2.7 second black fade, SLUT, and replay-to-main-menu control.
- Aqueduct boss goal works after all locks are defeated. Fresh completion starts the cave intro automatically; completed-save recovery preserves a cave checkpoint/coins. Explicit menu replay remains possible.

## Automated checks

Passed track, camera, rails, cave geometry, hinged doors, coins, character, audio, actual controller integration, aqueduct and offline Canvas tests. All ten courses complete through the real physics simulation; wrong branches fall and checkpoint restores work. Integration covers actual controller transitions, input, pickups, sound events, door events, story sequencing, save recovery and replay navigation.

## Browser checks

A temporary fixture used the production HTML/CSS, story cues, story reader, motion module, music and ending functions without WebGL. All three recordings completed (13.714 + 18.207 + 20.193 seconds). Observed music playing at volume 0.065 during narration and paused at zero after fade. The actual replay control navigated to https://fritidsparken.se/games/prince-of-persia/ and the main menu rendered.

Observed Canvas rendering times varied around 9–20 ms with adaptive mesh detail in this cloud browser. This is not a device FPS guarantee. Screenshots: outro-home.jpg and ending-slut.jpg. Temporary browser fixtures were removed from deployable files.

## Limits

The cloud browser has no working WebGL 2 context, so the entire 3D ride was not visually playtested here. Geometry, physics, camera, controls, model and audio were tested independently. Physical Safari/iPhone/Android hardware performance remains unverified.
