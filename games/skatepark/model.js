import { riverside, road, loops, jumps, jumpHeight, loopPoint, tau } from "./riverside/layout.js?v=evening";
export const parks = [
  {
    name: "Soliga skateparken",
    area: "GÅRDEN",
    desc: "Betong, lönnar och en djup bowl.",
    sky: 0xa9d9eb,
    floor: 0xe1d3bc,
    ink: 0x158e88,
    rail: 0xf37732,
    shapes: [
      ["bowl", -14, -11, 19, 21, -3],
      ["half", 15, -14, 13, 19, 3],
      ["pyramid", 0, 0, 10, 11, 1.8],
      ["quarter", -18, 14, 12, 8, 2.4],
      ["manual", 12, 9, 5, 11, 0.55],
      ["steps", 23, 14, 7, 11, 1.5],
      ["funbox", -37, 12, 10, 16, 1.55],
      ["steps", -39, -13, 9, 13, 1.9],
      ["quarter", -44, -35, 16, 13, 3.8],
      ["pyramid", -17, -36, 12, 12, 2.55],
      ["manual", 4, -35, 5, 15, 0.7],
      ["half", 31, -37, 23, 16, 3.6],
      ["quarter", 40, -9, 17, 11, 2.85],
      ["manual", 40, 13, 6, 17, 0.95],
      ["bowl", 32, 36, 23, 19, -3.4],
      ["funbox", 6, 34, 13, 15, 1.7],
      ["pyramid", -21, 33, 13, 12, 2.1],
      ["quarter", -43, 34, 12, 12, 3.1],
    ],
    rails: [
      [-5, 7, -5, 19, 0.63],
      [14.4, 4, 14.4, 14, 0.14],
      [23, 10, 23, 18, 0.7],
      [-37, 5, -37, 18, 0.62],
      [-39, -18, -39, -9, 0.8],
      [6, -41, 6, -29, 0.24],
      [36, -21, 46, -22, 0.84],
      [42, 6, 42, 20, 0.26],
      [-9, 32, 0, 39, 0.76],
      [-48, 18, -48, 31, 0.68],
    ],
  },
  {
    name: "Skatepark vid havet",
    area: "STRANDEN",
    desc: "Ta fart längs strandpromenaden.",
    sky: 0xf6cfaf,
    floor: 0xedd7bd,
    ink: 0xe16f54,
    rail: 0x189d9a,
    shapes: [
      ["half", -16, 2, 13, 25, 2.8],
      ["bowl", 15, -13, 19, 16, -2.6],
      ["funbox", 4, 8, 9, 15, 1.35],
      ["quarter", -4, -21, 16, 8, 2.7],
      ["manual", 19, 15, 5, 12, 0.8],
      ["pyramid", -1, -8, 7, 8, 1],
      ["bowl", -36, -30, 27, 21, -3.4],
      ["quarter", -10, -37, 18, 12, 3.1],
      ["funbox", 13, -37, 10, 15, 2],
      ["steps", 40, -28, 10, 19, 2.3],
      ["half", 39, 3, 16, 25, 3.4],
      ["quarter", 39, 33, 17, 12, 3.7],
      ["steps", 12, 35, 10, 15, 1.7],
      ["funbox", -12, 34, 14, 15, 1.6],
      ["pyramid", -40, 30, 14, 14, 2.4],
      ["manual", -36, 6, 6, 19, 0.8],
      ["quarter", -43, -10, 11, 9, 2.35],
    ],
    rails: [
      [4, 4, 4, 12, 0.65],
      [21.3, 10, 21.3, 20, 0.12],
      [-6, 18, 3, 18, 0.68],
      [14, -43, 14, -31, 0.64],
      [40, -36, 40, -20, 0.72],
      [27, -6, 27, 9, 0.8],
      [12, 29, 12, 41, 0.75],
      [-25, 40, -16, 33, 0.72],
      [-34, 0, -34, 13, 0.22],
      [-48, -4, -48, 8, 0.66],
    ],
  },
  {
    name: "Neonparken",
    area: "MAGASINET",
    desc: "Lysande rails under kvällshimlen.",
    sky: 0x353953,
    floor: 0x877e8b,
    ink: 0x39dbdf,
    rail: 0xff618a,
    shapes: [
      ["steps", 0, -8, 12, 16, 2],
      ["bowl", -17, 10, 17, 18, -2.7],
      ["half", 18, 6, 11, 21, 3.2],
      ["quarter", -17, -16, 12, 9, 3],
      ["funbox", 3, 13, 9, 11, 1.3],
      ["manual", 17, -17, 5, 11, 0.95],
      ["half", -34, -32, 21, 20, 4],
      ["pyramid", -5, -36, 15, 16, 2.6],
      ["steps", 24, -34, 12, 20, 2.7],
      ["quarter", 44, -27, 12, 16, 3.5],
      ["manual", 40, -5, 8, 19, 0.9],
      ["funbox", 40, 21, 14, 16, 2.15],
      ["bowl", 17, 35, 21, 21, -3.6],
      ["quarter", -7, 36, 14, 12, 3.6],
      ["steps", -34, 30, 12, 17, 2.1],
      ["funbox", -39, 6, 11, 17, 1.9],
      ["manual", -40, -11, 8, 10, 0.75],
    ],
    rails: [
      [0, -14, 0, -2, 0.72],
      [19.3, -21, 19.3, -13, 0.14],
      [-8, 0, 1, 0, 0.67],
      [24, -41, 24, -27, 0.75],
      [43, -12, 43, 2, 0.23],
      [40, 15, 40, 27, 0.7],
      [-34, 23, -34, 36, 0.8],
      [-39, 0, -39, 12, 0.71],
      [-35, -15, -28, -20, 0.86],
      [2, 22, 9, 15, 0.76],
    ],
  },
];
parks.push(riverside);
export const halfWidth = 56,
  halfDepth = 52;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const edge = (t) => clamp((1 - Math.abs(t)) * 5, 0, 1);
