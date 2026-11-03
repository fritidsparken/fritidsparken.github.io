import { tracks, karts, drivers, paints } from "./circuits.js";
import { makePath } from "./path.js";
import { Display } from "./display.js";
import { Race, clamp } from "./race.js";
import { Sound } from "./sound.js";
const $ = (id) => document.getElementById(id),
  keys = new Set(),
  touch = new Set(),
  modes = {
    quick: "Snabbt lopp",
    gp: "Grand Prix",
    time: "Time Trial",
    free: "Free Ride",
  },
  points = [15, 12, 10, 8, 6, 4, 2, 1];
const fmt = (s) =>
  Math.floor(s / 60) +
  ":" +
  String(Math.floor(s % 60)).padStart(2, "0") +
  "." +
  String(Math.floor(s * 100) % 100).padStart(2, "0");
let saved = {};
try {
  saved = JSON.parse(localStorage.getItem("fp-kart-v1")) || {};
} catch {}
const defaults = {
  track: 0,
  kart: 0,
  driver: 0,
  paint: 0,
  level: 0,
  laps: 3,
  mode: "quick",
  cup: 0,
  quality: (navigator.deviceMemory || 4) <= 4 ? 1 : 2,
};
const cfg = { ...defaults };
for (const k of Object.keys(defaults)) {
  let value = saved.options?.[k];
  if (k === "mode") {
    if (value in modes) cfg[k] = value;
  } else if (
    Number.isInteger(value) &&
    value >= 0 &&
    value <=
      {
        track: 11,
        kart: 7,
        driver: 7,
        paint: 7,
        level: 2,
        laps: 5,
        cup: 2,
        quality: 3,
      }[k]
  )
    cfg[k] = value;
}
let ghosts = saved.ghosts || {},
  recording = [];
let records = saved.records || {},
  medals = saved.medals || {},
  levels = [70, 35, 40, 25].map((v, i) =>
    Number.isFinite(saved.levels?.[i]) ? clamp(saved.levels[i], 0, 100) : v,
  );
const save = () => {
  try {
    localStorage.setItem(
      "fp-kart-v1",
      JSON.stringify({ options: cfg, records, levels, medals, ghosts }),
    );
  } catch {}
};
const sound = new Sound(levels);
let display,
  path,
  race,
  phase = "menu",
  gp = null,
  last = 0,
  acc = 0,
  pendingFire = false,
  prevPad = {},
  mapBase,
  projectMap,
  uiClock = 0;
function options(id, arr, sel) {
  $(id).replaceChildren(
    ...arr.map((s, i) => new Option(s, i, false, i === sel)),
  );
}
options(
  "track",
  tracks.map((t) => t.name),
  cfg.track,
);
options(
  "kart",
  karts.map((k) => k[0]),
  cfg.kart,
);
options("driver", drivers, cfg.driver);
for (let id of ["cup", "level", "quality"]) $(id).selectedIndex = cfg[id];
$("laps").value = cfg.laps;
for (let [mode, title] of Object.entries(modes)) {
  let b = document.createElement("button");
  b.textContent = title;
  b.dataset.mode = mode;
  $("modes").append(b);
  b.onclick = () => {
    cfg.mode = mode;
    refresh();
    showroom();
    save();
  };
}
for (let [i, c] of paints.entries()) {
  let b = document.createElement("button");
  b.style.background = c;
  b.setAttribute(
    "aria-label",
    ["Korall", "Turkos", "Solgul", "Lila", "Grön", "Rosa", "Blå", "Guld"][i],
  );
  $("paints").append(b);
  b.onclick = () => {
    cfg.paint = i;
    refresh();
    showroom();
    save();
  };
}
["Musik", "Motorljud", "Ljudeffekter", "Miljöljud"].forEach((s, i) => {
  let l = document.createElement("label"),
    range = document.createElement("input");
  range.type = "range";
  range.min = 0;
  range.max = 100;
  range.value = levels[i];
  l.append(s, range);
  $("volumes").append(l);
  range.oninput = () => {
    sound.volume(i, +range.value);
    save();
  };
});
function selected() {
  return cfg.mode === "gp" ? cfg.cup * 4 + (gp?.round || 0) : cfg.track;
}
function refresh() {
  let t = tracks[selected()];
  $("preview").src = "refs/" + String(t.id + 1).padStart(2, "0") + ".webp";
  $("landmark").textContent = t.landmark;
  $("trackNo").textContent =
    "BANA " + String(t.id + 1).padStart(2, "0") + " / 12";
  $("trackField").hidden = cfg.mode === "gp";
  $("cupField").hidden = cfg.mode !== "gp";
  $("laps").disabled = cfg.mode !== "quick";
  $("laps").value = cfg.mode === "quick" ? cfg.laps : 3;
  $("level").disabled = ["time", "free"].includes(cfg.mode);
  for (let b of $("modes").children)
    b.classList.toggle("active", cfg.mode === b.dataset.mode);
  [...$("paints").children].forEach((b, i) =>
    b.classList.toggle("active", i === cfg.paint),
  );
  let stat = karts[cfg.kart];
  $("stats").innerHTML = ["Toppfart", "Acceleration", "Styrning", "Drift"]
    .map(
      (s, i) =>
        "<p>" +
        s +
        ' <progress max="100" value="' +
        [stat[1] * 2, stat[2] * 4.5, stat[3] * 82, stat[4] * 75][i] +
        '"></progress></p>',
    )
    .join("");
}
for (let id of ["track", "cup", "level", "laps", "kart", "driver", "quality"])
  $(id).onchange = () => {
    cfg[id] = ["level", "quality", "cup"].includes(id)
      ? $(id).selectedIndex
      : +$(id).value;
    refresh();
    if (!["level", "laps"].includes(id)) showroom();
    save();
  };
