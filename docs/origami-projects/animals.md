# Eight body animals — independently authored geometry

Recovered on 2026-11-16 from the retained conversation after the environment reset. `animals.mjs` restores the final authored module, including all eight models, seven sets of finish-only pen details, exact irrational whale kite bisectors, corrected upward whale tail, horizontal whale display turn, corrected longer fly wings and final butterfly opening. The prior preview images/JSONs were lost; root must regenerate them. Validation results below describe the completed pre-reset checks, not newly rendered files.

Research on 2026-11-15. Source text was retrieved with web search; public reference diagrams/photos were inspected using a separate browser tab because search's image results contained only a placeholder and direct downloads timed out. No source photographs, drawings, code or media are distributed. Swedish instructions and millimetre geometry are independently authored. Dimensions use R = 150/sqrt(2). Small free shaping ratios are authored choices where sources specify no precise registration point.

## Val

- Source: https://www.origami-instructions.com/easy-origami-whale.html . Full indexed steps 1–10: diagonal crease/open, lower kite pair, top corner to middle, half-fold, rotation, ordinary raised-tail fold.
- Uses the simple kite-base whale, NOT that site's separate fish-base whale with cuts. Source photographs were inaccessible because its page redirects in a loop. Its complete indexed prose distinguishes the ordinary tail fold from the more complex model.
- Additional visual context: https://www.origami.org/wp-content/uploads/2025/06/origami_whale.pdf inspected in browser, but that PDF has a different body sequence and is NOT claimed as the implemented sequence.
- Both kite angles are exact 22.5° bisectors; top tip lands at origin. Tail uses an ordinary oblique valley fold. No inside reversal, cuts or fins claimed. Rotation is presentation only.
- Final corrected tail hinge: [[0,0.58R],[0.4R,0.34R]]. A 90° rotation around z makes the whale horizontal with tail on the left. Eye at [35,18], radius 3.4 mm.

## Cikada

- Source: https://origami.guide/origami-animals/origami-insects/origami-cicada-bug/ — traditional.
- Visually inspected source photos 06, 08, 11 under https://origami.guide/wp-content/uploads/2022/01/traditional-origami-cicada-tutorial-*.jpg . The two center flaps are separate paper layers; photo 08 establishes the contrasting chevron.
- Downward triangle, paired corners to bottom, paired wing flaps upward, separate lower tips upward with gaps, turnover, side shaping and turnover. Optional slotting is not selected; edges need not overlap.
- Initial half-fold tags front sheet material; wing tags select independent corner packets. First and second center hinges are 0.625R and 0.71R. Side creases taper the broad head end without narrowing wing tips.
- Final z-axis 180° rotation requires engine support that preserves stack order for in-plane turns. This fix was made by root before final pre-reset QA. Eyes at ±12,-65.

## Nyckelpiga

- Source: https://origami.guide/origami-animals/origami-insects/origami-ladybug/ and /2 — traditional.
- Inspected source photos 09 and 10: short head fold followed by a true outward pleat; final side tips folded behind, optional drawn markings.
- Side corner folds intentionally leave tips outside the center. After turning, hinge at 0.20R and return hinge at 0.25R leave the head extending beyond the main top edge.
- Head, spots and wing divider are pen decoration, not invented paper geometry. Final module includes the head polygon, narrow divider, four black spots, and two small pale eyes, all displayed only in the finish frame.

## Fluga

- Source: https://origami.guide/origami-animals/origami-insects/origami-fly/ and /2 — traditional.
- Inspected source photos 11 and 15. Fly has outspread pointed wings, contrasting V, and two small corner folds at its head; it differs from the closed cicada.
- Triangle up, corners to apex, each wing lowered at an outward angle, first central layer down. Rear layer receives a reference fold/open and then a shallower final fold. Side folds shape the body; tiny final head corners fold over.
- First central hinge is -0.625R. Second precrease is halfway between apex and that hinge; final hinge aligns the reference with the first flap. Separate wing tags retain both paper layers.
- Final corrected wing creases pass through [0,-0.30R] and [±0.5R,-0.45R], allowing wings to extend beyond the body. Eyes at ±12,-65, radius 4 mm.

## Pingvin

