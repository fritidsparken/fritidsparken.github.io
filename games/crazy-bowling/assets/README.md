# Original Crazy Bowling surface assets

These models and textures were authored specifically for Fritidsparken. They are
not downloaded third-party models. The reproducible authoring sources are in
`tools/bowling/`; runtime imports the exported GLB and WebP files.

- `bowling-kit.glb`: nine named glTF 2.0 assets, with normals, UVs, and material
  assignments. Pin: smooth sampled profile. Ball: pearl-resin surface with three
  recessed bores and dark vertex colours inside the bores. Return: continuous
  arched moulded shell, open mouth and tubular return rails. Chair: curved
  upholstered seat/back shell. Table, monitor, pendant, gutter and sweep assets.
- Base colour WebP: sRGB. Normal and ORM WebP: linear/non-colour data.
- ORM channels: R ambient occlusion, G roughness, B metalness (dielectric maps).
- Maple: original seeded plank grain with staggered joints; not a photographic
  scan. Fabric: original woven surface. Resin: seamless longitude swirl map.
- Total model + texture transfer is under 3 MB before transport compression.
- No paid assets, remote asset hotlinks, API keys or attribution obligations.
- Three.js GLTFLoader and BufferGeometryUtils are MIT licensed (see vendor).

Rebuild from repository root:

    node tools/bowling/build-assets.cjs
    python tools/bowling/build-textures.py

Python needs NumPy and Pillow. The vendored Three.js r160 is used for authoring.

The visual result still requires WebGL quality approval; asset export alone does
not establish commercial-quality rendering.
