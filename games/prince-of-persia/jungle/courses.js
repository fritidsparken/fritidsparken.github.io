"use strict";

const bridgeView = $('bridgeView'),
  bridgeCanvas = $('bridgeCanvas'),
  brush = bridgeCanvas.getContext('2d');
const bridgeArt = Object.fromEntries(Object.entries(JUNGLE_ART).map(([key, url]) => {
  const image = new Image();
  image.src = url;
  return [key, image];
}));
// Each course has its own rhythm. L/R obstacles leave the opposite half open.
const jungleCourses = [
  ['Ormbunksstigen', 190, 3.25, 'soil', 'gap logL gap logR gap pillar', .13],
  ['Rotstigen', 216, 3.35, 'soil', 'logL logR log logL gap logR', .38],
  ['Jadefloden', 232, 3.4, 'soil', 'gap pillarR gapL log gapR gap', .23],
  ['Den dränkta gården', 248, 3.45, 'stone', 'pillarL gapR pillar logL pillarR gap', .28],
  ['Lyktgrottan', 264, 3.55, 'soil', 'log gapL logR logL gap log', .47],
  ['Ockraravinen', 280, 3.62, 'stone', 'gapL pillarR gap pillarL log gapR', .59],
  ['Den gamla akvedukten', 298, 3.68, 'stone', 'pillar gapR gapL pillarR gap pillarL', .27],
  ['Bambudalen', 312, 3.76, 'soil', 'logR log gapL logL gap logR', .62],
  ['Bärnstensgrottan', 332, 3.86, 'stone', 'pillarL gap pillarR log gapL pillar', .43],
  ['Soltemplets flykt', 360, 4.0, 'soil', 'gap logL pillarR gapL log pillar gapR logR', .54]
];
const bridge = {
    active: false,
    resume: false,
    level: 0,
    done: false
  },
  bridgeKeys = new Set();
let bridgePointer = null,
  bridgeForward = 0,
  bridgeAxis = 0,
  bridgeStamp = 0,
  bridgeHandle = 0;
