# Eight independently authored decoration models

Research and original numerical/render validation: 2026-11-15. Recovered from retained working context on 2026-11-16 after the environment reset. `decor.mjs` exports `models`. No reference media is included. Swedish text and millimetre crease coordinates are original. No physical folding test or collision simulation has been performed.

Before the reset all eight complete sequences compiled. Every transition sampled at t=0,.25,.5,.75,1 had finite coordinates and preserved paper area to <0.000002 mm². Root subsequently replaced approximate bisector constants with exact expressions and repeated area checks successfully. The recovered module incorporates those corrections. Recovery validation here checked module import and all final step counts; root owns renewed geometry validation and rendering.

Panels use crease rotations in a zero-thickness representation. Area and finite-motion checks are not a physical connectivity or collision proof. The required selector addition is `select.none: string[]`, excluding any panel with any listed tag. Root had already implemented this.

| ID | Name | Final step/state |
|---|---|---:|
| platt-ros | Platt ros | 29 |
| paskagg | Påskägg | 14 |
| glass | Glasstrut | 14 |
| blomstjalk | Platt blomstjälk | 13 |
| blad | Blad | 26 |
| ljus | Pappersljus | 11 |
| morot | Morot | 15 |
| snoberg | Snöberg | 7 |

## Platt ros — `platt-ros`

Source: https://origami.me/rose/ — traditional fractal rose; tutorial by Kelly Tan. Full prose and reference photos/diagrams 2–7 inspected. Three consecutive blintzes produce nested square/diamond layers; tagged flaps are folded outward inside-to-outside. Each outer selection excludes every later layer so it does not drag the inner petals. Each tip crease is 60% of its ring's original corner-hinge distance from the centre. This deliberately flat variant has straight creased petals, without the source's optional curling or outer-tip rounding. Root approved the flat concentric blossom in its Blender preview. Reference photographs were temporary and are not redistributed.

## Påskägg — `paskagg`

Source: https://origami.me/easter-egg/ — designer not explicitly identified; tutorial by Florent Fabre. Diagrams 2–7 inspected. Upper kite edges use exact 22.5° bisectors. The bottom tip lands at y=.30R just above the shoulder line (√2−1)R, requiring hinge y=.65R. The original top point lands at that same tip via hinge y=−.35R. Symmetric side and shoulder folds round the outline; the source permits choosing these rounding proportions. Two additional small lower-corner folds round the bottom in the local adaptation. Final bounds x±42.426, y=−37.123..68.943 mm. Both erroneous draft shoulder directions and earlier tip positions were corrected before final validation. The final 14-step version was re-rendered and visually reviewed.

## Glasstrut — `glass`

Source: https://www.pinkstripeysocks.com/2016/03/how-to-fold-origami-ice-cream-cones.html — tutorial publisher Pink Stripey Socks; designer not identified. Complete prose and all 11 photographic reference stages inspected. Begin directly with a 7.5×15 cm rectangle; the source obtains this by halving a square. Quarter-height top flap creates the light scoop; two successive symmetric lower-edge folds make the cone; top corners soften the scoop. No additional paper or glued scoop. Initial color orientation makes the scoop and cone contrast. Root approved the Blender preview as clearly reading as ice cream.

## Platt blomstjälk — `blomstjalk`

Source construction: https://www.origami-fun.com/origami-flower-stem.html — traditional stem. Diagrams 1–7 inspected. Upper kite pair, lower edge pair and repeated lower narrowing use 22.5° and 11.25° bisectors. Turn over, raise the narrow lower end, and halve the body. **Explicit local flat variation:** fold the broad leaf sideways as an ordinary selected-layer hinge instead of claiming the source's outside-reverse fold and freestanding posture. Named and described as flat, for card decoration. Narrow stalk lineage is excluded from the leaf fold. The broad leaf stays attached below its new crease. Final preview reviewed.

## Blad — `blad`

Source: https://origami.me/leaf/ — traditional; diagrams by Jimena Candia. Entire public diagram inspected as reference. Square is halved diagonally, a narrow diagonal hem creates the stem, then ten alternating accordion folds form veins. The accordion is reopened with inverse rigid folds rather than state-reset `unfold`, retaining panel boundaries for every crease. Independently selected front/back lower-corner folds shape the blade. The front leaf half opens about the transformed centre hinge x+y=36. Flat opening is intentional; no curved surface is claimed. An alternative Origami Club leaf diagram was inspected for comparison but not implemented. Final green blade, white centre hem and visible vein creases were reviewed in Blender.

## Pappersljus — `ljus`

Source: https://en.origami-club.com/xmas/candle2/zu.html — Fumiaki Shingu, Candle 2. Entire five-stage public diagram inspected. Center precreases, side points to center, lower point upward, larger lower section upward, both vertical sides behind. Numerical proportions leave a small colored triangular flame above a pale rectangular candle. This is simple flat Candle 2, not Nick Robinson's cylindrical candle or Shingu's pocket/squash Candle 1. No curvature, cylinder or burning action is claimed. Final preview reviewed.

## Morot — `morot`

Source: https://en.origami-club.com/fruit/carrot/zu.html — Fumiaki Shingu. Entire ten-stage public diagram inspected. Double lower kite, top point folded behind, upper body down and back up to make an integral stalk, selected stalk edges narrowed, shoulders shaped, turn over. Crease proportions are locally authored; the stem consists of the same tagged paper. Optional green coloring is described as drawing. Shoulder folds are actual hinges. The final Blender preview reads as a narrow orange carrot with a small pale stalk.

## Snöberg — `snoberg`

Source: https://en.origami-club.com/easy/other/fuji/zu.html — Fumiaki Shingu, Fuji Mountain. Entire seven-stage public diagram inspected. Diagonal triangle, selected front tip down and partially back up create a white snow chevron; remaining back tip folds behind. Finished variant remains flat. The source's final shallow display bend is not claimed. A tested 15° final fold exposed an engine limitation: moving layer order reversed on partial folds, making half the mountain white. The final seven-step version removes that display bend and retains the correct blue body with white snow chevrons. Replaces proposed diamond because the inspected diamond source requires waterbomb collapse and inflation.

## Deferred rather than fabricated

The originally considered four-point star, bow, four-petal flower, mushroom and stocking require squash, pocket-collapse, reverse or inflation motions outside this bounded contribution. Replacements were agreed with root. Their names and finished silhouettes were not reused for simpler shapes.

## Original final-preview QA

Before reset, `/tmp/decor-qa-final.jpg` showed the finalized egg, stem, leaf, candle, carrot and mountain. Root had approved glass and flat rose. All six preview jobs exited 0 using 8 samples. Egg and mountain were corrected and rendered again. Their final state numbers are listed above; the old mountain state 08 was superseded by state 07 and must not be reconstructed as current. Preview files and reference media are not recovered by this task.

## Exact precision recovery

Root's final corrections retained in `decor.mjs`:

- 0.5857864376 → 2 − Math.SQRT2
- 0.4142135624 → Math.SQRT2 − 1
- 0.1989123674 → Math.tan(Math.PI / 16)
- 0.2813045677 → Math.SQRT2 * Math.tan(Math.PI / 16)

No repo edits, renders, or spawned agents were performed for this recovery.