- Source: https://en.origami-club.com/easy/sea/penguin/zu.html — diagram credit Fumiaki Shingu, Origami Club.
- Full eight-diagram sheet inspected. This is the complete flat front-view penguin, not the standing outside-reverse penguin.
- Two center precreases; lower point raised with colored border; belly tip lowered to beak; turnover; sides inward; side packets pleated outward; crown tip down; turnover. Belly is actual reverse-side paper.
- Lower hinge 0.20R, beak hinge -0.30R, side hinges ±0.375R, return hinges ±0.1875R, crown -0.85R. Authored proportions correspond to source's free dotted lines. Eyes are finish-only pen marks at ±17,-52.

## Fisk

- Source: https://origami.me/fish/ — traditional; source diagrams by Kelly Tan. Also verified matching original sequence at https://en.origami-club.com/easy/sea/fish/zu.html (Fumiaki Shingu diagram credit).
- Visually inspected Origami.me diagrams 2–6 and 8–9, and full Origami Club sheet. One front lower flap goes up; rear lower point receives an angled pleat; left tip receives a two-fold tail; opposite tip folds to make the head.
- Step-3 hinge is exact bisector between exposed lower-left edge and horizontal. Step 4 is a distinct nearby return crease, not an unfolding. Front layer and fin/tail lineages remain explicit. Source explicitly permits free choices for upper-flap height and tail size.
- Final eye at [-40,37], radius 3.8 mm.

## Risfisk

- Source: https://en.origami-club.com/easy/sea/rice-fish/zu.html — diagram credit Fumiaki Shingu.
- Full diagram sheet inspected. Starts from a 2:1 rectangle. Source cuts a square in half; this guide transparently starts with already prepared rectangle (15 × 7.5 cm), so no hidden cut occurs.
- Horizontal center precrease, left-quarter fold, turnover, two head corners inward, lower angled pleat, mirrored upper pleat, half-fold. Tail remains a sloping strip; white head is actual paper reverse. Eye/scales use a pen.
- Distinct rectangular pleated fish sequence, not a recoloring of Fisk. Final eye at [12,10], radius 3.2 mm.

## Enkel fjäril

- Source: https://www.enchantedlearning.com/crafts/butterfly/origami/ — designer not named.
- Inspected reference panels Fold5.GIF, Fold5a.GIF, Fold6a.GIF, Fold7.GIF. This is the very simple triangular corner-fold/tent butterfly, not the popular waterbomb/petal version.
- Source first prepares a square by cutting a rectangle; this guide starts from square. Fold triangle, fold in half, fold one corner packet on oblique hinge, repeat other packet, open center into shallow tent. Full paper form included. Glued antennae explicitly excluded from materials/form.
- Corner hinge intersects half-triangle at 0.30R on center and 0.50R/0.50R on diagonal. Center opens 145°. One sheet, all original material retained. No pen marks supplied on this nonflat model.

## Validation and limitations

- Before reset all eight compiled with the fold/unfold/turn/open engine, after root's in-plane turn fix.
- Every transition sampled at 0, 0.25, 0.5, 0.75 and 1; no nonfinite coordinates; maximum sheet-area deviation <3e-11 mm². Squares preserve 22500 mm²; Risfisk preserves 11250 mm².
- Sampled rigid panel distance drift was <1.8e-13 mm.
- No silhouette replacement, spawned part, squash/pocket/collapse approximation, or unsupported cut.
- Engine layer separation is visual, not a thickness/collision simulation. Physical folding was not tested.
- Whale source-photo limitation remains explicit above.

### Pre-reset final preview QA

All eight Blender preparation/finish previews were rendered with `render-glidaren.py --preview --samples 8`, Blender `-t 2`, and visually inspected. Fly wing hinges were corrected to extend beyond body; whale tail slope corrected to rise above spine; finish-only pen details added to seven flat models. Root fixed in-plane turn stacking so Cikada retains visible colored chevron when rotated. Exact irrational kite bisectors avoid sliver panels in Val.

Final QA judgment: Val has raised tail and broad head; Cikada has closed wing silhouette and contrasting chevron; Fluga has separate long spread wings; Nyckelpiga has head, spotted wing packets and central divider; Pingvin has actual pale belly and beak plus two flippers; Fisk has separate fin/tail pleats; Risfisk has contrasting triangular head and long rectangular tail body; Enkel fjäril has two tent-like opened wing packets as in its simple source. No flight/jumping/standing behavior claimed.

Final model step counts: val 9, cikada 12, nyckelpiga 12, fluga 16, pingvin 14, fisk 9, risfisk 12, fjaril 7.
