// Authored control points, grade changes and trail furniture in order from start to finish.
const layouts = [
  [
    "Gröna dalen",
    "Ängsstig",
    "meadow",
    "jord",
    8,
    [-4, 6, 24, 10, -15, -22, -4, 19, 4],
    [0, -4, -13, -9, -19, -30, -34, -32, -45],
    "r b j b r",
  ],
  [
    "Pine Forest",
    "Rotpasset",
    "pine",
    "jord",
    5,
    [0, 3, -24, 8, 27, -8, -30, -10, 11, 0],
    [0, -8, -19, -21, -28, -23, -34, -48, -50, -58],
    "o b o j o",
  ],
  [
    "Rocky Mountains",
    "Granitpasset",
    "rock",
    "grus",
    5,
    [0, 24, 42, 39, -5, -38, -42, -15, 23, 38, 19],
    [0, -18, -38, -39, -53, -63, -58, -80, -91, -105, -125],
    "j g o b g",
  ],
  [
    "Tropical Jungle",
    "Lianleden",
    "jungle",
    "lera",
    7,
    [0, -12, -36, -16, 7, 35, 10, -4, -25, -3],
    [0, -10, -7, -19, -25, -44, -40, -55, -61, -65],
    "b f o b j",
  ],
  [
    "Desert Canyon",
    "Sandstensvalvet",
    "desert",
    "grus",
    8,
    [0, -28, -55, -40, -8, 22, 55, 48, 12, -10],
    [0, -5, -22, -40, -36, -50, -67, -82, -84, -102],
    "r g a j g",
  ],
  [
    "Alpine Snow",
    "Glaciärleden",
    "snow",
    "snö",
    8,
    [0, 8, 33, 50, 26, -8, -25, -21, 5, 32, 15],
    [0, -11, -28, -32, -31, -47, -60, -64, -70, -74, -96],
    "i b r g j",
  ],
  [
    "Coastal Cliffs",
    "Havsryggen",
    "coast",
    "grus",
    5,
    [0, -9, 11, 42, 38, 5, -15, 2, 33, 21],
    [0, -4, -17, -28, -25, -34, -45, -52, -50, -69],
    "b a g b j",
  ],
  [
    "Bike Park Extreme",
    "Pumpverket",
    "park",
    "jord",
    9,
    [0, 17, 9, -21, -28, 14, 37, 6, -25, -5, 19],
    [0, -5, 1, -11, -7, -20, -16, -31, -22, -39, -48],
    "w f j g w r",
  ],
  [
    "Waterfall Valley",
    "Forsleden",
    "falls",
    "lera",
    7,
    [0, 28, 37, 17, 1, -23, -49, -25, 3, -9, 8],
    [0, -13, -19, -14, -32, -39, -54, -49, -68, -72, -86],
    "b j b g b",
  ],
  [
    "Grand Canyon Rush",
    "Örnryggen",
    "grand",
    "grus",
    7,
    [0, 32, 68, 60, 28, -9, -47, -62, -19, 22, 55, 35],
    [0, -15, -38, -62, -65, -80, -101, -108, -126, -150, -165, -186],
    "g a j o g j",
  ],
  [
    "Moonlight Forest",
    "Reflexstigen",
    "pine",
    "jord",
    6,
    [0, -13, -5, 24, 20, -20, -27, 4, 18, 0],
    [0, -6, -14, -10, -21, -30, -32, -42, -39, -52],
    "o b j o b",
  ],
  [
    "Neon Bike Park",
    "Ljusloopen",
    "neon",
    "trä",
    9,
    [0, 22, 37, 2, -35, -11, 24, 38, 5, -33, 0],
    [0, -4, -12, -6, -18, -14, -27, -20, -37, -33, -50],
    "w j f w g w",
  ],
  [
    "Sunset Mountains",
    "Sista solljuset",
    "sunset",
    "grus",
    7,
    [0, 5, -25, -41, -10, 24, 47, 39, 14, -4, 12],
    [0, -9, -12, -30, -35, -29, -43, -62, -65, -60, -82],
    "r b g j b",
  ],
  [
    "Foggy Valley",
    "Mossbäcken",
    "fog",
    "lera",
    6,
    [0, -21, -16, 2, 19, 5, -32, -20, 8, -6],
    [0, -5, -16, -12, -21, -18, -32, -43, -40, -53],
    "b o b r o",
  ],
  [
    "Night Canyon",
    "Stjärnpasset",
    "desert",
    "grus",
    6,
    [0, 14, -10, -42, -36, 7, 35, 20, -14, -38, 2],
    [0, -12, -24, -42, -35, -49, -62, -73, -78, -72, -95],
    "a g o g r",
  ],
  [
    "Northern Lights",
    "Polarskenet",
    "aurora",
    "snö",
    7,
    [0, -19, -32, -15, 20, 48, 29, -6, -26, -8],
    [0, -10, -21, -15, -30, -42, -47, -60, -55, -75],
    "i a b i g",
  ],
  [
    "Volcano Trail",
    "Basaltfallet",
    "lava",
    "grus",
    7,
    [0, 23, 18, -14, -38, -10, 21, 42, 8, -12, 18],
    [0, -12, -30, -25, -43, -57, -51, -72, -89, -84, -108],
    "g o a g j",
  ],
  [
    "City Rooftops",
    "Över taken",
    "city",
    "trä",
    6,
    [0, 0, 25, 25, -9, -9, -36, -36, 0, 0, 27],
    [0, -5, -6, -15, -16, -28, -29, -40, -41, -55, -65],
    "r b g w b j",
  ],
  [
    "Haunted Forest",
    "Lyktgläntan",
    "haunted",
    "jord",
    6,
    [0, 14, 5, -21, -12, 15, -9, -30, -7, 21, 0],
    [0, -4, -12, -8, -21, -18, -27, -39, -35, -49, -55],
    "b o f b j",
  ],
  [
    "Midnight Extreme",
    "Sista stupet",
    "extreme",
    "grus",
    8,
    [0, -32, -49, -18, 19, 52, 46, 8, -37, -52, -8, 32, 7],
    [0, -18, -41, -34, -60, -79, -74, -99, -122, -116, -143, -164, -189],
    "w g j f g w g",
  ],
];
const bikes = [
  ["Trail Rider", 1, 1, 1, 1, 1],
  ["Downhill Pro", 1.04, 1.12, 1.2, 1.12, 0.96],
  ["Carbon Racer", 1.15, 0.94, 0.94, 0.97, 1.03],
  ["Freeride X", 1.02, 1.02, 1.08, 0.96, 1.18],
  ["Enduro Beast", 0.97, 1.22, 1.18, 1.13, 0.95],
  ["Dirt Jumper", 0.96, 1.05, 0.98, 1.04, 1.25],
  ["Night Rider", 1.06, 1.1, 1.1, 1.08, 1.04],
  ["Elite Champion", 1.13, 1.15, 1.12, 1.07, 1.12],
];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)),
  mix = (a, b, t) => a + (b - a) * t,
  ease = (t) => t * t * (3 - 2 * t);
