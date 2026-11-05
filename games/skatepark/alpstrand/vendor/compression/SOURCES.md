# Alpstrand GLB codecs

Three.js r160 KTX2Loader and WorkerPool use the same release as the game engine. The KTX2Loader imports the game's global THREE namespace and loads the vendored dependencies from adjacent files. Three.js, meshoptimizer 0.23, ktx-parse and zstddec use the accompanying MIT licenses. Basis Universal uses Apache-2.0. zstddec bundles Zstandard; see ZSTD-COPYRIGHT.txt.

- https://github.com/mrdoob/three.js/tree/r160/examples/jsm
- https://github.com/zeux/meshoptimizer/tree/v0.23
- https://github.com/BinomialLLC/basis_universal
- https://github.com/donmccurdy/ktx-parse
- https://github.com/donmccurdy/zstddec
