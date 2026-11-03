import {
  parks,
  height,
  surface,
  railPoint,
  clamp,
  halfWidth,
  halfDepth,
} from "./model.js?v=street-lines-2";
const T = window.THREE,
  v = (x, y, z) => new T.Vector3(x, y, z);
const sphere = new T.SphereGeometry(1, 16, 12),
  cube = new T.BoxGeometry(1, 1, 1),
  tube = new T.CylinderGeometry(0.5, 0.5, 1, 12);
const mat = (color, opts = {}) =>
  new T.MeshStandardMaterial({ color, roughness: 0.78, ...opts });
function part(parent, geo, m, x, y, z, sx, sy, sz) {
  const obj = new T.Mesh(geo, m);
  obj.position.set(x, y, z);
  obj.scale.set(sx, sy, sz);
  parent.add(obj);
  return obj;
}
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"));
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
function noise() {
  let seed = 19;
  const t = canvasTex(192, 192, (c) => {
    const d = c.createImageData(192, 192);
    for (let i = 0; i < d.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const n = 211 + (seed >>> 27);
      d.data.set([n, n, n, 255], i);
    }
    c.putImageData(d, 0, 0);
    c.strokeStyle = "#a6a5a1";
    c.lineWidth = 1.1;
    c.strokeRect(0, 0, 192, 192);
    c.strokeStyle = "#ceccc8";
    c.beginPath();
    c.moveTo(1, 87);
    c.lineTo(15, 93);
    c.lineTo(25, 91);
    c.stroke();
  });
  t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}
