# Minigolf audio — sources and licences

Verified 2026-11-02. Files are hosted locally with the game. No audio was ripped from YouTube. The source files below allow redistribution; music attribution must remain accessible from the game's settings.

## Music

**Carefree — Kevin MacLeod (incompetech.com).**
Licensed under **Creative Commons: By Attribution 4.0**.
https://creativecommons.org/licenses/by/4.0/

- YouTube listening reference: https://www.youtube.com/watch?v=owrhKIN3Y90 (Audio Library promotion). The game uses the artist-supplied download below, under the artist’s CC BY 4.0 licence.
- Track source: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400037
- Author's supplied download: https://incompetech.com/music/royalty-free/mp3-royaltyfree/Carefree.mp3
- Author's licensing page: https://incompetech.com/music/royalty-free/licenses/
- Author's FAQ specifically describes video-game credits in a settings/credits screen: https://web.incompetech.com/music/royalty-free/faq.html
- CC BY 4.0 permits sharing/redistributing in any medium, including commercially, and adapting, subject to credit, licence link, and notice of changes. This covers local delivery with a public browser game. No endorsement is implied.
- Changes: 60-second excerpt, downmixed and re-encoded to 32 kbps MP3, low runtime gain, five-second crossfade between playbacks. Instrumental ukulele/acoustic arrangement, no vocals.
- Installed file: `carefree.mp3`.

## Golf and collision foley

**Golf swing, with a wooden club — Christophe / BigSoundBank**, CC0.
https://bigsoundbank.com/golf-swing-with-a-wooden-club-s0455.html
Download: https://bigsoundbank.com/UPLOAD/mp3/0455.mp3

The source page explicitly permits editing and redistributing, including in games and apps. Four distinct recorded contact transients were excerpted, normalized, trimmed and encoded as `putt-1.mp3` through `putt-4.mp3`. Playback varies gain, rate and filtering with shot strength. These are adapted golf contacts, not claimed to be new recordings of a putter.

**Bouncing Golf Ball — Mike Koenig / SoundBible**, CC BY 3.0.
https://soundbible.com/1071-Bouncing-Golf-Ball.html
https://creativecommons.org/licenses/by/3.0/
Download: https://soundbible.com/mp3/Bouncing%20Golf%20Ball-SoundBible.com-39306422.mp3

Three recorded bounces were excerpted and normalized as `impact-1.mp3` through `impact-3.mp3`; a short bounce sequence is `cup.mp3`. The cup effect is adapted bounce foley, not an actual recording inside a cup. Wood/stone variants use filtering and rate changes; metal adds a quiet synthesized resonance. Attribution is required and provided in `credits.html`.

## Outdoor field recordings (all CC0)

| Installed file | Recording / author | Source |
|---|---|---|
| `birds.mp3` | Ambient Bird Sounds — isaiah658 | https://opengameart.org/content/ambient-bird-sounds |
| `wind.mp3`, `river.mp3` | Park ambiences — Thimras | https://opengameart.org/content/park-ambiences |
| `waves.mp3` | Water Waves — transitking, submitted by qubodup | https://opengameart.org/content/water-waves |
| `crickets.mp3` | Crickets Ambient Noise – loopable — Ted Kerr (Wolfgang_) | https://opengameart.org/content/crickets-ambient-noise-loopable |

CC0: https://creativecommons.org/publicdomain/zero/1.0/

Changes: excerpts (wind and river), mono downmix, normalization, MP3 encoding and endpoint crossfades. Wave source: `wave_02_cc0-11505__transitking__wavesound.flac`. Bird source: `birds-isaiah658.ogg`. Cricket source: `crickets_1.mp3`. Every hole has its own combination and mix levels, rather than 18 copies of the same loop. These recordings do not include separately identified gulls, bees, cicadas or tropical bird species.

## Original runtime sound design

Low-pass filtered friction noise follows the ball's speed; quiet completion chimes and portal resonance are synthesized in Web Audio. They are not represented as recorded natural effects. All loops are gain-faded, source nodes reused, and suspended when the document is hidden. Music is streamed through HTML audio, avoiding decoding the full song into Web Audio memory.