export function surface(shape, x, z) {
  const [kind, cx, cz, w, d, h] = shape,
    u = (2 * (x - cx)) / w,
    v = (2 * (z - cz)) / d;
  if(kind==="mega" && v < -.86 && v > -1.14) {
    return h * edge(u) * clamp((1.14+v)*45,0,1);
  }
  if (Math.abs(u) >= 1 || Math.abs(v) >= 1) return 0;
  const r = Math.hypot(u, v);
  switch (kind) {
    case "mega": {
      const t=clamp((.86-v)/1.72,0,1);
      return h*(1-Math.sqrt(Math.max(0,1-t*t)))*edge(u)*clamp((1+v)*9,0,1);
    }
    case "bowl":
      return r >= 1 ? 0 : h * (0.5 + 0.5 * Math.cos(Math.PI * r));
    case "half":
      return h * Math.abs(u) ** 2.4 * edge(u) * edge(v);
    case "quarter":
      return h * ((v + 1) / 2) ** 2 * edge(v) * edge(u);
    case "manual":
      return h * edge(u) * edge(v);
    case "steps":
      return ((h * Math.floor((v + 1) * 3.5)) / 6) * edge(v) * edge(u);
    case "funbox":
      return h * Math.min(1, (1 - Math.abs(v)) * 2.8, edge(u));
    default:
      return h * Math.min(1, (1 - Math.max(Math.abs(v), Math.abs(u))) * 1.55);
  }
}
// Elevated pavilion terrace and its approaches share the rendered collision surface.
function terrace(x,z) {
 const side=clamp((12-Math.abs(x+36))/.7,0,1);
 return 3.35*side*clamp((9.8-Math.abs(z+30))/.7,0,1);
}
export const height = (park, x, z) =>
  park.sampleHeight ? park.sampleHeight(x, z) : park.shapes.reduce((sum,s)=>sum+surface(s,x,z),park===riverside?terrace(x,z)+jumpHeight(x,z):0);