function spline(points, u) {
  u = clamp(u, 0, points.length - 1);
  const i = Math.min(Math.floor(u), points.length - 2),
    t = u - i;
  const a = points[Math.max(0, i - 1)],
    b = points[i],
    c = points[i + 1],
    d = points[Math.min(i + 2, points.length - 1)];
  return (
    0.5 *
    (2 * b +
      (-a + c) * t +
      (2 * a - 5 * b + 4 * c - d) * t * t +
      (-a + 3 * b - 3 * c + d) * t * t * t)
  );
}
function course(id) {
  const [name, tag, theme, surface, width, x, y, sequence] = layouts[id],
    step = 32 + (id % 4) * 3,
    len = (x.length - 1) * step;
  const codes = sequence.split(" "),
    events = codes.map((type, i) => ({
      type,
      s: Math.round((len * (i + 1)) / (codes.length + 1)),
    }));
  const center = (s) => spline(x, s / step),
    base = (s) => spline(y, s / step) + 0.32 * Math.sin(s * 0.12);
  const fork = (s) => {
    let e = events.find((e) => e.type === "f" && Math.abs(s - e.s) < 17);
    return e ? 8 * Math.cos(((s - e.s) * Math.PI) / 34) ** 2 : 0;
  };
  const half = (s) => width * 0.5 + 0.65 * Math.sin(s * 0.046 + id);
  function feature(s) {
    return events.find((e) => s >= e.s - 8 && s <= e.s + 10);
  }
  function height(s, l = 0) {
    let h = base(s) + 0.1 * l * Math.sin(s * 0.053 + id),
      e = feature(s);
    if (e) {
      let d = s - e.s;
      if ("rgj".includes(e.type) && d < 0)
        h += (e.type === "g" ? 2.6 : 1.65) * ease(clamp((d + 8) / 8, 0, 1));
      if (e.type === "w")
        h +=
          Math.max(0, l) * 0.85 * Math.sin(clamp((d + 8) / 18, 0, 1) * Math.PI);
    }
    return h;
  }
  const gap = (s) =>
    events.some((e) => e.type === "g" && s >= e.s && s < e.s + 5);
  // Rotate the authored centerline through a sustained hairpin in selected passes.
  const bends = {
      1: [0.32, 0.66, 1.85],
      2: [0.26, 0.58, -2.2],
      12: [0.52, 0.8, 1.78],
      14: [0.27, 0.59, 2.12],
    },
    bend = bends[id];
  const turn = (s) =>
    bend
      ? bend[2] * ease(clamp((s / len - bend[0]) / (bend[1] - bend[0]), 0, 1))
      : 0;
  const spine = [];
  if (bend) {
    let px = center(0),
      pz = 0;
    spine.push([px, pz]);
    for (let s = 1; s <= len + 30; s++) {
      let a = turn(s - 0.5),
        d = center(s) - center(s - 1);
      px += Math.cos(a) * d + Math.sin(a);
      pz += Math.sin(a) * d - Math.cos(a);
      spine.push([px, pz]);
    }
  }
  function place(x, s) {
    if (!bend || s < 0) return [x, -s];
    let u = clamp(s, 0, spine.length - 1),
      i = Math.min(Math.floor(u), spine.length - 2),
      t = u - i,
      a = turn(s),
      l = x - center(s);
    return [
      mix(spine[i][0], spine[i + 1][0], t) +
        Math.cos(a) * l +
        Math.sin(a) * (s - u),
      mix(spine[i][1], spine[i + 1][1], t) +
        Math.sin(a) * l -
        Math.cos(a) * (s - u),
    ];
  }
  return {
    id,
    name,
    tag,
    theme,
    surface,
    width,
    len,
    events,
    turn,
    place,
    bend,
    center,
    base,
    half,
    height,
    gap,
    fork,
    feature,
    night: id >= 10,
    target: Math.round(len / (12 + id * 0.12) + 7),
  };
}
