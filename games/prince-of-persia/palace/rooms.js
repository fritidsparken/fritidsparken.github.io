"use strict";

const JUMP_STYLES = [{
  asset: 'jumpSoft',
  name: 'Mjukt hopp',
  impulse: 440
}, {
  asset: 'jumpStride',
  name: 'Löphopp',
  impulse: 420
}, {
  asset: 'jumpTuck',
  name: 'Ihopkrupet hopp',
  impulse: 490
}];
const PASSAGE_LEDGE = {
  x: 1415,
  y: 338,
  standX: 1450,
  standY: 332,
  hangX: 1384,
  hangY: 510,
  walkX: 1384,
  jumpX: 1372
};
const PASSAGE_PLATFORMS = [{
  x0: 80,
  x1: 1046,
  y: 649
}, {
  x0: 1168,
  x1: PASSAGE_LEDGE.x,
  y: 655
}, {
  x0: PASSAGE_LEDGE.x,
  x1: 1450,
  y: 332
}, {
  x0: 1450,
  x1: 1590,
  y: 332,
  endY: 303
}, {
  x0: 1590,
  x1: 1650,
  y: 303
}];
const PASSAGE_ANCHORS = [{
  x: 500,
  y: 649
}, {
  x: 1260,
  y: 655
}, {
  x: PASSAGE_LEDGE.standX,
  y: PASSAGE_LEDGE.standY
}];
// Coordinates are traced on each 1672 × 941 reference plate, at the walking
// line between the back and front edges of its stonework.
const ROOMS = [{
  name: 'Sandstenens port',
  key: '01_palatspassagen',
  line: 'Ta den brutna bron, häv dig upp och gå vidare längs terrassen.',
  scale: 1
}, {
  name: 'Rosornas tak',
  key: '02_rosenterrassen',
  line: 'Hoppa över det fallna murblocket och upp på terrassen.',
  floors: [[0, 748, 650], [809, 1252, 650], [1252, 1672, 507]],
  exit: 1574
}, {
  name: 'Det sjunkna palatset',
  key: '03_vattenpalatset',
  line: 'Korsa kanalerna. Dubbla hoppet för att ta dig över vattenstrålen.',
  floors: [[0, 518, 633], [572, 1135, 633], [1190, 1672, 633]],
  exit: 1588
}, {
  name: 'Mosaikens hemlighet',
  key: '04_mosaikgalleriet',
  line: 'Hoppa upp på galleriet och över den brutna valvbågen.',
  floors: [[0, 646, 680], [646, 1150, 544], [1235, 1672, 544]],
  exit: 1595
}, {
  name: 'Den glömda vattenvägen',
  key: '05_akvedukten',
  line: 'Korsa de tre brospannen högt över floden.',
  floors: [[0, 478, 575], [552, 1078, 575], [1152, 1672, 575]],
  exit: 1595
}, {
  name: 'Trädgårdarnas höjder',
  key: '06_hangande_tradgardar',
  line: 'Klättra förbi fontänen och hoppa över rännan.',
  floors: [[0, 638, 702], [638, 1232, 486], [1289, 1672, 486]],
  extras: [[1232, 1289, 525]],
  exit: 1592
}, {
  name: 'Stjärnornas gård',
  key: '07_stjarngarden',
  line: 'Följ stjärnljuset genom astronomens gård.',
  floors: [[0, 901, 629], [965, 1672, 629]],
  exit: 1560
}, {
  name: 'Tidens klocktorn',
  key: '08_klocktornet',
  line: 'Häv dig upp till urverket och ta den östra utgången.',
  floors: [[0, 776, 664], [776, 1288, 481], [1370, 1672, 481]],
  extras: [[1288, 1370, 511]],
  exit: 1570
}, {
  name: 'Kungarnas bro',
  key: '09_kungabron',
  line: 'Samla båda kungasigillen och gå in i det upplysta valvet till höger.',
  floors: [[0, 507, 476], [572, 1195, 476], [1247, 1672, 476]],
  exit: 1558
}, {
  name: 'Solportens skugga',
  key: '10_solporten',
  line: 'Nå den öppna porten med solsigillet.',
  floors: [[0, 600, 612], [654, 1060, 612], [1060, 1672, 516, 499]],
  exit: 1502
}];
ROOMS.splice(6, 1);
ROOMS.push({
  name: 'Solväktarens sigill',
  key: 'guardianRoom',
  line: 'Undvik näven. Hoppa över stötvågen och ta solsigillet på armbandet.',
  floors: [[0, 1672, 690]],
  exit: 1550
});
const STUDY_CONTACTS = [
  [180, 15, 1415, 338],
  [180, 15, 1415, 338],
  [177, 24, 1415, 338],
  [176, 33, 1415, 338],
  [180, 49, 1415, 338],
  [182, 62, 1415, 338],
  [173, 57, 1415, 338],
  [178, 62, 1415, 338],
  [181, 75, 1415, 338],
  [174, 102, 1415, 338],
  [174, 117, 1415, 338],
  [175, 141, 1415, 338],
  [175, 156, 1415, 338],
  [171, 161, 1423, 336],
  [174, 164, 1435, 334],
  [170, 168, 1460, 331],
  [110, 174, 1442, 334],
  [111, 176, 1450, 332],
  [111, 203, 1450, 332],
  [114, 215, 1450, 332],
  [113, 236, 1450, 332],
  [123, 243, 1450, 332],
  [128, 245, 1450, 332],
  [133, 245, 1450, 332]
];
const SOLES = [250, 250, 250, 249, 244, 239, 234, 234, 235, 230, 230, 222, 223];
const H = (f, x) => f[2] + ((f[3] ?? f[2]) - f[2]) * Math.max(0, Math.min(1, (x - f[0]) / (f[1] - f[0])));
const inSpan = (f, x) => x >= f[0] && x <= f[1];
const GRAVITY = 980,
  DOUBLE_TAP = .34,
  STEP_RISE = 150;
