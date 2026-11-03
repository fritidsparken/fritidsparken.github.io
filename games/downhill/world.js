const T = THREE,
  V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
const themes = {
  meadow: [0x90c8e0, 0x779447, 0xa28355, 0x345a39],
  pine: [0x8dafbc, 0x566348, 0x796449, 0x264735],
  rock: [0xa6cce2, 0x787a70, 0x958979, 0x525d53],
  jungle: [0xb8d3bb, 0x5d7640, 0x786047, 0x285e3e],
  desert: [0xf1bb88, 0xb56d4c, 0xd79965, 0x704237],
  snow: [0xb0d7e8, 0xe0e9ef, 0xd5e1eb, 0x536974],
  coast: [0x9bd6e3, 0x7a8966, 0xae9773, 0x4b6556],
  park: [0xa5cfe2, 0x89914f, 0xbb875b, 0x4a6441],
  falls: [0xb2cfc7, 0x68864c, 0x896c4b, 0x365837],
  grand: [0xedb17a, 0xad6b4d, 0xc18e67, 0x7c4838],
  neon: [0x333060, 0x41475a, 0x756c70, 0x243448],
  sunset: [0xf4ab77, 0x7a7463, 0xac866b, 0x4d4c4a],
  fog: [0x899b9e, 0x526854, 0x6f6556, 0x394c46],
  aurora: [0x25395a, 0xb5cada, 0xbccfdc, 0x364b5e],
  lava: [0x513841, 0x524c50, 0x71605d, 0x312c33],
  city: [0x343c60, 0x536071, 0x8a7b6c, 0x47536a],
  haunted: [0x454568, 0x525b50, 0x796954, 0x39483e],
  extreme: [0x29334f, 0x555f67, 0x8c7e70, 0x364458],
};
function rng(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const standard = (color, opts = {}) =>
  new T.MeshStandardMaterial({ color, roughness: 0.85, ...opts });
function mesh(g, m, parent) {
  const o = new T.Mesh(g, m);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
function texture(kind, seed) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d"),
    r = rng(seed),
    img = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      let n =
        188 +
        26 * r() +
        10 * Math.sin(x * 0.049 + 2 * Math.sin(y * 0.049)) +
        10 * Math.cos(y * 0.074 + x * 0.049);
      if (kind === "trail")
        n -= 17 * Math.pow(Math.cos((x * Math.PI) / 32), 12);
      let k = 4 * (x + y * 256);
      img.data.set([n, n, n, 255], k);
    }
  ctx.putImageData(img, 0, 0);
  for (let i = 0; i < 2700; i++) {
    let x = r() * 256,
      y = r() * 256;
    ctx.fillStyle = i % 2 ? "#53584b66" : "#ffffff77";
    ctx.beginPath();
    ctx.ellipse(x, y, 0.3 + r() * 2, 0.3 + r() * 1.6, r() * 3, 0, 7);
    ctx.fill();
  }
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
function surface(parent, verts, idx, uv, colors, mat) {
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = mesh(g, mat, parent);
  m.castShadow = false;
  return m;
}
function artMap(name, normal = false) {
  const t = new T.TextureLoader().load("art/" + name + ".webp");
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.anisotropy = 4;
  if (!normal) t.colorSpace = T.SRGBColorSpace;
  return t;
}
// Each crown is a volume of curved, individually oriented textured boughs.
function crown(kind, seed) {
  const r = rng(seed),
    vs = [],
    uv = [],
    ix = [],
    layers = kind === "palm" ? 2 : kind === "oak" ? 5 : 8;
  for (let layer = 0; layer < layers; layer++) {
    let f = layer / layers,
      count = kind === "palm" ? 11 : 8,
      offset = r() * 6;
    for (let j = 0; j < count; j++) {
      let a = offset + (j / count) * Math.PI * 2 + r() * 0.4,
        len =
          (kind === "palm" ? 0.48 : kind === "oak" ? 0.32 : 0.32) *
          (1 - f * 0.85) *
          (0.8 + r() * 0.36),
        y =
          kind === "palm" ? 0.82 + layer * 0.05 : 0.25 + f * 0.7 + r() * 0.045,
        w = len * (kind === "palm" ? 0.23 : 0.38),
        start = vs.length / 3;
      for (let k = 0; k <= 3; k++) {
        let u = k / 3,
          h =
            y +
            Math.sin(u * Math.PI) * (kind === "oak" ? 0.065 : 0.038) -
            u *
              u *
              (kind === "palm" ? 0.15 : kind === "oak" ? -0.04 : 0.075) *
              (1 - f);
        for (let side of [-1, 1]) {
          let d = u * len,
            spread = side * w;
          vs.push(
            Math.cos(a) * d - Math.sin(a) * spread,
            h + side * 0.02 * Math.sin(a + u),
            Math.sin(a) * d + Math.cos(a) * spread,
          );
          uv.push(u, side * 0.5 + 0.5);
        }
        if (k) {
          let b = start + k * 2;
          ix.push(b - 2, b, b - 1, b - 1, b, b + 1);
        }
      }
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(vs, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.setIndex(ix);
  g.computeVertexNormals();
  return g;
}
function mountain(seed, snowy, base) {
  const r = rng(seed),
    vs = [],
    uv = [],
    cols = [],
    ix = [],
    n = 38,
    m = 18,
    color = new T.Color();
  for (let j = 0; j <= m; j++)
    for (let k = 0; k <= n; k++) {
      let f = j / m,
        a = ((k % n) / n) * Math.PI * 2,
        fold =
          0.79 +
          0.18 * Math.sin(5 * a + seed) +
          0.14 * Math.cos(9 * a - f * 3) +
          0.09 * Math.sin(14 * a + f * 8);
      let radius = (1 - f) ** 0.78 * fold,
        h =
          f * (1 + 0.15 * Math.cos(3 * a) * Math.sin(Math.PI * f)) +
          0.035 * Math.sin(a * 9 + f * 23) * Math.sin(Math.PI * f);
      vs.push(Math.cos(a) * radius + 0.13 * f, h, Math.sin(a) * radius);
      uv.push((a / 6.283) * 17, f * 7);
      let frost = snowy
        ? clamp((h - 0.55 + 0.1 * Math.sin(a * 7)) * 4, 0, 1)
        : 0;
      color
        .set(base)
        .lerp(new T.Color(0xffffff), frost)
        .multiplyScalar(0.7 + 0.35 * r());
      cols.push(color.r, color.g, color.b);
      if (j && k) {
        let b = j * (n + 1) + k;
        ix.push(b - n - 2, b - 1, b, b - n - 2, b, b - n - 1);
      }
    }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(vs, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new T.Float32BufferAttribute(cols, 3));
  g.setIndex(ix);
  g.computeVertexNormals();
  return g;
}
function reflectionMap(horizon, night) {
  const faces = [];
  for (let side = 0; side < 6; side++) {
    const c = document.createElement("canvas");
    c.width = c.height = 96;
    let g = c.getContext("2d"),
      grad = g.createLinearGradient(0, 0, 0, 96);
    grad.addColorStop(0, night ? "#18263d" : "#83b2d4");
    grad.addColorStop(0.5, "#" + horizon.getHexString());
    grad.addColorStop(1, night ? "#20242c" : "#576652");
    g.fillStyle = grad;
    g.fillRect(0, 0, 96, 96);
    if (side === 1 || side === 2) {
      g.fillStyle = night ? "#bdcce4" : "#fff1ca";
      g.fillRect(26, 14, 7, 7);
    }
    faces.push(c);
  }
  const t = new T.CubeTexture(faces);
  t.colorSpace = T.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}
function world(scene, c) {
  const r = rng(842 + c.id),
    [sky, land, dirt, tree] = themes[c.theme],
    night = c.night && !["sunset", "fog"].includes(c.theme),
    snow = ["snow", "aurora"].includes(c.theme),
    stone = ["rock", "desert", "grand", "lava", "extreme"].includes(c.theme),
    city = c.theme === "city",
    wet = [
      "coast",
      "jungle",
      "falls",
      "fog",
      "aurora",
      "lava",
      "meadow",
    ].includes(c.theme),
    forest = !stone && !city;
  const horizon = night
    ? new T.Color(sky).multiplyScalar(0.68)
    : new T.Color(sky);
  scene.environment = reflectionMap(horizon, night);
  scene.background = horizon;
  scene.fog = new T.FogExp2(
    horizon,
    c.theme === "fog" ? 0.019 : night ? 0.008 : 0.0045,
  );
  const root = new T.Group();
  scene.add(root);
  const hemi = new T.HemisphereLight(
    night ? 0xbddeff : 0xfff5dc,
    night ? 0x62677e : 0x8a9072,
    night ? 1.35 : 1.6,
  );
  root.add(hemi);
  const sun = new T.DirectionalLight(
    night ? 0xc0d8ff : 0xffe0b0,
    night ? 1.1 : 2.05,
  );
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -23,
    right: 23,
    top: 23,
    bottom: -23,
    far: 105,
  });
  sun.shadow.normalBias = 0.065;
  root.add(sun, sun.target);
  const dome = new T.Mesh(
    // Keep the camera-centered sky entirely inside the 620-unit far plane.
    new T.SphereGeometry(480, 48, 32),
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      uniforms: {
        low: { value: horizon },
        high: {
          value: new T.Color(
            night ? 0x08132c : c.theme === "sunset" ? 0x645c87 : 0x4c92c5,
          ),
        },
        dark: { value: night ? 1 : 0 },
        aur: { value: c.theme === "aurora" ? 1 : 0 },
      },
      vertexShader:
        "varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: `varying vec3 v;uniform vec3 low,high;uniform float dark,aur;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 void main(){vec3 n=normalize(v);vec2 p=n.xz/max(.075,n.y+.12)*2.;float f=noise(p)*.52+noise(p*2.)*.28+noise(p*4.)*.14+noise(p*8.)*.06;vec3 col=mix(low,high,smoothstep(-.03,.72,n.y));col=mix(col,vec3(.94,.91,.85),smoothstep(.51,.75,f)*smoothstep(.0,.16,n.y)*(.6-dark*.54));vec2 st=n.xy*570.;col+=dark*step(.996,hash(floor(st)))*(1.-smoothstep(.0,.4,length(fract(st)-.5)))*smoothstep(.03,.3,n.y);col+=aur*vec3(.09,.69,.42)*exp(-10.*abs(n.y-.35-.15*sin(n.x*7.)))*(.35+noise(n.xz*49.));gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,
    }),
  );
  dome.renderOrder = -1000;
  root.add(dome);
  const groundName = stone || city ? "cliff" : "grass",
    groundTex = snow ? texture("land", 729) : artMap(groundName),
    pathTex = snow ? texture("trail", 222) : artMap("dirt"),
    landN = artMap(groundName + "-n", true),
    pathN = artMap("dirt-n", true);
  const cliffTex = artMap("cliff"),
    cliffN = artMap("cliff-n", true);
  function ridge(s, l) {
    let edge = Math.max(0, Math.abs(l) - c.half(s));
    const sign = l < 0 ? -1 : 1;
    let hills =
      (7 +
        7 * Math.sin(s * 0.028 + sign) +
        4 * Math.sin(s * 0.087 + l * 0.07)) *
        Math.sin(edge * 0.058) +
      edge * 0.18 * Math.sin(s * 0.018 + sign * 1.5);
    if (stone)
      hills += 4 * Math.sin(edge * 0.32 + s * 0.03) * Math.sin(edge * 0.05);
    if (l > 0 && wet)
      hills = -Math.min(17, edge * 0.76) + Math.sin(edge * 0.09) * 2;
    return (
      c.height(s, clamp(l, -c.half(s), c.half(s))) +
      hills * ease(clamp(edge / 3, 0, 1))
    );
  }
  const offsets = [
    -160, -110, -75, -52, -36, -25, -17, -11, -7, -4, -2, 0, 2, 4, 7, 11, 17,
    25, 36, 52, 75, 110, 160,
  ];
  function deform(vs) {
    if (!c.bend) return;
    for (let i = 0; i < vs.length; i += 3) {
      const [x, z] = c.place(vs[i], -vs[i + 2]);
      vs[i] = x;
      vs[i + 2] = z;
    }
  }
  function ribbon(path) {
    let vs = [],
      ix = [],
      uv = [],
      cs = [],
      rows = 0;
    let cols = path ? 7 : offsets.length;
    for (let s = -16; s <= c.len + 26; s += 1) {
      for (let j = 0; j < cols; j++) {
        let l = path ? ((j / 6) * 2 - 1) * c.half(s) : offsets[j];
        if (!path && c.bend)
          l = Math.sign(l) * 32 * Math.tanh(Math.abs(l) / 32);
        let h = path ? c.height(s, l) + 0.055 : ridge(s, l);
        if (!path && Math.abs(l) < c.half(s) + 1) h -= 0.3;
        if (!path) {
          let bridge = c.events.find(
            (e) => e.type === "b" && Math.abs(s - e.s) < 8,
          );
          if (bridge)
            h -=
              4.2 *
              Math.cos(((s - bridge.s) * Math.PI) / 16) ** 2 *
              Math.exp(-Math.abs(l) * 0.037);
          if (city && Math.abs(l) > c.half(s) + 2)
            h -= Math.min(12, Math.abs(l) - c.half(s) - 2);
        }
        if (!path && c.gap(s)) h -= 7 * Math.exp(-Math.abs(l) * 0.045);
        vs.push(c.center(s) + l, h, -s);
        uv.push(l / (path ? 3 : 7), s / (path ? 5 : 8));
        let shade = 0.86 + 0.1 * Math.sin(l * 0.18 + s * 0.054) + 0.045 * r();
        if (path) shade += (0.09 * Math.abs(j - 3)) / 3;
        cs.push(shade, shade, shade);
        if (rows && j && !(path && c.gap(s - 0.5))) {
          let a = rows * cols + j;
          ix.push(a - cols - 1, a - cols, a, a - cols - 1, a, a - 1);
        }
      }
      rows++;
    }
    deform(vs);
    const tx = path ? pathTex : groundTex;
    return surface(
      root,
      vs,
      ix,
      uv,
      cs,
      standard(
        snow
          ? path
            ? dirt
            : land
          : path
            ? c.theme === "desert" || c.theme === "grand"
              ? 0xffc391
              : 0xffe5bf
            : stone
              ? 0xbb9783
              : 0xd5e1b0,
        {
          map: tx,
          normalMap: path ? pathN : landN,
          normalScale: new T.Vector2(0.65, 0.65),
          vertexColors: true,
          roughness: c.surface === "lera" && path ? 0.48 : 0.84,
        },
      ),
    );
  }
  if (c.bend) {
    let basin = mesh(
      new T.PlaneGeometry(1200, 1200),
      standard(land, { map: groundTex }),
      root,
    );
    basin.rotation.x = -Math.PI / 2;
    basin.position.y = c.base(c.len) - 22;
    basin.castShadow = false;
  }
  ribbon(false);
  ribbon(true);
  // Batch scenery by material and geometry, including wheelside details, to bound draw calls.
  const batches = new Map(),
    dummy = new T.Object3D();
  const spine = Array.from({ length: Math.ceil(c.len / 4) + 1 }, (_, i) => {
    const s = Math.min(i * 4, c.len);
    return c.place(c.center(s), s);
  });
  const bounds = {
    x0: Math.min(...spine.map((p) => p[0])),
    x1: Math.max(...spine.map((p) => p[0])),
    z0: Math.min(...spine.map((p) => p[1])),
    z1: Math.max(...spine.map((p) => p[1])),
  };
  function item(key, g, m, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color) {
    if (!batches.has(key)) batches.set(key, { g, m, items: [] });
    if (c.bend) {
      if (key.startsWith("massif")) {
        let angle = ry,
          radius =
            165 + Math.max(bounds.x1 - bounds.x0, bounds.z1 - bounds.z0) * 0.78;
        x = (bounds.x0 + bounds.x1) / 2 + radius * Math.cos(angle);
        z = (bounds.z0 + bounds.z1) / 2 + radius * Math.sin(angle);
        y = c.base(c.len) - 20;
      } else {
        const side = x - c.center(-z);
        if (Math.abs(side) > 30) return;
        let pos = c.place(x, -z);
        ry -= c.turn(-z);
        x = pos[0];
        z = pos[1];
        if (
          Math.abs(side) > 5 &&
          spine.some(([px, pz]) => Math.hypot(px - x, pz - z) < 5)
        )
          return;
      }
    }
    dummy.position.set(x, y, z);
    dummy.rotation.set(rx, ry, rz);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    batches.get(key).items.push([dummy.matrix.clone(), color]);
  }
  const box = new T.BoxGeometry(1, 1, 1),
    ell = new T.IcosahedronGeometry(1, 1),
    pole = new T.CylinderGeometry(0.8, 1, 1, 9),
    trunk = standard(0xb9a58c, {
      map: artMap("bark"),
      normalMap: artMap("bark-n", true),
    }),
    leaf = standard(0xffffff),
    rockMat = standard(0xffffff, { map: cliffTex, normalMap: cliffN }),
    wood = standard(0xad8059, {
      map: pathTex,
      bumpMap: pathTex,
      bumpScale: 0.09,
    }),
    iron = standard(0x344247, { metalness: 0.58 }),
    paint = standard(0xf1ac37),
    glow = standard(0xffffff, {
      emissive: c.theme === "neon" ? 0xb41fff : 0xffbd56,
      emissiveIntensity: 1.3,
    });
  const tone = (col, v) => new T.Color(col).multiplyScalar(v);
  const kind = snow
    ? "frost"
    : c.theme === "jungle"
      ? "palm"
      : ["haunted", "coast"].includes(c.theme)
        ? "oak"
        : "spruce";
  const branches = standard(0xffffff, {
    map: artMap(kind),
    side: T.DoubleSide,
    alphaTest: 0.32,
    roughness: 0.82,
  });
  const crowns = [0, 1, 2].map((i) => crown(kind, i * 34 + 11));
  const massifs = [0, 1, 2, 3].map((i) =>
    mountain(
      24 + i * 19,
      snow || ["rock", "meadow", "sunset"].includes(c.theme),
      stone ? 0xd8a784 : 0xd9dcda,
    ),
  );
  const distant = standard(0xffffff, {
    vertexColors: true,
    map: cliffTex,
    side: T.DoubleSide,
  });
  for (let k = 0; k < c.len * 1.5; k++) {
    let s = r() * (c.len + 52) - 20,
      side = r() < 0.5 ? -1 : 1,
      l = side * (c.half(s) + 3 + r() ** 1.65 * 65);
    if (l > 0 && wet && l > 13 && l < 30) continue;
    const x = c.center(s) + l,
      y = ridge(s, l),
      z = -s,
      sz = 0.7 + r() * 1.55;
    if (city) {
      if (k % 4) continue;
      let height = 5 + r() * 22;
      item(
        "tower",
        box,
        rockMat,
        x,
        y + height * 0.5,
        z,
        3 + sz,
        height,
        3 + sz,
        0,
        0,
        0,
        tone(0x53647e, 0.65 + r() * 0.65),
      );
      for (let w = 1; w < height; w += 2)
        item("windows", box, glow, x, y + w, z + 2.6, 2, 0.19, 0.06);
      continue;
    }
    if (!forest || r() < 0.24) {
      let radius = stone ? 0.9 + r() * 3 : 0.35 + r();
      item(
        "rock",
        ell,
        rockMat,
        x,
        y + 0.18 * radius,
        z,
        radius,
        sz * (stone ? 1.6 : 0.6),
        radius * 0.8,
        0.2,
        r() * 6,
        0.14,
        tone(
          stone ? (c.theme === "lava" ? 0x584f52 : land) : 0x8a8a7c,
          0.74 + r() * 0.48,
        ),
      );
      continue;
    }
    let h = (3 + r() * 5) * sz;
    item(
      "bark",
      pole,
      trunk,
      x,
      y + h * 0.43,
      z,
      h * 0.027,
      h * 0.86,
      h * 0.031,
      0,
      r(),
      0.025,
    );
    let v = k % 3;
    item(
      "crown" + v,
      crowns[v],
      branches,
      x,
      y,
      z,
      h,
      h,
      h,
      0,
      r() * 6,
      0.017,
      tone(0xffffff, 0.82 + r() * 0.38),
    );
  }
  for (let k = 0; k < c.len * 2; k++) {
    let s = r() * c.len,
      l = (c.half(s) + 0.2 + r() * 3) * (r() < 0.5 ? -1 : 1),
      x = c.center(s) + l,
      y = ridge(s, l);
    item(
      "verge",
      ell,
      rockMat,
      x,
      y + 0.03,
      -s,
      0.08 + r() * 0.2,
      0.05 + r() * 0.12,
      0.15 + r() * 0.18,
      0.1,
      r() * 6,
      0.1,
      tone(snow ? 0xd5e4e9 : land, 0.75 + r() * 0.55),
    );
    if (["meadow", "jungle", "haunted", "falls"].includes(c.theme)) {
      const mushroom = c.theme === "haunted",
        h = 0.14 + r() * 0.21;
      item(
        "stem",
        pole,
        leaf,
        x,
        y + h * 0.5,
        -s,
        0.012,
        h,
        0.012,
        0,
        0,
        0.04,
        tone(mushroom ? 0xcba9aa : 0x689749, 0.94),
      );
      if (mushroom)
        item(
          "cap",
          ell,
          glow,
          x,
          y + h,
          -s,
          0.1,
          0.055,
          0.095,
          0,
          0,
          0,
          tone(0x86e9c3, 1),
        );
      else {
        for (let j = 0; j < 5; j++) {
          let a = j * 1.256;
          item(
            "petal",
            ell,
            leaf,
            x + Math.cos(a) * 0.041,
            y + h,
            -s + Math.sin(a) * 0.041,
            0.046,
            0.015,
            0.029,
            0,
            -a,
            0.15,
            tone(k % 4 ? 0xfff3de : 0xdfa8d8, 1),
          );
        }
        item(
          "pollen",
          ell,
          leaf,
          x,
          y + h + 0.015,
          -s,
          0.03,
          0.022,
          0.03,
          0,
          0,
          0,
          tone(0xffc93c, 1),
        );
      }
    }
  }
  // Distant irregular overlapping mountain ranges.
  for (let j = 0; j < 67; j++) {
    let s = -120 + r() * (c.len + 505),
      l = (145 + r() * 150) * (r() < 0.5 ? -1 : 1),
      h = 48 + r() * 91,
      v = j % 4;
    item(
      "massif" + v,
      massifs[v],
      distant,
      c.center(s) + l,
      c.base(s) - 18,
      -s,
      62 + r() * 52,
      h,
      65 + r() * 46,
      0,
      r() * 6,
      0,
    );
  }
  for (let j = 0; j < 10; j++) {
    let v = j % 4;
    item(
      "massif" + v,
      massifs[v],
      distant,
      (j - 5) * 53,
      c.base(c.len) - 25,
      -c.len - 100 - (j % 3) * 50,
      78,
      65 + r() * 100,
      80,
      0,
      r() * 6,
      0,
    );
  }
  const water = standard(
    c.theme === "lava" ? 0xff5422 : snow ? 0x8acbdf : 0x32939b,
    {
      roughness: 0.22,
      metalness: 0.32,
      emissive: c.theme === "lava" ? 0xca3010 : 0x00131b,
    },
  );
  if (wet) {
    let vs = [],
      ix = [],
      uv = [],
      cs = [];
    for (let s = -12; s < c.len + 20; s += 2) {
      let n = vs.length / 3;
      for (let l of [
        14,
        c.theme === "coast" ? 115 : 26 + 4 * Math.sin(s * 0.065),
      ]) {
        vs.push(c.center(s) + l, c.base(s) - 7, -s);
        uv.push(l / 10, s / 10);
        cs.push(0.9, 0.97, 1);
      }
      if (n) ix.push(n - 2, n - 1, n + 1, n - 2, n + 1, n);
    }
    deform(vs);
    surface(root, vs, ix, uv, cs, water);
  }
  for (let e of c.events) {
    if ("brw".includes(e.type)) {
      for (let j = -7; j < (e.type === "b" ? 9 : 0); j += 0.58) {
        let s = e.s + j,
          h = c.height(s),
          x = c.center(s),
          a = -Math.atan((c.center(s + 0.2) - c.center(s - 0.2)) / 0.4);
        item(
          "plank",
          box,
          wood,
          x,
          h + 0.1,
          -s,
          c.half(s) * 2,
          0.14,
          0.56,
          0,
          0,
          0,
        );
        if (e.type === "b" && Math.floor((j + 7) / 0.58) % 4 === 0)
          for (let side of [-1, 1])
            item(
              "post",
              pole,
              wood,
              x + side * c.half(s),
              h + 0.28,
              -s,
              0.1,
              1.15,
              0.1,
            );
      }
    }
    if (e.type === "b") {
      for (let side of [-1, 1]) {
        for (let j = -7; j <= 7; j++) {
          let u = e.s + j,
            x = c.center(u) + side * c.half(u);
          item(
            "handrail",
            box,
            wood,
            x,
            c.height(u) + 0.84,
            -u,
            0.085,
            0.09,
            1.2,
            0,
            -Math.atan(c.center(u + 0.5) - c.center(u - 0.5)),
            0,
          );
        }
        for (let j of [-5, 5]) {
          let u = e.s + j;
          item(
            "trestle",
            pole,
            wood,
            c.center(u) + side * (c.half(u) - 0.32),
            c.height(u) - 1.5,
            -u,
            0.15,
            3.3,
            0.15,
          );
        }
      }
      if (!city) {
        item(
          "brook",
          box,
          water,
          c.center(e.s),
          c.base(e.s) - 2.9,
          -e.s,
          22,
          0.06,
          3.4,
          0,
          0.08,
          0,
        );
      }
    }
    if (e.type === "o") {
      for (let j = 0; j < 3; j++) {
        let u = e.s - j * 1.5;
        item(
          "root",
          pole,
          trunk,
          c.center(u) - c.half(u) * 0.62,
          c.height(u) + 0.09,
          -u,
          0.1,
          c.half(u) * 0.9,
          0.11,
          0,
          0.3,
          1.45,
        );
      }
    }
    if (e.type === "w") {
      for (let j = -8; j < 10; j += 0.55) {
        let u = e.s + j,
          l = c.half(u) * 0.87;
        item(
          "bank",
          box,
          wood,
          c.center(u) + l,
          c.height(u, l) + 0.1,
          -u,
          l * 0.65,
          0.11,
          0.53,
          0,
          0,
          0.46,
        );
        if (night)
          item(
            "bankneon",
            box,
            glow,
            c.center(u) + c.half(u),
            c.height(u, c.half(u)) + 0.16,
            -u,
            0.08,
            0.11,
            0.56,
          );
      }
    }
    if (e.type === "i") {
      for (let j = -7; j < 9; j += 1) {
        let u = e.s + j;
        item(
          "ice",
          box,
          water,
          c.center(u),
          c.height(u) + 0.08,
          -u,
          c.half(u) * 1.74,
          0.055,
          1.1,
        );
      }
    }
    if (e.type === "f") {
      let vs = [],
        ix = [],
        uv = [],
        cs = [];
      for (let j = -17; j <= 17; j++) {
        let s = e.s + j;
        for (let off of [-1.55, 1.55]) {
          let l = c.fork(s) + off;
          vs.push(
            c.center(s) + l,
            Math.max(c.height(s, l) + 0.12, ridge(s, l) + 0.12),
            -s,
          );
          uv.push(off, s * 0.2);
          cs.push(1, 1, 1);
        }
        let n = vs.length / 3 - 2;
        if (n) ix.push(n - 2, n - 1, n + 1, n - 2, n + 1, n);
      }
      deform(vs);
      surface(root, vs, ix, uv, cs, standard(dirt, { map: pathTex }));
    }
    if (e.type === "o") {
      let h = c.height(e.s, -0.8);
      item(
        "obstacle",
        ell,
        rockMat,
        c.center(e.s) - 0.8,
        h + 0.24,
        -e.s,
        0.65,
        0.48,
        0.53,
        0.1,
        0.4,
        0.2,
        tone(0x827a6d, 1),
      );
    }
    if (e.type === "a") {
      for (let k = 0; k < 17; k++) {
        let a = (k * Math.PI) / 16,
          l = Math.cos(a) * (c.half(e.s) + 1);
        item(
          "arch",
          ell,
          rockMat,
          c.center(e.s) + l,
          c.base(e.s) + Math.sin(a) * 5,
          -e.s,
          1.3,
          1.4,
          1.9,
          0.1,
          a,
          0.1,
          tone(snow ? 0xaad7e7 : land, 0.91),
        );
      }
    }
    if (e.type === "g") {
      for (let j = 0; j < 4; j++) {
        let s = e.s + 5.6 + j * 0.8;
        item(
          "landing",
          box,
          paint,
          c.center(s),
          c.height(s) + 0.1,
          -s,
          c.half(s) * 1.5,
          0.05,
          0.16,
        );
      }
    }
  }
  for (let s = 6; s < c.len; s += night ? 6 : 16) {
    let side = Math.floor(s) % 2 ? 1 : -1,
      l = side * (c.half(s) + 0.4),
      h = ridge(s, l),
      x = c.center(s) + l;
    item("marker", pole, wood, x, h + 0.48, -s, 0.065, 1, 0.065);
    item(
      "reflect",
      box,
      night ? glow : paint,
      x,
      h + 0.91,
      -s,
      0.17,
      0.25,
      0.12,
    );
  }
  if (["jungle", "falls"].includes(c.theme))
    for (let s = 40; s < c.len; s += 68) {
      let x = c.center(s) + 18;
      for (let k = 0; k < 14; k++)
        item(
          "falls",
          pole,
          leaf,
          x + k * 0.22,
          c.base(s) - 1,
          -s + r() * 0.5,
          0.18,
          13 + r() * 2,
          0.15,
          0,
          0,
          0.05,
          tone(0xa9eced, 0.8 + r() * 0.35),
        );
    }
  if (city)
    for (let s = 1; s < c.len; s += 8) {
      let x = c.center(s),
        h = c.base(s);
      item(
        "roofblock",
        box,
        rockMat,
        x,
        h - 5.17,
        -s,
        c.half(s) * 2.8,
        9.8,
        8,
        0,
        0,
        0,
        tone(0x797e86, 0.92),
      );
      for (let side of [-1, 1])
        for (let j = 0; j < 3; j++)
          item(
            "rooflight",
            box,
            glow,
            x + side * (c.half(s) * 1.42),
            h - 2 - j * 1.8,
            -s,
            0.05,
            0.25,
            4.4,
          );
    }
  if (["neon", "extreme", "city"].includes(c.theme))
    for (let s = 3; s < c.len; s += 2) {
      for (let side of [-1, 1]) {
        let l = c.half(s) * side;
        item(
          "led",
          box,
          glow,
          c.center(s) + l,
          c.height(s, l) + 0.15,
          -s,
          0.12,
          0.1,
          1.45,
          0,
          -Math.atan(c.center(s + 0.5) - c.center(s - 0.5)),
          0,
        );
      }
    }
  for (let n of [0, c.len]) {
    let h = c.base(n),
      x = c.center(n);
    for (let side of [-1, 1])
      item("gate", pole, iron, x + side * 4, h + 2.4, -n, 0.16, 5, 0.16);
    item("gatebar", box, paint, x, h + 4.85, -n, 8.6, 0.42, 0.48);
    for (let i = 0; i < 16; i++)
      item(
        "flag",
        box,
        i % 2 ? iron : glow,
        x - 3.75 + i * 0.5,
        h + 4.8,
        -n + 0.27,
        0.48,
        0.35,
        0.04,
      );
  }
  for (let { g, m, items } of batches.values()) {
    let o = new T.InstancedMesh(g, m, items.length);
    items.forEach(([matrix, color], i) => {
      o.setMatrixAt(i, matrix);
      if (color) o.setColorAt(i, color);
    });
    o.castShadow = true;
    o.receiveShadow = true;
    root.add(o);
  }
  // Moving dust, powder or embers stay local to the active rider.
  const dots = 64,
    xyz = new Float32Array(dots * 3),
    vel = new Float32Array(dots * 3),
    life = new Float32Array(dots),
    dustGeom = new T.BufferGeometry();
  dustGeom.setAttribute("position", new T.BufferAttribute(xyz, 3));
  const motes = new T.Points(
    dustGeom,
    new T.PointsMaterial({
      color: snow ? 0xffffff : c.theme === "lava" ? 0xff9c40 : 0xbe9e79,
      size: snow ? 0.085 : 0.06,
      transparent: true,
      opacity: 0.63,
      depthWrite: false,
    }),
  );
  motes.frustumCulled = false;
  root.add(motes);
  let cursor = 0,
    lastS = -10;
  if (night) {
    const hv = [];
    for (let s = 6; s < c.len; s += 6) {
      const side = Math.floor(s) % 2 ? 1 : -1,
        l = side * (c.half(s) + 0.4),
        [x, z] = c.place(c.center(s) + l, s);
      hv.push(x, c.height(s, l) + 0.93, z);
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(hv, 3));
    const gl = new T.ShaderMaterial({
      transparent: true,
      blending: T.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        color: { value: new T.Color(c.theme === "neon" ? 0xc45aff : 0xffd88f) },
      },
      vertexShader:
        "void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(550./max(1.,-p.z),2.,48.);}",
      fragmentShader:
        "uniform vec3 color;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(color,pow(max(0.,1.-d),3.)*.56);}",
    });
    root.add(new T.Points(g, gl));
  }
  const head = new T.SpotLight(0xffedc9, night ? 4.3 : 0, 44, 0.52, 0.5, 0.65);
  root.add(head, head.target);
  return {
    night,
    ridge,
    update(x, y, s, cam) {
      let [wx, wz] = c.place(x, s),
        [tx, tz] = c.place(c.center(s + 12), s + 12);
      let travel = Math.abs(s - lastS);
      lastS = s;
      let dt = Math.min(0.05, travel * 0.08 + 0.01);
      for (let i = 0; i < dots; i++) {
        life[i] -= dt;
        if (life[i] > 0) {
          for (let j = 0; j < 3; j++) xyz[i * 3 + j] += vel[i * 3 + j] * dt;
          vel[i * 3 + 1] -= dt * 0.8;
        } else xyz[i * 3 + 1] = -1000;
      }
      if (travel > 0.015) {
        for (let k = 0; k < 2; k++) {
          let i = cursor++ % dots;
          life[i] = 0.55 + r() * 0.45;
          xyz.set([wx + (r() - 0.5) * 0.25, y + 0.15, wz + 0.65], i * 3);
          vel.set([(r() - 0.5) * 1.7, 1 + r(), 1 + r() * 1.4], i * 3);
        }
      }
      dustGeom.attributes.position.needsUpdate = true;
      dome.position.copy(cam.position);
      sun.position.set(wx - 21, y + 36, wz + 18);
      sun.target.position.set(wx, y, wz - 9);
      head.position.set(wx, y + 1.65, wz - 0.7);
      head.target.position.set(tx, c.base(s + 12), tz);
    },
  };
}
