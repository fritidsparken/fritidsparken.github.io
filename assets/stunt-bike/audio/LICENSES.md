# Stuntcykel — audio sources and licenses

Checked 2026-11-02. All shipped audio is served locally, not hotlinked.

## Recorded motorcycle audio

Author: **dklon**. Collection: **Engines – Startup, Idle & Rev**.
Original: https://opengameart.org/content/engines-startup-idle-rev
Download: https://opengameart.org/sites/default/files/Startup%2C%20Idle%20%26%20Rev.zip
License: **Creative Commons Attribution-ShareAlike 3.0 Unported**
https://creativecommons.org/licenses/by-sa/3.0/

The author describes these as actual recordings of several motorcycle makes and models.
The source does NOT establish a 450cc four-stroke motocross motorcycle. We do not claim that provenance.
All derived WAV files below remain CC BY-SA 3.0, attributed to dklon.
Changes: selected passages, mono/24 kHz conversion, DC removal, level normalization and loop-seam crossfade. No synthetic oscillators.

| Distributed file | Original recording | Extract, seconds | Use |
|---|---|---|---|
| idle.wav | 090912-022.mp3 | 2–6 | Idle sample layer |
| low.wav | 090912-017.mp3 | 1.7–3.4 | Low engine sample layer |
| mid.wav | 090912-017.mp3 | 4–5.8 | Mid engine sample layer |
| high.wav | 090912-022.mp3 | 9.6–11.4 | High engine sample layer |
| overrun.wav | 090912-022.mp3 | 11.7–13.3 | Throttle-release layer |
| metal-impact.wav | kickstand_on_concrete_01.mp3 | 0–3.8 | Recorded metal contact, adapted for landings/crashes |

The operating ranges are game mixing labels, not measured engine RPMs. The impact is recorded kickstand contact; it is not claimed to be a suspension or tyre recording. Dedicated asphalt, metal tyre rolling, tyre slip, exhaust backfire, wind and city traffic recordings are not yet included.

## Music

**“Raving Energy” — Kevin MacLeod (incompetech.com)**
ISRC: USUAN1900013. Instruments: synths and percussion. 122 BPM.
Source: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1900013
License listing: https://remote.incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1900013
Download: https://incompetech.com/music/royalty-free/mp3-royaltyfree/Raving%20Energy.mp3
Licensed under **Creative Commons: By Attribution 4.0**
https://creativecommons.org/licenses/by/4.0/

Distributed file: `raving-energy.mp3`. Changes: 32-bar extract starting at 31.47541 seconds, short seam crossfade, level normalization and 96 kbps MP3 encoding. In-game credit appears in Ljudinställningar → Musik och ljudkällor.

YouTube Audio Library was checked first but required sign-in; no YouTube license or file was assumed. Music was obtained from the composer's own site instead.

## Researched but NOT distributed

kyles' motocross recordings on Freesound are identified as CC0, but downloads were unavailable in the build environment. They are NOT included and no audio from them is claimed:
- https://freesound.org/people/kyles/sounds/450020/
- https://freesound.org/people/kyles/sounds/450029/
- https://freesound.org/people/kyles/sounds/450034/

## Rebuilding

`tools/stunt-bike/build-audio.py` records the exact transformations. Provide the extracted original engine ZIP and original Raving Energy MP3 as its two arguments. Its outputs reproduce the edits and preserve the licenses above.