export const tricks = [
  ["Ollie", 50, "Hopp"],
  ["Nollie", 75, "Broms + hopp"],
  ["Kickflip", 150, "Z i luften"],
  ["Heelflip", 150, "X i luften"],
  ["Pop shove-it", 125, "C i luften"],
  ["Frontside 180", 150, "Håll vänster i luften"],
  ["Backside 180", 150, "Håll höger i luften"],
  ["360 shove-it", 225, "Höger + C i luften"],
  ["Varial kickflip", 250, "Vänster + Z i luften"],
  ["Tre flip / 360 flip", 400, "Höger + Z i luften"],
  ["50-50 grind", 150, "Landa längs räcket, eller håll Z"],
  ["5-0 grind", 200, "Håll vänster + Z vid räcket"],
  ["Nosegrind", 250, "Håll höger + Z vid räcket"],
  ["Boardslide", 200, "Håll X vid räcket"],
  ["Lipslide", 250, "Håll C vid räcket"],
  ["Manual", 100, "Håll X på marken"],
  ["Nose manual", 150, "Håll C på marken"],
  ["Loop", 500, "Åk in längs pilen på vägen"],
  ["Framåtvolt",350,"F i luften · Volt på pekskärm"],
  ["Bakåtvolt",350,"B i luften · broms + Volt"],
  ["Indy grab",200,"G i luften · Grab på pekskärm"],
  ["Melon grab",225,"V i luften · vänster + Grab"],
  ["360", 300, "Håll svängen ett helt varv i luften"],
];
export function rider() {
  return {
    x: 0,
    z: 22,
    y: 0,
    dir: 0,
    speed: 0,
    vy: 0,
    air: false,
    loop: null,
    transition: null,
    justPopped: false,
    stunt: null,
    spin: 0,
    spinCount: 0,
    swipe: null,
    stance: 0,
    deckYaw: 0,
    settle: 0,
    rollingRise: 0,
    ignoredRail: null,
    flip: null,
    rail: null,
    manual: null,
    kick: 0,
    squat: 0,
    safe: [0, 22],
    combo: [],
    base: 0,
    variety: new Set(),
    grace: 0,
    total: 0,
    summary: "",
    recover: 0,
    holdFactor: 1,
  };
}
const turn = (k) => (k.right || 0) - (k.left || 0);
export function add(p, id, emit) {
  const repeats = p.combo.filter((n) => n === id).length;
  p.holdFactor = 1 / (1 + repeats);
  p.base += tricks[id][1] * p.holdFactor;
  p.combo.push(id);
  p.variety.add(id);
  p.grace = 0.52;
  emit("trick", id);
}
export const multi = (p) =>
  Math.min(8, 1 + 0.5 * Math.max(0, p.variety.size - 1));
