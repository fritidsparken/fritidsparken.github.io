# Glow Studio

Browser-local 3D makeup and nail styling game for Fritidsparken. Launch from the game hub or `games/glow-studio/`. Uses the repository's Three.js r160, with no installation or external runtime asset requests.

## Implemented player flow

Receive a customer → apply makeup by dragging → switch to manicure → paint individual nails → finish → earn creativity XP → save a photo → receive the next customer.

Three original customers have distinct complexions, jaw/nose proportions, hair colors and styles (long waves, curls and a short crop), eyes and clothes. Wishes rotate. Rewards count creative activity, colors, tools and painted nails, never a beauty score. Twelve palette colors and five material finishes unlock with progression; studio furnishing colors change at levels 5, 10 and 20.

### Makeup and manicure

- Genuine 3D raycast/UV painting; only touched areas receive pigment. Separate foundation, rouge, eyeshadow, eyeliner, mascara, lipstick and glitter layers.
- Five separately paintable nails. Freehand edge filing, three nail shapes, base coat, color, two-color gradient strokes, glitter, star stamps, individually placed 3D crystals and top coat.
- Roughness, metalness, iridescence and clearcoat texture maps apply locally with the brush. Matte, glossy, metallic, pearlescent and holographic finishes.
- Original brush, sponge, lipstick, file and mascara tool geometry. Surface-aligned contact with brush compression.
- Undo groups one pointer stroke across multiple surfaces, including material maps and geometric filing/decorations. A 24 MiB history budget prevents unbounded memory growth.
- A rotating tabletop fan for child-safe air drying; no UV curing lamp. Camera transitions, eye/lip/nail camera presets, pinch zoom and two-finger rotation. Painting is suppressed during two-finger gestures.
- Facial blinking, breathing and a lip-smile morph. Result rotation, three plain photo backdrops plus salon, portfolio download and local persistence.

### Technical behavior

- Local WebGL rendering with Three.js's WebGL2/WebGL1 compatibility path. No WebGPU-only dependency, streaming server or flat-image replacement for 3D.
- Original continuous face mesh with softly contoured complexion texture, curved nail plates with natural nail-bed tones, sculpted fingers, individual hair styles, iris/lash detail, generated skin microtexture, PBR materials and procedural PMREM environment. Makeup brush size starts large; pointer hit-testing accepts nearby strokes so children do not need to trace tiny contours precisely. A single nail is enough to complete the styling task; all five remain paintable.
- Key/fill/rim lighting and one shadow map. Four resolution/shadow presets; measured frame-time adaptation with cooldown; manual quality selection.
- Hand assets are constructed when the manicure station is first entered. Real loading milestones count renderer/salon/customer/input setup rather than a fake timer.
- Responsive tool tray, reduced-motion handling, touch-scoped scroll suppression and named keyboard-accessible UI controls. Painting itself requires a pointer.
- Full-viewport iframe in the existing game hub. The logo and Escape return to games. Message source and origin are checked; closing releases the frame and restores page scrolling.
- Versioned local progression, settings and six compressed portfolio images. Corrupt and unavailable storage are handled. Audio begins after a user gesture and suspends in the background.
- Context-loss feedback, texture re-upload on context restore and bfcache-aware lifecycle handling.
- `?debug` shows frame time, FPS, draw calls, triangles, texture count, rough memory estimate, renderer, preset and resolution.

## Verification and remaining limits

Automated tests run real geometry, raycasting, canvas painting, input, storage and application flow. The application-flow test substitutes a renderer and audio, so it does **not** establish browser GPU correctness. It completes three consecutive customers, undo, finish, once-only reward, photo generation, portfolio and persisted XP.

The supplied cloud Chrome instance reports WebGL disabled (`Error creating WebGL context`). The failure state was verified, but the actual WebGL scene, GPU material/shader output and runtime FPS could not be tested here. Safari, Firefox, iPhone, iPad and Android were not available. Original geometry was also inspected through an offline diagnostic render; that is not a screenshot of the game and does not verify final GPU lighting/materials.

This release completes a compact playable implementation in code. It should not be represented as having achieved the brief's high-end realism benchmark or as having passed physical-device QA. It uses stylized procedural characters, not artist-refined scanned/rigged models. Additional art refinement and actual GPU/device review remain necessary to substantiate that visual target.

Known intentional compromises: canvas texture compositing instead of GPU render-target painting; environment reflections instead of a live planar mirror; no depth-of-field pass; no external GLB/KTX2/Draco asset pipeline because assets are procedural; synthesized ambient audio instead of a produced soundtrack; simplified wardrobe/body, facial rig and hair; local file stroke modifies nail edge width without physics simulation. Studio progression changes furnishing colors rather than loading four wholly different salon layouts. There are three customers and rotating wishes, not a large narrative campaign.

## Test commands

Node 24 and test-only `@napi-rs/canvas`:

```sh
node --test tests/glow-studio.test.mjs tests/glow-flow.test.mjs
```

Run `node --check` on the game modules and integration JavaScript. Dependency and original-asset provenance are in `LICENSES.md`.

Before claiming device certification: verify real Chrome/Firefox/Safari rendering, portrait/landscape control occlusion, three visits, every tool/undo/material finish, photo framing, local storage quota, audio/background resume, context recovery, returning to the game hub, frame times and peak memory.
