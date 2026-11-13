"use strict";

// World coordinates are metres. +Z follows the trail toward the camera.
const trailCentre = z => 1.15 * Math.sin(z * .054 + bridge.level * .36) + .53 * Math.sin(z * .098);
function terrainY(x, z) {
  const off = Math.abs(x - trailCentre(z));
  const channel = bridge.level === 2 || bridge.level === 3 ? Math.max(0, Math.min(1, (off - 2.6) / 1.4, (8.8 - off) / 2)) * 1.5 : 0;
  const bank = Math.max(0, Math.min(Math.abs(x - trailCentre(z)) - 2.35, branchDistance(x, z) - 1.45));
  return -channel + .19 * Math.sin(z * .105) + .33 * Math.sin(z * .041 + bridge.level) + .035 * Math.sin(x * 1.9 + z * .55) + (bridge.rocks?.[1]?.branch ? 1.25 * Math.min(1, Math.abs(x - trailCentre(z)) / 8) ** 2 * Math.max(0, 1 - branchDistance(x, z) / 4) : 0) + Math.min(3.5, bank * .20) * (1 + .35 * Math.sin(z * .41 + x * .73));
}
function supportY(s, x) {
  const xw = trailCentre(s) + x,
    pit = bridge.pits.find(p => s > p.start && s < p.end);
  const pad = pit?.pads.find(p => (s - p.s) ** 2 + (xw - trailCentre(p.s) - p.x) ** 2 <= p.r * p.r);
  return pad ? terrainY(trailCentre(pad.s) + pad.x, pad.s) : terrainY(xw, s);
}
function jungleView() {
  const w = bridgeCanvas.clientWidth || 960,
    h = bridgeCanvas.clientHeight || 540;
  const focal = Math.min(h * 1.05, w * 1.42),
    eye = 7,
    tilt = .215,
    cs = Math.cos(tilt),
    sn = Math.sin(tilt);
  const cx = trailCentre(bridge.d) + bridge.cam,
    cy = terrainY(cx, bridge.d) + 3.05,
    cz = bridge.d + eye;
  function screen(x, y, z) {
    const rel = z - cz,
      dy = y - cy,
      depth = -rel * cs - dy * sn,
      k = focal / Math.max(.17, depth);
    return [w * .5 + (x - cx) * k, h * .47 - (dy * cs - rel * sn) * k, depth];
  }
  function proj(z, u, above = 0) {
    const x = trailCentre(z) + u;
    return screen(x, supportY(z, u) + above, z);
  }
  return {
    w,
    h,
    eye,
    fy: focal,
    fx: focal,
    cx,
    cy,
    cz,
    cs,
    sn,
    focal,
    proj,
    screen,
    unit: Math.max(w / 1672, h / 941)
  };
}
function seeded(seed) {
  return () => {
    seed = Math.imul(seed, 1664525) + 1013904223 >>> 0;
    return seed / 4294967296;
  };
}
const sub3 = (a, b) => a.map((v, i) => v - b[i]),
  cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit3 = a => {
  const n = Math.hypot(...a) || 1;
  return a.map(v => v / n);
};
function worldChunk(lo, hi, level) {
  const mats = {},
    rand = seeded(83411 + level * 17713 + Math.floor((lo + 62) * 113));
  function tri(tex, p, q, r, uv, color, normal) {
    const out = mats[tex] ??= [],
      n = normal || unit3(cross3(sub3(q, p), sub3(r, p)));
    for (const [i, v] of [p, q, r].entries()) out.push(...v, ...(Array.isArray(n[0]) ? n[i] : n), ...uv[i], ...color);
  }
  function face(tex, a, b, c, d, uv, tint, n) {
    tri(tex, a, b, c, [uv[0], uv[1], uv[2]], tint, n);
    tri(tex, a, c, d, [uv[0], uv[2], uv[3]], tint, n);
  }
  function tube(tex, a, b, r0, r1, tint, sides = 10) {
    const axis = unit3(sub3(b, a)),
      u = unit3(cross3(axis, Math.abs(axis[1]) > .92 ? [1, 0, 0] : [0, 1, 0])),
      v = cross3(axis, u);
    const len = Math.hypot(...sub3(a, b));
    let pa, pb, old;
    for (let i = 0; i <= sides; i++) {
      const t = i * 2 * Math.PI / sides,
        n = u.map((u, j) => u * Math.cos(t) + v[j] * Math.sin(t));
      const p = a.map((a, j) => a + r0 * n[j]),
        q = b.map((b, j) => b + r1 * n[j]);
      if (i) {
        const t0 = (i - 1) / sides,
          t1 = i / sides,
          k = len / 1.75;
        tri(tex, pa, p, q, [[t0, k], [t1, k], [t1, 0]], tint, [old, n, n]);
        tri(tex, pa, q, pb, [[t0, k], [t1, 0], [t0, 0]], tint, [old, n, old]);
      }
      if (i) {
        tri(tex, b, pb, q, [[.5, .5], [.1, .15], [.9, .8]], tint, axis);
        tri(tex, a, p, pa, [[.5, .5], [.9, .8], [.1, .15]], tint, axis.map(v => -v));
      }
      pa = p;
      pb = q;
      old = n;
    }
  }
  function cylinderTop(x, y, z, r, tint) {
    const count = 32;
    for (let i = 0; i < count; i++) {
      const a = i * 2 * Math.PI / count,
        b = (i + 1) * 2 * Math.PI / count;
      const polar = t => [x + r * Math.cos(t), y, z + r * Math.sin(t)],
        uv = t => [.5 + .49 * Math.cos(t), .5 + .49 * Math.sin(t)];
      tri('cap', [x, y, z], polar(b), polar(a), [[.5, .5], uv(b), uv(a)], tint, [0, 1, 0]);
    }
  }
  function box(x, y, z, rx, ry, rz, tint) {
    const a = [x - rx, y, z - rz],
      b = [x + rx, y, z - rz],
      c = [x + rx, y, z + rz],
      d = [x - rx, y, z + rz],
      up = p => [p[0], p[1] + ry, p[2]];
    const uv = [[0, 1], [1, 1], [1, 0], [0, 0]];
    for (const [p, q] of [[a, b], [b, c], [c, d], [d, a]]) {
      const len = Math.hypot(...sub3(p, q));
      face('stone', p, q, up(q), up(p), [[0, ry * .76], [len * .76, ry * .76], [len * .76, 0], [0, 0]], tint);
    }
    face('stone', up(a), up(d), up(c), up(b), uv, tint, [0, 1, 0]);
  }
  function leaf(tex, x, y, z, theta, length, width, rise, droop, color) {
    const dx = Math.cos(theta),
      dz = Math.sin(theta);
    function P(t, side) {
      const bend = rise * t - droop * t * t,
        fold = .055 * width * (1 - Math.abs(side)) * Math.sin(Math.PI * t);
      return [x + dx * t * length - side * dz * width / 2, y + bend + fold, z + dz * t * length + side * dx * width / 2];
    }
    for (let i = 0; i < 3; i++) {
      const a = i / 3,
        b = (i + 1) / 3;
      for (const [l, r] of [[-1, 0], [0, 1]]) face(tex, P(a, l), P(a, r), P(b, r), P(b, l), [[(l + 1) / 2, 1 - a], [(r + 1) / 2, 1 - a], [(r + 1) / 2, 1 - b], [(l + 1) / 2, 1 - b]], color, [0, .9, .35]);
    }
  }
  function tree(x, y, z, size) {
    if (isCave(level) || [0, 3, 5, 6, 7, 9].includes(level)) return;
    if (branchDistance(x, z) < 2.3) return;
    const height = size * (5.7 + rand() * 3.4),
      r = size * (.22 + rand() * .22),
      lean = (rand() - .5) * 1.25,
      sign = Math.sign(trailCentre(z) - x);
    const base = [x, y - .09, z],
      middle = [x + lean, y + height * .49, z + .12],
      crown = [x + sign * .9 + lean, y + height, z + (rand() - .5)];
    const bark = [.83, .83, .74, 0],
      rootTop = [x + lean * .10, y + r * 2.4, z + .04];
    tube('bark', base, rootTop, r * 1.63, r * .94, bark, 14);
    tube('bark', rootTop, middle, r * .94, r * .75, bark, 14);
    tube('bark', middle, crown, r * .75, r * .31, bark, 12);
    for (let k = 0; k < 5; k++) {
      const a = k * 1.256 + rand() * .7,
        run = r * (2.1 + rand() * 2.6);
      const dx = Math.cos(a),
        dz = Math.sin(a),
        rim = [x + dx * r * .63, y + r * 1.63, z + dz * r * .63];
      const mx = x + dx * run * .52,
        mz = z + dz * run * .52,
        mid = [mx, terrainY(mx, mz) + r * .20, mz];
      const ex = x + dx * run + .11 * dz,
        ez = z + dz * run - .11 * dx;
      tube('bark', rim, mid, r * .42, r * .22, bark, 8);
      tube('bark', mid, [ex, terrainY(ex, ez) - .04, ez], r * .22, r * .025, bark, 8);
    }
    for (let k = 0; k < 5; k++) {
      const a = k * 1.257 + rand() * .7,
        reach = size * (1.2 + rand() * 1.7);
      const start = [crown[0], crown[1] - size * (.7 + rand() * 2), crown[2]],
        end = [crown[0] + Math.cos(a) * reach, crown[1] + (rand() - .5) * size, crown[2] + Math.sin(a) * reach];
      tube('bark', start, end, r * .42, r * .08, bark, 7);
      for (let n = 0; n < 4; n++) {
        const t = a + n * 1.55,
          shade = .80 + rand() * .20;
        leaf('canopy', ...end, t, size * (1.7 + rand()), size * 1.95, size * .55, size * (.65 + rand() * .35), [shade, 1, .87, 0]);
      }
    }
  }
  function arch(z, goal) {
    const x = trailCentre(z),
      y = terrainY(x, z) - .13,
      t = [.91, .87, .73, 0],
      half = 2.65;
    for (const side of [-1, 1]) {
      const xx = x + side * half;
      box(xx, y, z, .67, .34, .71, t);
      box(xx, y + .34, z, .52, .33, .59, t);
      box(xx, y + .67, z, .39, 2.35, .48, t);
      box(xx, y + 3.02, z, .57, .36, .64, t);
      box(xx, y + 3.38, z, .67, .19, .72, t);
    }
    box(x, y + 3.58, z, half + .63, .48, .62, t);
    box(x, y + 4.06, z, half + .72, .17, .71, t);
    // Stepped temple wings, a raised cornice and a sun disk frame the exit.
    for (const side of [-1, 1]) {
      for (let step = 0; step < 3; step++) {
        const xx = x + side * (3.55 + step * .91);
        box(xx, y - .1, z - .57, .50, 3.26 - step * .65, 1.31, [.85, .84, .69, 0]);
        box(xx, y + 3.15 - step * .65, z - .55, .57, .20, 1.42, t);
      }
      for (let j = 0; j < 3; j++) box(x + side * half, y + .92 + j * .72, z, .432, .14, .51, [.82, .80, .61, 0]);
      const xx = x + side * half,
        zz = z + .68;
      const q = [[xx - .24, y + 3.28, zz], [xx + .24, y + 3.28, zz], [xx + .20, y + 1.91, zz + .07], [xx - .17, y + 2.02, zz + .06]];
      face('cloth', ...q, [[0, 0], [1, 0], [1, 1], [0, 1]], [1, .95, .86, 0], [0, 0, 1]);
    }
    const center = [x, y + 3.95, z + .68];
    for (let j = 0; j < 32; j++) {
      const a = j * Math.PI / 16,
        b = (j + 1) * Math.PI / 16;
      const p = t => [x + .36 * Math.cos(t), center[1] + .36 * Math.sin(t), center[2]];
      tri('seal', center, p(a), p(b), [[.5, .5], [.5 + .49 * Math.cos(a), .5 - .49 * Math.sin(a)], [.5 + .49 * Math.cos(b), .5 - .49 * Math.sin(b)]], white, [0, 0, 1]);
    }
    if (goal) box(x, y + 4.23, z, .66, .46, .46, [1, .77, .44, 0]);
  }
  const breaks = [lo, hi],
    crossings = [-22, -14, -9, -6, -4, -2.25, -1.15, 0, 1.15, 2.25, 4, 6, 9, 14, 22];
  for (let z = lo + 1; z < hi; z++) breaks.push(z);
  for (const p of bridge.pits) breaks.push(p.start, p.end);
  for (const h of bridge.hazards) if (h.type === 'gap' || h.type === 'hatch') {
    breaks.push(h.s - h.extent / 2, h.s + h.extent / 2);
    crossings.push(h.l, h.r);
  }
  const zs = [...new Set(breaks.filter(v => v >= lo && v <= hi))].sort((a, b) => a - b),
    xs = [...new Set(crossings)].sort((a, b) => a - b);
  function point(x, z) {
    const wx = trailCentre(z) + x;
    return [wx, terrainY(wx, z), z];
  }
  const white = [1, 1, 1, 0];
  for (let i = 1; i < zs.length; i++) for (let j = 1; j < xs.length; j++) {
    const za = zs[i - 1],
      zb = zs[i],
      l = xs[j - 1],
      r = xs[j],
      z = (za + zb) / 2,
      x = (l + r) / 2;
    const pit = bridge.pits.some(p => z > p.start && z < p.end && Math.abs(x) < 2.25);
    const gap = bridge.hazards.some(h => (h.type === 'gap' || h.type === 'hatch') && Math.abs(z - h.s) < h.extent * .5 && x > h.l && x < h.r);
    if (pit || gap) continue;
    const quad = [point(l, za), point(l, zb), point(r, zb), point(r, za)];
    face('ground', ...quad, quad.map(p => [p[0] / 3.4, p[2] / 3.4]), [1, 1, 1, 0]);
  }
  function cutWall(z0, z1, l, r, depth) {
    const a = Math.max(z0, lo),
      b = Math.min(z1, hi);
    if (a >= b) return;
    const q = [point(l, a), point(l, b), point(r, b), point(r, a)],
      down = p => [p[0], p[1] - depth, p[2]];
    for (const [i, j] of [[0, 1], [1, 2], [2, 3], [3, 0]]) {
      if (i === 1 && b < z1 || i === 3 && a > z0) continue;
      const p = q[i],
        v = q[j];
      face('stone', v, p, down(p), down(v), [[0, 0], [Math.hypot(...sub3(v, p)) / 2, 0], [Math.hypot(...sub3(v, p)) / 2, depth / 2], [0, depth / 2]], [.60, .65, .57, 0]);
    }
    face('depth', ...q.map(down), [[0, 0], [0, 1], [1, 1], [1, 0]], [.08, .25, .20, 0], [0, 1, 0]);
  }
  for (const pit of bridge.pits) {
    cutWall(pit.start, pit.end, -2.25, 2.25, 5.7);
    for (const p of pit.pads) if (p.s >= lo && p.s < hi) {
      const x = trailCentre(p.s) + p.x,
        y = terrainY(x, p.s),
        a = [x, y - 5.75, p.s],
        b = [x, y - .12, p.s];
      tube('stone', a, b, p.r * .81, p.r * .94, [.75, .79, .63, 0], 24);
      tube('stone', b, [x, y, p.s], p.r, p.r, white, 32);
      cylinderTop(x, y, p.s, p.r, white);
    }
  }
  for (const o of bridge.hazards) {
    if (o.type === 'hatch') {
      const a = o.s - o.extent / 2,
        b = o.s + o.extent / 2;
      cutWall(a, b, o.l, o.r, 4.8);
      if (o.s >= lo && o.s < hi) for (let j = 0; j < 5; j++) {
        const l = o.l + (o.r - o.l) * j / 5 + .009,
          r = o.l + (o.r - o.l) * (j + 1) / 5 - .009;
        const q = [point(l, a), point(l, b), point(r, b), point(r, a)];
        face('lid' + o.s, ...q, q.map(p => [p[0] / 3.4, p[2] / 3.4]), [.92, .91, .88, 0]);
      }
      continue;
    }
    if (o.type === 'web' && o.s >= lo && o.s < hi) {
      const mat = 'web' + o.s,
        mid = (o.r + o.l) / 2,
        y = terrainY(trailCentre(o.s) + mid, o.s) + 1.1;
      const at = (i, r) => {
        const a = i * Math.PI / 5;
        return [trailCentre(o.s) + mid + Math.cos(a) * r * (o.r - o.l) * .65, y + Math.sin(a) * r * 1.43, o.s + .12 * r * r];
      };
      const silk = [.83, .86, .87, 0];
      for (let i = 0; i < 10; i++) {
        tube(mat, at(i, 0), at(i, 1.2), .009, .012, silk, 4);
        for (let k = 1; k <= 5; k++) tube(mat, at(i, k / 5), at(i + 1, k / 5), .008, .008, silk, 4);
      }
      continue;
    }
    if (o.type === 'web') continue;
    if (o.type === 'gap') {
      cutWall(o.s - o.extent / 2, o.s + o.extent / 2, o.l, o.r, 2.7);
      continue;
    }
    if (o.s < lo || o.s >= hi) continue;
    if (o.type === 'spikes') {
      const count = Math.floor((o.r - o.l) / .40);
      for (let i = 0; i < count; i++) for (const dz of [-.13, .13]) {
        const z = o.s + dz,
          x = trailCentre(z) + o.l + (i + .5) * (o.r - o.l) / count,
          y = terrainY(x, z);
        tube('stone', [x, y - .03, z], [x, y + .065, z], .145, .12, [.79, .66, .43, 0], 8);
        tube('white', [x, y + .04, z], [x, y + .74, z], .078, .003, [.72, .76, .73, -1 - o.s], 8);
      }
      continue;
    }
    const x = trailCentre(o.s),
      rad = o.type === 'log' ? .245 : .29,
      a = [x + o.l, terrainY(x + o.l, o.s) + rad, o.s],
      b = [x + o.r, terrainY(x + o.r, o.s) + rad, o.s];
    tube(o.type === 'log' ? 'bark' : 'stone', a, b, rad, rad * .95, white, 18);
    for (const p of [a, b]) {
      const q = [p[0] + .05, p[1], p[2]];
      tube('stone', p, q, rad * 1.02, rad * 1.02, white, 16);
      for (let j = 0; j < 16; j++) {
        const t = j * Math.PI / 8,
          u = (j + 1) * Math.PI / 8,
          edge = k => [q[0], q[1] + rad * Math.sin(k), q[2] + rad * Math.cos(k)];
        tri('stone', q, edge(t), edge(u), [[.5, .5], [.5 + .48 * Math.cos(t), .5 + .48 * Math.sin(t)], [.5 + .48 * Math.cos(u), .5 + .48 * Math.sin(u)]], white);
      }
    }
    if (o.type === 'log') tube('bark', [(a[0] + b[0]) / 2, a[1], o.s], [(a[0] + b[0]) / 2 + .17, a[1] + .28, o.s + .32], .115, .037, white, 7);
  }
  for (const z of [-5, course()[1] + 1.2]) if (z >= lo && z < hi) arch(z, z > 0);
  for (let z = hi - 1; z >= lo; z -= 4.85) for (const side of [-1, 1]) {
    const zz = z - rand() * .8,
      near = trailCentre(zz) + side * (3.75 + rand() * 2.8);
    tree(near, terrainY(near, zz), zz, .68 + rand() * .56);
    const far = near + side * (3.6 + rand() * 4.5);
    tree(far, terrainY(far, zz), zz, 1 + rand() * .42);
  }
  for (const side of [-1, 1]) {
    const z = lo + 5.8,
      xx = trailCentre(z) + side * (13 + rand() * 4);
    tree(xx, terrainY(xx, z), z, 1.48 + rand() * .38);
  }
  for (const side of [-1, 1]) {
    const z = lo + 6,
      xx = trailCentre(z) + side * (3.4 + rand() * 1.9);
    if (level !== 1 && level !== 2) continue;
    let p = [xx, terrainY(xx, z) + 6.8, z];
    for (let j = 1; j < 8; j++) {
      const q = [xx + Math.sin(j * .48) * .48, p[1] - .50, z + j * .075];
      tube('bark', p, q, .032, .032, [.59, .73, .48, 0], 5);
      if (j % 2) leaf('canopy', ...q, j * 1.87, .41, .34, .31, .47, [.9, .97, .83, 0]);
      p = q;
    }
  }
  for (let z = hi - .21; z > lo; z -= .96) for (const side of [-1, 1]) {
    const xx = trailCentre(z) + side * (2.25 + rand() * 3.75),
      yy = terrainY(xx, z);
    if (isCave(level) || [3, 5, 6, 9].includes(level) && rand() < .88 || branchDistance(xx, z) < 1.75) continue;
    const species = rand(),
      tex = species < .37 ? 'banana' : species < .77 ? 'frond' : 'grass',
      size = (tex === 'banana' ? 1.35 : tex === 'frond' ? .93 : .56) * (.63 + rand() * .73);
    for (let j = 0; j < 6; j++) {
      const a = j * Math.PI / 3 + rand() * .5;
      leaf(tex, xx, yy - .02, z, a, size * (.75 + rand() * .55), size * (tex === 'frond' ? .49 : .56), size * 1.64, size * (.88 + rand() * .44), [.88 + rand() * .12, .97, .85, 0]);
    }
  }
  // Fixed pebbles, outcrops and ferns break up the transition at the banks.
  function outcrop(x, y, z, r, flat) {
    if (r > .4 && branchDistance(x, z) < 1.6 + r) return;
    const rings = 3,
      sides = 8,
      pts = [];
    for (let i = 0; i <= rings; i++) {
      const phi = i / rings * Math.PI * .62,
        ring = [];
      for (let j = 0; j < sides; j++) {
        const a = j * 2 * Math.PI / sides,
          dd = 1 + .14 * Math.sin(j * 3.1 + x);
        ring.push([x + Math.sin(phi) * Math.cos(a) * r * dd, y + (Math.cos(phi) - .18) * r * flat, z + Math.sin(phi) * Math.sin(a) * r * .76 * dd]);
      }
      pts.push(ring);
    }
    for (let i = 0; i < rings; i++) for (let j = 0; j < sides; j++) {
      const k = (j + 1) % sides,
        quad = [pts[i][j], pts[i][k], pts[i + 1][k], pts[i + 1][j]];
      face('rockSkin', ...quad, quad.map(p => [p[0] * .71 + p[1] * .24, p[2] * .77 + p[1] * .55]), [.73, .81, .66, 0]);
    }
  }
  for (let z = hi - .35; z > lo; z -= 1.45) {
    const side = rand() > .5 ? 1 : -1,
      xx = trailCentre(z) + side * (2.2 + rand() * 4.5),
      r = .23 + rand() * .77;
    outcrop(xx, terrainY(xx, z) - .05, z, r, .65 + rand() * .27);
  }
  for (let z = hi - .67; z > lo; z -= .63) {
    const xx = trailCentre(z) + (rand() - .5) * 4.4;
    if (groundAt(z, xx - trailCentre(z))) outcrop(xx, terrainY(xx, z) - .023, z, .07 + rand() * .10, .43);
  }
  // Weathered markers and clusters of bamboo have fixed foundations.
  if (level === 7) for (const side of [-1, 1]) {
    const z = lo + 5,
      x = trailCentre(z) + side * 3.4;
    if (branchDistance(x, z) < 2.3) continue;
    for (let i = 0; i < 6; i++) {
      const start = [x + rand() * .7, 0, z + rand() * .7];
      start[1] = terrainY(start[0], start[2]);
      const end = [start[0] + (rand() - .5) * 1.65, start[1] + 3 + rand() * 3, start[2] + (rand() - .5) * .9];
      tube('bark', start, end, .08, .053, [.72, .97, .49, 0], 7);
      for (let j = 1; j < 6; j++) {
        const f = j / 6,
          p = start.map((a, k) => a + (end[k] - a) * f);
        tube('bark', p, [p[0], p[1] + .043, p[2]], .084, .084, [.65, .74, .42, 0], 7);
      }
    }
  }
  if ([3, 6, 9].includes(level) && lo > -10) {
    const z = lo + 4,
      x = trailCentre(z) + (lo % 24 === 0 ? -3.4 : 3.4),
      y = terrainY(x, z);
    box(x, y - .06, z, .48, .26, .48, white);
    box(x, y + .20, z, .34, 1.1 + rand() * .7, .35, [.85, .87, .72, 0]);
  }
  if (level === 2 || level === 3 || isCave(level)) {
    const cave = isCave(level);
    if (cave) {
      const branch = bridge.rocks[1]?.branch;
      for (const side of [-1, 1]) {
        const w = (z, y) => [trailCentre(z) + side * (4.48 + .3 * Math.sin(z * .4) + y * .11), y, z];
        // Carve the arch in the wall surface. All reveal geometry extends outwards.
        const center = branch && side === branch.side ? branch.start + 1.75 : -10000;
        const ceiling = z => {
          const u = (z - center) / 2.65;
          return Math.abs(u) < 1 ? 1.6 + 3.15 * Math.sqrt(1 - u * u) : -1;
        };
        const cuts = [lo, hi];
        for (let z = lo + .5; z < hi; z += .5) cuts.push(z);
        for (const z of [center - 2.65, center + 2.65]) if (z > lo && z < hi) cuts.push(z);
        cuts.sort((a, b) => a - b);
        const surface = q => face('rockSkin', ...q, q.map(p => [p[2] * .45, p[1] * .53 + p[0] * .16]), [.84, .76, .66, 0]);
        for (let j = 1; j < cuts.length; j++) {
          const z = cuts[j - 1],
            v = cuts[j],
            inside = Math.abs((v + z) / 2 - center) < 2.65;
          const a = inside ? Math.max(1.6, ceiling(z)) : -1,
            b = inside ? Math.max(1.6, ceiling(v)) : -1;
          surface([w(z, a), w(v, b), w(v, 8.5), w(z, 8.5)]);
          if (inside) {
            const outer = (z, y) => {
              const q = w(z, y);
              q[0] += side * 5;
              q[2] -= 1.6;
              return q;
            };
            surface([w(z, a), w(v, b), outer(v, b), outer(z, a)]);
            for (const [k, y] of [[z, a], [v, b]]) if (Math.abs(Math.abs(k - center) - 2.65) < .0001) surface([w(k, -1), w(k, y), outer(k, y), outer(k, -1)]);
          }
        }
      }
      const z = lo + 6,
        side = Math.abs(lo / 12) % 2 ? -1 : 1,
        x = trailCentre(z) + side * 3.85,
        y = 2.55;
      if (branchDistance(x, z) > 2.7) {
        tube('stone', [x + side * 1.25, y + .38, z], [x, y + .38, z], .09, .07, white, 8);
        tube('bark', [x, y + .38, z], [x, y + .20, z], .04, .04, white, 8);
        tube('flame', [x, y - .24, z], [x, y + .2, z], .17, .14, [1, .66, .22, 3], 8);
        for (const dy of [-.26, .18]) tube('stone', [x, y + dy, z], [x, y + dy + .09, z], .22, .21, [.48, .39, .26, 0], 8);
        for (let i = 0; i < 4; i++) {
          const xx = x + .16 * Math.cos(i * Math.PI / 2),
            zz = z + .16 * Math.sin(i * Math.PI / 2);
          tube('stone', [xx, y - .23, zz], [xx, y + .22, zz], .023, .023, white, 5);
        }
      }
    }
    for (const side of [-1, 1]) for (let z = lo; z < hi; z += 2.4) {
      const x = trailCentre(z) + side * (5.8 + rand() * 1.4);
      outcrop(x, terrainY(x, z), z, 2.1 + rand(), 1.28);
      if (cave) {
        const y = 6.2 + .65 * Math.sin(z * .34);
        const q = [[x, y, z], [trailCentre(z), y + 2.2, z], [trailCentre(z + 2.4), y + 2.5, z + 2.4], [x, y + .12, z + 2.4]];
        face('stone', ...q, q.map(v => [v[0] * .41, v[2] * .47]), [.66, .66, .59, 0], [0, -1, 0]);
        tube('stone', [x - side * 2, y + 1, z], [x - side * 2.1, y - .65 - rand(), z], .28, .018, [.73, .74, .62, 0], 7);
      }
    }
  }
  if (level === 2 || level === 3) for (const side of [-1, 1]) for (let z = lo; z < hi; z++) {
    const water = (dz, r) => {
      const zz = z + dz,
        xx = trailCentre(zz) + side * r;
      return [xx, terrainY(trailCentre(zz), zz) - .16, zz];
    };
    const q = [water(0, 2.95), water(1, 2.95), water(1, 8.7), water(0, 8.7)];
    face('channel', ...q, q.map(v => [v[0], v[2]]), white, [0, 1, 0]);
  }
  // Fixed architecture and vegetation occupy the same terrain as the player.
  for (const side of [-1, 1]) {
    const z = lo + 6,
      x = trailCentre(z) + side * (4.2 + rand() * .7),
      y = terrainY(x, z);
    if (branchDistance(x, z) < 4.4) continue;
    if (level === 0) {
      const crown = [x + side * .68, y + 5.8, z + .38];
      tube('bark', [x, y - .12, z], [x + side * .22, y + 3, z], .27, .17, white, 11);
      tube('bark', [x + side * .22, y + 3, z], crown, .18, .12, white, 11);
      for (let k = 0; k < 12; k++) leaf('frond', ...crown, k * .524 + z, 3.35, .91, 1.38, 2.6, [.82, .98, .68, 0]);
    } else if (level === 1) {
      tube('bark', [x, y - .3, z], [x + side * .3, y + 7, z], .85, .53, white, 16);
      for (let k = 0; k < 8; k++) {
        const a = k * .785,
          r = 1.7,
          ex = x + r * Math.cos(a),
          ez = z + r * Math.sin(a);
        tube('bark', [x, y + 1.8, z], [ex, terrainY(ex, ez) - .1, ez], .37, .11, white, 9);
      }
      tube('bark', [x, y + 4.1, z], [x - side * 3.6, y + 5.5, z + 1], .38, .12, white, 12);
    } else if (level === 3 || level === 6) {
      // Vaulted arcades follow the canal and the aqueduct. The spans meet at shared piers.
      for (let k = 0; k < 2; k++) {
        const cz = lo + 3 + 6 * k,
          cx = trailCentre(cz) + side * (level === 3 ? 4.9 : 4.1),
          base = terrainY(cx, cz);
        if (branchDistance(cx, cz) < 5.3) continue;
        box(cx, base - .3, cz - 3, .58, 3, .52, [.94, .85, .67, 0]);
        for (let j = 0; j < 12; j++) {
          const at = (radius, angle, depth) => [cx + depth, base + 2.64 + radius * Math.sin(angle), cz + radius * Math.cos(angle)];
          const a = j * Math.PI / 12,
            b = (j + 1) * Math.PI / 12,
            uv = [[0, 1], [1, 1], [1, 0], [0, 0]];
          for (const d of [-.53, .53]) face('paving', at(2.49, a, d), at(2.49, b, d), at(3.14, b, d), at(3.14, a, d), uv, white);
          face('stone', at(2.49, a, -.53), at(2.49, b, -.53), at(2.49, b, .53), at(2.49, a, .53), uv, white);
        }
        box(cx, base + 5.53, cz, .64, .52, 3.03, white);
      }
    } else if (level === 5) {
      for (let k = 0; k < 4; k++) {
        const zz = lo + k * 3,
          xx = trailCentre(zz) + side * (5.1 + rand() * 1.8);
        if (branchDistance(xx, zz) < 4) continue;
        for (let tier = 0; tier < 4; tier++) tube('stone', [xx + side * tier * .32, y + tier * 1.45 - .45, zz], [xx + side * (tier + .2) * .32, y + (tier + 1) * 1.45 - .38, zz], 2.4 - tier * .23, 2.2 - tier * .23, [1.14, .66 + tier * .023, .44, 0], 9);
      }
    } else if (level === 9) {
      const gold = [1.13, .91, .58, 0];
      for (let k = 0; k < 5; k++) box(x + side * (3 + k * .08), y + k * .91 - .15, z, 3.35 - k * .51, .95, 4.7 - k * .61, gold);
      if (side === 1 && lo % 36 === 0) arch(z, false);
    }
  }
  return mats;
}
