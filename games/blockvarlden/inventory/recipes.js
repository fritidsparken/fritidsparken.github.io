// Numeric IDs belong to blocks/registry.json. String IDs belong to props/manifest.json.
// Each entry is one transaction. Only recipes tagged workbench require a nearby bench.
export const consumables = {apple: 3, bread: 6, potion: 4, blueberries: 2, lingonberries: 2, carrot: 3, potato: 3, baked_potato: 5, fruit_bowl: 5, sandwich: 6, vegetable_soup: 7, apple_pie: 7, berry_cake: 8};
export const durability = {pickaxe: 80, axe: 64, shovel: 56, hammer: 96, rod: 48};

const hand = (out, count, needs) => ({out, count, needs});
const bench = (out, count, needs) => ({out, count, needs, station: 'workbench'});

export const recipes = [
  hand('campfire',1,{31:3,3:4}),
  hand('shelf',1,{31:6}),
  hand('boat',1,{31:8}),
  hand('map',1,{75:2}),
  hand('outfit_sailor',1,{75:4,71:1}),
  hand('outfit_explorer',1,{75:4,70:1}),
  // Simple hand tools can be made before the player has found a tree.
  hand('shovel', 1, {1: 2, 3: 1}),
  hand('axe', 1, {1: 2, 3: 3}),
  hand('pickaxe', 1, {3: 3, 31: 1}),
  hand('hammer', 1, {3: 2, 31: 1}),
  hand('rod', 1, {31: 1, 75: 2}),
  hand('workbench', 1, {31: 4}),
  hand(136, 1, {31: 4}),

  // Eight timber species, each with its own sawn boards, beams, and patterned flooring.
  ...[[4,31],[34,35],[38,39],[42,43],[46,47],[50,51],[54,55],[58,59]].flatMap(([log, plank]) => [
    hand(plank, 4, {[log]: 1}),
    hand(plank + 1, 2, {[log]: 1}),
    bench(plank + 2, 4, {[plank]: 4}),
    ...(plank === 31 ? [] : [hand('workbench', 1, {[plank]: 4})])
  ]),

  hand('flashlight', 1, {31: 1, 106: 1, torch: 1}),
  hand('torch', 4, {31: 1, 76: 1}),
  hand('torch', 2, {31: 1, 18: 1}),
  hand('fence', 3, {31: 3}),
  hand('railing', 3, {31: 2, 32: 1}),
  hand('stairs', 3, {13: 3}),
  hand('slab', 4, {13: 2}),
  hand('chest', 1, {31: 5}),
  hand(137, 1, {31: 5}),
  hand('door', 1, {31: 3}),
  bench('window', 2, {31: 1, 106: 2}),
  bench('table', 1, {31: 3, 32: 1}),
  bench('chair', 1, {31: 2, 32: 1}),
  bench('bed', 1, {31: 3, 5: 4}),
  bench('roof', 4, {88: 2, 31: 1}),
  bench('lantern', 1, {106: 1, 78: 1, torch: 1}),
  hand('planter', 1, {8: 2, 2: 1}),
  hand('backpack', 1, {75: 3, 74: 2}),
  hand(138, 2, {2: 2, 1: 1}),
  hand('apple', 1, {5: 3}),
  hand('potion', 1, {71: 2}),
  bench('bread', 2, {24: 2, 76: 1}),
  // Fruit and vegetables can be collected from vegetation and turned into meals.
  hand('blueberries', 3, {71: 1}),
  hand('lingonberries', 3, {70: 1}),
  hand('carrot', 2, {24: 1}),
  hand('potato', 2, {24: 1, 2: 1}),
  hand('fruit_bowl', 1, {apple: 1, blueberries: 1, lingonberries: 1}),
  hand('sandwich', 1, {bread: 1, carrot: 1}),
  bench('baked_potato', 1, {potato: 1, 76: 1}),
  bench('vegetable_soup', 1, {carrot: 1, potato: 1}),
  bench('apple_pie', 1, {apple: 2, bread: 1}),
  bench('berry_cake', 1, {bread: 1, blueberries: 1, lingonberries: 1}),

  // Fired clay, dressed stone, sheet metals, colored glass, and inlaid floors.
  bench(88, 4, {8: 3, 76: 1}), bench(89, 4, {8: 2, 6: 1, 76: 1}),
  bench(90, 4, {8: 2, 15: 1, 76: 1}), hand(91, 2, {3: 2}),
  hand(92, 3, {91: 3}), bench(93, 4, {3: 4}),
  bench(94, 2, {14: 2}), bench(95, 2, {12: 2}), bench(96, 2, {15: 2}),
  bench(97, 4, {12: 3, 11: 1}), bench(98, 4, {12: 3, 29: 1}),
  bench(99, 4, {12: 3, 15: 1}), bench(100, 4, {13: 2}),
  bench(101, 4, {88: 2}), bench(102, 3, {104: 2}),
  bench(103, 3, {77: 2, 76: 1}), bench(104, 3, {78: 2, 76: 1}),
  bench(105, 3, {78: 2, 79: 1}), bench(106, 4, {6: 3, 76: 1}),
  bench(107, 3, {106: 3, 84: 1}), bench(108, 3, {106: 3, 83: 1}),
  bench(109, 3, {106: 3, 76: 1}), bench(110, 4, {31: 2, 95: 2}),
  bench(111, 4, {110: 3, 85: 1}),

  // Each pigment yields three distinct products. Keep output IDs in catalogue order.
  ...[22,21,11,83,81,29,76,70].flatMap((pigment,index) => {
    const base = 112 + index * 3;
    return [bench(base, 4, {7: 2, 8: 1, [pigment]: 1}),
      bench(base + 1, 4, {8: 3, [pigment]: 1}), bench(base + 2, 4, {31: 3, [pigment]: 1})];
  }),
  hand(139, 1, {106: 1, torch: 1}), bench(140, 1, {106: 2, 81: 1}),
  bench(141, 1, {106: 2, 84: 1}), bench(142, 2, {3: 2, 85: 1}),
  bench(143, 2, {3: 2, 86: 1}), bench(144, 1, {31: 3, 103: 1})
];