const trials = [
  [],
  [['stone', 415, 0, 76, 47], ['spikes', 1010, 1, 62, 120]],
  [['jet', 888, 1, 44, 153]],
  [['spikes', 895, 1, 69, 128], ['gear', 292, 0, 60, 56]],
  [['stone', 832, 1, 83, 55], ['spikes', 1290, 2, 62, 118]],
  [['jet', 911, 1, 45, 144], ['thorns', 418, 0, 66, 47]],
  [['spikes', 485, 0, 73, 131], ['stone', 1430, 1, 58, 48]],
  [['spikes', 1050, 1, 68, 146], ['gear', 345, 0, 60, 56]],
  [['stone', 873, 1, 72, 49]],
  [['jet', 327, 0, 42, 150], ['spikes', 879, 1, 62, 126], ['gear', 1270, 2, 64, 60]]
];
const clamp = (x, lo, hi) => Math.max(lo, Math.min(x, hi));
function gearX(h, t) {
  return h.x + 25 * Math.sin((t + h.offset) * 1.6);
}
function newTrialHit(h, p, t, scale) {
  const head = p.y - 143 * scale;
  if (h.type === 'gear' || h.type === 'saw') {
    const x = gearX(h, t),
      y = h.y - h.height * .5;
    const dx = Math.max(0, Math.abs(x - p.x) - 9),
      dy = Math.max(0, head - y, y - p.y);
    return dx * dx + dy * dy < (h.height * .48) ** 2;
  }
  return Math.abs(p.x - h.x) < h.width * .45 + 7 && p.y > h.y - h.height + 4 && head < h.y;
}
function trapPhase(h, time) {
  const period = h.type === 'jet' ? 4.85 : 4.15;
  const t = (time + h.offset) % period;
  const grow = clamp((t - 1.05) / .28, 0, 1),
    shrink = clamp((period - .52 - t) / .49, 0, 1);
  const a = Math.min(grow, shrink);
  return {
    height: h.height * a * a * (3 - 2 * a),
    warn: t >= .48 && t < 1.05
  };
}
function buildLip(f, i, dir, scale) {
  const lipX = dir === 1 ? f[0] : f[1],
    x = lipX + dir * 18,
    standX = clamp(x + dir * 35 * scale, f[0] + 4, f[1] - 4),
    y = H(f, x);
  return {
    dir,
    lipX,
    x,
    y,
    hangX: x - dir * 31 * scale,
    hangY: y + (SOLES[0] - STUDY_CONTACTS[0][1]) * 187 / 240 * scale,
    standX,
    standY: H(f, standX),
    floor: f,
    to: i,
    entry: 0
  };
}
const HANGING_BOXES = [
  [[0, 641, 234, 78, 94, 682.0]],
  [],
  [[1, 431, 256, 73, 91, 467.5], [2, 1412, 367, 52, 70, 1438.0]],
  [],
  [],
  [],
  [],
  [[3, 450, 260, 95, 139, 496.5], [4, 1205, 257, 65, 99, 1239.0]],
  [[5, 217, 590, 96, 176, 266], [6, 1372, 590, 96, 176, 1421]],
  []
];
HANGING_BOXES.splice(6, 1);
trials.splice(6, 1);
HANGING_BOXES.push([]);
trials.push([]);
// Floor indexes follow the final palace room order, including the guardian hall.
const palaceMechanisms = [
  [['hatch', 830, 0, 96, 0], ['spikes', 1532, 3, 46, 70]],
  [['hatch', 660, 0, 72, 0], ['saw', 1450, 2, 62, 61]],
  [['spikes', 338, 0, 50, 80], ['hatch', 1048, 1, 80, 0], ['saw', 1310, 2, 60, 59]],
  [['hatch', 470, 0, 90, 0], ['saw', 1455, 2, 68, 65]],
  [['hatch', 330, 0, 84, 0], ['saw', 978, 1, 60, 55]],
  [['hatch', 1065, 1, 84, 0], ['spikes', 1480, 2, 48, 87]],
  [['hatch', 665, 0, 86, 0], ['saw', 900, 1, 70, 68]],
  [['hatch', 710, 1, 98, 0], ['saw', 1050, 1, 68, 65]],
  [['hatch', 495, 0, 84, 0], ['spikes', 1460, 2, 54, 92]],
  [['saw', 1350, 0, 68, 64]]
];
palaceMechanisms.forEach((items, i) => trials[i].push(...items));
function hatchAngle(h, t) {
  if (h.trip == null) return 0;
  const age = t - h.trip;
  const u = clamp((age + 1 / 120) / .19, 0, 1);
  if (age < 1.8) return 1.48 * u * (2 - u) + .035 * Math.sin(24 * Math.max(0, age - .19)) * Math.exp(-10 * Math.max(0, age - .19)) * u;
  const v = clamp((age - 1.8) / .8, 0, 1);
  return 1.48 * (1 - v * v * (3 - 2 * v));
}
function hatchGap(h, t) {
  return h.width * .5 * (1 - Math.cos(hatchAngle(h, t)));
}
function makeCubes(game) {
  return HANGING_BOXES[game.index].map(([id, left, top, w, h, chain]) => {
    const x = left + w / 2;
    if (game.index === 7) return {
      id,
      left,
      top,
      w,
      h,
      chain,
      x,
      dy: 0,
      v: 0,
      up: true,
      phase: 'idle',
      timer: 0
    };
    const floor = game.all.find(f => inSpan(f, x) && H(f, x) > top + h);
    return {
      id,
      left,
      top,
      w,
      h,
      chain,
      x,
      limit: H(floor, x) - top - h,
      dy: 0,
      v: 0,
      phase: 'idle',
      timer: 0
    };
  });
}
function advanceCubes(game, dt, oldX, oldY) {
  const p = game.p,
    body = 143 * game.scale;
  for (const c of game.cubes) {
    // Collision follows the metal box. Its chain and suspension loop are scenery.
    const oldPhase = c.phase;
    const bodyTop = c.top + [32, 29, 20, 46, 32, 104, 104][c.id];
    if (c.up) {
      const near = Math.abs(p.x - c.x) < 34 && p.y <= c.top + 104 && p.y > 200;
      if (c.phase === 'idle' && near) {
        c.phase = 'release';
        c.timer = .16;
      } else if (c.phase === 'release' && (c.timer -= dt) <= 0) {
        c.phase = 'flight';
        c.v = -1190;
      } else if (c.phase === 'flight') {
        const prev = c.dy;
        c.dy += c.v * dt + 850 * dt * dt;
        c.v += 1700 * dt;
        const inX = Math.min(oldX, p.x) - 9 < c.x + 30 && Math.max(oldX, p.x) + 9 > c.x - 30;
        if (inX && Math.max(oldY, p.y) > bodyTop + Math.min(prev, c.dy) && Math.min(oldY, p.y) - body < c.top + 150 + Math.max(prev, c.dy)) {
          game.fail('cube');
          return;
        }
        if (c.dy >= 0) {
          c.dy = 0;
          c.phase = 'reset';
          c.timer = .45;
        }
      } else if (c.phase === 'reset' && (c.timer -= dt) <= 0) c.phase = 'idle';
      if (c.phase !== oldPhase) mechanismSound(c, c.phase, p.x);
      continue;
    }
    const under = Math.abs(p.x - c.x) < c.w * .46 && p.y > c.top + c.h && p.y - body < c.top + c.h + c.limit;
    const before = c.dy;
    switch (c.phase) {
      case 'idle':
        if (under) {
          c.phase = 'release';
          c.timer = c.limit < 165 ? .48 : .30;
        }
        break;
      case 'release':
        if ((c.timer -= dt) <= 0) c.phase = 'drop';
        break;
      case 'drop':
        c.v += 4200 * dt;
        c.dy = Math.min(c.limit, c.dy + c.v * dt);
        if (Math.min(p.x, oldX) - 10 < c.left + c.w - 3 && Math.max(p.x, oldX) + 10 > c.left + 3 && Math.min(oldY, p.y) - body < c.top + c.h + c.dy - 2 && Math.max(oldY, p.y) > bodyTop + before) {
          game.fail('cube');
          return;
        }
        if (c.dy >= c.limit) {
          c.phase = 'hold';
          c.timer = 1.2;
        }
        break;
      case 'hold':
        if ((c.timer -= dt) <= 0) c.phase = 'raise';
        break;
      case 'raise':
        c.dy = Math.max(0, c.dy - 146 * dt);
        if (!c.dy) {
          c.phase = 'idle';
          c.v = 0;
        }
        break;
    }
    if (c.phase !== oldPhase) mechanismSound(c, c.phase, p.x);
    if (c.phase === 'raise' && game.clock >= (c.linkTime || 0)) {
      c.linkTime = game.clock + .27;
      playEffect('chain', .16 / (1 + ((c.x - p.x) / 450) ** 2), c.x, .72);
    }
    if (c.phase === 'hold' || c.phase === 'raise') {
      const lid = bodyTop + c.dy,
        over = Math.abs(p.x - c.x) < c.w * .5 + 8;
      if (over && p.vy >= 0 && oldY <= lid + Math.abs(c.dy - before) + 2 && p.y >= lid - 1) {
        p.y = lid;
        p.vy = 0;
        p.ground = true;
        p.onCube = c;
        p.jumping = false;
        p.boosted = false;
        p.coyote = .1;
      } else if (over && p.y - body < c.top + c.h + c.dy - 2 && p.y > lid + 1) {
        p.x = oldX < c.x ? c.left - 9 : c.left + c.w + 9;
        p.vx = 0;
      }
    }
    if (p.onCube === c && (p.jumping || Math.abs(p.x - c.x) >= c.w * .5 + 8 || c.phase === 'idle')) {
      p.onCube = null;
      if (!p.jumping) {
        p.ground = false;
        p.vy = 0;
      }
    }
  }
}

