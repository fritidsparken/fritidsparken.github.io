# Stuntcykel urban presentation / sampled audio — 2026-11-02

## Implemented
- Open bridge deck with separate piers, rear railings and slender ramp supports; the continuous wall is removed. Promenade, seating and trees are at ground level below the bridge. Physics surfaces are unchanged.
- CC0 recorded highway ambience and studio wind Foley; speed-dependent wind, quiet traffic, shared effects/master/pause controls.
- Responsive side-view camera targets tyre contact at 72% canvas height, with smoothed look-ahead and jump/landing framing. Collision coordinates unchanged.
- Three-dimensional recessed glass window bays, projecting floor slabs, balconies, HVAC, antennas, street-level planters, benches, graffiti signs, cones and a crane.
- Instanced, seeded individual leaf geometry with bounded wind deformation, animated distant birds and slow sky movement. Existing traffic retained.
- Steel tread ramp material, hazard plates, real trusses and supports. Existing asphalt/concrete normal and roughness maps now 512px procedural textures.
- Number plates, radiator louvers, curved exhaust, sprocket details and orange Metro paint; existing articulated rider, forks, suspension and wheel rotation retained.
- Dark translucent HUD, orange throttle, responsive controls, music/motor/effects sliders and separate master/music toggles.
- Sample-based Web Audio mixer: four distinct engine excerpts, overrun layer, recorded metal impact, compressor, fades, limited pitch adjustment, same-origin assets and async cleanup guard.
- Licensed instrumental Raving Energy loop, with stored playback position on pause/resume and attenuation while accelerating.
- Three quality settings affect shadow resolution/filter, render resolution, reflection strength, anisotropy and vegetation detail.

## Automated verification
- `node --check js/stunt-bike.js` and `node --check js/stunt-bike-audio.mjs`.
- `node tests/stunt-bike.test.cjs`: original seven courses, acceleration, braking/reverse, flips, failure and checkpoint tests pass without physics changes.
- `node tests/stunt-bike-visual.test.cjs`: real Three.js transforms and geometry, 7 tracks × 4 sizes × 3 quality settings × 3 poses, twice; resource reuse/disposal and contact-plane separation. New assertion verifies projected wheel contact at 70–74% height after camera settling.
- `node tests/stunt-bike-audio.test.mjs`: local asset availability, five sample layers, throttle crossfade, bounded playback rate, overrun, mute, music pause/resume position and disposal. Web Audio nodes are mocked, not audible browser QA.

## Limits — not complete against the full brief
- Shipped engine recordings are genuine motorcycles by dklon, but the model, displacement and four-stroke motocross identity are unverified. This does NOT meet the specific verified 450cc recording requirement.
- Separate authentic tyre/asphalt, tyre/metal, suspension, tyre slip, backfire recordings remain missing. Metal contact is an adapted recorded kickstand impact.
- Materials are procedural PBR maps, not photographic scans. Reflections use the generated sky environment, not live city reflections. No full-screen SSAO or bloom pass. Visual equivalence to the photorealistic reference is not claimed.
- The cloud browser has WebGL disabled. Its preview service is shared with concurrent project work; no performance or GPU rendering claim is based on that preview.
- The connected Chrome session disconnected before the updated 3D scene could be inspected. No successful live GPU visual QA is claimed.
- Physical Safari/iOS, Android, Chromebook and tablet testing and measured 30/60 FPS remain unverified.

Licenses and exact source-to-output mapping: `assets/stunt-bike/audio/LICENSES.md`.