const saveKey = 'lostWorlds.jungleChase.1';
let jungleRecord = {
  next: 0,
  best: Array(10).fill(-1)
};
try {
  const r = JSON.parse(localStorage.getItem(saveKey));
  if (Number.isInteger(r?.next) && Array.isArray(r.best)) {
    jungleRecord.next = clamp(r.next, 0, 9);
    jungleRecord.best = jungleRecord.best.map((_, i) => Number.isInteger(r.best[i]) ? Math.max(-1, r.best[i]) : -1);
  }
} catch {}
function course() {
  return jungleCourses[bridge.level];
}
const PAD_TOP = .115;
const isCave = level => level === 4 || level === 8;
function buildCourse() {
  const [, length, speed,, sequence] = course(),
    pattern = sequence.split(' '),
    hazards = [],
    coins = [],
    pits = [],
    rocks = [{
      trigger: 0,
      s: -4.2,
      x: 0,
      travel: 0,
      stopped: false
    }];
  let s = 11,
    i = 0;
  while (s < length - 7) {
    if (i % 5 === 2 && s + speed * .78 * (6 + Math.floor(bridge.level / 3) + 1) < length - 6) {
      const stride = speed * .78,
        start = s - 2,
        count = 6 + Math.floor(bridge.level / 3);
      const pads = Array.from({
        length: count
      }, (_, j) => ({
        s: start + stride * (.82 + j),
        x: (j % 2 ? -.46 : .46) * (i % 2 ? 1 : -1),
        r: .85
      }));
      const end = pads[count - 1].s + stride * .82;
      pits.push({
        start,
        end,
        pads
      });
      pads.forEach(p => coins.push({
        s: p.s,
        x: p.x,
        y: .84,
        taken: false
      }));
      s = end + speed * 2.6;
      i++;
      continue;
    }
    const token = pattern[i % pattern.length],
      lane = token.endsWith('L') ? -1 : token.endsWith('R') ? 1 : 0;
    const type = token.replace(/[LR]$/, '');
    const extent = type === 'gap' ? 1.05 + bridge.level * .035 : .62;
    hazards.push({
      s,
      type,
      l: lane < 0 ? -2.25 : lane > 0 ? .08 : -2.25,
      r: lane < 0 ? -.08 : 2.25,
      extent,
      hit: false
    });
    const line = lane ? -lane * 1.16 : 0;
    for (const [off, height] of [[-1.9, .82], [-.95, lane ? .82 : 1.22], [0, lane ? .82 : 1.62], [.95, lane ? .82 : 1.15]]) {
      coins.push({
        s: s + off,
        x: line,
        y: height,
        taken: false
      });
    }
    i++;
    s += speed * (2.55 + (i * 7 + bridge.level * 3) % 5 * .19 - bridge.level * .033);
  }
  // Bring a fresh boulder onto solid ground near the middle of each course.
  if (pits.length) {
    const crossing = pits.filter(p => p.end + 30 < length).reduce((best, p) => Math.abs(p.end - length * .50) < Math.abs(best.end - length * .50) ? p : best, pits[0]);
    const start = crossing.end + 1,
      side = bridge.level % 4 === 1 ? 1 : -1;
    rocks.push({
      trigger: start + 1.5,
      s: start,
      x: side * 8,
      travel: 0,
      stopped: false,
      branch: {
        start,
        side
      },
      entering: true
    });
  }
  // Place pressure beds in clear stretches between the original obstacles.
  let bed = 0;
  for (let pos = 5.4; pos < length - 4; pos += 2.1) {
    if (pits.some(p => pos > p.start - 4 && pos < p.end + 4) || hazards.some(o => Math.abs(o.s - pos) < 4.1)) continue;
    const side = (bed + bridge.level) % 3;
    hazards.push({
      s: pos,
      type: 'spikes',
      l: side === 0 ? .16 : -2.25,
      r: side === 1 ? -.16 : 2.25,
      extent: .60,
      hit: false
    });
    bed++;
    pos += 3.5;
  }
  if (isCave(bridge.level)) {
    const beds = hazards.filter(o => o.type === 'spikes' && (o.l > 0 || o.r < 0));
    beds.forEach((o, i) => {
      o.type = i % 2 ? 'web' : 'hatch';
      o.extent = i % 2 ? .3 : 1.75;
      o.open = false;
    });
  }
  if (!isCave(bridge.level)) {
    const beds = hazards.filter(o => o.type === 'spikes' && (o.l > 0 || o.r < 0));
    for (const o of beds.filter((_, i) => i % 2 === 0)) {
      o.type = 'hatch';
      o.extent = 1.52;
      o.open = false;
    }
  }
  // Add side obstacles between existing threats, keeping clear ground around landings.
  const variants = isCave(bridge.level) ? ['pillar', 'web', 'spikes', 'hatch'] : ['log', 'pillar', 'hatch', 'spikes'];
  let added = 0;
  for (let pos = 8; pos < length - 4; pos += .6) {
    if (pits.some(p => pos > p.start - 4 && pos < p.end + 4)) continue;
    if (hazards.some(o => Math.abs(o.s - pos) < o.extent / 2 + speed * .79 + .42)) continue;
    const type = variants[(added + bridge.level) % variants.length],
      left = (added + bridge.level) % 2 === 0;
    hazards.push({
      s: pos,
      type,
      l: left ? -2.25 : .32,
      r: left ? -.32 : 2.25,
      extent: type === 'hatch' ? 1.24 : .64,
      hit: false,
      open: false
    });
    added++;
    pos += speed * 1.45;
  }
  hazards.sort((a, b) => a.s - b.s);
  const target = [36, 40, 44, 44, 48, 52, 56, 56, 60, 64][bridge.level];
  for (let pos = 2; pos < length - 2 && coins.length < target; pos += 1.21) {
    if (coins.some(c => Math.abs(c.s - pos) < 1.1) || pits.some(p => pos > p.start - 2 && pos < p.end + 2) || hazards.some(o => Math.abs(o.s - pos) < 2.4)) continue;
    const next = hazards.find(o => o.s > pos - .8);
    coins.push({
      s: pos,
      x: next ? next.l > 0 ? -1.16 : next.r < 0 ? 1.16 : 0 : 0,
      y: .82,
      taken: false
    });
  }
  for (const pit of pits) {
    if (coins.length >= target) break;
    coins.push({
      s: pit.end - .55,
      x: pit.pads.at(-1).x,
      y: 1.24,
      taken: false
    });
  }
  return {
    hazards,
    coins,
    pits,
    rocks
  };
}
