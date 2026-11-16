# Eight objects: recovered final geometry and research record

Recovered from retained agent context on 2026-11-16. Research and rendered-preview QA occurred on 2026-11-15. The former `/tmp` images and modules were deleted by the environment reset. This document records those completed inspections; no new render is claimed during recovery.

The contribution substitutes complete simple variants for house/piano/dress/crown/boat/fortune-teller collapse sequences. No source artwork, source SVG geometry, or source animation is shipped. All millimetre hinge geometry and Swedish instructions in `objects.mjs` were independently authored. Existing fold/select/turn/tuck API only. Final set: eight models, 78 steps. Before the reset, all compiled; finite coordinates and sheet area were checked at 0%, 25%, 50%, 75%, 100% of every transition, maximum area error 2.55e-11 square mm. The final helmet brim correction was then compiled/exported and visually rerendered. Physical prototypes were not made.

## Rymdraket
Source: https://www.origamiway.com/origami-rocket/ (designer not stated). Square 15 cm. Full source steps read; photos 9 and 13 and the final photograph inspected. Source final image was https://www.origamiway.com/wp-content/uploads/2024/01/rocket-ship-origami-final1.png.webp . Quarter-band fold, turnover, corner folds, two side folds, two selected outward flap folds, turnover. Two-thirds flap return makes short side fins. Source final indeed has white body, colored triangular nose, short white fins and a drawn porthole. The local finish explicitly teaches the round drawn window, and materials mention a pen. Three original concentric ellipse marks at (0,31), radii 16/13.5/10.5 mm, represent this ink. Flat decoration, no flight claim.

The final rocket geometry was visually approved. Preview exposed z-fighting between overlapping ink ellipses in the then-current Blender renderer; root was asked to assign distinct depth per mark. Recovery retains all three marks; do not remove the window or alter correct paper geometry to hide the renderer issue.

## Pappersdrake
Source: https://origami.guide/beginner-origami/origami-folding-techniques/origami-kite-fold/ (traditional kite base). Complete three-fold base with turnover, honestly presented as a flat decorative kite. No tail or flight is claimed. Diagonal bisectors use exact sqrt(2) expressions. All moving regions belong to one intact square. Method read; elementary base did not require a separate downloaded reference picture. Final preview approved.

## Skjorta
Source: https://origami-resource-center.com/origami-shirt/ . Full tutorial and composite photo diagram inspected: https://origami-resource-center.com/wp-content/uploads/diagrams/diagramOrigamiShirt.jpg . Rectangle; long sides inward; bottom inner flap corners outward as sleeves; narrow top band backward; collar corners inward; bottom upward and tucked under both collar tips. Author-chosen 15 × 21 cm dimensions. Collar target (0,-75) mm; upper edge after band y=-90 mm; body top y=-82.5 mm reaches inside collar.

Final corrected sleeve hinges are (0,40)→(-37.5,105) and (0,40)→(37.5,105). Both moved sleeve regions receive `sleeve`; collar folds explicitly select `not:sleeve`. This avoids the infinite collar crease incorrectly folding remote sleeve corners. Two explicit pocket-insertion steps lift and replace the collar tips above the body. Final preview showed a clean rectangular body, two shoulder sleeves and distinct collar, matching the source. No named designer in the source.

## Platt samurajhjälm
Source: https://www.origami-fun.com/origami-samurai-hat.html and https://www.origami-fun.com/support-files/origami-samurai-hat-print.pdf . Entire single-page PDF inspected. Traditional triangle; outer points to bottom; each selected point upward; horns outward; front brim twice upward.

Final corrections: separate `corner-left` and `corner-right` lineages, separate upward folds, separately selected horn folds. First brim fold: y=0.625R, `select:front`, adds `brim`. Second brim fold: y=0.5R, **select `front`**, not `brim`; the whole front strip must fold, including the part untouched by the first triangle fold. This last correction removed an erroneous lower trapezoid. Corrected final PNG was rerendered and approved: continuous white brim, two horns and central upper point.

Declared local variant: rear bottom point folds backward along y=0.5R, rather than an unimplemented wearable-hat pocket opening. Name/materials/finish explicitly identify a flat decorative helmet, not a wearable hat. Eleven instructions.

## Papperspenna
Source: https://www.origami-instructions.com/origami-pencil.html . Full tutorial read through indexed content; source photos 3a, 5a, 7a, 8, 9a and 12 inspected from the site's `/images/pencil/thumbnails/` directory. Begins with a ready 3.75 × 15 cm strip, consistent with the source's quarter-square. Materials disclose cutting the strip before folding if starting from a full sheet. Center precrease, small corner, turnover, larger corner, turnover, lengthwise half-fold, exact 22.5-degree tip-edge bisectors, turnover. Tip before last turnover: (-9.375,-65.625) mm. All layers retained. Final preview matches the source: narrow colored body, white tapered wooden region and colored triangular tip. Explicitly a decoration that cannot write.

## Litet pappershus
Source: https://www.playowl.com/paper-crafts/origami-house . Full tutorial read. Source step-3 SVG rendered solely for inspection: https://www.playowl.com/activity-art/paper-crafts/origami-house-step-3-after.svg?v=1 . This is the simple corner-fold variant, not a skipped squash/organ-base house. Vertical precrease, both upper corners to center, colored triangular roof above white wall. Door/windows are optional pen drawing, stated in materials and finish. Source identifies an original PlayOwl project; attribution names that published simple variant. Final preview approved and matches reference diagram.

## Slips
Source: https://www.haradaeigo.com/origami/en/m/necktie/ ; Japanese canonical https://www.haradaeigo.com/origami/m/necktie/ . English method read. Public Japanese page retrieved and actual inline final/tip-fold diagrams rasterized only for inspection. Source explicitly labels this simple variant Harada Eigo original. Two successive top-edge narrowing pairs, turnover, upper tip downward forms triangular knot. Author-chosen knot crease y=-0.57R, exact 22.5-degree and 11.25-degree bisectors. This named variant has no hidden squash step, unlike other tie tutorials. Final preview approved against source: tapering tie with pointed lower end and small downward triangular knot flap.

## Shorts
Source: https://www.haradaeigo.com/origami/en/m/pants/ ; Japanese canonical https://www.haradaeigo.com/origami/m/pants/ . English method read; actual inline leg-fold and final diagrams rasterized for inspection. Source explicitly labels Harada Eigo original. Opposite edges to middle; upper half behind; selected front edge down as belt; both strip ends diagonally downward behind to form separate legs. Author-selected 5 mm belt; mirrored hinges (-8,0)→(-41,37.5) and (8,0)→(41,37.5). Whole square retained. Final preview approved against the source's narrow central gap and splayed legs. Optional drawn button/pockets are taught in finish.

## Completed preview QA and recovery boundary
All eight were exported with the former `/tmp/export-expansion.mjs` and rendered with the existing `render-glidaren.py --preview --samples 8`, Blender two threads. Every final PNG was opened and compared with the inspected source variant. Corrected shirt and final helmet were explicitly rechecked. All eight final geometries were visually approved and frozen. Rocket ink needed renderer depth ordering as described above; no further geometry change was pending.

Recovery recreated the final module and this research/QA record only. It retains the latest shirt sleeve exclusion, helmet separate horn lineages, final full-front brim fold, exact kite bisectors, all eight names/IDs, and rocket window marks. Source media was never added to the repository, and deleted reference images have not been recreated here. Root owns fresh geometry validation, renderer restoration, final asset generation and publication after the reset.
