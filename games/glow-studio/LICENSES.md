# Dependencies and provenance

- **Three.js r160**, MIT. Reuses the repository's `js/vendor/three.min.js`. Full notice: `js/vendor/three-LICENSE.txt`. Copyright © 2010–2023 three.js authors.
- **@napi-rs/canvas**, MIT, test environment only. Not bundled or requested by the game. Required for deterministic CPU painting tests. Its packaged LICENSE accompanies the test dependency.
- All salon and hand geometry, generated textures, paint code, interface, icon paths and synthesized audio in this directory were newly authored for this implementation. No game assets or code from another makeup game were used.
- `assets/glow-studio/single-customer.png`: transparent customer extraction made from the exact Glow Studio interface image supplied by the Fritidsparken site owner on 2026-10-26. The source background and interface are not included or used. `cover.webp` composites that cutout over a newly authored abstract background.
- System fonts only. No externally hosted font, music, HDRI, model or texture is loaded.

The original files are supplied for the Fritidsparken project. Third-party MIT notices must remain with redistributed Three.js and test dependencies.
