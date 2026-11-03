const T = THREE,
  V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z),
  TAU = Math.PI * 2;
export const shapes = {
  ball: new T.SphereGeometry(1, 20, 14),
  box: new T.BoxGeometry(1, 1, 1),
  pole: new T.CylinderGeometry(0.78, 1, 1, 14),
  cone: new T.ConeGeometry(1, 1, 14),
  ring: new T.TorusGeometry(1, 0.13, 9, 32),
  rock: new T.IcosahedronGeometry(1, 1),
};
// A palm frond is one reusable mesh with a curved spine and paired tapered leaflets.
function frondGeometry() {
  let pos = [],
    colors = [];
  function tri(a, b, c, k) {
    pos.push(...a, ...b, ...c);
    for (let j = 0; j < 3; j++)
      colors.push(0.63 + k * 0.3, 0.82 + k * 0.15, 0.6 + k * 0.27);
  }
  for (let i = 0; i < 21; i++) {
    let t = i / 21,
      n = (i + 1) / 21,
      z = t * 5.5,
      y = Math.sin(t * Math.PI) * 0.9 - t * t * 1.5,
      yn = Math.sin(n * Math.PI) * 0.9 - n * n * 1.5;
    tri([-0.055, y, z], [0.055, y, z], [0.04, yn, n * 5.5], 0.7);
    tri([-0.055, y, z], [0.04, yn, n * 5.5], [-0.04, yn, n * 5.5], 0.7);
    for (let sign of [-1, 1]) {
      let width = (0.12 + Math.sin(Math.PI * t) ** 0.65) * 1.05;
      tri(
        [0, y, z],
        [sign * width, y - 0.21 - width * 0.18, z + 0.55],
        [0, yn, n * 5.5],
        (i % 4) / 4,
      );
    }
  }
  let g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}
shapes.frond = frondGeometry();
shapes.land = new T.SphereGeometry(1, 10, 7);
export function surface(color, rough = 0.6, metal = 0.08, glow = 0) {
  return new T.MeshStandardMaterial({
    color,
    roughness: rough,
    metalness: metal,
    emissive: color,
    emissiveIntensity: glow,
  });
}
function canvasTexture(size, draw) {
  let c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
export function label(text, bg = "#192239", fg = "white") {
  let tex = canvasTexture(512, (g, s) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, s, s);
    g.fillStyle = fg;
    g.font = "900 72px system-ui";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, s / 2, s / 2, 480);
  });
  return new T.MeshBasicMaterial({ map: tex, side: T.DoubleSide });
}
function asphalt(track, quality) {
  const tex = canvasTexture(quality > 1 ? 512 : 256, (g, s) => {
    g.fillStyle =
      track.id === 5
        ? "#6d4540"
        : track.id === 7
          ? "#9daebf"
          : track.id === 9
            ? "#80644a"
            : "#535760";
    g.fillRect(0, 0, s, s);
    let seed = 631;
    for (let i = 0; i < s * s * 0.7; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      let x = seed % s,
        y = (seed >>> 13) % s;
      g.fillStyle = i % 2 ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.14)";
      g.fillRect(x, y, 1 + (i % 3), 1);
    }
    for (let i of [0.12, 0.26, 0.72, 0.86]) {
      let grad = g.createLinearGradient(s * (i - 0.045), 0, s * (i + 0.045), 0);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.5, "rgba(16,18,24,.13)");
      grad.addColorStop(1, "transparent");
      g.fillStyle = grad;
      g.fillRect(s * (i - 0.045), 0, s * 0.09, s);
    }
    if (track.id === 9) {
      g.fillStyle = "#453c32";
      for (let i = 0; i < 8; i++) g.fillRect(0, (i * s) / 8, s, 2);
    }
  });
  tex.wrapS = tex.wrapT = T.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}