export const score = (p) => Math.round(p.base * multi(p));
function clear(p) {
  p.combo = [];
  p.variety.clear();
  p.base = 0;
  p.grace = 0;
}
export function reset(p, park) {
  const [x, z] = p.safe;
  Object.assign(p, rider(), {
    x,
    z,
    y: height(park, x, z),
    safe: [x, z],
    total: p.total,
  });
}
export function act(p, k, key, emit) {
  if (p.recover > 0 || p.loop) return;
  if (key === "jump" && (!p.air || p.rail)) {
    if (p.rail) p.ignoredRail = p.rail.r;
    p.rail = null;
    p.manual = null;
    p.air = true;
    p.spin = 0;
    p.spinCount = 0;
    p.vy = 7.8 + clamp(p.slope || 0, 0, 1) * p.speed * 0.45;
    p.y += 0.06;
    p.justPopped = true;
    p.nollie = !!k.brake;
    add(p, k.brake ? 1 : 0, emit);
    emit("pop");
    return;
  }
  if (p.air && !p.flip && !p.stunt && ["volt","backflip","grab","melon"].includes(key)) {
    const id=key==="volt"?(k.brake?19:18):key==="backflip"?19:key==="melon"||k.left?21:20;
    p.stunt={id,t:0,duration:id<20?.61:.48};
    return;
  }
  if (!p.air || p.rail || p.stunt || p.flip || !["z", "x", "c"].includes(key)) return;
  const id =
    key === "z"
      ? k.left
        ? 8
        : k.right
          ? 9
          : 2
      : key === "x"
        ? 3
        : k.right
          ? 7
          : 4;
  startFlip(p, id, emit);
}
function startFlip(p, id, emit) {
  p.flip = { id, t: 0, duration: id === 9 ? 0.48 : 0.38 };
  add(p, id, emit);
  emit("swish");
}
// Eight thumb directions clockwise from up. A longer downward flick adds a full shove-it.
export const swipeMoves = [
  ["↑", 1], ["↗", 9], ["→", 3], ["↘", 6],
  ["↓", 4], ["↙", 5], ["←", 2], ["↖", 8],
];
export function swipeMove(x, up, full) {
  if (Math.hypot(x, up) < .29) return 0;
  const sector = (Math.round(Math.atan2(x, up) / (Math.PI / 4)) + 8) % 8;
  return sector === 4 && full ? 7 : swipeMoves[sector][1];
}
export function swipeJump(p, id, x, up, emit) {
  if (p.loop || p.recover > 0 || (p.air && !p.rail)) return;
  act(p, { brake: id === 1 }, "jump", emit);
  const len = Math.hypot(x, up);
  if (!id || !len) return;
  // Add a short impulse in the camera's travel frame without turning the camera
  // or replacing the rider's forward speed. It dies away during the flight.
  const scale = 3.2 / len;
  p.swipe = {
    vx: scale * (x * Math.cos(p.dir) - up * Math.sin(p.dir)),
    vz: scale * (-x * Math.sin(p.dir) - up * Math.cos(p.dir)),
    spin: id === 5 ? Math.PI : id === 6 ? -Math.PI : 0,
  };
  if (id > 1 && !p.swipe.spin) startFlip(p, id, emit);
}
export function railPoint(park, r, t) {
  const x = r[0] + (r[2] - r[0]) * t,
    z = r[1] + (r[3] - r[1]) * t;
  // A handrail is one straight bar, including above steps and ledges.
  if (r.profile) return [x, r.profile[0] + r.profile[1] * t, z];
  let profile = railProfiles.get(r);
  if (!profile) {
    const start = height(park, r[0], r[1]),
      end = height(park, r[2], r[3]);
    let clearance = 0;
    for (let j = 0; j <= 32; j++) {
      const u = j / 32;
      clearance = Math.max(
        clearance,
        height(park, r[0] + (r[2] - r[0]) * u, r[1] + (r[3] - r[1]) * u) -
          (start + (end - start) * u),
      );
    }
    profile = [start + r[4] + clearance, end - start];
    railProfiles.set(r, profile);
  }
  return [x, profile[0] + profile[1] * t, z];
}
const railProfiles = new WeakMap();
function catchRail(p, k, park, emit, previousY) {
  const holding = !!(k.z || k.x || k.c);
  if ((!holding && !p.air) || p.speed < 0.9 || (p.air && p.vy > 0.8)) return;
  for (const r of park.rails) {
    if (r === p.ignoredRail || (r.line && r.line === p.ignoredRail?.line)) continue;
    const dx = r[2] - r[0],
      dz = r[3] - r[1],
      len = Math.hypot(dx, dz);
    const raw = ((p.x - r[0]) * dx + (p.z - r[1]) * dz) / (len * len);
    if (raw < -0.35 / len || raw > 1 + 0.35 / len) continue;
    const t = clamp(raw, 0, 1),
      [x, y, z] = railPoint(park, r, t);
    const align = (-Math.sin(p.dir) * dx - Math.cos(p.dir) * dz) / len;
    if (
      Math.hypot(x - p.x, z - p.z) > (holding ? 0.94 : 0.64) ||
      Math.abs(align) < (holding ? 0.28 : 0.46)
    )
      continue;
    // Catch a downward crossing, or deliberately roll onto a low ledge.
    if (
      p.air
        ? Math.max(previousY, p.y) < y - 0.22 || p.y > y + 0.18
        : Math.abs(y - p.y) > 0.44
    )
      continue;
    const id = !holding
      ? 10
      : k.z
        ? k.left
          ? 11
          : k.right
            ? 12
            : 10
        : k.x
          ? 13
          : 14;
    p.swipe = null;
    p.stunt=null;
    p.rail = { r, t, len, sign: Math.sign(align), id, held: holding };
    p.slope = ((r.profile || railProfiles.get(r))[1] * p.rail.sign) / len;
    p.air = false;
    p.flip = null;
    p.manual = null;
    p.spin = 0;
    p.dir = Math.atan2(-dx * Math.sign(align), -dz * Math.sign(align));
    p.x = x;
    p.y = y;
    p.z = z;
    p.vy = 0;
    add(p, id, emit);
    emit("metal");
    return;
  }
}
export function tick(p, k, park, dt, emit) {
  if (p.loop) {
    const g=p.loop;
    const speed=Math.max(6.6,Math.sqrt(Math.max(0,g.entry*g.entry-5*p.y)));
    g.a+=g.sign*dt*speed/Math.hypot(g.track.r,g.track.drift*(1-Math.cos(g.a))/tau);
    const done=g.a<=0 || g.a>=tau;
    Object.assign(p,loopPoint(g.track,clamp(g.a,0,tau),g.lateral));
    if(done){p.loop=null;p.speed=g.entry;p.settle=.3;p.grace=.52;p.rollingRise=0;add(p,17,emit);}
    return;
  }
  if (p.recover > 0) {
    p.recover -= dt;
    return;
  }
  p.settle = Math.max(0, p.settle - dt);
  p.squat = Math.max(0, p.squat - dt * 3);
  if(p.stunt){
    p.stunt.t+=dt;
    if(p.stunt.t>=p.stunt.duration){add(p,p.stunt.id,emit);p.stunt=null;}
  }
  if (p.flip) {
    p.flip.t += dt;
    if (p.flip.t >= p.flip.duration) {
      if ([4, 8].includes(p.flip.id))
        p.deckYaw = (p.deckYaw + Math.PI) % (Math.PI * 2);
      p.flip = null;
    }
  }
  if (p.rail) {
    const g = p.rail;
    g.t += (g.sign * p.speed * dt) / g.len;
    // Carry excess distance across the welded segments of a curved bar.
    while ((g.t > 1 && g.r.next) || (g.t < 0 && g.r.prev)) {
      const advance = g.t > 1;
      const excess = (advance ? g.t - 1 : g.t) * g.len;
      g.r = advance ? g.r.next : g.r.prev;
      const dx = g.r[2] - g.r[0], dz = g.r[3] - g.r[1];
      g.len = Math.hypot(dx, dz);
      g.t = (advance ? 0 : 1) + excess / g.len;
      p.dir = Math.atan2(-dx * g.sign, -dz * g.sign);
      p.slope = g.r.profile[1] * g.sign / g.len;
    }
    p.speed = Math.max(1, p.speed - dt * 0.48);
    [p.x, p.y, p.z] = railPoint(park, g.r, clamp(g.t, 0, 1));
    p.base += p.speed * dt * 15 * p.holdFactor;
    if ((g.t <= 0 && !g.r.prev) || (g.t >= 1 && !g.r.next) || (g.held && !(k.z || k.x || k.c))) {
      p.rail = null;
      p.air = true;
      p.ignoredRail = g.r;
      p.vy = 0;
      p.spin = 0;
      p.spinCount = 0;
    }
    return;
  }
  const dx = -Math.sin(p.dir),
    dz = -Math.cos(p.dir),
    ground = height(park, p.x, p.z);
  p.slope = (height(park, p.x + dx * 0.3, p.z + dz * 0.3) - ground) / 0.3;
  if (!p.air) {
    p.dir -= turn(k) * dt * (1.05 + 1.1 / (1 + p.speed * 0.17));
    const onWood = park.shapes.some(
      (shape) =>
        shape[0] === "half" && Math.abs(surface(shape, p.x, p.z)) > 0.01,
    );
    const drag = onWood ? 0.48 : park === parks[1] ? 0.78 : 0.6;
    p.speed = clamp(
      p.speed +
        dt *
          ((k.go || 0) * 6.9 -
            (k.brake || 0) * 13 -
            drag -
            p.speed * 0.085 -
            p.slope * 8),
      0,
      13,
    );
    if (k.go) {
      p.kick += dt * (5 + p.speed * 0.13);
      if (
        Math.sin(p.kick) > 0 &&
        Math.sin(p.kick - dt * (5 + p.speed * 0.13)) <= 0
      )
        emit("push");
    }
    if (!k.go) p.kick = 0;
    const manual = p.speed > 0.9 ? (k.x ? 15 : k.c ? 16 : null) : null;
    if (manual !== null) {
      if (p.manual !== manual) {
        add(p, manual, emit);
        emit("manual");
      }
      p.base += dt * p.speed * 8 * p.holdFactor;
    }
    p.manual = manual;
  } else {
    if (p.swipe?.spin) {
      p.spin = Math.sign(p.swipe.spin) * Math.min(Math.PI, Math.abs(p.spin) + 7.6 * dt);
    } else if (!p.swipe) {
      p.spin -= turn(k) * dt * (park.sampleHeight ? 7.1 : 5.8);
    }
    const n = Math.floor((Math.abs(p.spin) + 0.1) / Math.PI);
    if (n > p.spinCount) {
      p.spinCount = n;
      add(p, park.sampleHeight && n % 2 === 0 ? 17 : p.spin > 0 ? 5 : 6, emit);
    }
  }
  // The coping redirects momentum upwards. On descent the board rolls back
  // into the same transition, including when the player pops before the lip.
  if ((!p.air || p.justPopped) && !p.transition && p.speed>1) {
    for (const [kind,cx,cz,w,d] of park.shapes) {
      if (!["quarter","half","mega"].includes(kind)) continue;
      const across=kind==="half", axis=across?p.x:p.z, center=across?cx:cz;
      const side=across?Math.sign(axis-center):kind==="mega"?-1:1;
      const size=across?w:d, lip=kind==="mega"?.85:.79;
      const along=2*(axis-center)*side/size;
      const heading=across?dx:dz, cross=across?p.z-cz:p.x-cx, width=across?d:w;
      if (heading*side<.32 || Math.abs(cross)>=width*.49 || along>lip+.045) continue;
      if (p.justPopped ? along<(across?.12:-.72) : along+2*heading*side*p.speed*dt/size<lip) continue;
      const launch=Math.max(p.vy,8.2+.32*p.speed);
      const outward=Math.max(0,(lip*size/2-(axis-center)*side));
      p.transition={across,side,cx,cz,w,d,time:0,flight:2*launch/17.5,
        start:axis,excursion:Math.min(outward,1.1),dir:p.dir,
        turn:Math.atan2(Math.sin((across?-p.dir:Math.PI-p.dir)-p.dir),Math.cos((across?-p.dir:Math.PI-p.dir)-p.dir))};
      p.vy=launch;p.air=true;p.manual=null;
      break;
    }
  }
  p.justPopped=false;
  const prev={x:p.x,y:p.y,z:p.z};
  let nx = p.x + ((p.swipe?.vx || 0) - Math.sin(p.dir) * p.speed) * dt,
    nz = p.z + ((p.swipe?.vz || 0) - Math.cos(p.dir) * p.speed) * dt;
  if (p.transition) {
    const tr=p.transition;
    tr.time+=dt;
    const u=tr.time/tr.flight;
    const arc=4*u*(1-u)*tr.excursion-.85*u*u;
    const normal=tr.start+tr.side*arc;
    const tangent=(tr.across?dz:dx)*p.speed*dt;
    if(tr.across){nx=normal;nz=clamp(p.z+tangent,tr.cz-tr.d*.48,tr.cz+tr.d*.48);}
    else{nz=normal;nx=clamp(p.x+tangent,tr.cx-tr.w*.48,tr.cx+tr.w*.48);}
    const t=clamp((u-.26)/.6,0,1);
    p.dir=tr.dir+tr.turn*t*t*(3-2*t);
  }
  if (p.swipe) {
    const drag = Math.exp(-2.8 * dt);
    p.swipe.vx *= drag;
    p.swipe.vz *= drag;
  }
  const limitX = park.halfWidth || halfWidth, limitZ = park.halfDepth || halfDepth;
  const avenue=park===riverside && nz>=50;
  p.x = clamp(nx, avenue?road.xMin+1:1-limitX, avenue?road.xMax-1:limitX-1);
  p.z = clamp(nz, park===riverside && Math.abs(p.x)>55?52:1-limitZ, park===riverside?road.zMax-1:limitZ-1);
  if(park===riverside && Math.abs(prev.x)>55 && nz<52){p.x=prev.x;p.z=52;}
  if (nx !== p.x || nz !== p.z) {
    p.speed *= 0.88;
    if (p.speed > 3 && p.squat === 0) {
      emit("bump");
      p.squat = 0.4;
    }
  }
  let woodFloor=0;
  if(park===riverside && p.z>58){
    // Boards can climb the sloping face, but cannot enter a jump through a vertical riser.
    const rim=jumpHeight(p.x,p.z);
    if(rim>jumpHeight(prev.x,prev.z)+.22 && prev.y<rim-.12){
      p.x=prev.x;p.z=prev.z;p.speed=0;p.swipe=null;
    }
    const sign=-Math.sign(Math.sin(p.dir));
    if(!p.air && !p.rail && p.speed>2 && Math.abs(Math.sin(p.dir))>.78){
      for(const track of loops){
        const entry=loopPoint(track,sign>0?0:tau),lateral=p.z-entry.z;
        if((prev.x-track.x)*sign<=0 && (p.x-track.x)*sign>=0 && Math.abs(lateral)<=1.84){
          p.loop={track,a:sign>0?0:tau,sign,lateral,entry:Math.max(8.5,p.speed)};
          p.dir=-sign*Math.PI/2;p.stance=p.spin=0;p.manual=null;p.slope=0;
          Object.assign(p,loopPoint(track,p.loop.a,lateral));return;
        }
      }
    }
    // Test the swept board and body against the same helical ribbon as the mesh.
    for(const l of loops){
      if(Math.abs(p.x-l.x)>l.r+.8)continue;
      // At a fixed X there can be two different wooden surfaces overhead.
      // Only the one approached from above may become a landing surface.
      const dx=p.x-l.x;
      for(const top of [false,true]){
        const r=top?l.r+.24:l.r;
        if(Math.abs(dx)>=r)continue;
        const offset=Math.sqrt(r*r-dx*dx)*(top?1:-1),y=.035+l.r+offset;
        const a=(Math.atan2(dx,-offset)+tau)%tau;
        if(a<.42||a>tau-.42||Math.abs(p.z-loopPoint(l,a).z)>2.05)continue;
        if(prev.y>=y-.015 && p.vy<=0)woodFloor=Math.max(woodFloor,y);
      }
      for(const dy of [.12,.72,1.3]){
        const sx=p.x-l.x,sy=l.r+.035-(p.y+(p.air?p.vy*dt:0)+dy);
        const angle=(Math.atan2(sx,sy)+tau)%tau;
        if(angle<.42||angle>tau-.42)continue;
        const radius=Math.hypot(sx,sy),old=Math.hypot(prev.x-l.x,l.r+.035-prev.y-dy);
        if(Math.abs(p.z-loopPoint(l,angle).z)>2.24 || Math.min(old,radius)>l.r+.32 || Math.max(old,radius)<l.r-.1)continue;
        p.x=prev.x;p.z=prev.z;p.speed=0;p.swipe=null;
        if(p.vy>0)p.vy=0;
        break;
      }
    }
    if(!p.air && p.speed>3){
      for(const j of jumps){
        if(Math.abs(p.z-j.z)>2.65)continue;
        const lip=j.x-sign*j.gap/2;
        if((prev.x-lip)*sign<0 && (p.x-lip)*sign>=0){
          p.air=true;p.y=j.h;p.vy=5.2;p.spin=p.spinCount=0;p.manual=null;
        }
      }
    }
  }
  const floor = Math.max(woodFloor||-Infinity,height(park, p.x, p.z));
  const rise = (floor - ground) / dt;
  if (
    !p.air &&
    p.settle === 0 &&
    p.rollingRise > 2.4 &&
    p.speed > 4 &&
    rise < p.rollingRise * 0.52
  ) {
    p.air = true;
    p.vy = Math.min(8, p.rollingRise);
    p.spin = 0;
    p.spinCount = 0;
    p.manual = null;
  }
  p.rollingRise = p.air ? 0 : rise;
  if (p.air) {
    const previousY = p.y;
    p.vy -= 17.5 * dt;
    p.y += p.vy * dt;
    if (!p.transition) catchRail(p, k, park, emit, previousY);
    if (p.rail) return;
    if (p.y <= floor && p.vy <= Math.max(0, rise)) {
      const mis = Math.abs(Math.sin(p.spin));
      const unfinished = (p.flip && p.flip.t / p.flip.duration < 0.57) || (p.stunt?.id<20 && p.stunt.t/p.stunt.duration<.75);
      p.stunt=null;
      p.transition=null;
      p.y = floor;
      p.air = false;
      // After a 180 the rider rolls switch; the velocity and chase camera keep their heading.
      p.stance =
        (p.stance + Math.round(p.spin / Math.PI) * Math.PI) % (2 * Math.PI);
      if (park.sampleHeight && !p.swipe) {
        // Roll away regular along the landing heading after a completed half-turn.
        p.dir += Math.round(p.spin / Math.PI) * Math.PI;
        p.stance = 0;
      }
      p.swipe = null;
      p.settle = 0.32;
      p.ignoredRail = null;
      p.spin = 0;
      p.flip = null;
      p.grace = 0.52;
      p.squat = 1;
      emit("land", Math.abs(p.vy));
      p.vy = 0;
      if (unfinished || mis > 0.95) {
        clear(p);
        p.summary = "Oj! Upp på brädan igen.";
        p.speed *= 0.3;
        p.recover = park.sampleHeight ? 0.95 : 0.45;
        emit("bail");
      }
    }
  } else {
    p.y = floor;
    catchRail(p, k, park, emit, p.y);
    if (p.rail) return;
    if (!p.manual && p.combo.length) {
      p.grace -= dt;
      if (p.grace <= 0) {
        const value = score(p);
        p.total += value;
        p.summary =
          p.combo
            .slice(-4)
            .map((i) => tricks[i][0])
            .join(" + ") +
          " · " +
          value.toLocaleString("sv-SE") +
          " poäng!";
        emit("bank", value);
        clear(p);
      }
    }
    if (
      Math.abs(floor) < 0.02 &&
      ((Math.abs(p.x)<halfWidth-3 && Math.abs(p.z)<halfDepth-3) ||
        (park===riverside && p.z>54 && p.z<80 && Math.abs(p.x)<78 && loops.every(l=>Math.abs(l.x-p.x)>l.r+1)))
    )
      p.safe = [p.x, p.z];
  }
}
