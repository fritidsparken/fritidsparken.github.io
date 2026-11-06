"use strict";
const $ = (id) => document.getElementById(id),
  modes = [
    "Tävla mot banans måltid.",
    "Samla poäng och landa dina kombinationer.",
    "Slå din bästa tid på banan.",
    "Öva i din egen takt. Tiden räknas inte.",
  ],
  tricks = [
    "Whip",
    "Tabletop",
    "Barspin",
    "Superman",
    "Backflip",
    "Frontflip",
    "360 spin",
  ];
let renderer,
  scene,
  cam,
  env,
  mount,
  c,
  state,
  run,
  view = 0,
  toastTime = 0,
  frame = 0,
  previous = 0,
  acc = 0,
  record = {},
  footage = [],
  ghost,
  ghostData = [],
  aim,
  soft = 0,
  previousRun,
  jumpBuffer = 0,
  cameraSnap = false,
  loading = false,
  slowTime = 0,
  shadowTime = 0,
  hudTime = 0;
const FIXED_STEP = 1 / 90;
const samples = [];
const settings = { quality: "medium", music: true, effects: true };
try {
  const saved = JSON.parse(localStorage.getItem("fp-downhill-settings-v1") || "{}");
  if (["low", "medium", "high"].includes(saved?.quality)) settings.quality = saved.quality;
  for (const key of ["music", "effects"])
    if (typeof saved?.[key] === "boolean") settings[key] = saved[key];
} catch {}
function saveSettings() {
  try { localStorage.setItem("fp-downhill-settings-v1", JSON.stringify(settings)); } catch {}
  sound.configure(settings);
  document.querySelectorAll("[data-audio]").forEach(button => {
    const key = button.dataset.audio;
    button.textContent = (key === "music" ? "Musik" : "Ljudeffekter") + (settings[key] ? " på" : " av");
    button.setAttribute("aria-pressed", String(settings[key]));
  });
}
function qualitySettings() {
  return { low: [0.9, 700000, false], medium: [1.4, 1500000, true], high: [1.8, 2400000, true] }[settings.quality];
}
// Read-only measurements for QA; no frame-rate claim is inferred from the preset.
window.downhillDiagnostics = () => {
  const sorted = samples.slice().sort((a, b) => a - b);
  return { quality: settings.quality, adaptive: !!soft, frames: sorted.length,
    medianMs: sorted[Math.floor(sorted.length * .5)] || 0,
    p95Ms: sorted[Math.floor(sorted.length * .95)] || 0,
    calls: renderer?.info.render.calls || 0, triangles: renderer?.info.render.triangles || 0,
    geometries: renderer?.info.memory.geometries || 0, textures: renderer?.info.memory.textures || 0 };
};
try {
  const saved = JSON.parse(localStorage.getItem("fp-downhill-v1") || "{}");
  if (saved && typeof saved === "object" && !Array.isArray(saved)) record = saved;
} catch {}
const input = new Set(),
  held = new Map();
layouts.forEach((l, i) =>
  $("tracks").add(new Option(String(i + 1).padStart(2, "0") + " · " + l[0], i)),
);
bikes.forEach((b, i) => $("bikes").add(new Option(b[0], i)));
function preview() {
  c = course(+$("tracks").value);
  $("name").textContent = c.name;
  $("summary").textContent =
    c.tag +
    "  ·  " +
    Math.round(c.len) +
    " m  ·  " +
    c.surface +
    "  ·  " +
    (c.night ? "Kväll / natt" : "Dag");
  $("number").textContent =
    "LED " + String(c.index + 1).padStart(2, "0") + " / " + layouts.length;
  $("credit").textContent =
    "BANREFERENS  /  " + String(c.id + 1).padStart(2, "0");
  document.querySelector(".cover").style.backgroundImage =
    "url(ref/" + (c.id + 1) + ".webp)";
  let best = record[saveKey(c, $("mode").selectedIndex)];
  $("modeHint").textContent =
    modes[$("mode").selectedIndex] +
    (best
      ? "  Rekord " + (best.time ? fmt(best.time) : best.score + " p") + "."
      : "");
}
$("tracks").onchange = $("mode").onchange = preview;
preview();
const qualityLabel = document.createElement("label");
qualityLabel.textContent = "Grafik";
const qualitySelect = document.createElement("select");
qualitySelect.id = "quality";
for (const [value, label] of [["low", "Low · Snabb"], ["medium", "Medium · Balanserad"], ["high", "High · Detaljerad"]])
  qualitySelect.add(new Option(label, value));