$("tabs").onclick = (e) => {
  let key = e.target.dataset.tab;
  if (!key) return;
  for (let b of $("tabs").children) {
    b.classList.toggle("active", b.dataset.tab === key);
    $(b.dataset.tab + "Tab").hidden = b.dataset.tab !== key;
  }
};
function resetRace(menu) {
  let t = tracks[selected()];
  path = makePath(t);
  let settings = {
    ...cfg,
    mode: menu ? "free" : cfg.mode,
    laps: cfg.mode === "quick" ? cfg.laps : 3,
  };
  race = new Race(path, t, settings, onEvent);
  display.load(t, path, settings, race);
  recording = [];
  if (!menu && cfg.mode === "time") display.ghost(ghosts[t.id]);
  acc = 0;
  makeMap();
  $("trackTitle").textContent = t.name;
}
function showroom() {
  if (display) resetRace(true);
}
function makeMap() {
  let pts = Array.from(
      { length: 160 },
      (_, i) => path.at((path.length * i) / 160).pos,
    ),
    xs = pts.map((p) => p.x),
    zs = pts.map((p) => p.z),
    x = Math.min(...xs),
    z = Math.min(...zs),
    w = Math.max(...xs) - x,
    h = Math.max(...zs) - z,
    scale = Math.min(139 / w, 111 / h);
  projectMap = (p) => [
    (p.x - x) * scale + (160 - w * scale) / 2,
    (p.z - z) * scale + (130 - h * scale) / 2,
  ];
  mapBase = document.createElement("canvas");
  mapBase.width = 160;
  mapBase.height = 130;
  let g = mapBase.getContext("2d");
  g.strokeStyle = "#c9d1db";
  g.lineWidth = 3;
  g.beginPath();
  pts.forEach((p, i) => g[i ? "lineTo" : "moveTo"](...projectMap(p)));
  g.closePath();
  g.stroke();
}
function hud() {
  const r = race.racers[0],
    ord = race.order(),
    time = Math.max(0, race.t - r.lapStart);
  $("place").textContent =
    cfg.mode === "free"
      ? "Fri körning"
      : cfg.mode === "time"
        ? "Mot klockan"
        : ord.indexOf(r) + 1 + " / 8";
  $("lap").textContent =
    cfg.mode === "free"
      ? "∞"
      : Math.min(r.lap + 1, race.settings.laps) + " / " + race.settings.laps;
  $("clock").textContent = fmt(time);
  $("speed").textContent = Math.round(r.v * 3.6);
  $("item").textContent = (r.item || "") + "  ◈ " + r.coins;
  $("turbo").value = r.boost ? 3 : r.slide;
  let g = $("map").getContext("2d");
  g.clearRect(0, 0, 160, 130);
  g.drawImage(mapBase, 0, 0);
  for (let o of [...race.racers].reverse()) {
    let p = path.route(o.d, o.alt).pos;
    g.fillStyle = o.id ? "#91c4d2" : "#ffbd4d";
    g.beginPath();
    g.arc(...projectMap(p), o.id ? 2.6 : 4, 0, 7);
    g.fill();
  }
  $("count").textContent =
    race.t < 0 ? Math.ceil(-race.t) : race.t < 0.65 ? "KÖR!" : "";
}
function start(next = false) {
  if (!display) return;
  if (cfg.mode === "gp" && !next) gp = { round: 0, scores: Array(8).fill(0) };
  sound.init();
  $("dialog").close();
  $("menu").hidden = true;
  $("hud").hidden = false;
  phase = "race";
  keys.clear();
  touch.clear();
  resetRace(false);
  last = performance.now();
  hud();
}
function menu() {
  sound.pause();
  $("dialog").close();
  keys.clear();
  touch.clear();
  gp = null;
  phase = "menu";
  $("hud").hidden = true;
  $("count").textContent = "";
  $("menu").hidden = false;
  refresh();
  showroom();
}
function dialog(html, buttons) {
  $("message").innerHTML = html;
  $("actions").replaceChildren();
  for (let [title, fn] of buttons) {
    let b = document.createElement("button");
    b.textContent = title;
    if (!$("actions").children.length) b.className = "primary";
    b.onclick = fn;
    $("actions").append(b);
  }
  if (!$("dialog").open) $("dialog").showModal();
}
function resume() {
  if (phase !== "paused") return;
  phase = "race";
  $("dialog").close();
  sound.init();
  last = performance.now();
  acc = 0;
}
function pause() {
  if (phase !== "race") return;
  phase = "paused";
  keys.clear();
  touch.clear();
  pendingFire = false;
  sound.pause();
  dialog(
    "<small>DEPÅSTOPP</small><h2>Paus</h2><p>Pilar eller WASD kör. Håll mellanslag i en kurva och släpp för driftboost. Shift använder din box. Den gröna pilen visar vägen till genvägen.</p>",
    [
      ["Fortsätt köra", resume],
      ["Starta om loppet", () => start(true)],
      ["Till menyn", menu],
    ],
  );
}
function onEvent(name, r) {
  if (name === "finish") {
    phase = "finish";
    $("count").textContent = "MÅL!";
    setTimeout(results, 850);
  } else if (!r.id) sound.fx(name);
}
function results() {
  if (phase !== "finish") return;
  if (gp) {
    race.finished = false;
    for (let i = 0; i < 18000 && race.racers.some((o) => !o.done); i++)
      race.step(1 / 60, { turn: 0 });
    race.finished = true;
  }
  const r = race.racers[0],
    order = race.order(),
    pos = order.indexOf(r) + 1,
    lap = Math.min(...r.laps),
    key = selected() + "-" + race.settings.laps,
    prev = records[key] || {};
  if (
    cfg.mode === "time" &&
    recording.length &&
    r.done < (prev.ghostTime || Infinity)
  ) {
    ghosts[selected()] = recording;
    prev.ghostTime = r.done;
  }
  records[key] = {
    ...prev,
    lap: Math.min(prev.lap ?? Infinity, lap),
    time: Math.min(prev.time ?? Infinity, r.done),
  };
  let html =
      "<small>" +
      tracks[selected()].name +
      "</small><h2>" +
      (cfg.mode === "time"
        ? "Tidtagning klar"
        : pos === 1
          ? "Du vann!"
          : "Mål · plats " + pos) +
      "</h2><p>Total tid " +
      fmt(r.done) +
      " · Bästa varv " +
      fmt(lap) +
      "<br>Banrekord " +
      fmt(records[key].time) +
      " · Varvrekord " +
      fmt(records[key].lap) +
      "</p>",
    buttons = [];
  if (gp) {
    order.forEach((a, i) => (gp.scores[a.id] += points[i]));
    const table = order
      .slice()
      .sort((a, b) => gp.scores[b.id] - gp.scores[a.id]);
    if (gp.round === 3) display.podium(table.map((o) => o.id));
    html +=
      "<h3>" +
      (gp.round === 3
        ? "Prispallen"
        : "Cupställning efter lopp " + (gp.round + 1)) +
      "</h3><table>" +
      table
        .map(
          (o, i) =>
            "<tr><td>" +
            (gp.round === 3 && i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1) +
            "</td><td>" +
            (o.id ? drivers[(cfg.driver + o.id) % 8] : "Du") +
            "</td><td>" +
            gp.scores[o.id] +
            " p</td></tr>",
        )
        .join("") +
      "</table>";
    if (gp.round < 3)
      buttons.push([
        "Nästa lopp →",
        () => {
          gp.round++;
          start(true);
        },
      ]);
    else {
      medals[cfg.cup] = Math.min(
        medals[cfg.cup] || 8,
        table.findIndex((o) => !o.id) + 1,
      );
    }
  } else buttons.push(["Kör igen", () => start()]);
  buttons.push(["Till menyn", menu]);
  save();
  sound.pause();
  $("count").textContent = "";
  dialog(html, buttons);
}
$("go").onclick = () => start();
$("pause").onclick = pause;
function camera() {
  if (display) {
    display.cameraMode = (display.cameraMode + 1) % 3;
    display.first = true;
  }
}
$("cam").onclick = camera;
$("dialog").addEventListener("cancel", (e) => {
  e.preventDefault();
  if (phase === "paused") resume();
});
window.addEventListener("keydown", (e) => {
  if (phase !== "race" && phase !== "paused") return;
  if (
    [
      "Space",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "ShiftLeft",
      "ShiftRight",
      "Escape",
    ].includes(e.code)
  )
    e.preventDefault();
  if (!e.repeat) {
    if (e.code === "Escape") phase === "paused" ? resume() : pause();
    if (e.code === "KeyC") camera();
    if (e.code.startsWith("Shift")) pendingFire = true;
  }
  keys.add(e.code);
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", pause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
for (let b of document.querySelectorAll("[data-key]")) {
  b.onpointerdown = (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    touch.add(b.dataset.key);
    if (b.dataset.key === "fire") pendingFire = true;
  };
  b.onlostpointercapture = () => touch.delete(b.dataset.key);
  b.onpointerup = b.onpointercancel = () => touch.delete(b.dataset.key);
}
function readInput() {
  let pad = navigator.getGamepads?.()?.[0],
    p = (i) => pad?.buttons[i]?.pressed,
    axis = pad?.axes[0] || 0;
  if (p(1) && !prevPad.fire) pendingFire = true;
  if (p(9) && !prevPad.pause) pause();
  if (p(3) && !prevPad.cam) camera();
  prevPad = { fire: p(1), pause: p(9), cam: p(3) };
  const is = (a, b, c) => keys.has(a) || keys.has(b) || touch.has(c);
  let input = {
    turn: clamp(
      +!!is("ArrowLeft", "KeyA", "left") -
        !!is("ArrowRight", "KeyD", "right") -
        (Math.abs(axis) > 0.13 ? axis : 0),
      -1,
      1,
    ),
    gas: is("ArrowUp", "KeyW", "gas") || p(7),
    brake: is("ArrowDown", "KeyS", "brake") || p(6),
    drift: keys.has("Space") || touch.has("drift") || p(0),
    fire: pendingFire,
  };
  return input;
}
function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  if (phase === "paused" || document.hidden || !display) return;
  if (phase === "race") {
    let input = readInput();
    if (phase !== "race") return;
    acc += dt;
    while (acc >= 1 / 60) {
      race.step(1 / 60, input);
      if (
        cfg.mode === "time" &&
        race.t >= 0 &&
        recording.length <= Math.floor(race.t * 8) &&
        recording.length < 8000
      ) {
        let r = race.racers[0];
        recording.push([
          Math.round(r.d * 20) / 20,
          Math.round(r.l * 30) / 30,
          Math.round(r.hop * 20) / 20,
          +r.alt,
        ]);
      }
      if (!input.fire) pendingFire = false;
      acc -= 1 / 60;
    }
    let p = race.racers[0];
    sound.tick(p.v, p.drift, input.brake, selected());
    uiClock += dt;
    if (uiClock > 0.08) {
      hud();
      uiClock = 0;
    }
  }
  display.draw(dt, phase === "menu", phase === "finish");
}
refresh();
try {
  display = new Display($("view"));
  if (saved.options?.quality == null) {
    const gl = display.renderer.getContext(),
      ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (
      ext &&
      /swiftshader|llvmpipe|software/i.test(
        gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),
      )
    ) {
      cfg.quality = 0;
      $("quality").selectedIndex = 0;
    }
  }
  showroom();
  window.addEventListener("resize", () => display.resize());
  requestAnimationFrame(loop);
} catch (error) {
  console.error(error);
  $("go").disabled = true;
  $("tagline").textContent =
    "3D-grafiken kunde inte starta. Aktivera grafikacceleration i webbläsaren och ladda om sidan.";
}
