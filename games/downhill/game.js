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
    "LED " + String(c.id + 1).padStart(2, "0") + " / 20";
  $("credit").textContent =
    "BANREFERENS  /  " + String(c.id + 1).padStart(2, "0");
  document.querySelector(".cover").style.backgroundImage =
    "url(ref/" + (c.id + 1) + ".webp)";
  let best = record[c.id + "-" + $("mode").selectedIndex];
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
    "Trampa med ↑ eller W. Bromsa med ↓ eller S. Styr med ← → eller A och D. På mobilen styr du med spaken. Dra uppåt för fart och nedåt för broms. Du kan hoppa och göra trick med andra tummen.\n\nHoppa med mellanslag. Ramper ger automatiska hopp. I luften gör T nästa trick. Med 1–7 väljer du trick direkt. Avsluta tricket innan hjulen tar mark.\n\nC byter kamera. Esc pausar. Vid en vurpa börjar du vid senaste kontrollpunkten.",
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
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
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
  };
  footage = [];
  const savedGhost = run.mode === 2 ? record[c.id + "-2"]?.ghost : null;
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
  let best = record[c.id + "-" + run.mode];
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
function jump(boost) {
  if (run.air || run.lock > 0) return;
  run.air = true;
  run.vy = boost;
  run.airStart = run.s;
  run.chain = 0;
  run.combo = 0;
  run.trick = null;
  run.auto = false;
}
function trick(index) {
  if (!run.air || run.trick || run.lock > 0) return;
  let i = index ?? run.next++ % 7;
  run.trick = {
    type: tricks[i],
    duration: [0.33, 0.4, 0.38, 0.52, 0.68, 0.67, 0.64][i],
    t: 0,
    p: 0,
    i,
  };
  toast(tricks[i], 0.7);
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
function crash() {
  let q = run;
  q.s = q.checkpoint;
  q.l = q.side = 0;
  q.y = c.height(q.s);
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
  toast("Upp igen! Kör från flaggan.", 1.6);
}
function finish() {
  state = "finish";
  clearInput();
  sound.quiet();
  let q = run,
    key = c.id + "-" + q.mode,
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
        $("tracks").value = (c.id + 1) % 20;
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
    jump(5.8 * q.b[5]);
    jumpBuffer = 0;
    toast("Bunny hop", 0.6);
  }
  jumpBuffer = Math.max(0, jumpBuffer - dt);
  q.lock = Math.max(0, q.lock - dt);
  q.compression *= Math.exp(-dt * 7);
  let dx = (c.center(q.s + 0.4) - c.center(q.s - 0.4)) / 0.8,
    metric = Math.hypot(1, dx),
    slope = (ground(q.s + 0.25, q.l) - ground(q.s - 0.25, q.l)) / 0.5 / metric;
  q.v = clamp(
    q.v +
      dt *
        (2.1 +
          ped * 5 -
          slope * 10 -
          br * 14 * b[4] -
          q.v * q.v * (mat === "lera" ? 0.025 : 0.014)),
    br ? 0 : 2.6,
    26 * b[1],
  );
  let grip =
      ({ jord: 1, grus: 0.82, lera: 0.65, snö: 0.72, is: 0.39, trä: 0.98 }[
        mat
      ] || 1) * b[2],
    responsiveness = q.air ? 3.6 : 8 * grip;
  const curvature =
    (c.center(q.s + 1) - 2 * c.center(q.s) + c.center(q.s - 1)) / metric ** 3;
  const drift = clamp(
    (-(curvature + (c.turn(q.s + 0.5) - c.turn(q.s - 0.5)) / metric) *
      q.v *
      q.v *
      0.22) /
      (grip * b[3]),
    -4.8,
    4.8,
  );
  q.side = mix(
    q.side,
    steer * (3.1 + q.v * 0.16) * Math.min(1, q.v / 3) + drift,
    1 - Math.exp(-dt * responsiveness),
  );
  q.l += q.side * dt;
  let old = q.s;
  q.s = Math.min(c.len, q.s + (dt * q.v) / metric);
  q.dist += q.v * dt;
  q.lean = mix(q.lean, -steer * 0.32, 1 - Math.exp(-dt * 6));
  q.phase += ped ? q.v * 0.42 * dt : 0;
  for (let e of c.events) {
    if (old < e.s && q.s >= e.s && !q.air && "gjr".includes(e.type)) {
      jump((e.type === "g" ? 8.2 : 6.3) * b[5]);
      q.auto = true;
    }
    if (
      old < e.s &&
      q.s >= e.s &&
      e.type === "o" &&
      Math.abs(q.l + 0.8) < 0.74 &&
      !q.air &&
      q.v > 7
    ) {
      crash();
      return;
    }
  }
  let h = ground(q.s, q.l);
  if (q.air) {
    q.vy -= 15 * dt;
    q.y += q.vy * dt;
    if (q.trick) {
      let t = q.trick;
      t.t += dt;
      t.p = Math.min(1, t.t / t.duration);
      if (t.p >= 1) {
        q.chain++;
        q.combo =
          (q.combo || 0) + [90, 120, 140, 180, 240, 240, 210][t.i] * q.chain;
        q.trick = null;
      }
    }
    if (q.vy < 0 && q.y <= h && !c.gap(q.s)) {
      if (q.trick && q.trick.p > 0.16 && q.trick.p < 0.82) {
        crash();
        return;
      }
      q.air = false;
      q.trick = null;
      q.y = h;
      q.compression = clamp(-q.vy / 8, 0.25, 1);
      sound.land(-q.vy);
      q.vy = 0;
      let pts = Math.round((q.s - q.airStart) * 3 + (q.combo || 0) + 22);
      q.score += pts;
      toast(
        (q.chain ? "Kombination ×" + q.chain : "Fin landning") + "  +" + pts,
      );
    } else if (q.y < h - 2.6) {
      crash();
      return;
    }
  } else if (c.gap(q.s)) {
    jump(0);
  } else q.y = h;
  let edge = Math.min(
    Math.abs(q.l) - c.half(q.s),
    c.fork(q.s) > 0 ? Math.abs(q.l - c.fork(q.s)) - 1.5 : Infinity,
  );
  if (edge > 0) {
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
  if (q.v > 15) {
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
    q.air ? clamp(q.vy * 0.038, -0.35, 0.4) : Math.atan(slope),
    1 - Math.exp(-dt * 8),
  );
  sound.tick(q.v, mat, br, ped, q.air);
  if (q.s >= c.len) finish();
}
function renderRide(dt, snap = false) {
  snap = snap || cameraSnap;
  cameraSnap = false;
  const q = { ...run };
  if (!snap && previousRun) {
    const alpha = clamp(acc / FIXED_STEP, 0, 1);
    for (const key of ["s", "l", "y", "side", "lean", "pitch", "dist", "phase", "compression"])
      q[key] = mix(previousRun[key], run[key], alpha);
    // Ground clamps prevent interpolation through a sharp ramp edge.
    if (!q.air) q.y = Math.max(q.y, ground(q.s, q.l));
  }
  const x = c.center(q.s) + q.l,
    y = q.y,
    s = q.s,
    dir = -Math.atan(c.center(s + 0.5) - c.center(s - 0.5)),
    a = snap ? 1 : 1 - Math.exp(-dt * 9);
  let [wx, wz] = c.place(x, s);
  mount.group.position.set(wx, y + 0.09, wz);
  mount.group.rotation.y = dir - c.turn(s) - q.side * 0.04;
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
