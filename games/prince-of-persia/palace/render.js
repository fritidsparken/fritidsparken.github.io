"use strict";

function poseSprite(im, index, s, ax, ay, p) {
  const cw = im.width / 4,
    ch = im.height / 2;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.facing, 1);
  ctx.drawImage(im, index % 4 * cw, Math.floor(index / 4) * ch, cw, ch, -ax * s, -ay * s, cw * s, ch * s);
  ctx.restore();
}
function idle(x, y, facing, scale) {
  const s = 187 / 1400 * scale,
    i = images.idle;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.drawImage(i, -680 * s, -1423 * s, i.width * s, i.height * s);
  ctx.restore();
}
function phase(t) {
  const k = [[0, 1], [.30, 8], [.55, 13], [.75, 17], [.94, 23], [1, 23]];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
  return 23;
}
const capCache = new Map();
function lip(room, L) {
  const key = room.key + ':' + L.x;
  if (capCache.has(key)) return capCache.get(key);
  let poly;
  if (L.original) poly = [
    [1332, 360],
    [1364, 353],
    [1390, 347],
    [1412, 342],
    [1440, 335],
    [1468, 331],
    [1490, 324],
    [1506, 320],
    [1506, 345],
    [1482, 352],
    [1450, 359],
    [1418, 367],
    [1386, 374],
    [1356, 380],
    [1332, 381]
  ];else {
    const x = L.lipX,
      b = clamp(x + L.dir * 130, L.floor[0], L.floor[1]),
      aY = H(L.floor, x) + 5,
      bY = H(L.floor, b) + 5;
    poly = [[x, aY], [b, bY], [b, bY + 12], [x, aY + 12]];
  }
  const x = Math.floor(Math.min(...poly.map(v => v[0]))),
    y = Math.floor(Math.min(...poly.map(v => v[1]))),
    c = document.createElement('canvas');
  c.width = Math.ceil(Math.max(...poly.map(v => v[0])) - x) + 1;
  c.height = Math.ceil(Math.max(...poly.map(v => v[1])) - y) + 1;
  const g = c.getContext('2d');
  g.translate(-x, -y);
  g.beginPath();
  poly.forEach(([u, v], i) => i ? g.lineTo(u, v) : g.moveTo(u, v));
  g.closePath();
  g.clip();
  g.drawImage(images[room.key], 0, 0, 1672, 941);
  const layer = {
    c,
    x,
    y
  };
  capCache.set(key, layer);
  return layer;
}
function mantle(p, L, room, scale, reach) {
  if (!reach && p.mode === 'mantle' && p.mantle >= .985) {
    idle(L.standX, L.standY, L.dir, scale);
    return;
  }
  const entry = L.entry || 0,
    raw = reach ? 0 : p.mode === 'hang' ? Math.max(0, Math.min(1, 1 - p.hang / .18)) : phase(p.mantle),
    t = entry + (23 - entry) * raw / 23;
  const a = Math.floor(t),
    b = Math.min(23, a + 1),
    v = t - a,
    idx = Math.round(t),
    s = 187 / 240 * scale;
  function anchor(index) {
    const [ax, ay, cx, cy] = STUDY_CONTACTS[index];
    if (L.original) return [ax, ay, cx, cy];
    return [ax, ay, L.x + (cx - 1415) * scale, index < 16 ? L.y + (cy - 338) * scale * .3 : L.standY + (cy - 332) * scale];
  }
  const A = anchor(a),
    B = anchor(b),
    F = anchor(idx),
    mix = (u, w) => u + (w - u) * v,
    dx = reach ? (p.x - L.hangX) * L.dir : 0,
    dy = reach ? p.y - L.hangY : 0;
  const x = mix(A[2] - A[0] * s, B[2] - B[0] * s) + dx,
    y = mix(A[3] - A[1] * s, B[3] - B[1] * s) + dy;
  const tx = [x, mix(A[2], B[2]) + dx, x + 256 * s],
    ty = [y, mix(A[3], B[3]) + dy, y + 256 * s],
    sx = [0, F[0], 256],
    sy = [0, F[1], 256],
    im = images.climb,
    cw = im.width / 6,
    ch = im.height / 4;
  ctx.save();
  if (L.dir < 0) {
    ctx.translate(2 * L.x, 0);
    ctx.scale(-1, 1);
  }
  for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) ctx.drawImage(im, idx % 6 * cw + sx[col] * cw / 256, Math.floor(idx / 6) * ch + sy[row] * ch / 256, (sx[col + 1] - sx[col]) * cw / 256, (sy[row + 1] - sy[row]) * ch / 256, tx[col], ty[row], tx[col + 1] - tx[col], ty[row + 1] - ty[row]);
  ctx.restore();
  if (room.key !== 'guardianRoom' && !reach && p.mode === 'mantle' && t > 13) {
    const front = lip(room, L);
    ctx.save();
    ctx.globalAlpha = Math.min(1, (t - 13) / 1.8);
    ctx.drawImage(front.c, front.x, front.y);
    ctx.restore();
  }
}
const cubeArt = {
  "0": "assets/images/palace/blocks/block-0.png",
  "1": "assets/images/palace/blocks/block-1.png",
  "2": "assets/images/palace/blocks/block-2.png",
  "3": "assets/images/palace/blocks/block-3.png",
  "4": "assets/images/palace/blocks/block-4.png",
  "5": "assets/images/palace/blocks/block-5.png",
  "6": "assets/images/palace/blocks/block-6.png"
};
const cubeImages = {};
function drawTreasure(x, y, shape, color, ink = ctx) {
  ink.save();
  ink.translate(x, y);
  const grad = ink.createLinearGradient(-12, -14, 12, 15);
  grad.addColorStop(0, '#fff7d4');
  grad.addColorStop(.38, color);
  grad.addColorStop(1, '#77513a');
  ink.fillStyle = grad;
  ink.strokeStyle = '#573728';
  ink.lineWidth = 2.1;
  ink.beginPath();
  if (shape === 'coin' || shape === 'pearl') ink.ellipse(0, 0, shape === 'coin' ? 12 : 10, shape === 'coin' ? 14 : 10, -.16, 0, Math.PI * 2);else if (shape === 'leaf') {
    ink.moveTo(-9, 11);
    ink.bezierCurveTo(-16, -3, -1, -13, 11, -15);
    ink.bezierCurveTo(16, 2, 4, 13, -9, 11);
  } else if (shape === 'gem') {
    ink.moveTo(-14, -4);
    ink.lineTo(-7, -12);
    ink.lineTo(7, -12);
    ink.lineTo(14, -4);
    ink.lineTo(0, 15);
    ink.closePath();
  } else {
    const n = shape === 'gear' ? 32 : 16;
    for (let i = 0; i < n; i++) {
      const a = i * Math.PI * 2 / n - Math.PI / 2,
        r = shape === 'gear' ? i % 4 < 2 ? 15 : 11 : i % 2 ? 7 : 15;
      i ? ink.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ink.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ink.closePath();
  }
  ink.shadowColor = '#231814';
  ink.shadowBlur = 3;
  ink.fill();
  ink.shadowBlur = 0;
  ink.stroke();
  ink.strokeStyle = '#fff2b9';
  ink.lineWidth = 1.4;
  ink.beginPath();
  if (shape === 'gem') {
    ink.moveTo(-12, -4);
    ink.lineTo(12, -4);
    ink.moveTo(-5, -4);
    ink.lineTo(0, 12);
    ink.lineTo(5, -4);
  } else if (shape === 'leaf') {
    ink.moveTo(-8, 10);
    ink.lineTo(8, -10);
  } else if (shape === 'pearl') {
    ink.ellipse(-3, -4, 3, 2, -.6, 0, 2 * Math.PI);
    ink.fillStyle = '#fff8ed';
    ink.fill();
  } else ink.arc(0, 0, shape === 'coin' ? 8 : 4, 0, Math.PI * 2);
  ink.stroke();
  ink.restore();
}
function drawPickupFeedback(ink = ctx, state = route, targetX = 1531, targetY = 45) {
  const now = state.elapsed;
  let pending = 0,
    bump = 0;
  for (const fx of state.pickups) {
    const t = now - fx.start;
    if (t < .8) pending += fx.combo;else bump = Math.max(bump, Math.max(0, 1 - (t - .8) / .24));
    let x, y, size;
    if (t < .2) {
      const u = (t / .2) ** 2,
        player = state.game.p;
      if (fx.room === state.index) {
        fx.hitX = player.x;
        fx.hitY = player.y - 94 * state.game.scale;
      }
      x = fx.x + (fx.hitX - fx.x) * u;
      y = fx.y + (fx.hitY - fx.y) * u - 12 * Math.sin(Math.PI * u);
      size = 1;
    } else if (t < .43) {
      const u = (t - .2) / .23;
      x = fx.hitX;
      y = fx.hitY - 42 * u;
      size = 1 + .85 * Math.sin(u * Math.PI) - .48 * u;
    } else {
      const u = clamp((t - .43) / .37, 0, 1),
        k = u * u;
      x = fx.hitX + (targetX - fx.hitX) * k;
      y = fx.hitY - 42 + (targetY - fx.hitY + 42) * k - 92 * Math.sin(Math.PI * u);
      size = .52 + .18 * u;
    }
    const [, shape, color] = TREASURES[fx.room];
    if (t < .8) {
      ink.save();
      ink.translate(x, y);
      ink.scale(size, size);
      drawTreasure(0, 0, shape, color, ink);
      ink.restore();
    }
    if (t >= .2 && t < .65) {
      const u = (t - .2) / .45;
      ink.save();
      ink.globalAlpha = 1 - u;
      for (let j = 0; j < 9; j++) {
        const a = j * 2.399 + fx.x,
          dist = (18 + j % 4 * 8) * Math.sin(u * Math.PI / 2),
          s = (4 + j % 3) * (1 - u);
        ink.save();
        ink.translate(fx.hitX + Math.cos(a) * dist, fx.hitY + Math.sin(a) * dist - 15 * u);
        ink.fillStyle = j % 2 ? color : '#fff2ab';
        ink.beginPath();
        for (let k = 0; k < 8; k++) {
          const b = k * Math.PI / 4,
            r = k % 2 ? s * .26 : s;
          ink.lineTo(r * Math.cos(b), r * Math.sin(b));
        }
        ink.closePath();
        ink.fill();
        ink.restore();
      }
      ink.restore();
    }
  }
  ink.save();
  ink.translate(targetX, targetY);
  const zoom = 1 + .18 * Math.sin(Math.PI * bump);
  ink.scale(zoom, zoom);
  ink.fillStyle = 'rgba(39,29,35,.81)';
  ink.beginPath();
  ink.roundRect(-20, -21, 112, 42, 17);
  ink.fill();
  drawTreasure(0, 0, 'coin', '#ffcd65', ink);
  ink.fillStyle = '#fff1ce';
  ink.font = 'bold 24px system-ui';
  ink.fillText(String(state.points - pending), 21, 8);
  if (state.combo > 1 && now - state.lastPickup < 1.6) {
    ink.fillStyle = '#ffcc66';
    ink.font = 'bold 18px system-ui';
    ink.fillText('×' + state.combo, 63, 7);
  }
  ink.restore();
}

// Points follow masonry edges on each 360 × 320 exit crop, at half scale.
const EXIT_STONES = [
  [
    [54, 129],
    [55, 77],
    [59, 62],
    [67, 52],
    [80, 42],
    [94, 38],
    [106, 45],
    [114, 58],
    [120, 76],
    [121, 115]
  ],
  [[92, 146], [92, 47], [98, 29], [110, 14], [129, 4], [146, 9], [157, 23], [162, 44], [162, 139]],
  [[143, 146], [143, 44], [144, 22], [148, 5]],
  [[111, 146], [112, 63], [117, 37], [126, 14], [136, 2]],
  [[108, 143], [108, 69], [112, 40], [122, 16], [134, 2]],
  [[52, 142], [52, 56], [55, 31], [66, 4]],
  [[96, 136], [96, 61], [103, 36], [116, 18], [134, 5], [149, 13], [161, 30], [166, 54], [166, 132]],
  [[59, 143], [59, 60], [64, 35], [75, 13], [84, 2]],
  [[93, 144], [93, 72], [98, 51], [110, 31], [134, 10], [151, 19], [164, 31], [173, 51], [174, 122]],
  [
    [53, 145],
    [53, 43],
    [58, 24],
    [70, 5],
    [80, 0],
    [113, 0],
    [123, 8],
    [132, 26],
    [136, 47],
    [136, 132]
  ]
];
EXIT_STONES.splice(6, 1);
function paintExitLight(g) {
  if (g.index === 9) return;
  if (g.exitLightAt === undefined) return;
  const age = route.elapsed - g.exitLightAt;
  if (age < 0 || age > 1.15) return;
  const points = EXIT_STONES[g.index],
    ground = [303, 507, 633, 544, 575, 486, 481, 476, 499][g.index];
  ctx.save();
  ctx.translate(1312, ground - 305);
  ctx.scale(2, 2);
  ctx.lineCap = 'round';
  ctx.globalCompositeOperation = 'screen';
  const head = age / 1.15 * 1.32;
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i - 1],
      [nx, ny] = points[i];
    for (let j = 0; j < 10; j++) {
      const u = j / 10,
        z = (i - 1 + u) / (points.length - 1),
        a = Math.max(0, 1 - Math.abs(head - z - .12) / .19);
      if (!a) continue;
      ctx.beginPath();
      ctx.moveTo(x + (nx - x) * u, y + (ny - y) * u);
      ctx.lineTo(x + (nx - x) * (u + .1), y + (ny - y) * (u + .1));
      ctx.strokeStyle = 'rgba(255,172,51,' + .3 * a + ')';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ffb347';
      ctx.shadowBlur = 8 * a;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.15;
      ctx.strokeStyle = 'rgba(255,228,155,' + .87 * a + ')';
      ctx.stroke();
    }
  }
  ctx.restore();
}
const hallWaterArea = {
  x: 440,
  y: 240,
  w: 150,
  h: 405
};
const hallWaterSources = [[537, 366], [543, 611], [514, 630]];
const hallFireSources = [[48, 497], [151, 492], [674, 494], [759, 485], [905, 485], [1623, 506]];
const hallWaterPatches = new Map();
function hallWaterPatch(key, t) {
  const {
    x,
    y,
    w,
    h
  } = hallWaterArea;
  let patch = hallWaterPatches.get(key);
  if (!patch) {
    const canvas = makePaintSurface(w, h),
      g = canvas.getContext('2d');
    g.drawImage(images[key], x, y, w, h, 0, 0, w, h);
    const frame = g.getImageData(0, 0, w, h),
      base = new Uint8ClampedArray(frame.data);
    g.drawImage(images[key + 'WaterMask'], 0, 0);
    const mask = g.getImageData(0, 0, w, h).data,
      active = [];
    for (let i = 0; i < w * h; i++) {
      const m = mask[i * 4];
      frame.data[i * 4 + 3] = 0;
      if (m) active.push([i, m / 255]);
    }
    patch = {
      canvas,
      g,
      base,
      frame,
      active,
      last: -1
    };
    hallWaterPatches.set(key, patch);
  }
  const tick = Math.floor(t * 30);
  if (patch.last === tick) return patch.canvas;
  patch.last = tick;
  const {
    g,
    base,
    frame,
    active
  } = patch;
  for (const [i, mask] of active) {
    const row = i / w | 0,
      col = i - row * w,
      k = i * 4;
    const lip = row < 160 ? 23 : 247,
      depth = Math.max(0, row - lip);
    const pool = row >= 360;
    const lane = col - depth * (lip === 23 ? .10 : .052);
    const flight = 2 * (Math.sqrt(1 + depth / 23) - 1);
    const wave = Math.sin(lane * .43 + Math.sin(lane * .17) + flight * 5.2 - t * 6.1) + .57 * Math.sin(lane * .78 - flight * 8.3 + t * 9.74) + .37 * Math.sin(lane * .21 + flight * 3.26 - t * 3.82);
    const glint = pool ? .051 * Math.sin(row * .62 - col * .045 - t * 2.4 + .72 * Math.sin(col * .13 + t * .54)) + .027 * Math.sin(row * .91 + col * .08 - t * 3.14) : .108 * wave * Math.min(1, depth / 5);
    const lift = pool ? 3 : 6;
    for (let c = 0; c < 3; c++) frame.data[k + c] = base[k + c] + glint * (50 + base[k + c] * .64) + lift * glint;
    frame.data[k + 3] = Math.round(mask * 255);
  }
  g.putImageData(frame, 0, 0);
  return patch.canvas;
}
function drawHallWater(g, key, t) {
  g.drawImage(hallWaterPatch(key, t), hallWaterArea.x, hallWaterArea.y);
}
function paintGuardian(g) {
  const t = g.clock - g.phaseStart,
    angle = guardianPose(g);
  ctx.drawImage(images.guardianRoom, 0, 0, 1672, 941);
  drawHallWater(ctx, "guardianRoom", g.clock);
  if (g.phase === 'warning' || g.phase === 'swing') {
    ctx.save();
    ctx.translate(885, 687);
    ctx.scale(235, 17);
    const shadow = ctx.createRadialGradient(0, 0, .05, 0, 0, 1);
    shadow.addColorStop(0, 'rgba(55,32,31,.7)');
    shadow.addColorStop(1, 'rgba(55,32,31,0)');
    ctx.globalAlpha = g.phase === 'swing' ? 1 : clamp(t * 1.4, 0, 1);
    ctx.fillStyle = shadow;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
  ctx.save();
  ctx.translate(783, 194);
  ctx.rotate(angle);
  ctx.translate(-783, -194);
  ctx.drawImage(images.guardianArm, 546, 172);
  if (route.bags[9] !== 1) {
    ctx.drawImage(images.guardianSeal, 864, 312);
  }
  ctx.restore();
  if (g.phase === 'rest' && t < 1.6) {
    ctx.save();
    ctx.globalAlpha = clamp((1.6 - t) * 2, 0, 1);
    for (const d of [-1, 1]) {
      const x = 820 + d * 580 * t;
      for (let j = 0; j < 15; j++) {
        const u = (t * 2.8 + j * .618) % 1;
        ctx.fillStyle = j % 3 ? 'rgba(206,149,87,.57)' : 'rgba(255,222,148,.83)';
        ctx.beginPath();
        ctx.ellipse(x - d * (u * 42 + j % 3 * 6), 689 - 35 * Math.sin(Math.PI * u), 3 + j % 4, 2 + j % 3, j, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
function paintTreasures(g) {
  if (g.index === 9) return;
  const [, shape, color] = TREASURES[route.index];
  route.items.forEach(({
    x,
    y
  }, i) => {
    if (!(route.bags[route.index] & 1 << i)) drawTreasure(x, y + Math.sin(g.clock * 2 + i) * 3, shape, color);
  });
}
function paintCubes(game) {
  for (const c of game.cubes) {
    if (!c.dy) continue;
    const im = cubeImages[c.id];
    if (!im) continue;
    ctx.drawImage(im, 0, 0, c.w, c.h, c.left, c.top, c.w, c.h);
    const anchor = c.up ? c.top + 23 : c.top;
    const boxTop = c.top + c.dy + (c.up ? 79 : 0);
    const end = c.up && boxTop < anchor ? Math.min(anchor, c.top + c.dy + 151) : boxTop;
    const y0 = Math.min(anchor, end),
      len = Math.abs(anchor - end);
    ctx.save();
    ctx.beginPath();
    ctx.rect(c.chain - 8, y0 - 1, 16, len + 3);
    ctx.clip();
    const unit = c.w > .75 * 100 ? 12 : 9;
    for (let i = 0; i * unit < len + unit; i++) {
      const y = y0 + i * unit;
      ctx.beginPath();
      ctx.ellipse(c.chain, y, i % 2 ? 1.5 : 3.5, unit * .67, i % 2 ? -.12 : .13, 0, Math.PI * 2);
      ctx.strokeStyle = '#382319';
      ctx.lineWidth = 3.4;
      ctx.stroke();
      ctx.strokeStyle = '#ae7846';
      ctx.lineWidth = 1.15;
      ctx.stroke();
    }
    ctx.restore();
    ctx.drawImage(im, c.w, 0, c.w, c.h, c.left, c.top + c.dy, c.w, c.h);
  }
}
function paintPalaceObstacle(h, t) {
  const w = h.width,
    ht = h.height;
  const metal = ctx.createLinearGradient(-w / 2, -ht, w / 2, 0);
  metal.addColorStop(0, '#514549');
  metal.addColorStop(.28, '#a87742');
  metal.addColorStop(.48, '#f3cf86');
  metal.addColorStop(.68, '#947043');
  metal.addColorStop(1, '#493a39');
  function line(x, y, xx, yy, color, size) {
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(xx, yy);
    ctx.stroke();
  }
  if (h.type === 'gear') {
    line(-w * .8, -3, w * .8, -3, '#5a443d', 5);
    ctx.translate(gearX(h, t) - h.x, -ht / 2);
    ctx.rotate(t * 2.6 + h.offset);
    ctx.beginPath();
    for (let j = 0; j < 48; j++) {
      const a = j * Math.PI / 24,
        r = (j % 4 === 1 || j % 4 === 2 ? .50 : .41) * ht;
      if (j) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);else ctx.moveTo(r, 0);
    }
    ctx.closePath();
    ctx.moveTo(ht * .32, 0);
    ctx.arc(0, 0, ht * .32, 0, Math.PI * 2, true);
    ctx.fillStyle = metal;
    ctx.fill('evenodd');
    ctx.strokeStyle = '#513f36';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    for (let j = 0; j < 6; j++) {
      const a = j * Math.PI / 3;
      line(0, 0, ht * .34 * Math.cos(a), ht * .34 * Math.sin(a), '#ac844f', 4);
    }
    ctx.fillStyle = '#60514a';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    for (let i = 0; i < 7; i++) {
      const x = (i - 3) * w / 8,
        tip = x + (i % 2 ? 8 : -6),
        top = -ht * (.7 + .3 * Math.sin(i * 1.7) ** 2);
      ctx.beginPath();
      ctx.moveTo(x - 7, 0);
      ctx.quadraticCurveTo(x + 9, top * .38, tip, top);
      ctx.strokeStyle = i % 2 ? '#4e5634' : '#675238';
      ctx.lineWidth = 4;
      ctx.stroke();
      for (let j = 1; j < 5; j++) {
        const y = top * j / 5,
          side = j % 2 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 4);
        ctx.lineTo(x + side * 9, y - 7);
        ctx.lineTo(x + 1, y);
        ctx.fillStyle = '#a98250';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.ellipse(tip + 2, top + 8, 5, 2.5, -.6, 0, Math.PI * 2);
      ctx.fillStyle = '#627446';
      ctx.fill();
    }
  }
}
function paintTrials(game) {
  const t = game.clock;
  for (const h of game.hazards) {
    const {
      width: w,
      height: ht
    } = h;
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.fillStyle = 'rgba(54,32,39,.31)';
    ctx.beginPath();
    ctx.ellipse(2, 1, w * .57, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    function face(pts, fill) {
      ctx.beginPath();
      ctx.moveTo(...pts[0]);
      for (const pt of pts.slice(1)) ctx.lineTo(...pt);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (h.type === 'hatch') {
      const half = w / 2,
        angle = hatchAngle(h, t),
        reach = half * Math.cos(angle),
        drop = half * Math.sin(angle) * .68;
      const well = ctx.createLinearGradient(0, -8, 0, 10);
      well.addColorStop(0, '#181819');
      well.addColorStop(.75, '#322924');
      well.addColorStop(1, '#806347');
      face([[-half - 4, 4], [-half + 3, -9], [half + 5, -9], [half, 5]], well);
      ctx.strokeStyle = '#a38259';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.save();
      ctx.clip();
      for (const side of [-1, 1]) {
        const edge = side * half,
          nose = edge - side * reach;
        ctx.save();
        face([[edge, 3], [edge + 5, -8], [nose + 5, -8 + drop], [nose, 3 + drop]], '#9b805e');
        ctx.clip();
        ctx.drawImage(images[game.room.key], h.x + Math.min(edge, 0), h.y + 6, half, 18, Math.min(edge, nose), -8, Math.max(1, reach + 5), 12 + drop);
        ctx.fillStyle = 'rgba(39,24,18,' + (.14 + .5 * Math.sin(angle)) + ')';
        ctx.fillRect(-half - 4, -9, w + 10, drop + 16);
        ctx.strokeStyle = '#806044';
        ctx.lineWidth = 2;
        for (const f of [.2, .8]) {
          ctx.beginPath();
          ctx.moveTo(edge + 4 * f, 3 - 11 * f);
          ctx.lineTo(nose + 4 * f, 3 - 11 * f + drop);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
      for (const side of [-1, 1]) for (const z of [-5, 1]) {
        const x = side * (half - 2);
        ctx.fillStyle = '#513e31';
        ctx.fillRect(x - 3, z - 1, 7, 3);
        ctx.fillStyle = '#ccac79';
        ctx.fillRect(x - 2, z - 1, 5, 1);
      }
    } else if (h.type === 'saw') {
      const rad = ht / 2,
        dx = gearX(h, t) - h.x;
      face([[-44, 2], [-39, -5], [44, -5], [40, 2]], '#71593f');
      ctx.fillStyle = '#322d2d';
      ctx.fillRect(-37, -3, 74, 3);
      for (const x of [-34, 34]) {
        ctx.fillStyle = '#d5af75';
        ctx.fillRect(x, -4, 3, 2);
      }
      ctx.translate(dx, 0);
      face([[-12, 0], [-5, -rad - 2], [5, -rad - 2], [12, 0]], '#574b3d');
      ctx.translate(0, -rad);
      const sheen = ctx.createLinearGradient(-rad, -rad, rad, rad);
      sheen.addColorStop(0, '#564e49');
      sheen.addColorStop(.28, '#c4b59e');
      sheen.addColorStop(.48, '#737678');
      sheen.addColorStop(.76, '#d6c7af');
      sheen.addColorStop(1, '#62534a');
      ctx.save();
      ctx.rotate(t * 5 + h.offset);
      ctx.beginPath();
      for (let tooth = 0; tooth < 20; tooth++) for (const [phase, r] of [[0, .80], [.64, 1], [.78, .97], [.86, .83]]) {
        const a = (tooth + phase) * Math.PI / 10,
          x = rad * r * Math.cos(a),
          y = rad * r * Math.sin(a);
        if (!tooth && !phase) ctx.moveTo(x, y);else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = sheen;
      ctx.fill();
      ctx.strokeStyle = '#554a40';
      ctx.lineWidth = 1;
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        ctx.rotate(Math.PI * 2 / 5);
        ctx.fillStyle = '#4e443b';
        ctx.beginPath();
        ctx.ellipse(rad * .51, 0, rad * .135, rad * .06, -.39, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ecddbe';
        ctx.beginPath();
        ctx.arc(0, 0, rad * .72, .1, .49);
        ctx.stroke();
      }
      ctx.restore();
      for (const [size, col] of [[.25, '#544132'], [.2, '#b99863'], [.12, '#695b50']]) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(0, 0, rad * size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (['thorns', 'gear'].includes(h.type)) {
      paintPalaceObstacle(h, t);
    } else if (h.type === 'stone') {
      // Sample the room's own engraved stone for the front of the fallen cornice.
      const left = -w / 2,
        right = w / 2;
      ctx.save();
      face([[left, -ht + 6], [left + 12, -ht], [right, -ht + 5], [right - 3, -8], [right - 12, 0], [left + 2, -3]], '#9b6345');
      ctx.clip();
      ctx.drawImage(images[game.room.key], Math.round(h.x - w / 2), Math.round(h.y + 7), w, ht, left, -ht, w, ht);
      const shade = ctx.createLinearGradient(0, -ht, 4, 0);
      shade.addColorStop(0, 'rgba(234,182,113,.36)');
      shade.addColorStop(1, 'rgba(75,41,48,.55)');
      ctx.fillStyle = shade;
      ctx.fillRect(left, -ht, w, ht);
      ctx.restore();
      face([[left, -ht + 6], [left + 8, -ht - 4], [right - 9, -ht - 3], [right, -ht + 5], [right - 13, -ht + 8]], '#ddb587');
      face([[right - 13, -ht + 8], [right, -ht + 5], [right - 3, -8], [right - 12, 0]], '#886043');
      ctx.strokeStyle = '#a17b53';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left + 16, -ht - 3);
      ctx.lineTo(left + 29, -ht + 3);
      ctx.lineTo(left + 25, -ht + 7);
      ctx.stroke();
    } else {
      const {
          height,
          warn
        } = trapPhase(h, t),
        left = -w / 2;
      const bronze = ctx.createLinearGradient(0, -6, 0, 3);
      bronze.addColorStop(0, '#faD899');
      bronze.addColorStop(.35, '#a57644');
      bronze.addColorStop(.64, '#49392f');
      bronze.addColorStop(1, '#c4975b');
      face([[left - 5, -2], [left + 3, -7], [w / 2 + 4, -6], [w / 2 + 5, 0], [w / 2 - 2, 3], [left - 5, 2]], bronze);
      if (h.type === 'spikes') {
        for (let j = 0; j < 5; j++) {
          const x = left + (j + .5) * w / 5,
            top = -4 - height;
          ctx.fillStyle = '#342d30';
          ctx.beginPath();
          ctx.ellipse(x, -3.6, 5.4, 2.3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.save();
          ctx.beginPath();
          ctx.rect(x - 6, -ht - 10, 12, ht + 6);
          ctx.clip();
          const steel = ctx.createLinearGradient(x - 3, 0, x + 3, 0);
          steel.addColorStop(0, '#3d454b');
          steel.addColorStop(.35, '#a4a8a3');
          steel.addColorStop(.57, '#ebd6b3');
          steel.addColorStop(1, '#55565a');
          ctx.fillStyle = steel;
          ctx.fillRect(x - 2.7, top + 21, 5.4, ht);
          face([[x, top], [x + 5, top + 19], [x + 2, top + 24], [x - 2, top + 24], [x - 5, top + 19]], steel);
          face([[x, top], [x, top + 20], [x - 5, top + 19]], '#d1c5a9');
          ctx.restore();
          if (warn) {
            ctx.fillStyle = 'rgba(247,173,82,.8)';
            ctx.fillRect(x - 4, -2, 8, 1);
          }
        }
      } else {
        ctx.fillStyle = '#394b50';
        ctx.beginPath();
        ctx.ellipse(0, -4, w * .38, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        const lift = height + (warn ? 4 : 0);
        if (lift > 1) {
          ctx.save();
          ctx.translate(0, -4);
          // Each stream leaves the nozzle, breaks at its crest and falls back as droplets.
          for (let j = 0; j < 19; j++) {
            const k = j - 9,
              side = k / 9,
              peak = lift * (1 - .20 * side * side + .025 * Math.sin(t * 5 + j)),
              base = side * w * .23;
            const curl = side * w * .18 + Math.sin(t * 3 + j * .6) * 2;
            ctx.beginPath();
            ctx.moveTo(base, 0);
            ctx.quadraticCurveTo(base * .76, -peak * .64, base + curl, -peak);
            ctx.lineWidth = 1.8 + (1 - Math.abs(side)) * 2.3;
            ctx.strokeStyle = j % 4 ? 'rgba(108,191,197,.32)' : 'rgba(240,255,239,.68)';
            ctx.stroke();
            for (let d = 0; d < 3; d++) {
              const u = (t * (1.18 + j * .017) + j * .618 + d / 3) % 1;
              const x = base + curl + side * w * .28 * u,
                y = -peak + peak * u * u;
              ctx.fillStyle = 'rgba(213,245,238,' + (.65 - .37 * u) + ')';
              ctx.beginPath();
              ctx.ellipse(x, y, 1.1, 1.2 + u * 2, -side * .35, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
        }
      }
    }
    ctx.restore();
  }
}
function draw() {
  const r = ROOMS[route.index],
    g = route.game,
    p = g.p,
    scale = route.index ? g.scale : 1;
  ctx.clearRect(0, 0, 1672, 941);
  if (g.index === 9) paintGuardian(g);
  paintCubes(g);
  paintExitLight(g);
  paintTrials(g);
  paintTreasures(g);
  paintPalacePlayer(g);
  drawPickupFeedback();
  if (fade > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(12,21,29,' + .78 * fade / .38 + ')';
    ctx.fillRect(0, 0, 1672, 941);
    ctx.restore();
  }
}
function frame(t) {
  const dt = Math.min(.06, Math.max(0, (t - last) / 1000));
  last = t;
  if (bridge.active || !opening.hidden || !menu.hidden && !atlasOpen) {
    requestAnimationFrame(frame);
    return;
  }
  if (!paused && !atlasOpen && !route.done) {
    fade = Math.max(0, fade - dt);
    if (t >= (route.game.nextMix || 0)) {
      route.game.nextMix = t + 90;
      environmentalMix(route.game);
    }
    acc += dt;
    while (acc >= 1 / 120) {
      route.step(1 / 120, input());
      acc -= 1 / 120;
    }
  } else acc = 0;
  displayRoom(t, dt);
  if (!atlasOpen) {
    followPlayer();
    draw();
  }
  requestAnimationFrame(frame);
}

function paintPalacePlayer(g) {
  const p = g.p, r = g.room, scale = g.scale;
  const floors = g.all;
  const support = floors.filter(f => inSpan(f, p.x) && H(f, p.x) >= p.y - .5).sort((a, b) => H(a, p.x) - H(b, p.x))[0];
  if (support && !p.pitfall && p.mode !== 'hang' && p.mode !== 'mantle') {
    const yy = H(support, p.x),
      h = Math.max(0, yy - p.y);
    ctx.save();
    ctx.globalAlpha = .18 * Math.max(.2, 1 - h / 220);
    ctx.fillStyle = '#41302a';
    ctx.beginPath();
    ctx.ellipse(p.x, yy + 1, (24 + h * .06) * scale, 3.2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  if (p.pitfall) {
    const h = p.pitfall;
    ctx.beginPath();
    ctx.rect(0, 0, 1672, h.y + 3);
    ctx.clip();
  }
  if (p.dead > 0) ctx.globalAlpha = Math.min(1, p.dead / .46);
  const L = p.activeLedge;
  if (p.mode === 'idle') idle(p.x, p.y, p.facing, scale);else if (L && (p.mode === 'hang' || p.mode === 'mantle')) mantle(p, L, r, scale, false);else if (L && p.ledgeLeap && p.mode === 'jump' && p.air > .15) mantle(p, L, r, scale, true);else {
    let im, idx;
    if (p.mode === 'run') {
      im = images.run;
      idx = Math.floor(p.run * 12) % 8;
    } else {
      im = images[JUMP_STYLES[p.style].asset];
      const f = p.jumping ? clamp(.5 + p.vy / (2 * p.launch * (p.boosted ? Math.SQRT2 : 1)), 0, 1) : .85;
      idx = p.mode === 'prepare' ? 0 : p.mode === 'land' ? p.land > .09 ? 6 : 7 : f < .16 ? 1 : f < .34 ? 2 : f < .56 ? 3 : f < .76 ? 4 : 5;
    }
    const cw = im.width / 4,
      ch = im.height / 2,
      blend = p.mode === 'jump' ? p.reachBlend || 0 : 0,
      opacity = ctx.globalAlpha;
    ctx.globalAlpha = opacity * (1 - blend);
    poseSprite(im, idx, 187 * scale / (ch * .925), cw * .60, ch * .958, p);
    if (blend && p.reaching) {
      ctx.globalAlpha = opacity * blend;
      mantle(p, p.reaching, r, scale, true);
    }
    ctx.globalAlpha = opacity;
  }
  ctx.restore();
}
