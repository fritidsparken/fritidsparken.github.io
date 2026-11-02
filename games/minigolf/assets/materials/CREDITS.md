# Minigolf PBR texture sources

These textures are from **ambientCG**, by **Lennart Demes**. All source assets are published under the **Creative Commons CC0 1.0 Universal** dedication, including commercial use and redistribution. Official license: https://docs.ambientcg.com/license/ (verified 2026-11-02).

| Local prefix | Source asset | Official source |
| --- | --- | --- |
| `grass` | Grass004 | https://ambientcg.com/a/Grass004 |
| `rock` | Rock030 | https://ambientcg.com/a/Rock030 |
| `wood` | Wood049 | https://ambientcg.com/a/Wood049 |
| `bark` | Bark014 | https://ambientcg.com/a/Bark014 |
| `sand` | Ground080 | https://ambientcg.com/a/Ground080 |

Each source was downloaded as its official `1K-JPG.zip` package using the download link returned by ambientCG's official v2 API. The selected Color, NormalGL, and Roughness maps were resized to 512×512 with Lanczos filtering, and encoded as WebP (quality 82 for color/roughness, 88 for normals). No other source files are redistributed.

- `*-color.webp`: sRGB albedo. Use sRGB color space.
- `*-normal.webp`: OpenGL tangent-space normal map. Treat as linear data, not sRGB.
- `*-roughness.webp`: linear roughness map, read from the green channel by Three.js.

All 15 maps together occupy 939,666 bytes (approximately 0.94 MB). Textures are stored locally so gameplay has no runtime dependency on asset providers.

The `turf` set is derived from Grass004: reduced color saturation and brighter albedo for clear separation of the putting green; normal/roughness data retained. All 18 texture files total approximately 1.25 MB.
