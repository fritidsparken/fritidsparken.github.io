// Blender-authored rigid articulation. Metres, Y up, forward -Z.
// Named pivots are shared by the exported PedalCycle clip and the responsive
// runtime pose below, which synchronizes wheel travel and pedal contacts exactly.
function rider(parent, model, color) {
  const source = DownhillAssets.get("rider");
  if (!source) throw new Error("Cyklistens 3D-modell är inte laddad");
  const group = new T.Group(), rig = source.clone(true);
  parent.add(group); group.add(rig);
  const node = (name) => {
    const found = rig.getObjectByName(name);
    if (!found) throw new Error("Saknad cyklistdel: " + name);
    return found;
  };
  const body = node("Body"), frame = node("Frame"), bars = node("Handlebar");
  const wheels = [node("RearWheel"), node("FrontWheel")];
  const cranks = [node("CrankL"), node("CrankR")];
  const limbs = ["L", "R"].map((s) => ({
    sign: s === "L" ? -1 : 1,
    leg: [node("Thigh" + s), node("Shin" + s), node("Knee" + s), node("Shoe" + s)],
    arm: [node("UpperArm" + s), node("Forearm" + s), node("Hand" + s)],
  }));
  // Preserve eight bike choices with distinct wheelbase, tire width and geometry.
  const variant = [
    [1, 1, 1], [1.12, 1.18, .95], [1.04, .94, 1.04],
    [1.02, 1.1, .88], [1.08, 1.28, .98], [.87, .96, .92],
    [1.06, 1.08, .96], [1.02, .96, 1.02],
  ][model] || [1, 1, 1];
  frame.scale.set(1, variant[2], variant[0]);
  const rear = V(0, .425, .65 * variant[0]);
  const front = V(0, .425, -.72 * variant[0]);
  const handZ = -.52 * variant[0];
  bars.position.set(0, 1.23, handZ);
  const recolored = new Map();
  frame.traverse((o) => {
    if (!o.isMesh) return;
    const list = [].concat(o.material).map((m) => {
      if (m.name !== "FramePaint") return m;
      if (!recolored.has(m)) {
        const own = m.clone(); own.color.set(color);
        own.userData = { ...own.userData, downhillShared: false };
        recolored.set(m, own);
      }
      return recolored.get(m);
    });
    o.material = Array.isArray(o.material) ? list : list[0];
  });
  rig.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const up = V(0, 1, 0), delta = V();
  function segment(o, a, b) {
    o.position.copy(a).lerp(b, .5);
    delta.subVectors(b, a);
    o.scale.set(1, delta.length(), 1);
    o.quaternion.setFromUnitVectors(up, delta.normalize());
  }
  function pose(distance, speed, lean, pitch, compress, phase, trick, pedaling) {
    const spin = trick?.p || 0, type = trick?.type || "";
    const wave = Math.sin(spin * Math.PI), extension = type === "Superman" ? wave : 0;
    rig.rotation.set(
      pitch + (type === "Backflip" ? -1 : type === "Frontflip" ? 1 : 0) * spin * Math.PI * 2,
      type === "360 spin" ? Math.PI * 2 * spin : type === "Whip" ? wave * .94 : 0,
      lean + (type === "Tabletop" ? wave * 1.14 : 0), "YXZ",
    );
    bars.rotation.y = type === "Barspin" ? spin * 2 * Math.PI : lean * .34;
    const travel = compress * .065 + Math.sin(distance * 7.5) * Math.min(.008, speed * .0004);
    rig.position.y = -travel;
    wheels[0].position.copy(rear); wheels[1].position.copy(front);
    wheels.forEach((w) => {
      w.position.y += travel;
      w.rotation.set(-distance / .425, 0, 0);
      w.scale.set(variant[1], 1, 1);
    });
    wheels[1].rotation.y = lean * .20;
    cranks.forEach((p, i) => {
      p.position.set(0, .42, 0);
      p.rotation.set(Math.PI / 2 - phase + (i ? 0 : Math.PI), 0, 0);
    });
    body.position.set(lean * .06, -compress * .10 + extension * .17, pitch * .07 + extension * .40);
    for (const { sign: k, leg, arm } of limbs) {
      const p = phase + (k > 0 ? 0 : Math.PI);
      const hip = V(k * .18, 1.3, .19).add(body.position);
      const foot = V(k * .20, .42 + .15 * Math.sin(p) + extension * .55, .15 * Math.cos(p) + extension * .73);
      const knee = hip.clone().lerp(foot, .5);
      knee.z -= .28 * (1 - extension);
      segment(leg[0], hip, knee); segment(leg[1], knee, foot);
      leg[2].position.copy(knee); leg[2].rotation.set(0, 0, 0); leg[2].scale.setScalar(1);
      leg[3].position.copy(foot); leg[3].rotation.set(-extension * .45, 0, 0); leg[3].scale.setScalar(1);
      const shoulder = V(k * .31, 1.68, -.03).add(body.position);
      const hand = V(k * .34, 1.23, handZ);
      const elbow = shoulder.clone().lerp(hand, .5);
      elbow.x += k * .09; elbow.z += .10;
      segment(arm[0], shoulder, elbow); segment(arm[1], elbow, hand);
      arm[2].position.copy(hand); arm[2].rotation.set(0, 0, 0); arm[2].scale.setScalar(1);
    }
  }
  pose(0, 0, 0, 0, 0, 0, null, false);
  return { group, pose };
}
