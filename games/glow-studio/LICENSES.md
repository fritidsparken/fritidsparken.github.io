# Dependencies and provenance

- **Three.js r160**, MIT. Reuses the repository's `js/vendor/three.min.js`. Full notice: `js/vendor/three-LICENSE.txt`. Copyright © 2010–2023 three.js authors.
- **@napi-rs/canvas**, MIT, test environment only. Not bundled or requested by the game. Required for deterministic CPU painting tests. Its packaged LICENSE accompanies the test dependency.
- All salon and character geometry, generated textures, paint code, interface, icon paths and synthesized audio in this directory were newly authored for this implementation. No game assets or code from another makeup game were used.
- `assets/glow-studio/cover.webp`: original AI-generated illustration created with the built-in image-generation tool on 2026-10-25. It is a marketing illustration, not a screenshot or a claim about verified rendered gameplay. Final generation brief: "Original GLOW STUDIO beauty-game cover; pearlescent rose nail polish, makeup brush, berry lipstick, lavender/teal palette; warm travertine vanity, sage velvet and rose gold; original elegant title; no people, third-party brands, copyrighted characters or UI." Generation source is retained in the working session; the optimized WebP is the project asset.
- System fonts only. No externally hosted font, music, HDRI, model or texture is loaded.

The original files are supplied for the Fritidsparken project. Third-party MIT notices must remain with redistributed Three.js and test dependencies.
