const T = THREE,
  V = (x, y, z) => new T.Vector3(x, y, z),
  wrap = (x) => ((x % 1) + 1) % 1;
export function makePath(track) {
  const p = track.points.map((a) => V(...a)),
    curve = new T.CatmullRomCurve3(p, true);
  let line = curve.getSpacedPoints(700);
  if (track.id === 11) {
    // Replace part of the starting straight by an actual vertical loop with an offset exit.
    const end = line.findIndex((v) => v.z > 79),
      loop = [];
    for (let j = 0; j <= 120; j++) {
      let t = j / 120,
        a = t * Math.PI * 2;
      loop.push(
        V(
          5 * Math.sin(Math.PI * t) ** 2,
          30 + 19 * (1 - Math.cos(a)),
          17 + 19 * Math.sin(a) + 25 * t,
        ),
      );
    }
    line = [
      V(0, 30, 0),
      V(0, 30, 9),
      ...loop,
      V(0, 30, 59),
      ...line.slice(end),
    ];
  }
  // In the final sector the road winds around a horizontal axis with a banked full turn.
  if (track.id === 11) {
    const original = line.map((p) => p.clone()),
      begin = Math.floor(line.length * 0.64),
      end = Math.floor(line.length * 0.79);
    for (let i = begin; i <= end; i++) {
      let t = (i - begin) / (end - begin),
        w = Math.sin(Math.PI * t) ** 2,
        f = original[Math.min(i + 1, line.length - 1)]
          .clone()
          .sub(original[Math.max(0, i - 1)])
          .normalize();
      line[i].addScaledVector(
        V(f.z, 0, -f.x).normalize(),
        Math.sin(t * Math.PI * 2) * 9 * w,
      );
      line[i].y += (1 - Math.cos(t * Math.PI * 2)) * 5 * w;
    }
  }
  const lengths = [0];
  for (let i = 1; i < line.length; i++)
    lengths.push(lengths[i - 1] + line[i].distanceTo(line[i - 1]));
  const length = lengths.at(-1),
    n = Math.ceil(length * 1.6),
    samples = [];
  let j = 1;
  for (let i = 0; i < n; i++) {
    const d = (i * length) / n;
    while (lengths[j] < d) j++;
    samples.push(
      line[j - 1]
        .clone()
        .lerp(line[j], (d - lengths[j - 1]) / (lengths[j] - lengths[j - 1])),
    );
  }
  const frames = samples.map((pos, i) => {
    const f = samples[(i + 1) % n]
      .clone()
      .sub(samples[(i - 1 + n) % n])
      .normalize();
    const inLoop =
      track.id === 11 &&
      (i * length) / n > 15 &&
      (i * length) / n < 165 &&
      pos.z < 60 &&
      pos.z > -5;
    let right = inLoop ? V(1, 0, 0) : V(f.z, 0, -f.x).normalize();
    right.addScaledVector(f, -right.dot(f)).normalize();
    const u = i / n;
    if (track.id === 11 && u > 0.65 && u < 0.8) {
      let t = (u - 0.65) / 0.15;
      right.applyAxisAngle(f, t * t * (3 - 2 * t) * Math.PI * 2);
    }
    return { pos, f, right, up: f.clone().cross(right).normalize() };
  });
  function at(d) {
    let k = wrap(d / length) * n,
      i = Math.floor(k),
      a = frames[i],
      b = frames[(i + 1) % n],
      t = k - i;
    return {
      pos: a.pos.clone().lerp(b.pos, t),
      f: a.f.clone().lerp(b.f, t).normalize(),
      right: a.right.clone().lerp(b.right, t).normalize(),
      up: a.up.clone().lerp(b.up, t).normalize(),
    };
  }
  const span = length * 0.12;
  let start = track.shortcut * length,
    best = 0;
  for (let j = -5; j <= 5; j++) {
    let candidate = (track.shortcut + j * 0.012) * length,
      a = at(candidate),
      b = at(candidate + span);
    let ratio = span / a.pos.distanceTo(b.pos);
    if (ratio > best) {
      best = ratio;
      start = candidate;
    }
  }
  const end = start + span,
    a = at(start),
    b = at(end);
  a.pos.addScaledVector(a.right, 4);
  b.pos.addScaledVector(b.right, 4);
  const mid = a.pos.clone().lerp(b.pos, 0.5).addScaledVector(a.right, 3);
  const branch = new T.QuadraticBezierCurve3(a.pos, mid, b.pos);
  function route(d, alt) {
    const s = wrap(d / length) * length;
    if (!alt || s < start || s > end) return at(d);
    const t = (s - start) / (end - start),
      pos = branch.getPointAt(t),
      f = branch.getTangentAt(t),
      right = V(f.z, 0, -f.x).normalize();
    return { pos, f, right, up: f.clone().cross(right).normalize() };
  }
  return {
    length,
    at,
    route,
    start,
    end,
    branchLength: branch.getLength(),
    width: 7.4,
  };
}