qualitySelect.value = settings.quality;
qualitySelect.onchange = () => { settings.quality = qualitySelect.value; soft = 0; saveSettings(); resize(); };
qualityLabel.append(qualitySelect);
document.querySelector(".options").append(qualityLabel);
for (const [key, label] of [["music", "Musik"], ["effects", "Ljudeffekter"]]) {
  const button = document.createElement("button");
  button.className = "audio-option";
  button.dataset.audio = key;
  const refresh = () => { button.textContent = label + (settings[key] ? " på" : " av"); button.setAttribute("aria-pressed", String(settings[key])); };
  button.onclick = () => { settings[key] = !settings[key]; saveSettings(); refresh(); };
  refresh();
  document.querySelector(".actions").append(button);
}
sound.configure(settings);
if (document.documentElement.requestFullscreen) {
  const button = document.createElement("button");
  button.id = "fullscreen";
  button.textContent = "⛶";
  button.setAttribute("aria-label", "Växla fullskärm");
  button.onclick = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { toast("Fullskärm stöds inte i det här läget."); }
  };
  $("hud").insertBefore(button, $("pause"));
}
// Legacy short-route records stay intact; their times/ghosts are not comparable.
function saveKey(track, mode) { return "long-v2:" + track.id + "-" + mode; }
function fmt(t) {
  return Math.floor(t / 60) + ":" + (t % 60).toFixed(1).padStart(4, "0");
}
function dialog(title, msg, buttons) {
  $("title").textContent = title;
  $("message").textContent = msg;
  $("choices").replaceChildren();
  buttons.forEach(([label, fn]) => {
    let b = document.createElement("button");
    b.textContent = label;
    b.onclick = () => {
      $("panel").close();
      fn();
    };
    $("choices").append(b);
  });
  if (!$("panel").open) $("panel").showModal();
}
$("help").onclick = () =>
  dialog(
    "Så spelar du",
    "Trampa med ↑ eller W. Bromsa med ↓ eller S. Styr med ← → eller A och D. På mobilen styr du med spaken. Dra uppåt för fart och nedåt för broms. Du kan hoppa och göra trick med andra tummen.\n\nHoppa med mellanslag. Ramper ger automatiska hopp. I luften gör T nästa trick. Med 1–7 väljer du trick direkt. Avsluta tricket innan hjulen tar mark. I luften behåller du riktningen från avstampet: vänster/höger finjusterar kursen och upp/ned justerar nosen. Bromsa inför skarpa svängar och sikta på landningen. Varierade trick ger mer poäng än upprepningar.\n\nC byter kamera. Esc pausar. Vid en vurpa börjar du vid senaste kontrollpunkten.",
    [["Tillbaka", () => {}]],
  );
