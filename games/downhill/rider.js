function rider(parent, model, color) {
  const group = new T.Group(),
    rig = new T.Group(),
    body = new T.Group();
  parent.add(group);
  group.add(rig);
  rig.add(body);
  const frame = standard(color, { roughness: 0.27, metalness: 0.64 }),
    metal = standard(0xbfcbd2, { roughness: 0.27, metalness: 0.82 }),
    rubber = standard(0x202426),
    black = standard(0x293436, { roughness: 0.5, metalness: 0.32 }),
    cloth = standard(0x283848),
    jersey = standard(color, { roughness: 0.79 }),
    visor = standard(0x72bdd6, { roughness: 0.13, metalness: 0.62 }),
    accent = standard(0xffcc58);
  const sphere = new T.SphereGeometry(1, 16, 12),
    cyl = new T.CylinderGeometry(1, 1, 1, 10),
    up = V(0, 1, 0);
  function ball(p, pos, scale, m) {
    let o = mesh(sphere, m, p);
    o.position.copy(pos);
    o.scale.set(...scale);
    return o;
  }
  function fit(o, a, b, rad) {
    o.position.copy(a).lerp(b, 0.5);
    o.scale.set(rad, a.distanceTo(b), rad);
    o.quaternion.setFromUnitVectors(up, V().subVectors(b, a).normalize());
    return o;
  }
  function bar(p, a, b, rad, m) {
    return fit(mesh(cyl, m, p), a, b, rad);
  }
  function ring(p, pos, rad, thick, m) {
    let o = mesh(new T.TorusGeometry(rad, thick, 8, 36), m, p);
    o.position.copy(pos);
    o.rotation.y = Math.PI / 2;
    return o;
  }
  const forkSliders = [];
  // Chainstay, reach and seat-cluster height define each frame silhouette.
  const [stay, reach, top, tube] = [
    [0.65, 0.72, 1.02, 0.06],
    [0.72, 0.86, 0.96, 0.077],
    [0.63, 0.78, 1.08, 0.049],
    [0.67, 0.81, 0.86, 0.073],
    [0.71, 0.8, 1.0, 0.071],
    [0.54, 0.65, 0.77, 0.052],
    [0.7, 0.76, 0.96, 0.066],
    [0.64, 0.83, 0.99, 0.059],
  ][model];
  const rear = V(0, 0.39, stay),
    front = V(0, 0.39, -reach),
    seat = V(0, top, 0.22),
    ax = V(0, 0.37, 0),
    neck = V(0, 0.96, -reach + 0.23),
    steer = V(0, 1.19, -reach + 0.18);
  const bars = mesh(new T.BoxGeometry(0.02, 0.02, 0.02), black, rig),
    wheels = [];
  for (let hub of [rear, front]) {
    let w = new T.Group();
    rig.add(w);
    w.position.copy(hub);
    wheels.push(w);
    ring(w, V(), 0.335, 0.059, rubber);
    ring(w, V(), 0.299, 0.017, metal);
    ring(w, V(0.068, 0, 0), 0.115, 0.012, metal);
    for (let i = 0; i < 24; i++) {
      let a = (i * Math.PI) / 12;
      bar(
        w,
        V((i % 2 ? 1 : -1) * 0.045, 0, 0),
        V(0, Math.sin(a) * 0.298, Math.cos(a) * 0.298),
        0.0038,
        metal,
      );
    }
    // Instanced opposing knobs on the tire carcass.
    const tread = new T.InstancedMesh(
        new T.BoxGeometry(0.045, 0.023, 0.038),
        rubber,
        64,
      ),
      d = new T.Object3D();
    for (let k = 0; k < 64; k++) {
      let a = (k * Math.PI) / 32;
      d.position.set(
        (k % 2 ? 1 : -1) * 0.031,
        0.387 * Math.cos(a),
        0.387 * Math.sin(a),
      );
      d.rotation.x = a;
      d.updateMatrix();
      tread.setMatrixAt(k, d.matrix);
    }
    w.add(tread);
  }
  for (let side of [-1, 1]) {
    let a = rear.clone();
    a.x = 0.09 * side;
    bar(rig, a, ax, 0.031, frame);
    bar(rig, a, seat, 0.026, frame);
    let f = front.clone();
    f.x = 0.09 * side;
    forkSliders.push(bar(rig, f, V(f.x, 0.75, -0.6), 0.036, black));
    bar(rig, V(f.x, 0.74, -0.6), V(f.x, 0.95, -0.5), 0.025, metal);
  }
  bar(rig, ax, seat, 0.047, frame);
  if (model === 1 || model === 3 || model === 4) {
    const elbow = V(0, 0.48, -0.26);
    bar(rig, ax, elbow, tube, frame);
    bar(rig, elbow, neck, tube, frame);
    bar(rig, V(0, 0.75, 0.14), V(0, 0.55, -0.17), 0.029, black);
  } else bar(rig, ax, neck, tube, frame);
  if (model === 1 || model === 7)
    bar(rig, V(-0.115, 0.97, neck.z), V(0.115, 0.97, neck.z), 0.034, black);
  if (model === 6) {
    ball(rig, V(0, 1.22, steer.z - 0.05), [0.079, 0.065, 0.095], black);
    ball(
      rig,
      V(0, 1.22, steer.z - 0.13),
      [0.061, 0.047, 0.022],
      standard(0xfff1b6, { emissive: 0xffd466, emissiveIntensity: 1.5 }),
    );
  }
  if (model === 2 || model === 7) {
    const wrap = standard(0x363b3c, { metalness: 0.44, roughness: 0.33 });
    for (let k = 0; k < 4; k++) {
      let a = ax.clone().lerp(neck, 0.42 + 0.041 * k),
        b = ax.clone().lerp(neck, 0.442 + 0.041 * k);
      bar(rig, a, b, tube + 0.002, wrap);
    }
  }
  if (model === 4) {
    ball(rig, V(0, 0.66, -0.04), [0.044, 0.12, 0.047], accent);
  }
  bar(rig, neck, seat, 0.048, frame);
  bar(rig, neck, steer, 0.027, black);
  bar(rig, seat, V(0, 1.11, 0.25), 0.025, metal);
  ball(rig, V(0, 1.12, 0.25), [0.112, 0.04, 0.165], rubber);
  for (let i = 0; i < (model === 5 ? 0 : 7); i++)
    ring(
      rig,
      V(0, 0.56 + i * 0.022, 0.14 + i * 0.013),
      0.045,
      0.012,
      accent,
    ).rotation.set(Math.PI * 0.34, 0, 0);
  bars.position.copy(steer);
  bar(bars, V(-0.35, 0.025, 0.05), V(0.35, 0.025, 0.05), 0.021, metal);
  for (let side of [-1, 1])
    bar(
      bars,
      V(side * 0.25, 0.025, 0.05),
      V(side * 0.35, 0.025, 0.05),
      0.03,
      rubber,
    );
  const cable = new T.CatmullRomCurve3([
    V(0.25, 1.22, -0.48),
    V(0.2, 1.0, -0.73),
    V(0.11, 0.78, -0.59),
    V(0.09, 0.46, -0.69),
  ]);
  mesh(new T.TubeGeometry(cable, 16, 0.008, 5, false), black, rig);
  ring(rig, V(0.093, 0.37, 0), 0.105, 0.015, metal);
  ring(rig, V(0.093, rear.y, rear.z), 0.067, 0.015, metal);
  for (let dy of [-1, 1])
    bar(
      rig,
      V(0.093, 0.37 + 0.105 * dy, 0),
      V(0.093, rear.y + 0.067 * dy, rear.z),
      0.009,
      black,
    );
  const torso = ball(body, V(0, 1.53, 0.05), [0.26, 0.35, 0.17], jersey);
  torso.rotation.x = -0.49;
  ball(body, V(0, 1.31, 0.2), [0.22, 0.17, 0.18], cloth);
  ball(body, V(0, 1.62, 0.18), [0.194, 0.24, 0.1], black);
  const bib = document.createElement("canvas");
  bib.width = 192;
  bib.height = 240;
  const bc = bib.getContext("2d");
  bc.fillStyle = "#f1ead6";
  bc.fillRect(0, 0, 192, 240);
  bc.fillStyle = "#243331";
  bc.fillRect(0, 0, 192, 48);
  bc.fillStyle = "#f8f4e2";
  bc.textAlign = "center";
  bc.font = "bold 22px sans-serif";
  bc.fillText("TRAIL TEAM", 96, 33);
  bc.fillStyle = "#223432";
  bc.font = "italic bold 110px sans-serif";
  bc.fillText(String(model + 11), 96, 163);
  bc.fillStyle = color;
  bc.fillRect(0, 194, 192, 24);
  let label = new T.CanvasTexture(bib);
  label.colorSpace = T.SRGBColorSpace;
  let plate = mesh(
    new T.PlaneGeometry(0.24, 0.26),
    standard(0xffffff, { map: label }),
    body,
  );
  plate.position.set(0, 1.64, 0.278);
  plate.rotation.x = -0.34;
  for (let side of [-1, 1]) {
    ball(body, V(side * 0.195, 1.7, -0.01), [0.095, 0.092, 0.14], jersey);
    ball(body, V(side * 0.189, 1.707, -0.012), [0.102, 0.045, 0.144], accent);
  }
  const helmet = ball(body, V(0, 1.92, -0.2), [0.195, 0.214, 0.215], frame);
  for (let k of [-1, 1]) {
    let stripe = ball(
      body,
      V(k * 0.095, 1.993, -0.075),
      [0.026, 0.116, 0.12],
      accent,
    );
    stripe.rotation.z = k * 0.28;
  }
  ball(body, V(0, 1.91, -0.376), [0.173, 0.086, 0.079], visor);
  ball(body, V(0, 1.81, -0.34), [0.168, 0.067, 0.14], black);
  ball(body, V(0, 2.034, -0.32), [0.196, 0.031, 0.17], frame);
  for (let k of [-1, 1])
    ball(body, V(0.13 * k, 1.98, -0.12), [0.039, 0.085, 0.13], black);
  const cranks = [];
  for (let k of [-1, 1]) {
    let pivot = new T.Group();
    pivot.position.copy(ax);
    rig.add(pivot);
    bar(pivot, V(k * 0.1, 0, 0), V(k * 0.12, 0.14, 0), 0.012, black);
    let pedal = mesh(new T.BoxGeometry(0.105, 0.024, 0.077), black, pivot);
    pedal.position.set(k * 0.15, 0.14, 0);
    cranks.push(pivot);
  }
  const limbs = [];
  for (let sign of [-1, 1]) {
    const limb = () => mesh(sphere, cloth, rig);
    let leg = [limb(), limb(), limb(), limb()],
      arm = [limb(), limb(), limb()];
    leg[3].material = black;
    leg[2].material = black;
    arm[0].material = jersey;
    arm[2].material = black;
    limbs.push({ sign, leg, arm });
  }
  function segment(o, a, b, r) {
    fit(o, a, b, r);
    o.scale.y *= 0.59;
  }
  function pose(
    distance,
    speed,
    lean,
    pitch,
    compress,
    phase,
    trick,
    pedaling,
  ) {
    let spin = trick?.p || 0,
      type = trick?.type || "",
      wave = Math.sin(spin * Math.PI),
      extension = type === "Superman" ? wave : 0;
    rig.rotation.set(
      pitch +
        (type === "Backflip" ? -1 : type === "Frontflip" ? 1 : 0) *
          spin *
          Math.PI *
          2,
      type === "360 spin"
        ? Math.PI * 2 * spin
        : type === "Whip"
          ? wave * 0.94
          : 0,
      lean + (type === "Tabletop" ? wave * 1.14 : 0),
      "YXZ",
    );
    bars.rotation.y = type === "Barspin" ? spin * 2 * Math.PI : lean * 0.34;
    wheels.forEach((w) => (w.rotation.x = -distance / 0.39));
    cranks.forEach(
      (p, i) => (p.rotation.x = Math.PI / 2 - phase + i * Math.PI),
    );
    let travel =
      compress * 0.085 +
      Math.sin(distance * 7.5) * Math.min(0.014, speed * 0.00065);
    rig.position.y = -travel;
    wheels[0].position.y = rear.y + travel;
    wheels[1].position.y = front.y + travel;
    for (let i = 0; i < 2; i++) {
      let side = i ? 1 : -1;
      fit(
        forkSliders[i],
        V(side * 0.09, front.y + travel, front.z),
        V(side * 0.09, 0.75, -0.6),
        0.036,
      );
    }
    body.position.set(
      lean * 0.09,
      -compress * 0.13 + extension * 0.2,
      pitch * 0.12 + extension * 0.45,
    );
    for (let { sign: k, leg, arm } of limbs) {
      let p = phase + (k > 0 ? 0 : Math.PI),
        hip = V(k * 0.13, 1.33, 0.19).add(body.position),
        foot = V(
          k * 0.15,
          0.39 + 0.14 * Math.sin(p) + extension * 0.55,
          0.1 + 0.14 * Math.cos(p) + extension * 0.73,
        );
      let knee = hip.clone().lerp(foot, 0.5);
      knee.z -= 0.25 * (1 - extension);
      knee.y += 0.025;
      segment(leg[0], hip, knee, 0.105);
      segment(leg[1], knee, foot, 0.075);
      leg[2].position.copy(knee);
      leg[2].scale.set(0.092, 0.1, 0.095);
      leg[3].position.copy(foot);
      leg[3].scale.set(0.075, 0.057, 0.135);
      let shoulder = V(k * 0.225, 1.7, -0.04).add(body.position),
        hand = V(k * 0.31, 1.215, -0.49),
        elbow = shoulder.clone().lerp(hand, 0.51);
      elbow.x += k * 0.115;
      elbow.z += 0.12;
      segment(arm[0], shoulder, elbow, 0.079);
      segment(arm[1], elbow, hand, 0.064);
      arm[2].position.copy(hand);
      arm[2].scale.set(0.068, 0.064, 0.085);
    }
  }
  pose(0, 0, 0, 0, 0, 0, null, false);
  return { group, pose };
}
