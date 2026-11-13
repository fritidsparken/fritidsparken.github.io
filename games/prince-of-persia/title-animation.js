(async function titleAnimation() {
  const art = document.getElementById('titleStill'),
    canvas = document.getElementById('titleMotion');
  const menu = document.getElementById('titleMenu');
  const ctx = canvas.getContext('2d', {
    alpha: false
  });
  if (!ctx) return;
  function pixels(img, w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', {
      willReadFrequently: true
    });
    g.drawImage(img, 0, 0, w, h);
    return g.getImageData(0, 0, w, h);
  }
  const maps = await Promise.all([
    "assets/images/menu/waterfall-mask.png", "assets/images/menu/cloth-mask.png",
    "assets/images/menu/pool-mask.png"
  ].map(async url => {
    const i = new Image();
    i.src = url;
    await i.decode();
    return i;
  }));
  await art.decode();
  // Work only on moving regions. Fixed pixel coordinates keep every mask registered on resize.
  const w = art.naturalWidth,
    h = art.naturalHeight,
    scale = w / 1000;
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(art, 0, 0);
  const src = pixels(art, w, h).data,
    m = pixels(maps[0], w, h).data,
    cloth = pixels(maps[1], w, h).data;
  const pool = pixels(maps[2], w, h).data;
  const tiles = [],
    size = 96;
  for (let top = 0; top < h; top += size) for (let left = 0; left < w; left += size) {
    const tw = Math.min(size, w - left),
      th = Math.min(size, h - top),
      list = [];
    for (let y = top; y < top + th; y++) for (let x = left; x < left + tw; x++) {
      const i = 4 * (y * w + x);
      if (pool[i] + m[i] + m[i + 1] + m[i + 2] + cloth[i] > 9) list.push(i / 4);
    }
    if (list.length) tiles.push({
      left,
      top,
      tw,
      frame: ctx.getImageData(left, top, tw, th),
      list: new Int32Array(list)
    });
  }
  const sin = Math.sin,
    cos = Math.cos;
  function sample(out, j, x, y, light) {
    x = Math.max(0, Math.min(w - 2, x));
    y = Math.max(0, Math.min(h - 2, y));
    const ix = x | 0,
      iy = y | 0,
      a = x - ix,
      b = y - iy,
      k = 4 * (iy * w + ix),
      l = k + 4 * w;
    for (let c = 0; c < 3; c++) out[j + c] = ((src[k + c] * (1 - a) + src[k + c + 4] * a) * (1 - b) + (src[l + c] * (1 - a) + src[l + c + 4] * a) * b) * light;
  }

  // Smooth, deterministic turbulence evaluated in stream coordinates moving downstream.
  const grain = new Float32Array(65536);
  let seed = 9013;
  for (let i = 0; i < grain.length; i++) {
    seed = Math.imul(seed, 1664525) + 1013904223 >>> 0;
    grain[i] = seed / 2147483648 - 1;
  }
  function noise(x, y) {
    const i = Math.floor(x),
      j = Math.floor(y);
    let u = x - i,
      v = y - j;
    u = u * u * (3 - 2 * u);
    v = v * v * (3 - 2 * v);
    const row = (j & 255) << 8,
      next = (j + 1 & 255) << 8,
      col = i & 255,
      right = i + 1 & 255;
    return (grain[row + col] * (1 - u) + grain[row + right] * u) * (1 - v) + (grain[next + col] * (1 - u) + grain[next + right] * u) * v;
  }
  function render(t) {
    for (const {
      left,
      top,
      tw,
      frame,
      list
    } of tiles) {
      for (const n of list) {
        const iy = n / w | 0,
          ix = n - iy * w,
          x = ix / scale,
          y = iy / scale,
          k = n * 4;
        const f = m[k] / 255,
          v = m[k + 1] / 255,
          sky = m[k + 2] / 255;
        const scarf = cloth[k] / 255 * Math.min(1, Math.max(0, (x - 880) / 85));
        let dx = 0,
          dy = 0,
          light = 1;
        const ripple = pool[k] / 255;
        if (ripple > .006) {
          dx += ripple * 2.1 * sin(y * .55 - t * 1.31);
          dy += ripple * .42 * sin(y * .62 + t * 1.09);
        }
        if (f > .008) {
          const lip = y > 340 ? 350 : y > 260 ? 267 : y > 220 ? 231 : 116;
          const depth = Math.max(0, y - lip);
          const distant = lip < 250;
          const bend = distant ? .035 : x < 663 && lip === 267 ? .045 : .21;
          const lane = x + bend * depth;
          const flight = Math.sqrt(1 + depth * .075) - 1;
          const u = lane * (distant ? 1.5 : .85);
          const a = noise(u, flight * 3.6 - t * 2.4);
          const b = noise(u * 1.83 + 27, flight * 6.8 - t * 4.53);
          const strength = f * Math.min(1, depth / 3.5) * (distant ? .54 : 1);
          light += strength * (.116 * a + .056 * b);
        }
        if (v > .005) {
          const mist = v * (1 - f);
          dx += mist * (2.6 * sin(y * .11 + t * .35) + 1.3 * cos(x * .085 - t * .21));
          dy += mist * (1.7 * cos(x * .06 + t * .27) + .9 * sin(y * .14 - t * .41));
          light += .021 * mist * sin(x * .064 + y * .09 - t * .39);
        }
        if (sky > .005) {
          dx += sky * (10 * sin(t * .038 + y * .014) + 4 * sin(t * .059 + x * .008));
          dy += sky * (1.4 * cos(t * .073 + x * .011));
        }
        if (scarf > .002) {
          dy += scarf * (3.2 * sin(x * .054 - t * 1.17) + 1.9 * sin(x * .092 - t * .83) + 1.4 * sin(x * .027 - t * .42));
          dx += scarf * (1.1 * cos(x * .066 - t * .79) + .6 * sin(t * .37));
        }
        sample(frame.data, 4 * ((iy - top) * tw + ix - left), ix + dx * scale, iy + dy * scale, light);
      }
      ctx.putImageData(frame, left, top);
    }
  }
  let time = 0,
    last = 0,
    handle = 0;
  function tick(now) {
    handle = 0;
    if (menu.hidden || document.hidden) return;
    if (!last || now - last >= 45) {
      time += last ? Math.min(.09, (now - last) / 1000) : 0;
      last = now;
      render(time);
      canvas.hidden = false;
      art.hidden = true;
    }
    handle = requestAnimationFrame(tick);
  }
  function sync() {
    if (handle) cancelAnimationFrame(handle);
    last = 0;
    handle = 0;
    if (!document.hidden && !menu.hidden) handle = requestAnimationFrame(tick);
  }
  new MutationObserver(sync).observe(menu, {
    attributes: true,
    attributeFilter: ['hidden']
  });
  document.addEventListener('visibilitychange', sync);
  sync();
})().catch(() => {});
