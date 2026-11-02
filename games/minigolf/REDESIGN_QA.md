# Minigolf redesign — 2026-11-02

## Delivered

- 18 individually directed environment profiles and lighting palettes in `environments.mjs`.
- 17 generated photographic concept references plus the user's original hole-one screenshot, named by course in `references/`. The references are design targets, not screenshots or collision specifications. AI image geometry is approximate; authored game coordinates take precedence. Prompts are in `manifest.json`.
- Course inventory in `COURSE_INVENTORY.md`. `courses.mjs` and `physics.mjs` are unchanged.
- Batched individual stone kerbs, clipped continuous turf mesh to remove coplanar joints, gravel margins, instanced planting/flowers/ferns, lanterns, ponds, fountains, pergolas, pine trees, cabin and dock details. Existing local CC0 albedo/normal/roughness maps retained.
- Per-course skies, ACES exposure, PMREM environment light, directional shadows snapped to a texel grid; lit night-course lamps and emissive accents. Sky is procedural LDR, not a claimed photographic HDRI. AO is contact decals, not screen-space AO. No expensive full-screen bloom pass.
- Instanced broadleaf vegetation with reduced-distance LOD on medium/high. Low, medium and high/Ultra presets, resolution adaptation in Auto. Fixed pool of local lights (maximum 3 medium / 6 high). Resource disposal includes normal maps.
- Raised follow camera; whole-course overview calculates its distance from full course bounds. Mobile glass controls stay at the edges.
- Recorded hit/impact/ambience assets, 18 ambience mixes, speed-sensitive rolling, persistent licensed instrumental music, crossfades, two saved volume sliders, mute controls and background pause. See `assets/audio/CREDITS.md` for exact sources and adaptations. No YouTube ripping.

## Verification

- `node --test tests/minigolf-*.mjs`: 50 passing tests. Covers authored courses, physics, transfers, score state, new mesh normals/finite geometry, start-surface height, gap preservation and audio setting persistence.
- `node games/minigolf/tests/graphics-regression.mjs`: simulation completed all 18 courses; closed contour checks passed at three moving-bridge offsets.
- Browser scene construction for all 18 holes at low, medium and high: finite geometry, no exceptions. Overview contact sheet inspected using fallback renderer.
- Browser checks: game loads, settings present in Swedish, music/effect sliders and credits link present; a keyboard shot increments stroke counter and starts ball movement.
- Portrait 390×844 and landscape 844×390 iframe viewports checked for panel placement and game start.
- All 14 MP3 files decoded with ffmpeg successfully.

## Verification limits and remaining art direction

The QA browser has no WebGL context. Browser screenshots show the low-resolution CPU fallback, not the GPU/PBR path. Actual GPU shadow quality, sustained FPS, acoustic balance and physical mobile touch ergonomics require hardware review; 60 FPS is a target, not a measured result. The procedural realtime scenes are less detailed than the photographic concept art. Reference-image-level foliage, photographic HDRI, screen-space AO and post-process bloom are not claimed as completed. Environmental species-specific calls (gulls, bees, tropical birds) are not separately recorded; the 18 mixes use five recorded source layers. Cup foley uses adapted recorded golf-ball bounces; friction is synthesized. No collider or course-coordinate edits were made.

Publication note: reference images were resized for delivery. The music file is a 60-second mono excerpt rather than the complete original track.
