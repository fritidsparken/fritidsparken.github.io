# Autumn coloring references

All 27 original pages in `../mandala-host-2026/` map by basename to
`<basename>-reference.webp` here. The runtime reads those files and fills
connected regions segmented from the original page. It retains the original
ink layer, records each region in undo history, and exports the actual painting.
It does not use scan-line reveals or replace the finished painting with a photo.

The 17 existing PNG references remain unchanged. Their WebP versions are
optimized runtime copies. The remaining ten references were generated with
the built-in image-generation tool from their respective original drawings:
`snigel`, `hjort`, `graving`, `te`, `lyktor`, `ronn`, `lovkrans`, `husskog`,
`lovdjur`, and `vind`.

Generation prompt shared by the new images: Color this exact coloring page
with rich realistic natural autumn colors and soft shading. Preserve all
original contours, composition, object positions, proportions, framing and
margins exactly. Add no objects or text. Output a colored reference matching
the drawing. Subject colors: natural brown deer and snail; gray, black and
white badger; teal mug and rust scarf; bronze lanterns with golden light;
blue and yellow blue tits with red rowan berries; orange, gold and red autumn
leaves; red wooden cabin; leaf animals in autumn colors; yellow sun and blue
clouds. White paper backgrounds remain white where applicable.

Validation: `node tests/autumn-coloring.test.cjs` runs the deployed loader
and painter with native image decoding and canvas rendering for all 27 pages.
It checks reference loading, region history, unchanged source contours,
undo/redo, PNG export, and retry after a simulated reference-load error.
The minimal DOM harness is not a physical-device/browser UI test.
