import { shapes, surface, label } from "./world.js";
const T = THREE;
// A rounded moulded racing nose, lofted across a sequence of cross-sections.
function fairingGeometry() {
  let p = [],
    idx = [];
  const stations = [
    [-1, 0.06, 0.09],
    [-0.89, 0.53, 0.5],
    [-0.6, 0.89, 0.85],
    [-0.12, 1, 1],
    [0.38, 0.83, 0.82],
    [0.8, 0.61, 0.58],
    [0.96, 0.42, 0.38],
    [1, 0.08, 0.08],
  ];
  for (let [j, [z, w, h]] of stations.entries())
    for (let i = 0; i <= 28; i++) {
      let a = (i / 28) * Math.PI * 2,
        c = Math.cos(a),
        s = Math.sin(a);
      p.push(
        Math.sign(c) * Math.abs(c) ** 0.68 * w,
        Math.sign(s) * Math.abs(s) ** 0.73 * h,
        z,
      );
      if (j && i) {
        let k = j * 29 + i;
        idx.push(k - 30, k - 29, k, k - 30, k, k - 1);
      }
    }
  let g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(p, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
shapes.fairing = fairingGeometry();
const shadowTex = (() => {
  let c = document.createElement("canvas");
  c.width = c.height = 64;
  let g = c.getContext("2d"),
    v = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  v.addColorStop(0, "rgba(0,0,0,.64)");
  v.addColorStop(1, "transparent");
  g.fillStyle = v;
  g.fillRect(0, 0, 64, 64);
  return new T.CanvasTexture(c);
})();
export function model(id, driver, color) {
  let root = new T.Group(),
    body = new T.Group();
  root.add(body);
  let paint = surface(color, 0.24, 0.47),
    dark = surface("#242733", 0.57, 0.24),
    metal = surface("#bdcbd2", 0.24, 0.78),
    rubber = surface("#22242a", 0.91),
    trim = surface("#fff3d4", 0.32, 0.25),
    black = surface("#15202d", 0.24, 0.48),
    lamp = surface("#ff392b", 0.25, 0.3, 0.7);
  const wheel = [],
    arm = [],
    batches = new Map(),
    obj = new T.Object3D();
  function part(
    shape,
    mat,
    x,
    y,
    z,
    w,
    h,
    d,
    rx = 0,
    ry = 0,
    rz = 0,
    parent = body,
  ) {
    obj.position.set(x, y, z);
    obj.rotation.set(rx, ry, rz);
    obj.scale.set(w, h, d);
    obj.updateMatrix();
    let key = shape + "-" + mat.uuid + "-" + parent.uuid;
    if (!batches.has(key)) batches.set(key, { shape, mat, parent, parts: [] });
    batches.get(key).parts.push(obj.matrix.clone());
  }
  const length = [1, 1.16, 1.05, 1.04, 1.11, 0.85, 1.08, 1.11][id],
    wide = id === 3 ? 1.14 : 1;
  part("ball", dark, 0, 0.38, 0, 1.03 * wide, 0.23, 1.48 * length);
  part("fairing", paint, 0, 0.62, 0.81, 0.9 * wide, 0.35, 1.06 * length);
  part("fairing", trim, 0, 0.91, 0.88, 0.14, 0.05, 0.65 * length);
  for (let s of [-1, 1]) {
    part(
      "fairing",
      paint,
      s * 0.94 * wide,
      0.55,
      -0.05,
      0.28,
      0.25,
      1.03 * length,
    );
    part("ball", metal, s * 0.9, 0.37, 0.12, 0.085, 0.085, 1.1);
    part("ball", lamp, s * 0.64, 0.71, -1.35, 0.22, 0.08, 0.08);
    part("ball", trim, s * 0.62, 0.72, 1.45, 0.18, 0.08, 0.12);
  }
  part("ball", paint, 0, 0.65, -1.12, 1.02, 0.22, 0.43);
  part("ball", dark, 0, 0.76, -0.26, 0.55, 0.32, 0.59);
  part("ball", dark, 0, 1.02, -0.69, 0.55, 0.62, 0.17, -0.18);
  for (let s of [-1, 1])
    for (let e of [-1, 1]) {
      let hub = new T.Group();
      hub.position.set(
        s * 1.03 * wide,
        id === 3 ? 0.49 : 0.43,
        e * 1.0 * length,
      );
      body.add(hub);
      wheel.push(hub);
      let radius = id === 3 ? 0.54 : 0.45;
      part(
        "pole",
        rubber,
        0,
        0,
        0,
        radius,
        0.43,
        radius,
        0,
        0,
        Math.PI / 2,
        hub,
      );
      part(
        "pole",
        metal,
        s * 0.21,
        0,
        0,
        0.29,
        0.04,
        0.29,
        0,
        0,
        Math.PI / 2,
        hub,
      );
      for (let j = 0; j < 5; j++)
        part(
          "ball",
          dark,
          s * 0.24,
          0.15 * Math.cos(j * 1.257),
          0.15 * Math.sin(j * 1.257),
          0.025,
          0.08,
          0.058,
          j * 1.257,
          0,
          0,
          hub,
        );
      for (let j = 0; j < 3; j++)
        part(
          "ring",
          rubber,
          (j - 1) * 0.12,
          0,
          0,
          radius * 0.94,
          radius * 0.94,
          0.24,
          0,
          Math.PI / 2,
          0,
          hub,
        );
    }
  part("pole", metal, 0.66, 0.83, -1.22, 0.14, 0.74, 0.14, 1.25);
  part("ball", black, 0.66, 0.96, -1.57, 0.112, 0.105, 0.04);
  for (let j = 0; j < 5; j++)
    part("box", metal, 0.54, 0.73 + j * 0.067, -0.78, 0.45, 0.03, 0.47);
  if ([1, 2, 4, 6, 7].includes(id)) {
    for (let s of [-1, 1])
      part("pole", dark, s * 0.58, 0.98, -1.3, 0.065, 0.5, 0.065);
    part(
      "ball",
      id === 7 ? surface("#ffcf62", 0.21, 0.72) : paint,
      0,
      1.21,
      -1.35,
      1.18,
      0.085,
      0.28,
    );
  }
  part("ring", black, 0, 1.13, 0.36, 0.35, 0.35, 0.42, -0.68);
  part("pole", metal, 0, 0.9, 0.4, 0.055, 0.49, 0.055, 0.43);
  const suit = surface(
      [
        "#203652",
        "#a33452",
        "#533990",
        "#277b78",
        "#a95e24",
        "#46644c",
        "#3554a4",
        "#72547c",
      ][driver],
    ),
    skin = surface(
      [
        "#e8ae83",
        "#9b6550",
        "#edc49c",
        "#bf845d",
        "#db936a",
        "#865848",
        "#d3a080",
        "#f2be95",
      ][driver],
      0.7,
    );
  let head = new T.Group();
  head.position.set(0, 1.67, -0.26);
  body.add(head);
  part("ball", suit, 0, 1.16, -0.26, 0.4, 0.46, 0.34);
  part("ball", trim, 0, 1.2, 0.02, 0.07, 0.35, 0.035);
  part("ball", paint, 0, 0.11, 0, 0.5, 0.52, 0.48, 0, 0, 0, head);
  part("ball", skin, 0, 0.035, 0.23, 0.405, 0.34, 0.3, 0, 0, 0, head);
  part("ball", paint, 0, -0.15, 0.31, 0.43, 0.14, 0.23, 0, 0, 0, head);
  part("ball", trim, 0, 0.55, 0, 0.09, 0.06, 0.3, 0, 0, 0, head);
  for (let s of [-1, 1]) {
    part(
      "ball",
      black,
      s * 0.145,
      0.105,
      0.497,
      0.045,
      0.061,
      0.035,
      0,
      0,
      0,
      head,
    );
    part(
      "ball",
      trim,
      s * 0.15,
      0.12,
      0.523,
      0.013,
      0.013,
      0.013,
      0,
      0,
      0,
      head,
    );
    part("ball", suit, s * 0.37, 1.22, 0.06, 0.14, 0.15, 0.33, -0.28);
    part("ball", trim, s * 0.27, 1.16, 0.32, 0.14, 0.13, 0.15);
  }
  if (driver % 2 === 0)
    for (let s of [-1, 1])
      part(
        "ball",
        trim,
        s * 0.29,
        0.47,
        0,
        0.1,
        0.16,
        0.11,
        0,
        0,
        -s * 0.3,
        head,
      );
  // Helmet piping and ear guards read in both the chase camera and the garage.
  for (let s of [-1, 1]) {
    part("ball", dark, s * 0.45, 0.07, -0.02, 0.08, 0.19, 0.18, 0, 0, 0, head);
    part("ball", metal, s * 0.5, 0.07, -0.02, 0.028, 0.1, 0.1, 0, 0, 0, head);
    part(
      "ball",
      trim,
      s * 0.16,
      0.36,
      -0.27,
      0.041,
      0.16,
      0.17,
      -0.5,
      0,
      0,
      head,
    );
    part(
      "pole",
      metal,
      s * 0.77,
      0.45,
      0.81,
      0.045,
      0.57,
      0.045,
      0.62,
      0,
      -s * 0.77,
    );
    for (let j = 0; j < 4; j++)
      part(
        "ring",
        black,
        s * 0.79,
        0.42 + j * 0.057,
        0.77,
        0.098,
        0.098,
        0.09,
        Math.PI / 2,
        0,
        0,
      );
    part("ball", dark, s * 0.84, 0.63, 0.35, 0.12, 0.1, 0.31);
  }
  const number = new T.Mesh(
    new T.PlaneGeometry(0.48, 0.36),
    label(String(driver + 1), "#203045", "#fff4c9"),
  );
  number.rotation.x = -Math.PI * 0.42;
  number.position.set(0, 0.98, 0.77);
  body.add(number);
  for (let { shape, mat, parent, parts } of batches.values()) {
    let m = new T.InstancedMesh(shapes[shape], mat, parts.length);
    parts.forEach((p, i) => m.setMatrixAt(i, p));
    m.castShadow = true;
    parent.add(m);
  }
  let sh = new T.Mesh(
    new T.PlaneGeometry(4.3, 5),
    new T.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
  );
  sh.rotation.x = -Math.PI / 2;
  sh.position.y = 0.045;
  root.add(sh);
  return { root, body, head, wheel, lamp, shadow: sh };
}