function plaza(park, scene) {
  const geo = new T.PlaneGeometry(halfWidth * 2, halfDepth * 2, 256, 240);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position,
    colors = [],
    uv = geo.attributes.uv;
  const plain = new T.Color(park.floor),
    stripe = new T.Color(park.ink),
    color = new T.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      z = pos.getZ(i),
      y = height(park, x, z);
    pos.setY(i, y);
    uv.setXY(i, x / 5, z / 5);
    color.copy(plain);
    for (const s of park.shapes) {
      if (Math.abs(surface(s, x, z)) < 0.012) continue;
      const level = Math.abs(y / s[5]);
      color.lerp(
        stripe,
        s[0] === "bowl"
          ? level > 0.1 && level < 0.22
            ? 0.96
            : 0.29
          : level > 0.62 && level < 0.83
            ? 0.95
            : 0.36,
      );
      if (s[0] === "half") {
        const plank = Math.floor((z - s[2]) * 3);
        color.lerp(new T.Color(plank % 2 ? 0xad795b : 0xc6976d), 0.47);
      }
    }
    colors.push(color.r, color.g, color.b);
  }
  geo.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const floor = new T.Mesh(
    geo,
    mat(0xffffff, { map: noise(), vertexColors: true }),
  );
  floor.receiveShadow = true;
  scene.add(floor);
}
function skylineTexture(i) {
  return canvasTex(1024, 256, (c) => {
    c.fillStyle = ["#b25b44", "#d58b66", "#333452"][i];
    c.fillRect(0, 0, 1024, 256);
    for (let row = 0; row < 28; row++) {
      c.fillStyle = "rgba(24,18,24,.13)";
      c.fillRect(0, row * 10, 1024, 1);
      for (let x = -18; x < 1024; x += 38)
        c.fillRect(x + 19 * (row % 2), row * 10, 1, 10);
    }
    for (let x = 12; x < 1024; x += 58) {
      for (let y = 18; y < 240; y += 73) {
        c.fillStyle = "#463f46";
        c.fillRect(x, y, 33, 53);
        c.fillStyle = i === 2 ? "#f4bc7c" : "#a9c2c4";
        c.fillRect(x + 3, y + 4, 27, 43);
        c.fillStyle = "#63575b";
        c.fillRect(x + 15, y, 2, 51);
        c.fillRect(x, y + 23, 32, 2);
        c.fillStyle = "#ddc5ac";
        c.fillRect(x - 2, y + 51, 37, 3);
      }
    }
  });
}
function mural(i) {
  return canvasTex(1024, 256, (c) => {
    c.fillStyle = ["#12695f", "#db7050", "#383253"][i];
    c.fillRect(0, 0, 1024, 256);
    for (let j = 0; j < 9; j++) {
      c.lineWidth = 7 + j;
      c.strokeStyle = ["#ffad58", "#f0948b", "#73d9c8"][j % 3];
      c.beginPath();
      c.moveTo(-40, 230 + j * 10);
      c.bezierCurveTo(220, -260 + j * 15, 650, 450 - j * 24, 1080, 30 + j * 9);
      c.stroke();
    }
    c.fillStyle = "#101f2b";
    c.fillRect(35, 38, 525, 124);
    c.fillStyle = "#fff1d2";
    c.font = "italic 900 77px sans-serif";
    c.fillText("FRITIDSPARKEN", 48, 122, 496);
    c.font = "bold 26px sans-serif";
    c.fillText(
      ["01   /   GÅRDEN", "02   /   STRANDEN", "03   /   MAGASINET"][i],
      52,
      207,
    );
  });
}
function environment(scene, park, i) {
  const batches = new Map(),
    dummy = new T.Object3D(),
    staticM = mat(0xffffff);
  function stamp(g, color, x, y, z, a, b, c, rx = 0, ry = 0, rz = 0) {
    let items = batches.get(g);
    if (!items) batches.set(g, (items = []));
    dummy.position.set(x, y, z);
    dummy.scale.set(a, b, c);
    dummy.rotation.set(rx, ry, rz);
    dummy.updateMatrix();
    items.push([dummy.matrix.clone(), new T.Color(color)]);
  }
  const box = (...args) => stamp(cube, ...args),
    ball = (...args) => stamp(sphere, ...args);
  function bar(a, b, r, color) {
    const start = v(...a),
      end = v(...b),
      delta = end.clone().sub(start);
    const q = new T.Quaternion().setFromUnitVectors(
      v(0, 1, 0),
      delta.clone().normalize(),
    );
    const e = new T.Euler().setFromQuaternion(q);
    stamp(
      tube,
      color,
      ...start.lerp(end, 0.5).toArray(),
      r,
      delta.length(),
      r,
      e.x,
      e.y,
      e.z,
    );
  }
  plaza(park, scene);
  const land = i === 1 ? 0xe3bc90 : i === 2 ? 0x464256 : 0x91a164;
  for (const side of [-1, 1]) {
    box(land, side * (halfWidth + 13), -0.35, 0, 26, 0.58, halfDepth * 2 + 12);
    box(land, 0, -0.35, side * (halfDepth + 6), halfWidth * 2, 0.58, 12);
  }

  for (const r of park.rails) {
    let a = railPoint(park, r, 0);
    for (let n = 1; n <= 16; n++) {
      const b = railPoint(park, r, n / 16);
      bar(a, b, 0.13, park.rail);
      if (n % 5 === 1)
        bar([b[0], height(park, b[0], b[2]) - 0.04, b[2]], b, 0.09, 0x52646a);
      a = b;
    }
  }
  if (i === 1) {
    box(0x54b4bc, -0.5, -0.43, -halfDepth - 35, 200, 0.2, 48);
    for (let j = 0; j < 45; j++)
      box(
        0xb8e4dd,
        Math.sin(j * 12.5) * 74,
        -0.316,
        -halfDepth - 13 - j * 0.66,
        2 + (j % 5),
        0.03,
        0.13,
      );
    for (let j = 0; j < 142; j++)
      box(
        j % 2 ? 0xba9570 : 0xc49b75,
        -halfWidth + j * 0.79,
        -0.14,
        -halfDepth - 4,
        0.76,
        0.26,
        9,
      );
    for (let j = 0; j < 3; j++) {
      const x = -31 + j * 29;
      bar([x, -0.3, -halfDepth - 24], [x, 6, -halfDepth - 24], 0.12, 0x6e655c);
      const g = new T.BufferGeometry();
      g.setAttribute(
        "position",
        new T.Float32BufferAttribute(
          [
            x,
            5.9,
            -halfDepth - 24,
            x + 3,
            0.6,
            -halfDepth - 24,
            x,
            0.6,
            -halfDepth - 24,
          ],
          3,
        ),
      );
      g.computeVertexNormals();
      scene.add(new T.Mesh(g, mat(0xffeace, { side: T.DoubleSide })));
      ball(0x385873, x, 0.1, -halfDepth - 24, 2.8, 0.37, 0.7);
    }
  } else {
    const facade = mat(0xffffff, { map: skylineTexture(i) });
    for (let j = 0; j < 3; j++) {
      const h = 4 + ((j * 13) % 5);
      part(
        scene,
        cube,
        facade,
        27 + j * 15,
        h / 2,
        -halfDepth - 10 - (j % 2) * 4,
        13,
        h,
        7,
      );
      box(
        0x535361,
        27 + j * 15,
        h,
        -halfDepth - 10 - (j % 2) * 4,
        13.5,
        0.5,
        7.6,
      );
    }
  }
  const sign = new T.Mesh(
    new T.PlaneGeometry(16, 4),
    mat(0xffffff, { map: mural(i), side: T.DoubleSide }),
  );
  sign.position.set(0, 2.1, -halfDepth - 0.5);
  scene.add(sign);
  for (let j = 0; j < 46; j++) {
    const x = -55 + (j % 23) * 5,
      z = j < 23 ? -halfDepth - 1 : halfDepth + 1;
    bar([x, 0, z], [x, 1.55, z], 0.09, 0x435859);
    if (j % 23 < 22) {
      bar([x, 1.42, z], [x + 5, 1.42, z], 0.08, 0x526c69);
      bar([x, 0.65, z], [x + 5, 0.65, z], 0.06, 0x526c69);
    }
  }
  const foliage = new T.TextureLoader().load(
    "../downhill/art/" + (i === 1 ? "palm" : "oak") + ".webp",
  );
  foliage.colorSpace = T.SRGBColorSpace;
  const leafGeo = new T.PlaneGeometry(1, 1);
  leafGeo.rotateX(-Math.PI / 2);
  const leaves = mat(0xffffff, {
    map: foliage,
    alphaTest: 0.33,
    side: T.DoubleSide,
  });
  for (let j = 0; j < 20; j++) {
    const x = (j % 2 ? -1 : 1) * (halfWidth + 3 + (j % 4)),
      z = -halfDepth + Math.floor(j / 2) * 11;
    const h = 4 + (j % 3);
    bar([x, 0, z], [x + 0.25, h, z], 0.39, 0x86654b);
    const layers = i === 1 ? 2 : 4;
    for (let level = 0; level < layers; level++) {
      for (let k = 0; k < 8; k++) {
        const angle = (k * Math.PI) / 4 + level * 0.83 + j * 0.75,
          len =
            (i === 1 ? 3.7 : 3.5 - level * 0.5) * (1 + 0.11 * Math.sin(j + k));
        stamp(
          leafGeo,
          0xffffff,
          x + Math.sin(angle) * len * 0.39,
          h - 0.45 + level * (i === 1 ? 0.22 : 0.64),
          z + Math.cos(angle) * len * 0.39,
          len,
          1,
          len * 0.86,
          0.28 + level * 0.08,
          angle - Math.PI / 2,
          0,
        );
      }
    }
  }
  for (let j = 0; j < 8; j++) {
    const side = j % 2 ? 1 : -1,
      x = side * (halfWidth + 1),
      z = -40 + Math.floor(j / 2) * 26;
    bar([x, 0, z], [x, 5.7, z], 0.15, 0x394955);
    box(0x374654, x - side * 0.48, 5.7, z, 1.1, 0.22, 0.56);
    box(
      i === 2 ? 0x7ffaff : 0xffedbb,
      x - side * 0.5,
      5.55,
      z,
      0.8,
      0.09,
      0.42,
    );
    box(0xa77350, x, 0.62, z + 3, 0.92, 0.2, 3.1);
    box(0x926247, x + side * 0.4, 1, z + 3, 0.15, 0.7, 3.1);
    for (const dz of [-1, 1])
      box(0x47525a, x, 0.3, z + 3 + dz, 0.65, 0.62, 0.14);
    if (j % 2 === 0) {
      ball(0xe2ad87, x, 0.99 + 1, z + 4, 0.21, 0.24, 0.21);
      ball([0xcc724c, 0x4b7189][(j % 4) / 2], x, 1.49, z + 4, 0.29, 0.43, 0.22);
      box(0x384456, x, 0.84, z + 4, 0.42, 0.83, 0.26);
    }
  }
  if (i === 2) {
    for (let j = 0; j < 6; j++) {
      box(
        j % 2 ? 0xd96e9d : 0x64dedf,
        -5 + j * 2,
        1.84,
        -1.8,
        0.94,
        0.06,
        0.09,
      );
    }
    for (let j = 0; j < 4; j++) {
      const light = new T.PointLight(j % 2 ? 0xff3e91 : 0x57eefe, 1.4, 24);
      light.position.set(j % 2 ? 17 : -17, 4, j < 2 ? -12 : 12);
      scene.add(light);
    }
  }
  for (const [g, items] of batches) {
    const mesh = new T.InstancedMesh(
      g,
      g === leafGeo ? leaves : staticM,
      items.length,
    );
    items.forEach(([m, c], n) => {
      mesh.setMatrixAt(n, m);
      mesh.setColorAt(n, c);
    });
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
  }
}
function skater(shirt, deck) {
  const group = new T.Group(),
    body = new T.Group(),
    board = new T.Group();
  group.add(board, body);
  const skin = mat(0xd8a17e),
    helmet = mat(0x233646),
    cloth = mat(shirt),
    pants = mat(0x34475a),
    shoe = mat(0x202938),
    white = mat(0xf6e6cf),
    black = mat(0x283136),
    silver = mat(0xb9c3c4, { metalness: 0.65 }),
    paint = mat(deck);
  const blob = (parent, m, x, y, z, a, b, c) =>
    part(parent, sphere, m, x, y, z, a, b, c);
  blob(board, paint, 0, 0.13, 0, 0.25, 0.063, 0.68);
  blob(board, black, 0, 0.166, 0, 0.24, 0.043, 0.66);
  for (const sign of [-1, 1]) {
    blob(board, paint, 0, 0.18, 0.53 * sign, 0.235, 0.055, 0.19).rotation.x =
      -sign * 0.22;
    part(board, cube, silver, 0, 0.087, sign * 0.38, 0.4, 0.09, 0.08);
    for (const x of [-0.205, 0.205])
      part(
        board,
        tube,
        white,
        x,
        0.082,
        sign * 0.38,
        0.154,
        0.084,
        0.154,
      ).rotation.z = Math.PI / 2;
  }
  const graphic = canvasTex(256, 512, (c) => {
    c.fillStyle = "#" + deck.toString(16).padStart(6, "0");
    c.fillRect(0, 0, 256, 512);
    c.strokeStyle = "#143a43";
    c.lineWidth = 16;
    if (deck === 0xe4a963) {
      for (let n = 0; n < 5; n++) {
        c.beginPath();
        c.moveTo(0, 65 + n * 90);
        c.lineTo(256, n * 90);
        c.stroke();
      }
    } else if (deck === 0xff704f) {
      for (let n = 0; n < 4; n++) {
        c.beginPath();
        c.arc(128, 250, 33 + n * 39, 0, Math.PI * 2);
        c.stroke();
      }
    } else {
      for (let n = 0; n < 18; n++) {
        const x = (n * 91) % 246,
          y = (n * 47) % 500;
        c.fillStyle = n % 3 ? "#f4ffff" : "#254979";
        c.fillRect(x, y, 8, 8);
      }
    }
    c.fillStyle = "#ffedd0";
    c.font = "italic bold 90px sans-serif";
    c.fillText("FP", 58, 285);
  });
  const print = new T.Mesh(
    new T.CircleGeometry(1, 36),
    mat(0xffffff, { map: graphic }),
  );
  print.scale.set(0.23, 0.62, 1);
  print.rotation.x = Math.PI / 2;
  print.position.y = 0.071;
  board.add(print);
  for (const z of [-0.38, 0.38])
    for (const x of [-0.07, 0.07])
      blob(board, silver, x, 0.212, z, 0.014, 0.007, 0.014);
  const torso = blob(body, cloth, 0, 1.01, 0.015, 0.28, 0.33, 0.265);
  blob(body, cloth, 0.045, 1.25, 0.06, 0.25, 0.14, 0.22);
  blob(body, cloth, 0, 0.83, 0.015, 0.263, 0.12, 0.238);
  blob(body, helmet, 0, 0.86, 0.206, 0.135, 0.075, 0.085);
  blob(body, skin, 0, 1.48, -0.035, 0.192, 0.237, 0.193);
  blob(body, helmet, 0, 1.61, -0.027, 0.216, 0.17, 0.213);
  blob(body, helmet, 0, 1.58, -0.13, 0.205, 0.057, 0.147);
  for (const x of [-0.203, 0.203])
    blob(body, helmet, x, 1.45, -0.02, 0.025, 0.1, 0.022);
  const badge = canvasTex(128, 96, (c) => {
    c.fillStyle = "#fff5cf";
    c.font = "italic 900 67px sans-serif";
    c.fillText("FP", 9, 74);
  });
  const logo = new T.Mesh(
    new T.PlaneGeometry(0.205, 0.14),
    new T.MeshBasicMaterial({ map: badge, transparent: true }),
  );
  logo.position.set(0, 1.09, 0.26);
  body.add(logo);
  for (let n = 0; n < 3; n++) {
    blob(body, black, -0.1 + n * 0.1, 1.735, -0.045, 0.021, 0.015, 0.055);
  }
  blob(body, skin, 0.17, 1.47, -0.04, 0.039, 0.06, 0.043);
  blob(body, skin, 0.04, 1.48, -0.208, 0.051, 0.04, 0.049);
  const limbs = [];
  for (const s of [-1, 1]) {
    const leg = new T.Group();
    leg.position.set(0, 0.86, s * 0.25);
    body.add(leg);
    blob(leg, pants, -0.03, -0.16, 0.015 * s, 0.13, 0.24, 0.137);
    blob(leg, pants, 0.015, -0.43, 0.04 * s, 0.11, 0.19, 0.12);
    blob(leg, helmet, 0.055, -0.34, 0.035 * s, 0.099, 0.094, 0.11);
    blob(leg, shoe, -0.035, -0.61, 0.04 * s, 0.19, 0.085, 0.115);
    blob(leg, white, -0.035, -0.659, 0.04 * s, 0.19, 0.038, 0.116);
    const arm = new T.Group();
    arm.position.set(0, 1.2, s * 0.22);
    body.add(arm);
    blob(arm, cloth, 0.025, -0.105, s * 0.045, 0.12, 0.17, 0.118);
    blob(arm, skin, 0.047, -0.31, s * 0.1, 0.078, 0.16, 0.081);
    blob(arm, skin, 0.045, -0.44, s * 0.12, 0.084, 0.087, 0.078);
    limbs.push({ leg, arm, s });
  }
  group.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  return { group, body, board, limbs, torso };
}
export class World {
  constructor(canvas) {
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "low-power",
    });
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.camera = new T.PerspectiveCamera(57, 1, 0.12, 160);
    this.focus = v(0, 1, 0);
    this.want = v(0, 0, 0);
    this.target = v(0, 0, 0);
  }
  build(i, shirt, deck, q) {
    if (this.scene) {
      const materials = new Set(),
        geometry = new Set();
      this.scene.traverse((o) => {
        if (o.geometry && ![cube, tube, sphere].includes(o.geometry))
          geometry.add(o.geometry);
        if (o.material) materials.add(o.material);
        if (o.isInstancedMesh) o.dispose();
      });
      geometry.forEach((g) => g.dispose());
      materials.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
      this.sun.shadow.dispose();
      this.scene.background?.dispose();
    }
    const park = parks[i];
    this.park = park;
    this.scene = new T.Scene();
    const sky = new T.TextureLoader().load("vista-" + i + ".webp");
    sky.mapping = T.EquirectangularReflectionMapping;
    sky.colorSpace = T.SRGBColorSpace;
    this.scene.background = sky;
    this.scene.fog = new T.FogExp2(park.sky, i === 2 ? 0.014 : 0.0075);
    this.scene.add(
      new T.HemisphereLight(
        i === 2 ? 0xdfddff : 0xfff5de,
        i === 2 ? 0x797196 : 0xb2afa0,
        i === 2 ? 1.65 : 1.58,
      ),
    );
    const sun = new T.DirectionalLight(
      i === 2 ? 0xb3cbff : 0xffe3b5,
      i === 2 ? 1.65 : 2.05,
    );
    sun.position.set(-36, 82, 42);
    sun.castShadow = true;
    Object.assign(sun.shadow.camera, {
      left: -80,
      right: 80,
      top: 74,
      bottom: -74,
      far: 185,
    });
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.001;
    this.scene.add(sun);
    this.sun = sun;
    environment(this.scene, park, i);
    this.avatar = skater(shirt, deck);
    this.scene.add(this.avatar.group);
    const shadow = canvasTex(64, 64, (c) => {
      const g = c.createRadialGradient(32, 32, 1, 32, 32, 32);
      g.addColorStop(0, "#0009");
      g.addColorStop(1, "#0000");
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
    });
    this.blob = new T.Mesh(
      new T.PlaneGeometry(1.5, 2.2),
      new T.MeshBasicMaterial({
        map: shadow,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    );
    this.blob.rotation.x = -Math.PI / 2;
    this.scene.add(this.blob);
    this.snap = true;
    this.quality(q);
  }
  quality(q) {
    const light =
      q === "låg" ||
      (q === "auto" &&
        (matchMedia("(pointer:coarse)").matches || innerWidth < 700));
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio || 1, light ? 1 : 1.65),
    );
    this.renderer.shadowMap.enabled = !light;
    this.camera.far = light ? 105 : 160;
    this.resize();
  }
  resize() {
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.fov = innerWidth < innerHeight ? 66 : 55;
    this.camera.updateProjectionMatrix();
  }
  draw(p, k, dt) {
    const { group, body, board, limbs } = this.avatar,
      air = p.air,
      steer = Number(!!k.right) - Number(!!k.left);
    group.position.set(p.x, p.y + 0.015, p.z);
    group.rotation.order = "YXZ";
    const blend = this.snap ? 1 : 1 - Math.exp(-dt * 24);
    const follow = (from, to) =>
      from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * blend;
    group.rotation.y = follow(group.rotation.y, p.dir + p.stance + p.spin);
    group.rotation.x = follow(
      group.rotation.x,
      air ? 0 : Math.atan(p.slope || 0) * Math.cos(p.stance),
    );
    group.rotation.z = steer * 0.095;
    const push = !air && !p.manual && !p.rail && k.go ? Math.sin(p.kick) : 0,
      crouch = p.squat * 0.16 + (air ? 0.095 : 0);
    body.position.y += (-crouch - body.position.y) * blend;
    body.rotation.z = -0.085 - steer * 0.085;
    body.rotation.x = push * 0.045;
    for (const { leg, arm, s } of limbs) {
      leg.rotation.x = s === 1 ? push * 0.54 : -crouch * 0.85;
      leg.position.y = 0.86 + crouch * 0.4;
      arm.rotation.x = follow(
        arm.rotation.x,
        -s *
          (0.27 + (air ? 0.83 : 0) + (p.manual !== null || p.rail ? 0.36 : 0)) +
          push * 0.15,
      );
      arm.rotation.z = 0.19 + steer * 0.28;
    }
    const prevX = board.rotation.x,
      prevY = board.rotation.y,
      prevZ = board.rotation.z;
    board.rotation.set(
      p.manual === 15
        ? -0.21
        : p.manual === 16
          ? 0.21
          : p.rail?.id === 11
            ? -0.17
            : p.rail?.id === 12
              ? 0.17
              : 0,
      0,
      0,
    );
    if (p.rail?.id >= 13)
      board.rotation.y = p.rail.id === 13 ? Math.PI / 2 : -Math.PI / 2;
    if (air)
      board.rotation.x = (p.nollie ? -1 : 1) * clamp(p.vy / 16, -0.24, 0.34);
    if (p.flip) {
      const a = Math.PI * 2 * clamp(p.flip.t / p.flip.duration, 0, 1);
      const id = p.flip.id;
      board.rotation.z = id === 3 ? -a : [2, 8, 9].includes(id) ? a : 0;
      board.rotation.y = [7, 9].includes(id)
        ? a
        : [4, 8].includes(id)
          ? a / 2
          : 0;
    }
    board.rotation.x = follow(prevX, board.rotation.x);
    board.rotation.y = follow(prevY, p.deckYaw + board.rotation.y);
    board.rotation.z = follow(prevZ, board.rotation.z);
    const ground = height(this.park, p.x, p.z);
    this.blob.position.set(p.x, ground + 0.027, p.z);
    this.blob.material.opacity = clamp(1 - (p.y - ground) * 0.16, 0.22, 1);
    const dist = (innerWidth < innerHeight ? 6.1 : 5.15) + p.speed * 0.075;
    const sx = Math.sin(p.dir),
      cz = Math.cos(p.dir);
    this.want.set(
      clamp(p.x + sx * dist + 0.95 * cz, 0.6 - halfWidth, halfWidth - 0.6),
      p.y + 2.75 + p.speed * 0.055,
      clamp(p.z + cz * dist - 0.95 * sx, 0.6 - halfDepth, halfDepth - 0.6),
    );
    this.want.y = Math.max(
      this.want.y,
      height(this.park, this.want.x, this.want.z) + 1.45,
    );
    this.target.set(p.x - sx * 2.35, p.y + 1.05, p.z - cz * 2.35);
    const smooth = this.snap ? 1 : 1 - Math.exp(-8 * dt);
    this.camera.position.lerp(this.want, smooth);
    this.focus.lerp(this.target, smooth);
    this.camera.position.y = Math.max(
      this.camera.position.y,
      height(this.park, this.camera.position.x, this.camera.position.z) + 0.65,
    );
    this.camera.lookAt(this.focus);
    this.snap = false;
    this.renderer.render(this.scene, this.camera);
  }
}