function toast(msg, d = 1.6) {
  $("toast").textContent = msg;
  toastTime = d;
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) $("toast").animate?.(
    [
      { opacity: 0.15, scale: ".9" },
      { opacity: 1, scale: "1" },
    ],
    { duration: 160 },
  );
}
const stick = createRideStick(document.querySelector(".ride-stick"));
function clearInput() {
  stick.reset();
  jumpBuffer = 0;
  input.clear();
  held.clear();
  document.querySelectorAll(".on").forEach((b) => b.classList.remove("on"));
}
function dispose() {
  cancelAnimationFrame(frame);
  if (scene) {
    const gs = new Set(),
      ms = new Set(),
      tx = new Set();
    scene.traverse((o) => {
      if (o.geometry && !o.geometry.userData?.downhillShared) gs.add(o.geometry);
      if (o.material)
        for (let m of [].concat(o.material)) {
          if (m.userData?.downhillShared) continue;
          ms.add(m);
          Object.values(m).forEach((x) => {
            if (x?.isTexture && !x.userData?.downhillShared) tx.add(x);
          });
        }
      o.shadow?.map?.dispose();
      if (o.isInstancedMesh) o.dispose();
    });
    gs.forEach((g) => g.dispose());
    ms.forEach((m) => m.dispose());
    tx.forEach((t) => t.dispose());
    scene.environment?.dispose();
  }
  scene = null;
}
function leave() {
  dispose();
  state = "menu";
  $("stage").hidden = true;
  $("lobby").hidden = false;
  $("lobby").style.display = "";
  clearInput();
  sound.quiet();
  preview();
}
async function start() {
  if (loading) return;
  loading = true;
  const startButton = $("start");
  startButton.disabled = true;
  startButton.textContent = "Laddar 3D-världen…";
  // Resume audio during the user gesture, before the asynchronous model download.
  sound.init();
  sound.quiet();
  try { await window.DownhillAssets.load(); }
  catch (error) {
    console.error("Downhill assets could not load", error);
    dialog("Modellerna kunde inte laddas", "Kontrollera anslutningen och försök igen.", [["Försök igen", start], ["Tillbaka", leave]]);
    return;
  } finally {
    loading = false;
    startButton.disabled = false;
    startButton.textContent = "▶  Starta åket";
  }
  dispose();
  clearInput();
  c = course(+$("tracks").value);
  try {
    if (!renderer) {
      renderer = new T.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ReinhardToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      $("viewport").append(renderer.domElement);
    }
  } catch {
    dialog(
      "3D kunde inte starta",
      "Webbläsaren behöver WebGL för att visa Downhill.",
      [["Tillbaka", leave]],
    );
    return;
  }
  $("lobby").style.display = "none";
  $("stage").hidden = false;
  scene = new T.Scene();
  cam = new T.PerspectiveCamera(63, 1, 0.08, 620);
  env = world(scene, c);
  mount = rider(scene, +$("bikes").value, $("color").value);
  run = {
    s: 0,
    l: 0,
    side: 0,
    v: 5,
    y: c.height(0),
    vy: 0,
    air: false,
    t: 0,
    score: 0,
    chain: 0,
    trick: null,
    next: 0,
    checkpoint: 0,
    crashes: 0,
    phase: 0,
    compression: 0,
    dist: 0,
    lean: 0,
    airStart: 0,
    lock: 0,
    clean: 0,
    mode: $("mode").selectedIndex,
    b: bikes[+$("bikes").value],
    pitch: 0,
    airX: 0, airZ: 0, airVX: 0, airVZ: 0, airYaw: 0, airTilt: 0, airTime: 0,
    trickCounts: {}, groundYaw: trailYaw(0),
  };
  footage = [];
  const savedGhost = run.mode === 2 ? record[saveKey(c, 2)]?.ghost : null;
  ghostData = Array.isArray(savedGhost) && savedGhost.every(p => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite)) ? savedGhost : [];
  ghost = null;
  if (ghostData.length) {
    ghost = new T.Group();
    scene.add(ghost);
    let m = new T.MeshBasicMaterial({
      color: 0x63ffe4,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    });
    for (let z of [-0.7, 0.7]) {
      let o = mesh(new T.TorusGeometry(0.35, 0.045, 6, 20), m, ghost);
      o.position.set(0, 0.4, z);
      o.rotation.y = Math.PI / 2;
    }
    let o = mesh(new T.CapsuleGeometry(0.2, 0.62, 4, 8), m, ghost);
    o.position.set(0, 1.42, 0);
    o.rotation.x = -0.35;
  }
  renderer.shadowMap.autoUpdate = true;
  state = "ride";
  view = 0;
  previous = 0;
  soft = 0;
  slowTime = shadowTime = hudTime = 0;
  samples.length = 0;
  previousRun = { ...run };
  acc = 0;
  aim = V();
  resize();
  sound.init();
  let best = record[saveKey(c, run.mode)];
  $("raceGoal").textContent =
    run.mode === 0
      ? "Måltid " + fmt(c.target)
      : run.mode === 2
        ? best
          ? "Spöktid " + fmt(best.time)
          : "Sätt din första spöktid"
        : run.mode === 1
          ? best
            ? "Rekord " + best.score + " p"
            : "Landa trick för poäng"
          : "Utforska fritt";
  toast(matchMedia("(pointer: coarse)").matches ? "Spak uppåt: fart · Nedåt: broms" : c.name + " · Kör!", 3);
  renderRide(1, true);
  frame = requestAnimationFrame(loop);
}
$("start").onclick = start;
function resize() {
  if (!renderer || !cam) return;
  let w = innerWidth,
    h = innerHeight;
  const [ratio, pixels, shadows] = qualitySettings();
  renderer.shadowMap.enabled = shadows;
  renderer.setPixelRatio(Math.min(devicePixelRatio, soft ? 0.85 : ratio,
    Math.sqrt((soft ? 640000 : pixels) / (w * h))));
  renderer.setSize(w, h, false);
  cam.aspect = w / h;
  cam.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
const GRAVITY = 22;
const TRICK_SPECS = [
  {duration: .24, points: 90}, {duration: .3, points: 125},
  {duration: .32, points: 150}, {duration: .4, points: 190},
  {duration: .57, points: 300}, {duration: .55, points: 300},
  {duration: .5, points: 260},
];
function trailYaw(s) {
  return -c.turn(s) - Math.atan((c.center(s + .25) - c.center(s - .25)) / .5);
}
function angleDifference(a, b) { return Math.atan2(Math.sin(a - b), Math.cos(a - b)); }
function jump(boost, inheritSlope = true) {
  if (run.air || run.lock > 0) return;
  const q = run, yaw = trailYaw(q.s), sideAngle = c.turn(q.s);
  [q.airX, q.airZ] = c.place(c.center(q.s) + q.l, q.s);
  q.airVX = -Math.sin(yaw) * q.v + Math.cos(sideAngle) * q.side;
  q.airVZ = -Math.cos(yaw) * q.v + Math.sin(sideAngle) * q.side;
  q.airYaw = Math.hypot(q.airVX,q.airVZ) > .01 ? Math.atan2(-q.airVX, -q.airVZ) : yaw;
  q.airTilt = 0;
  q.airTime = 0;
  q.air = true;
  const metric = Math.hypot(1,(c.center(q.s+.25)-c.center(q.s-.25))/.5);
  const approachSlope = (ground(q.s-.05,q.l)-ground(q.s-.55,q.l))/.5/metric;
  // A bunny hop preserves the velocity down/up the trail instead of erasing it.
  q.vy = clamp(boost + (inheritSlope ? q.v * approachSlope : 0), -6, 6.4);
  q.airStart = q.s;
  q.airDistance = 0;
  q.chain = 0;
  q.combo = 0;
  q.trickCounts = {};
  q.trick = null;
  q.auto = false;
}
function trick(index) {
  if (!run.air || run.trick || run.lock > 0) return;
  const i = index ?? run.next++ % tricks.length;
  if (!Number.isInteger(i) || !TRICK_SPECS[i]) return;
  run.trick = { type: tricks[i], duration: TRICK_SPECS[i].duration, t:0, p:0, i };
  toast(tricks[i] + " · Landa rakt", .7);
}
function act(k, down, source) {
  if (state !== "ride") return;
  if (down) {
    if (held.has(source)) return;
    held.set(source, k);
    input.add(k);
    if (k === "jump") jumpBuffer = 0.13;
    if (k === "trick") trick();
    if (k.startsWith("slot")) trick(+k.slice(4));
  } else {
    let old = held.get(source);
    held.delete(source);
    if (![...held.values()].includes(old)) input.delete(old);
  }
}
const keys = {
  ArrowUp: "pedal",
  KeyW: "pedal",
  ArrowDown: "brake",
  KeyS: "brake",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  Space: "jump",
  KeyT: "trick",
};
addEventListener("keydown", (e) => {
  if (state !== "ride") return;
  let k =
    keys[e.code] ||
    (/^Digit[1-7]$/.test(e.code)
      ? "slot" + (Number(e.code.slice(-1)) - 1)
      : null);
  if (k) {
    e.preventDefault();
    act(k, true, e.code);
  } else if (!e.repeat && e.code === "Escape") {
    e.preventDefault();
    pause();
  } else if (!e.repeat && e.code === "KeyC") camera();
});
addEventListener("keyup", (e) => act(keys[e.code], false, e.code));
document.querySelectorAll("[data-key]").forEach((b) => {
  b.onpointerdown = (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    b.classList.add("on");
    act(b.dataset.key, true, e.pointerId);
  };
  b.onlostpointercapture = b.onpointercancel = b.onpointerup = (e) => {
    b.classList.remove("on");
    act(b.dataset.key, false, e.pointerId);
  };
});
function camera() {
  view = (view + 1) % 3;
  toast(["Följekamera", "Actionkamera", "Hjälmkamera"][view]);
  renderRide(1, true);
}
$("camera").onclick = camera;
function pause() {
  if (state !== "ride") return;
  state = "pause";
  clearInput();
  sound.quiet();
  dialog(
    "Paus",
    c.name + " · " + Math.round((run.s / c.len) * 100) + " % av banan",
    [
      ["Fortsätt", resume],
      [settings.music ? "Musik av" : "Musik på", () => { settings.music = !settings.music; saveSettings(); resume(); }],
      [settings.effects ? "Ljudeffekter av" : "Ljudeffekter på", () => { settings.effects = !settings.effects; saveSettings(); resume(); }],
      ["Börja om", start],
      ["Banväljaren", leave],
    ],
  );
}
function resume() {
  state = "ride";
  previous = 0;
  sound.init();
}
$("pause").onclick = pause;
$("panel").addEventListener("cancel", (e) => {
  if (state === "pause") {
    e.preventDefault();
    $("panel").close();
    resume();
  } else if (state === "finish") e.preventDefault();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
window.addEventListener("blur", () => {
  if (state === "ride") pause();
});
function crash(reason = "Utanför leden") {
  let q = run;
  q.s = q.checkpoint;
  q.l = q.side = 0;
  q.y = c.height(q.s);
  q.groundYaw = trailYaw(q.s);
  q.air = false;
  q.trick = null;
  q.chain = 0;
  q.v = 5;
  q.vy = 0;
  q.lock = 0.6;
  q.crashes++;
  q.clean = 0;
  q.combo = 0;
  jumpBuffer = 0;
  previousRun = { ...q };
  cameraSnap = true;
  toast(reason + " · Upp igen från flaggan!", 2.1);
}
function finish() {
  state = "finish";
  clearInput();
  sound.quiet();
  let q = run,
    key = saveKey(c, q.mode),
    old = record[key],
    win = q.mode === 1 ? !old || q.score > old.score : !old || q.t < old.time;
  if (q.mode !== 3 && win) {
    record[key] =
      q.mode === 1
        ? { score: q.score }
        : { time: q.t, ...(q.mode === 2 ? { ghost: footage } : {}) };
    try {
      localStorage.setItem("fp-downhill-v1", JSON.stringify(record));
    } catch {}
  }
  let msg =
    q.mode === 3
      ? "Du har utforskat hela leden."
      : q.mode === 1
        ? q.score + " trickpoäng"
        : fmt(q.t) + (q.mode === 0 ? "  /  Måltid " + fmt(c.target) : "");
  if (q.mode === 0)
    msg +=
      q.t <= c.target
        ? " · Måltiden slagen!"
        : " · Försök slå måltiden nästa gång.";
  if (q.mode !== 3 && win) msg += "\nNytt personligt rekord!";
  dialog("I mål!", c.name + "\n" + msg, [
    [
      "Nästa bana",
      () => {
        $("tracks").value = (c.index + 1) % layouts.length;
        start();
      },
    ],
    ["Kör igen", start],
    ["Banväljaren", leave],
  ]);
}
function ground(s, l) {
  let base = c.height(s, l);
  return c.fork(s) > 0 && Math.abs(l - c.fork(s)) < 1.65
    ? Math.max(base, env.ridge(s, l)) + 0.1
    : base;
}
function step(dt) {
  let q = run,
    b = q.b,
    br = Math.max(Number(input.has("brake")), -stick.y),
    ped = Math.max(Number(input.has("pedal")), stick.y),
    steer = clamp(Number(input.has("right")) - Number(input.has("left")) + stick.x, -1, 1),
    e = c.feature(q.s),
    mat =
      e?.type === "i"
        ? "is"
        : e && ["b", "r"].includes(e.type)
          ? "trä"
          : c.surface;
  q.t += dt;
  if (jumpBuffer > 0 && !q.air && q.lock <= 0) {
    jump(3.3 * Math.sqrt(q.b[5]));
    jumpBuffer = 0;
    toast("Bunny hop", 0.6);
  }
  jumpBuffer = Math.max(0, jumpBuffer - dt);
  q.lock = Math.max(0, q.lock - dt);
  q.compression *= Math.exp(-dt * 7);
  let dx = (c.center(q.s + 0.4) - c.center(q.s - 0.4)) / 0.8,
    metric = Math.hypot(1, dx),
    slope = (ground(q.s + 0.25, q.l) - ground(q.s - 0.25, q.l)) / 0.5 / metric;
  let grip = ({jord:1, grus:.82, lera:.65, snö:.72, is:.39, trä:.98}[mat] || 1) * b[2];
  const old = q.s;
  if (q.air) {
    // Momentum is world-space and independent of center()/turn(). Steering is a
    // limited, deliberate air correction; there is no magnetic path-following.
    q.airTime += dt;
    q.airYaw -= steer * .42 * dt;
    const speed = Math.hypot(q.airVX, q.airVZ) * Math.exp(-.06 * dt);
    q.airVX = -Math.sin(q.airYaw) * speed;
    q.airVZ = -Math.cos(q.airYaw) * speed;
    q.airX += q.airVX * dt;
    q.airZ += q.airVZ * dt;
    q.airDistance += speed * dt;
    const projected = c.project(q.airX, q.airZ, q.s + q.v * dt / metric);
    q.s = projected.s;
    q.l = projected.l;
    q.v = speed;
    q.airTilt = clamp(q.airTilt + (ped - br) * .85 * dt, -.45, .45);
    q.lean = mix(q.lean, -steer * .22, 1 - Math.exp(-dt * 6));
  } else {
    q.v = clamp(q.v + dt * (1.5 + ped * 4.5 - slope * 10 - br * 15 * b[4]
      - q.v * q.v * (mat === "lera" ? .028 : .018)), br ? 0 : 2.2, 22 * b[1]);
    const curvature = (c.center(q.s + 1) - 2 * c.center(q.s) + c.center(q.s - 1)) / metric ** 3;
    const drift = clamp(-(curvature + (c.turn(q.s + .5) - c.turn(q.s - .5)) / metric)
      * q.v * q.v * .3 / (grip * b[3]), -6, 6);
    q.side = mix(q.side, steer * (2.6 + q.v * .13) * Math.min(1,q.v/3) + drift,
      1 - Math.exp(-dt * 7 * grip));
    q.l += q.side * dt;
    q.s = Math.min(c.len, q.s + dt * q.v / metric);
    q.lean = mix(q.lean, -steer * .36, 1 - Math.exp(-dt * 6));
    q.phase += ped ? q.v * .42 * dt : 0;
    q.groundYaw = (q.groundYaw ?? trailYaw(q.s)) + angleDifference(trailYaw(q.s) - q.side * .04, q.groundYaw ?? trailYaw(q.s)) * (1 - Math.exp(-dt * 10));
  }
  q.dist += q.v * dt;
  for (let e of c.events) {
    if (old < e.s && q.s >= e.s && !q.air && "gjr".includes(e.type)) {
      // Measure the actual ramp climb over the last four metres. Takeoff energy
      // depends on approach speed and ramp angle, with a hard child-friendly cap.
      const rampGrade = Math.max(.08, (c.height(e.s - .05, q.l) - c.height(e.s - 4,q.l)) / 4);
      const impulse = clamp(1.5 + q.v * rampGrade * .6 + (e.type === "g" ? 1 : 0), 2.4, 5.2);
      jump(impulse * Math.sqrt(b[5]), false);
      q.auto = true;
    }
    if (old < e.s && q.s >= e.s && e.type === "o" && Math.abs(q.l + .8) < .74 && !q.air && q.v > 7) {
      crash("Hinder på stigen – hoppa eller välj en annan linje"); return;
    }
  }
  let h = ground(q.s, q.l);
  if (q.air) {
    q.vy -= GRAVITY * dt;
    q.y += q.vy * dt;
    if (q.trick) {
      let t = q.trick;
      t.t += dt;
      t.p = Math.min(1, t.t / t.duration);
      if (t.p >= 1) {
        q.chain++;
        const repeats = q.trickCounts[t.i] || 0;
        q.trickCounts[t.i] = repeats + 1;
        const variety = Object.keys(q.trickCounts).length;
        q.combo += Math.round(TRICK_SPECS[t.i].points * (1 + (variety - 1) * .35) * Math.pow(.55,repeats));
        q.trick = null;
      }
    }
    if (q.vy < 0 && q.y <= h && !c.gap(q.s)) {
      const landingEdge = Math.min(Math.abs(q.l) - c.half(q.s),
        c.fork(q.s) > 0 ? Math.abs(q.l - c.fork(q.s)) - 1.5 : Infinity);
      if (landingEdge > .65) { crash("Landningen hamnade utanför stigen"); return; }
      const headingError = Math.abs(angleDifference(q.airYaw, trailYaw(q.s)));
      const impact = Math.max(0, q.v * slope - q.vy);
      const pitchError = Math.abs(q.pitch - Math.atan(slope));
      if (q.trick || headingError > .65 || pitchError > .85 || impact > 17) {
        crash(q.trick ? "Tricket var inte färdigt" : headingError > .65 ? "Landa i banans riktning" : pitchError > .85 ? "Räta upp cykeln före landningen" : "För hård landning – bromsa före hoppet");
        return;
      }
      q.groundYaw = q.airYaw;
      q.side *= .5;
      q.v *= Math.max(.75, 1 - impact * .008 - headingError * .08);
      q.air = false;
      q.trick = null;
      q.y = h;
      q.compression = clamp(-q.vy / 8, 0.25, 1);
      sound.land(-q.vy);
      q.vy = 0;
      let pts = Math.round(Math.min(q.airDistance, 20) * 2 + (q.combo || 0) + (headingError < .2 ? 30 : 10));
      q.score += pts;
      toast(
        (q.chain ? "Kombination ×" + q.chain : headingError < .2 ? "Perfekt landning" : "Fin landning") + "  +" + pts,
      );
    } else if (q.y < h - 2.6) {
      crash("Hoppet nådde inte landningen");
      return;
    }
  } else if (c.gap(q.s)) {
    jump(0);
  } else q.y = h;
  let edge = Math.min(
    Math.abs(q.l) - c.half(q.s),
    c.fork(q.s) > 0 ? Math.abs(q.l - c.fork(q.s)) - 1.5 : Infinity,
  );
  if (edge > 0 && !q.air) {
    q.v = Math.max(2, q.v - 5 * dt);
    if (edge > 1.25 * b[3]) {
      crash();
      return;
    }
  }
  let cp = Math.floor(q.s / 65) * 65;
  if (cp > q.checkpoint && !q.air && !c.feature(q.s)) {
    q.checkpoint = q.s;
    q.score += 40;
    toast("Kontrollpunkt  +40", 1);
  }
  if (q.v > 15 && !q.air) {
    q.clean += dt;
    if (q.clean > 2) {
      q.score += 10;
      q.clean = 0;
    }
  }
  if (q.mode === 2 && Math.floor(q.t * 5) >= footage.length)
    footage.push([+q.s.toFixed(2), +q.l.toFixed(2), +q.y.toFixed(2)]);
  if (ghost) {
    let point = ghostData[Math.floor(q.t * 5)];
    ghost.visible = !!point;
    if (point) {
      const [gx, gz] = c.place(c.center(point[0]) + point[1], point[0]);
      ghost.position.set(gx, point[2], gz);
      ghost.rotation.y =
        -c.turn(point[0]) -
        Math.atan(c.center(point[0] + 0.5) - c.center(point[0] - 0.5));
    }
  }
  q.pitch = mix(
    q.pitch,
    q.air ? clamp(q.vy * .025, -.3, .3) + q.airTilt : Math.atan(slope),
    1 - Math.exp(-dt * 8),
  );
  sound.tick(q.v, mat, br, ped, q.air);
  if (q.s >= c.len && !q.air) finish();
}
function renderRide(dt, snap = false) {
  snap = snap || cameraSnap;
  cameraSnap = false;
  const q = { ...run };
  if (!snap && previousRun) {
    const alpha = clamp(acc / FIXED_STEP, 0, 1);
    for (const key of ["s", "l", "y", "side", "lean", "pitch", "dist", "phase", "compression"])
      q[key] = mix(previousRun[key], run[key], alpha);
    if (q.air && previousRun.air) {
      q.airX = mix(previousRun.airX, run.airX, alpha);
      q.airZ = mix(previousRun.airZ, run.airZ, alpha);
      q.airYaw = previousRun.airYaw + angleDifference(run.airYaw, previousRun.airYaw) * alpha;
    }
    // Ground clamps prevent interpolation through a sharp ramp edge.
    if (!q.air) q.y = Math.max(q.y, ground(q.s, q.l));
  }
  const x = c.center(q.s) + q.l,
    y = q.y,
    s = q.s,
    dir = -Math.atan(c.center(s + 0.5) - c.center(s - 0.5)),
    a = snap ? 1 : 1 - Math.exp(-dt * 9);
  let [wx, wz] = q.air ? [q.airX, q.airZ] : c.place(x, s);
  const surfaceOffset = c.feature(s)?.type === "b" ? .09 : .06;
  mount.group.position.set(wx, y + surfaceOffset, wz);
  mount.group.rotation.y = q.air ? q.airYaw : (q.groundYaw ?? dir - c.turn(s) - q.side * 0.04);
  mount.pose(
    q.dist,
    q.v,
    q.lean,
    q.pitch,
    q.compression,
    q.phase,
    q.trick,
    input.has("pedal") || stick.y > 0,
  );
  mount.group.visible = view !== 2;
  let back = view === 2 ? -0.35 : view === 1 ? 3.8 : 6.8 + q.v * 0.045 + (q.air ? 0.8 : 0),
    alt = view === 2 ? 1.96 : view === 1 ? 1.8 : 3.15,
    lag = s - back / Math.sqrt(1 + Math.tan(dir) ** 2),
    px =
      c.center(lag) + q.l * 0.86 + (view === 1 ? 0.74 : 0),
    pz = -lag;
  let py = Math.max(y + alt, ground(lag, px - c.center(lag)) + alt * 0.83),
    lead = view === 2 ? 9 : 4.8 + q.v * 0.12 + (q.air ? 2 : 0);
  let cameraPos = c.place(px, lag),
    look = c.place(c.center(s + lead) + q.l * 0.7, s + lead);
  if (q.air) {
    // Follow the takeoff heading so spins cannot rotate the camera or hide touchdown.
    cameraPos = [wx + Math.sin(q.airYaw) * back, wz + Math.cos(q.airYaw) * back];
    look = [wx - Math.sin(q.airYaw) * lead, wz - Math.cos(q.airYaw) * lead];
  }
  cam.position.lerp(V(cameraPos[0], py, cameraPos[1]), a);
  aim.lerp(
    V(
      look[0],
      Math.max(c.base(s + lead) + 0.82, y + (view === 2 ? 1.05 : 0.48)),
      look[1],
    ),
    a,
  );
  // Keep the horizon stable through spins and hard landings.
  cam.up.set(0, 1, 0);
  const targetFov = view === 2 ? 67 : 59 + clamp(q.v / 26, 0, 1) * 5;
  cam.fov = snap ? targetFov : mix(cam.fov, targetFov, 1 - Math.exp(-dt * 3));
  cam.updateProjectionMatrix();
  cam.lookAt(aim);
  env.update(x, y, s, cam, dt);
  renderer.render(scene, cam);
  hudTime += dt;
  if (!snap && hudTime < 0.08) return;
  hudTime = 0;
  $("hudName").textContent = c.name;
  $("time").textContent = q.mode === 3 ? "Fri åkning" : fmt(q.t);
  $("speed").textContent = Math.round(q.v * 3.6);
  $("points").textContent = q.score;
  document.querySelector("#progress i").style.width = (s / c.len) * 100 + "%";
}
function loop(now) {
  frame = requestAnimationFrame(loop);
  if (state !== "ride") {
    previous = 0;
    return;
  }
  let elapsed = previous ? (now - previous) / 1000 : 1 / 60;
  previous = now;
  if (run.t > 3 && elapsed < 0.25) {
    samples.push(elapsed * 1000);
    if (samples.length > 600) samples.shift();
    // Adapt only after sustained pressure; a single asset upload must not lower quality.
    slowTime = elapsed > 0.038 ? slowTime + elapsed : Math.max(0, slowTime - elapsed * 2);
    if (slowTime > 2 && !soft && settings.quality !== "high") {
      soft = 1;
      renderer.shadowMap.autoUpdate = false;
      resize();
    }
  }
  shadowTime += elapsed;
  if (soft && shadowTime > 0.1) {
    renderer.shadowMap.needsUpdate = true;
    shadowTime = 0;
  }
  let dt = Math.min(elapsed, 0.12);
  acc += dt;
  while (acc >= FIXED_STEP && state === "ride") {
    previousRun = { ...run };
    step(FIXED_STEP);
    acc -= FIXED_STEP;
  }
  renderRide(dt);
  if (toastTime > 0 && (toastTime -= dt) <= 0) $("toast").textContent = "";
}
