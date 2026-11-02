# Stuntcykel: 20 courses, loops and ravines

## Course compatibility
The original seven course IDs, layouts and records are preserved. Thirteen new courses bring the total to ten daylight and ten nighttime courses. New courses use seeded city detail, shared PBR materials, glass facades, vegetation and bridge geometry. Day/night selectors expose the two groups; numbering and next-course navigation handle all 20.

## Physics
Loop sections constrain the motorcycle to the inside of a circular road while contact is maintained. Tangential speed responds to throttle, gravity, drag and braking. Jumping or losing normal contact releases the bike into the original airborne physics. Completing a loop awards 400 points once per attempt. Retry restores checkpoint score and skips already-passed rings. Ordinary road physics is unchanged.

New ravines have no collision surface until 28 units below the road; a missed jump triggers the normal crash/retry state before reaching the bottom. The ground and road meshes have matching holes, with layered rock walls and water below. Flat run-ups allow acceleration from checkpoints before loops and jumps. Camera framing includes the ring during loop riding and avoids aiming into the ravine floor.

## Music repair
The published MP3 was downloaded and decoded successfully (62.98 seconds). Enabling music previously did not disable a saved master mute. Music-on now also enables the master, and an explicit Starta musik button restores audible music volume and retries failed loads. Keyboard driving also resumes the audio context from a user gesture. The status reports loading, playback, mute, pause, context suspension and music-load failure; requests time out instead of hanging indefinitely. User volume settings remain adjustable.

## Verification
- Physics regression covers all 20 courses, 10/10 day/night count, every loop, low-speed braking, falling into every ravine, and restarting from every new checkpoint.
- Three.js scene test covers all 20 courses at four viewport sizes and three quality levels with repeated builds and disposal. GPU rendering is not covered by this test.
- Audio mixer tests cover asset loading, engine crossfades, pause/resume, mute and disposal.
- Real-browser playback state and visual observations are recorded separately in the delivery report; no measured mobile FPS or Safari result is implied.
