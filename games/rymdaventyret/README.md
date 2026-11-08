# Rymdäventyret

Rymdäventyret for Fritidsparken, revision 20261108-3. Three.js r160/WebGL, native Blender/GLB models, no build step or CDN dependency.

Serve the repository with a static HTTP server and open `/games/rymdaventyret/`. Opening the HTML as a `file:` URL will not load ES modules/GLB assets reliably.

## Included systems

- Solar system: Sun, eight planets, Moon, Europa and Enceladus. Compressed orbital coordinates; floating origin for rendering.
- Flight acceleration, braking, pitch/yaw steering, inertia, turbo energy and shield/hull collisions. Free mode disables fuel consumption and damage.
- Chase, side, cockpit, orbital and photo cameras. PNG photo export. Keyboard and multi-touch controls.
- World map, destination marker, automatic steering with planet/Sun avoidance, optional quick travel.
- Landing zones on Mercury, Mars, Moon, Europa and Enceladus; reversible takeoff and drivable six-wheel rover. Procedural crater/canyon terrain with rocks and base.
- Eleven expeditions with ordered steps, reward accounting and completion persistence. Collectibles cannot be farmed twice from the same save.
- Four orbital stations with docking, repair and refuel. Probe repair missions and rover rescue objective.
- Garage: earned paints, engine/tank levels, hull proportions and wing variants. Three named variants reuse one underlying spacecraft model; they are not three independently modeled ships.
- Original synthesized audio, separate sound/music sliders, quality settings, guarded local saves and Continue.
- All textures and models are locally hosted. Failed WebGL/assets produce a recoverable error message rather than a blank screen.

## Validation

```sh
node --experimental-vm-modules --test tests/rymdaventyret*.test.mjs
python3 tools/blender/space/verify_assets.py
```

46 automated tests cover controller-level completion of every expedition, autopilot trips from Earth to every destination, real GLB parsing, camera transforms, terrain/rover construction, flight/fuel/collision behavior, upgrade spending and save recovery. Controller tests run actual main.mjs with DOM/audio/render adapters; they place the ship near objectives to verify interaction rules. They do not verify human-input difficulty or rendered gameplay.

## Revision 20261108-2

- Cancel descent state during quick travel, new games and returning home; prevents a stale landing from accessing a missing surface.
- Protect existing progress behind the explicit new-game dialog. Resume progress when choosing a mission from the home screen. Accept ground missions while already landed.
- Clear multi-touch state on pause, hidden tabs and lost capture. Keep mobile action labels visible, add a takeoff button, preserve safe areas and scroll panel contents below a fixed heading.
- Allow camera motion in photo mode while simulation is frozen; keep rover cameras above terrain and tilt the rover with the slope.
- Align the landing base under the rocket on flat ground. Model the rescue target as a rover, not a satellite.
- Original packed PBR color/roughness textures and retractable landing gear added in Blender. Rebuild with `finish_rocket.py` after `build_assets.py`; `-- --render` produces the studio review image.
- Apply output color conversion and tone mapping in the postprocessing pass. Reduce resolution after sustained low frame rates; measure FPS with wall time.
- Guard corrupt numeric save fields, avoid replaying completed missions, persist settings consistently and recover visibly after WebGL context loss.

## Verification limits

The managed browser cannot create a WebGL context, including on the unchanged baseline. The real HTML menus/settings were inspected. The Blender release render verifies model/materials, and the Python check decodes all embedded PBR textures. No WebGL pixel, shader, iPhone gameplay, FPS or visual reference-match result is claimed. A WebGL-capable device still needs to validate those items.

## Scope

Eight planets, three moons, eleven expeditions, five landing worlds and four orbital stations are implemented. The map is an orbital chart. Garage variants reshape one modeled rocket. Pluto bonus, three separately designed ships, a freely orbitable 3D map, garage decals/cockpit customization and streamed terrain are not part of this revision. The cinematic reference images remain a visual target; they are not screenshots of this build.

The site integration adds only the new game card and bumps its script version. Other game source is unchanged.