function ribbon(scene, frames, left, right, height, material, colorAt, skip) {
  const positions = [],
    uv = [],
    indices = [],
    colors = [];
  frames.forEach(({ pos, up, right: r }, i) => {
    for (const l of [left, right]) {
      let p = pos.clone().addScaledVector(r, l).addScaledVector(up, height);
      positions.push(...p.toArray());
      uv.push(l === left ? 0 : 1, i / 5);
      if (colorAt) colors.push(...colorAt(i, l).toArray());
    }
    if (i && !(skip && skip(i))) {
      let k = i * 2;
      indices.push(k - 2, k, k - 1, k, k + 1, k - 1);
    }
  });
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  if (colorAt) {
    g.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    material.vertexColors = true;
  }
  g.setIndex(indices);
  g.computeVertexNormals();
  let mesh = new T.Mesh(g, material);
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
// World-space projection keeps grain consistent across cliffs, shoulders and steep faces.
function terrainMaterial(color, texture, scale = 0.16) {
  let m = surface(color, 0.83, 0.03);
  m.onBeforeCompile = (shader) => {
    shader.uniforms.detailMap = { value: texture };
    shader.uniforms.detailScale = { value: scale };
    shader.vertexShader =
      "varying vec3 detailPosition;varying vec3 detailNormal;\n" +
      shader.vertexShader.replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
 vec4 detailLocal=vec4(transformed,1.);
 #ifdef USE_INSTANCING
 detailLocal=instanceMatrix*detailLocal;
 detailNormal=normalize(mat3(instanceMatrix)*objectNormal);
 #else
 detailNormal=normalize(objectNormal);
 #endif
 detailPosition=(modelMatrix*detailLocal).xyz;`,
      );
    shader.fragmentShader =
      "uniform sampler2D detailMap;uniform float detailScale;varying vec3 detailPosition;varying vec3 detailNormal;\n" +
      shader.fragmentShader.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
 vec3 wt=pow(abs(normalize(detailNormal)),vec3(4.));wt/=max(dot(wt,vec3(1.)),.001);vec3 p=detailPosition*detailScale;
 vec3 grain=texture2D(detailMap,p.yz).rgb*wt.x+texture2D(detailMap,p.xz).rgb*wt.y+texture2D(detailMap,p.xy).rgb*wt.z;
 diffuseColor.rgb*=clamp(grain*2.4+.30,.32,1.45);`,
      );
  };
  return m;
}
export function world(track, path, quality) {
  const loader = new T.TextureLoader(),
    detail = {};
  for (let key of ["sand", "grass", "stone", "road"]) {
    const t = loader.load("materials/" + key + ".webp");
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = 4;
    detail[key] = t;
  }
  const scene = new T.Scene(),
    id = track.id,
    night = [2, 6, 10].includes(id),
    snow = [1, 7].includes(id),
    floating = [8, 11].includes(id);
  scene.background = new T.Color(track.sky);
  scene.fog = new T.FogExp2(track.sky, night ? 0.0045 : 0.003);
  const sky = new T.Mesh(
    new T.SphereGeometry(760, 40, 24),
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      uniforms: {
        base: { value: new T.Color(track.sky) },
        dark: { value: night ? 1 : 0 },
        sun: { value: V(-0.52, 0.43, -0.74).normalize() },
      },
      vertexShader:
        "varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: `varying vec3 dir;uniform vec3 base,sun;uniform float dark;
 float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 void main(){vec3 d=normalize(dir);float h=max(d.y,0.);vec3 c=mix(base*1.18,base*vec3(.47,.68,.96),smoothstep(0.,.92,h));vec2 p=d.xz/(.12+h)*2.;float n=noise(p)*.5+noise(p*2.)*.28+noise(p*4.)*.14+noise(p*8.)*.08;c=mix(c,vec3(1.,.97,.94),smoothstep(.53,.73,n)*smoothstep(.01,.22,h)*(.72-.60*dark));float s=max(dot(d,sun),0.);c+=vec3(1.,.78,.43)*(pow(s,140.)*.55+smoothstep(.9991,.9998,s)*1.8)*(1.-dark);c+=step(.998,hash(floor(d.xy*1100.)))*dark*h;gl_FragColor=vec4(c,1.);
 #include <colorspace_fragment>
 }`,
    }),
  );
  scene.add(
    sky,
    new T.HemisphereLight(
      night ? 0xbfcfff : 0xfffcf1,
      night ? 0x504471 : 0xc4a57b,
      night ? 1.8 : 2.1,
    ),
  );
  let sun = new T.DirectionalLight(night ? 0xadc9ff : 0xffecd1, night ? 2 : 3);
  scene.add(sun, sun.target);
  sun.castShadow = quality > 0;
  sun.shadow.mapSize.setScalar(quality > 1 ? 1024 : 512);
  Object.assign(sun.shadow.camera, {
    left: -29,
    right: 29,
    top: 29,
    bottom: -29,
    near: 1,
    far: 160,
  });
  sun.shadow.bias = -0.00045;
  sun.shadow.normalBias = 0.035;
  const rows = Math.ceil(path.length / 1.8),
    frames = Array.from({ length: rows + 1 }, (_, i) =>
      path.at((i / rows) * path.length),
    );
  const gap = (i) => {
    let d = (i / rows - track.jump) * path.length;
    return d > 1.5 && d < 6.2;
  };
  const tex = asphalt(track, quality),
    road = surface("#ffffff", id === 2 ? 0.24 : 0.79, id === 2 ? 0.36 : 0.05);
  road.map = tex;
  road.bumpMap = tex;
  road.normalMap = loader.load("materials/road-normal.webp");
  road.normalMap.wrapS = road.normalMap.wrapT = T.RepeatWrapping;
  road.normalScale = new T.Vector2(0.29, 0.29);
  road.bumpScale = 0.035;
  road.side = T.DoubleSide;
  ribbon(
    scene,
    frames,
    -7.4,
    7.4,
    0,
    road,
    id === 11
      ? (i, l) =>
          new T.Color().setHSL(((i / rows) * 3 + l * 0.012) % 1, 0.62, 0.65)
      : null,
    gap,
  );
  const alt = Array.from({ length: 40 }, (_, i) =>
    path.route(path.start + ((path.end - path.start) * i) / 39, true),
  );
  ribbon(scene, alt, -3.2, 3.2, 0.024, road);
  for (let side of [-1, 1]) {
    ribbon(
      scene,
      frames,
      side * 7.45,
      side * 8,
      0.025,
      Object.assign(surface("white"), { side: T.DoubleSide }),
      (i) => new T.Color((i >> 1) % 2 ? track.accent : "#fff6df"),
      gap,
    );
    ribbon(
      scene,
      frames,
      side * 6.94,
      side * 7.04,
      0.032,
      Object.assign(surface("#f6edda"), { side: T.DoubleSide }),
      null,
      gap,
    );
  }
  let seed = id * 917 + 112;
  function rnd() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const batches = new Map(),
    dummy = new T.Object3D();
  function put(
    shape,
    color,
    x,
    y,
    z,
    w,
    h,
    d,
    rx = 0,
    ry = 0,
    rz = 0,
    lit = false,
  ) {
    let key = shape + "|" + lit;
    if (!batches.has(key)) batches.set(key, []);
    dummy.position.set(x, y, z);
    dummy.scale.set(w, h, d);
    dummy.rotation.set(rx, ry, rz);
    dummy.updateMatrix();
    batches.get(key).push([dummy.matrix.clone(), new T.Color(color)]);
  }
  function prop(shape, color, p, w, h, d, rx = 0, ry = 0, rz = 0, lit = false) {
    put(shape, color, p.x, p.y, p.z, w, h, d, rx, ry, rz, lit);
  }
  function palm(p, s) {
    for (let j = 0; j < 7; j++)
      put(
        "pole",
        j % 2 ? "#a88b63" : "#876d4b",
        p.x + j * j * 0.028 * s,
        p.y + (j + 0.5) * 1.18 * s,
        p.z,
        (0.48 - j * 0.027) * s,
        1.23 * s,
        (0.48 - j * 0.027) * s,
        0,
        0,
        -j * 0.033,
      );
    for (let k = 0; k < 12; k++)
      put(
        "frond",
        k % 2 ? "#548a3e" : "#326d39",
        p.x + 1.13 * s,
        p.y + 8.35 * s,
        p.z,
        s * 1.3,
        s * 1.3,
        s * 1.3,
        k % 2 ? -0.16 : 0.19,
        k * 2.4,
      );
    for (let j = 0; j < 3; j++)
      put(
        "ball",
        "#936239",
        p.x + (1 + Math.sin(j * 2) * 0.35) * s,
        p.y + 7.95 * s,
        p.z + Math.cos(j * 2) * 0.35 * s,
        0.3 * s,
        0.39 * s,
        0.3 * s,
      );
  }
  function pine(p, s) {
    prop("pole", "#765d49", p, 0.6 * s, 5 * s, 0.6 * s);
    for (let k = 0; k < 3; k++)
      put(
        "cone",
        snow ? (k % 2 ? "#ddebf3" : "#799e9e") : "#397852",
        p.x,
        p.y + (2 + k * 2) * s,
        p.z,
        (3.4 - k * 0.7) * s,
        (6 - k * 0.5) * s,
        (3.4 - k * 0.7) * s,
      );
  }
  function house(p, s) {
    put(
      "box",
      snow ? "#966e52" : "#b17f52",
      p.x,
      p.y + 2 * s,
      p.z,
      5 * s,
      4 * s,
      4 * s,
    );
    put(
      "cone",
      snow ? "#eef8ff" : "#ae5846",
      p.x,
      p.y + 5 * s,
      p.z,
      4.2 * s,
      3 * s,
      4 * s,
      0,
      0.75,
    );
    for (let k of [-1, 1])
      put(
        "box",
        "#ffcf77",
        p.x + k * 1.4 * s,
        p.y + 2 * s,
        p.z + 2.02 * s,
        0.85 * s,
        1.3 * s,
        0.1 * s,
        0,
        0,
        0,
        true,
      );
  }
  function tower(p, s) {
    let ht = (8 + rnd() * 18) * s;
    put("box", "#293451", p.x, p.y + ht / 2, p.z, 6 * s, ht, 6 * s);
    for (let y = 2; y < ht; y += 2.8)
      put(
        "box",
        rnd() > 0.5 ? "#54dcff" : "#e477dc",
        p.x,
        p.y + y,
        p.z,
        6.08 * s,
        0.32,
        6.08 * s,
        0,
        0,
        0,
        true,
      );
  }
  function decor(p, s, k) {
    switch (id) {
      case 0:
      case 9:
        if (id === 9 && k % 3 === 0) house(p, s);
        else palm(p, s);
        break;
      case 1:
      case 7:
        if (k % 6 === 0) house(p, s);
        else pine(p, s);
        break;
      case 2:
        tower(p, s);
        break;
      case 3:
        if (k % 6 === 0) {
          for (let l = 0; l < 5; l++)
            put(
              "box",
              l % 2 ? "#99a076" : "#808467",
              p.x,
              p.y + l * 1.6 * s,
              p.z,
              (11 - l * 1.8) * s,
              2 * s,
              (11 - l * 1.8) * s,
            );
        } else {
          prop("pole", "#725341", p, 1.4 * s, 10 * s, 1.4 * s);
          for (let l = 0; l < 4; l++)
            put(
              "ball",
              l % 2 ? "#35774a" : "#458555",
              p.x + Math.sin(l * 2) * 3 * s,
              p.y + (6 + l) * s,
              p.z + Math.cos(l * 2) * 3 * s,
              4 * s,
              3 * s,
              4 * s,
            );
        }
        break;
      case 4:
      case 6:
        for (let l = 0; l < 4; l++)
          put(
            "rock",
            id === 4
              ? ["#ae5c42", "#cc7952", "#db8a5d", "#e29b70"][l]
              : ["#533a39", "#4c3436", "#75463b", "#4e3639"][l],
            p.x,
            p.y + l * 2.3 * s,
            p.z,
            (5 - l * 0.65) * s,
            2.6 * s,
            (4 - l * 0.55) * s,
            0,
            k * 0.45,
          );
        break;
      case 5:
        prop("pole", "#fff1d5", p, 0.35 * s, 11 * s, 0.35 * s);
        put(
          "ball",
          ["#f477a4", "#91dfe2", "#ffba72"][k % 3],
          p.x,
          p.y + 6 * s,
          p.z,
          3 * s,
          3 * s,
          0.8 * s,
          0,
          k,
        );
        for (let j = 0; j < 3; j++)
          put(
            "ring",
            "#fff4da",
            p.x,
            p.y + 6 * s,
            p.z + 0.7 * s,
            (j + 1) * 0.8 * s,
            (j + 1) * 0.8 * s,
            0.4 * s,
            0,
            k,
          );
        break;
      case 8:
        prop("rock", "#697085", p, 6 * s, 8 * s, 6 * s);
        put("ball", "#81ae63", p.x, p.y + 5 * s, p.z, 6 * s, 2 * s, 6 * s);
        pine(V(p.x, p.y + 7 * s, p.z), s);
        break;
      case 10:
        if (k % 4 === 0) {
          prop("ball", "#d2d8df", p, 5 * s, 4 * s, 5 * s);
          put(
            "pole",
            "#a2acb7",
            p.x,
            p.y + 6 * s,
            p.z,
            0.2 * s,
            8 * s,
            0.2 * s,
          );
          put(
            "ball",
            "#5deeff",
            p.x,
            p.y + 10 * s,
            p.z,
            0.5,
            0.5,
            0.5,
            0,
            0,
            0,
            true,
          );
        } else prop("rock", "#777a83", p, 3 * s, s, 2 * s, 0, k);
        break;
      case 11:
        put(
          "ring",
          ["#ff8eb2", "#ffda85", "#78e8ff"][k % 3],
          p.x,
          p.y + 3 * s,
          p.z,
          5 * s,
          5 * s,
          2 * s,
          0.2,
          k * 0.3,
          0,
          true,
        );
        break;
    }
  }
  // Terrain is built outwards from the road shoulders, leaving open water beneath bridge spans.
  for (let i = 0; i < rows; i += 3) {
    const u = i / rows,
      a = frames[i],
      s = a.pos;
    let bridge = (u > 0.17 && u < 0.3) || (u > 0.72 && u < 0.79) || floating;
    if (!bridge) {
      /* The continuous banks below meet the road at its actual elevation. */
    } else if (i % 9 === 0) {
      for (let side of [-1, 1]) {
        let p = s.clone().addScaledVector(a.right, side * 7.7);
        prop("pole", track.stone, V(p.x, p.y - 8, p.z), 0.65, 16, 0.65);
        prop(
          "ball",
          track.accent,
          V(p.x, p.y + 0.48, p.z),
          0.22,
          0.22,
          0.22,
          0,
          0,
          0,
          night,
        );
        if (!(id === 11 && u < 0.2)) {
          let yaw = Math.atan2(a.f.x, a.f.z);
          prop(
            "box",
            track.stone,
            V(p.x, p.y + 0.47, p.z),
            0.27,
            0.32,
            13,
            0,
            yaw,
          );
        }
      }
    }
    if (i % 6 === 0 && !bridge) {
      const sign = i % 12 ? 1 : -1,
        p = s.clone().addScaledVector(a.right, sign * (17 + rnd() * 13));
      p.y -= 1.4;
      decor(p, 0.73 + rnd() * 0.65, i / 6);
      if ([0, 1, 3, 7, 9].includes(id)) {
        for (let k = 0; k < 4; k++) {
          let b = s.clone().addScaledVector(a.right, sign * (10 + rnd() * 6));
          b.y -= 0.65;
          prop(
            "land",
            snow ? "#d9e9f0" : k % 2 ? "#617e41" : "#4a783e",
            b,
            1 + rnd(),
            0.7 + rnd(),
            1 + rnd(),
            0,
            k,
          );
        }
      }
    }
  }
  // Profiled embankments meet the asphalt and descend into the sea. Breaks expose the piers.
  for (let side of [-1, 1]) {
    let pos = [],
      col = [],
      idx = [];
    for (let i = 0; i <= rows; i++) {
      let u = i / rows,
        f = frames[i],
        bridge = (u > 0.17 && u < 0.3) || (u > 0.72 && u < 0.79) || floating;
      for (let [j, dist] of [7.32, 10, 16, 25, 34, 44].entries()) {
        let wobble = Math.sin(u * 62 + side) * 0.8 + Math.sin(u * 108) * 0.5;
        let b = f.pos
          .clone()
          .addScaledVector(
            f.right,
            side * (dist + (j > 1 ? wobble * j * 0.5 : 0)),
          );
        b.y +=
          [-0.12, -0.34, -0.72, -1.4, -4.3, -12][j] +
          (j > 1 ? wobble * 0.35 : 0);
        if (bridge && j > 0) {
          b = f.pos.clone().addScaledVector(f.right, side * (7.45 + j * 0.13));
          b.y -= 0.8 + j * 0.35;
        }
        pos.push(...b.toArray());
        let color = new T.Color(
          j === 5
            ? track.stone
            : [0, 9].includes(id) && j === 2
              ? "#9ead66"
              : track.ground,
        );
        color.multiplyScalar(
          0.85 +
            0.09 * Math.sin(i * 0.19 + j) +
            0.06 * Math.sin(i * 0.43 + side),
        );
        col.push(...color.toArray());
        if (i && j) {
          let k = i * 6 + j;
          idx.push(k - 7, k - 1, k, k - 7, k, k - 6);
        }
      }
    }
    let geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new T.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    let m = terrainMaterial(
      "#ffffff",
      [0, 4, 9].includes(id)
        ? detail.sand
        : [3, 8].includes(id)
          ? detail.grass
          : detail.stone,
      0.23,
    );
    m.vertexColors = true;
    m.side = T.DoubleSide;
    let bank = new T.Mesh(geo, m);
    bank.receiveShadow = true;
    scene.add(bank);
  }
  // A continuous eroded skyline. The coast opens to sea, alpine peaks carry snow
  // above the timberline, and the desert rim breaks into stratified mesas.
  if (id === 2) {
    for (let k = 0; k < 68; k++) {
      let a = (k / 68) * TAU,
        r = 220 + rnd() * 110;
      tower(V(Math.cos(a) * r, -6, Math.sin(a) * r), 2 + rnd() * 2);
    }
  } else if (!floating) {
    let vertices = [],
      colors = [],
      indices = [],
      rings = 30,
      segments = 256;
    for (let row = 0; row <= rings; row++)
      for (let col = 0; col <= segments; col++) {
        const a = (TAU * col) / segments,
          t = row / rings,
          coast = [0, 9].includes(id),
          phase = id * 0.79;
        const ridge = Math.max(
          0,
          Math.sin(a * 3 + phase) * 0.35 +
            Math.sin(a * 7 + 0.8) * 0.22 +
            Math.sin(a * 13 + phase) * 0.09 +
            0.43,
        );
        const relief =
          (0.76 + 0.24 * Math.cos(a * 29 + phase + Math.sin(a * 11))) * ridge;
        const r = 202 + t * 191 + Math.sin(a * 5 + phase) * 14,
          sweep = Math.sin(t * Math.PI);
        const fold =
          Math.sin(a * 24 + t * 6 + Math.sin(a * 9)) * 0.56 +
          Math.sin(a * 57 - t * 11) * 0.22 +
          Math.sin(a * 97 + t * 15) * 0.12;
        let height =
          -9 +
          sweep * (coast ? 52 : snow ? 105 : id === 10 ? 25 : 76) * relief +
          sweep * fold * (snow ? 13 : 7);
        if (coast) height -= Math.max(0, Math.sin(a * 2 + 1)) * 21;
        if (id === 4) height = Math.round(height / 6) * 6 + sweep * fold * 1.8;
        if (id === 5)
          height += sweep * (6 * Math.sin(a * 16) + 3 * Math.cos(a * 31));
        vertices.push(Math.cos(a) * r, height, Math.sin(a) * r);
        const color = new T.Color(track.stone);
        if (snow)
          color.lerp(
            new T.Color("#eef6ff"),
            Math.max(0, Math.min(1, (height - 23 + fold * 14) / 12)),
          );
        if ([0, 3, 9].includes(id))
          color.lerp(
            new T.Color("#35764e"),
            Math.max(0, Math.min(1, (height - 1) * 0.11 + fold * 0.32)),
          );
        if (id === 4)
          color.lerp(
            new T.Color("#dd9970"),
            0.35 + 0.29 * Math.sin(height * 1.15),
          );
        if (id === 5)
          color.lerp(
            new T.Color("#ffcfce"),
            0.4 + 0.38 * Math.sin(height * 0.1),
          );
        color.multiplyScalar(0.92 + 0.11 * fold);
        colors.push(...color.toArray());
        if (row && col) {
          let i = row * (segments + 1) + col;
          indices.push(
            i - segments - 2,
            i - 1,
            i,
            i - segments - 2,
            i,
            i - segments - 1,
          );
        }
      }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
    geo.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    let material = terrainMaterial("#ffffff", detail.stone, 0.11);
    material.vertexColors = true;
    material.side = T.DoubleSide;
    scene.add(new T.Mesh(geo, material));
  }
  // Signature silhouettes remain recognisable across the circuit.
  if (id === 4) {
    let a = path.at(0.38 * path.length);
    for (let j = 0; j <= 17; j++) {
      let t = (j / 17) * Math.PI,
        b = a.pos.clone().addScaledVector(a.right, Math.cos(t) * 13);
      b.y += Math.sin(t) * 13;
      prop(
        "rock",
        j % 2 ? "#cc7953" : "#ab6046",
        b,
        3.4,
        3.1,
        3.8,
        0,
        j * 0.18,
      );
    }
  }
  if (id === 5) {
    let a = path.at(path.length * 0.26),
      p = a.pos.clone().addScaledVector(a.right, 37);
    for (let j = -1; j <= 1; j++) {
      let x = p.x + j * 8;
      put("pole", "#e89494", x, p.y + 5, p.z, 3.2, 11, 3.2);
      put("cone", "#fbd7a7", x, p.y + 14, p.z, 4.7, 9, 4.7);
      put("ball", "#de4774", x, p.y + 19, p.z, 0.9, 1.0, 0.9);
    }
    put("box", "#efb8a0", p.x, p.y + 4, p.z, 16, 8, 7);
  }
  if (id === 6) {
    let a = path.at(path.length * 0.55),
      p = a.pos.clone().addScaledVector(a.right, 67);
    for (let j = 0; j < 6; j++)
      put(
        "pole",
        j % 2 ? "#633b39" : "#4d3333",
        p.x,
        p.y + j * 5 - 4,
        p.z,
        29 - j * 3.5,
        6,
        29 - j * 3.5,
      );
    put("ball", "#ff6812", p.x, p.y + 24, p.z, 11, 0.9, 11, 0, 0, 0, true);
    for (let j = 0; j < 14; j++)
      put(
        "ball",
        "#ff6e24",
        p.x + j * 1.25,
        p.y + 23 - j * 1.65,
        p.z + j * 0.65,
        1.5,
        2.5,
        1.1,
        0,
        0,
        0.42,
        true,
      );
  }
  if (floating) {
    for (let j = 0; j < 8; j++) {
      let a = path.at((j / 8) * path.length);
      if (j === 0 && id === 11) continue;
      let p = a.pos.clone();
      prop("rock", track.stone, V(p.x, p.y - 9, p.z), 13, 9, 14, 0, j);
      prop(
        "land",
        id === 8 ? "#789d67" : "#d6aed6",
        V(p.x, p.y - 2.1, p.z),
        13,
        2,
        14,
      );
      for (let k = 0; k < 4; k++)
        put(
          "land",
          "#f4eff9",
          p.x + Math.cos(k * 2) * 18,
          p.y - 24 - k,
          p.z + Math.sin(k * 2) * 18,
          12,
          4,
          11,
        );
    }
  }
  if (id === 2) {
    for (let j = 0; j < 6; j++) {
      let a = path.at(path.length * (0.1 + j * 0.14)),
        p = a.pos.clone().addScaledVector(a.right, j % 2 ? 18 : -18);
      let board = new T.Mesh(
        new T.BoxGeometry(10, 3.3, 0.4),
        label(
          ["NEON GP", "NOVA", "MIDNATT"][j % 3],
          "#22243d",
          j % 2 ? "#fa83cf" : "#63e6f2",
        ),
      );
      board.position.copy(p).y += 7;
      board.rotation.y = Math.atan2(a.f.x, a.f.z);
      scene.add(board);
      for (let h = 0; h < 3; h++)
        put(
          "box",
          j % 2 ? "#f452bf" : "#44dcea",
          p.x,
          p.y + 5.5 + h * 1.65,
          p.z,
          10.35,
          0.13,
          0.55,
          0,
          board.rotation.y,
          0,
          true,
        );
    }
  }
  if (id === 9) {
    let p = path.at(path.length * 0.22).pos;
    const x = p.x + 28,
      z = p.z;
    put("ball", "#71412a", x, 2, z, 5, 3, 16);
    for (let j = -1; j <= 1; j++) {
      put("pole", "#69482c", x, 11, z + j * 8, 0.35, 20, 0.35);
      put("ball", "#fff0cf", x, 13, z + j * 8, 0.55, 5, 5, 0.1, 0.4);
    }
  }
  if (id === 10) {
    let globe = canvasTexture(512, (g, n) => {
      g.fillStyle = "#477da5";
      g.fillRect(0, 0, n, n);
      for (let i = 0; i < 600; i++) {
        let x = rnd() * n,
          y = rnd() * n,
          land =
            Math.sin(x * 0.023 + Math.sin(y * 0.047) * 1.4) +
            Math.cos(y * 0.032 + x * 0.011);
        if (land > 0.4 || i % 3 === 0) {
          g.fillStyle =
            land > 0.4
              ? i % 3
                ? "#83a581"
                : "#acaf88"
              : "rgba(236,246,250,.65)";
          g.beginPath();
          g.ellipse(x, y, 5 + rnd() * 24, 2 + rnd() * 8, 0.16, 0, TAU);
          g.fill();
        }
      }
    });
    let earth = new T.Mesh(
      shapes.ball,
      new T.MeshBasicMaterial({ map: globe }),
    );
    earth.scale.setScalar(22);
    earth.position.set(-120, 91, -180);
    scene.add(earth);
  }
  for (let i = 0; i < 10; i++) {
    let a = path.at((0.39 + i * 0.007) * path.length),
      p = a.pos,
      yaw = Math.atan2(a.f.x, a.f.z);
    if ([1, 3, 4, 6, 7, 10, 2, 5].includes(id)) {
      for (let side of [-1, 1]) {
        let b = p.clone().addScaledVector(a.right, side * 9.3);
        prop("rock", track.stone, V(b.x, b.y + 2, b.z), 2.3, 5, 3, 0, yaw);
      }
      prop("rock", track.stone, V(p.x, p.y + 8, p.z), 11, 2.4, 3, 0, yaw);
    }
  }
  const start = path.at(0);
  for (let side of [-1, 1]) {
    let p = start.pos.clone().addScaledVector(start.right, side * 8.4);
    prop("pole", track.accent, V(p.x, p.y + 3, p.z), 0.48, 6, 0.48);
  }
  let arch = new T.Mesh(new T.BoxGeometry(17, 2, 0.6), label("KART  •  GP"));
  arch.position.copy(start.pos).y += 6.3;
  arch.rotation.y = Math.atan2(start.f.x, start.f.z);
  scene.add(arch);
  for (let x = 0; x < 16; x++)
    for (let z = 0; z < 2; z++) {
      let p = start.pos
        .clone()
        .addScaledVector(start.right, (x - 7.5) * 0.9)
        .addScaledVector(start.f, z * 0.87);
      prop(
        "box",
        (x + z) % 2 ? "#252b37" : "#fff9ee",
        p.addScaledVector(start.up, 0.055),
        0.91,
        0.05,
        0.88,
        0,
        arch.rotation.y,
      );
    }
  for (let [key, list] of batches) {
    let [shape, lit] = key.split("|");
    let m = ["rock", "land"].includes(shape)
      ? terrainMaterial(
          "#ffffff",
          shape === "land" ? detail.grass : detail.stone,
          0.13,
        )
      : surface("#ffffff", 0.63, 0.09);
    if (lit === "true") {
      m = new T.MeshBasicMaterial({ color: "white" });
    }
    if (shape === "frond") {
      m.vertexColors = true;
      m.side = T.DoubleSide;
    }
    let mesh = new T.InstancedMesh(
      shape === "ball" ? shapes.land : shapes[shape],
      m,
      list.length,
    );
    list.forEach(([mx, c], i) => {
      mesh.setMatrixAt(i, mx);
      mesh.setColorAt(i, c);
    });
    mesh.receiveShadow = true;
    mesh.castShadow = quality > 1;
    scene.add(mesh);
  }
  const sea = new T.Mesh(
    new T.PlaneGeometry(1200, 1200, 1, 1),
    new T.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        tint: { value: new T.Color(track.water) },
        mist: { value: new T.Color(track.sky) },
        kind: { value: floating ? 1 : id === 10 ? 2 : 0 },
      },
      vertexShader:
        "varying vec3 wp;void main(){vec4 p=modelMatrix*vec4(position,1.);wp=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}",
      fragmentShader: `varying vec3 wp;uniform float time,kind;uniform vec3 tint,mist;void main(){vec2 p=wp.xz;float w=sin(p.x*.71+p.y*.33+time)*.5+sin(p.y*.91-p.x*.15-time*1.3)*.26+sin(p.x*.22+p.y*.65+time)*.24;vec3 eye=normalize(cameraPosition-wp);vec3 normal=normalize(vec3(.13*cos(p.x*.71+p.y*.33+time)+.06*cos(p.x*.22+p.y*.65+time),1.,.12*cos(p.y*.91-p.x*.15-time*1.3)));float fres=pow(1.-max(dot(eye,normal),0.),4.);float shine=pow(max(dot(reflect(-eye,normal),normalize(vec3(-.52,.43,-.74))),0.),76.);vec3 c=mix(tint*(.88+w*.13),mist*.92,fres*.74)+vec3(1.,.88,.67)*shine*1.4;if(kind==1.)c=mix(tint,vec3(1.),.5+.45*sin(p.x*.045+sin(p.y*.05)));if(kind==2.)c=tint*(.75+w*.09);gl_FragColor=vec4(mix(c,mist,clamp(distance(cameraPosition,wp)/500.,0.,.9)),1.);
 #include <colorspace_fragment>
 }`,
    }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = floating ? -27 : -2;
  scene.add(sea);
  const animated = [];
  if ([0, 3, 8].includes(id)) {
    for (let j = 0; j < 3; j++) {
      let f = path.at(path.length * (0.12 + j * 0.24)),
        p = f.pos.clone().addScaledVector(f.right, (j % 2 ? -1 : 1) * 38);
      const h = 19 + j * 3;
      let cliff = new T.Mesh(
        new T.IcosahedronGeometry(1, 2),
        terrainMaterial(track.stone, detail.stone),
      );
      cliff.scale.set(11, h, 9);
      cliff.position.copy(p);
      cliff.position.y -= 2;
      scene.add(cliff);
      let water = new T.Mesh(
        new T.CylinderGeometry(2.8, 3.45, h * 1.9, 16, 1, true),
        new T.ShaderMaterial({
          side: T.DoubleSide,
          uniforms: { time: { value: 0 } },
          vertexShader:
            "varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
          fragmentShader: `varying vec2 v;uniform float time;void main(){float streak=sin(v.x*145.+sin(v.y*18.+time*3.)*.9)*.5+.5;float foam=smoothstep(.6,1.,sin(v.y*53.+time*9.+v.x*12.));gl_FragColor=vec4(mix(vec3(.28,.69,.70),vec3(.9,1.,1.),streak*.6+foam*.36),1.);}`,
        }),
      );
      water.position.copy(p);
      water.position.x += 8.1;
      scene.add(water);
      animated.push(water);
    }
  }
  const weather = new T.BufferGeometry(),
    coords = [];
  for (let i = 0; i < (quality + 1) * 65; i++)
    coords.push((rnd() - 0.5) * 50, rnd() * 32, (rnd() - 0.5) * 50);
  weather.setAttribute("position", new T.Float32BufferAttribute(coords, 3));
  const flakes = new T.Points(
    weather,
    new T.PointsMaterial({
      color: id === 6 ? "#ffb04a" : "#fffafa",
      size: id === 6 ? 0.15 : 0.1,
      transparent: true,
      opacity: 0.82,
    }),
  );
  flakes.visible = snow || id === 6;
  scene.add(flakes);
  return { scene, sun, sky, sea, detail, flakes, animated };
}
