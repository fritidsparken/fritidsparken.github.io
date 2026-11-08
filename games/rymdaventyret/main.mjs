import {
  VERSION,
  PLANETS,
  WORLDS,
  MISSIONS,
  CAMERAS,
  arrival,
  worldPosition,
} from "./data.mjs?v=20261108-10";
import {
  clamp,
  dist,
  freshState,
  validateSave,
  readSave,
  writeSave,
  completeStep,
  buyUpgrade,
  advanceFlight,
  collisionResponse,
  steerTo,
  segmentHitsSphere,
} from "./systems.mjs?v=20261108-4";
import { SpaceRenderer } from "./render.mjs";
import { SpaceAudio } from "./audio.mjs";
const $ = (id) => document.getElementById(id),
  T = window.THREE;
const storage = {
  getItem: (k) => localStorage.getItem(k),
  setItem: (k, v) => localStorage.setItem(k, v),
};
const saved = readSave(storage);
let state = saved.state || freshState(),
  renderer,
  ready = false,
  started = false,
  cameraMode = 0,
  paused = false,
  auto = false,
  autoGoal = false,
  destination = "earth",
  surface = null,
  rover = false,
  transition = 0,
  goal = null,
  goalType = "",
  mapWorld = "earth",
  panelType = "",
  toastTime = 0,
  saveTime = 0,
  hudTime = 0,
  frames = 0,
  fpsTime = 0,
  collisionCooldown = 0;
let dockTarget = null;
let gasLocked = false, gasCanLatch = false, gasHoldTime = 0, gasPressStart = 0;
function setGasLock(value) {
  gasLocked = value;
  $("gas-btn").setAttribute("aria-pressed", String(value));
  $("gas-btn").textContent = value ? "GAS LÅST ●" : "GAS ↑";
}
let hasSave = !!saved.state;
let ship = {
    position: arrival(WORLDS.find((b) => b.id === "saturn")),
    yaw: 0,
    pitch: 0,
    speed: 0,
  },
  keys = {},
  held = {},
  joystick = { x: 0, y: 0 },
  pointer = null;
try {
  const opt = JSON.parse(
    localStorage.getItem("fp-rymdaventyret-settings") || "null",
  );
  if (opt)
    state.settings = validateSave({ ...freshState(), settings: opt }).settings;
} catch {}
const sound = new SpaceAudio();
sound.set(state.settings);
$("save-warning").textContent = saved.error || "";
$("continue").hidden = !saved.state;
function toast(text) {
  $("toast").textContent = text;
  $("toast").classList.add("on");
  toastTime = 4;
}
function save() {
  if (!started) return;
  const safe = surface
    ? arrival(
        WORLDS.find((b) => b.id === state.world),
        state.time,
      )
    : ship.position;
  state.position = { ...safe };
  state.yaw = ship.yaw;
  state.pitch = ship.pitch;
  if (!writeSave(storage, state))
    $("save-warning").textContent =
      "Din webbläsare tillåter inte sparning just nu.";
  else hasSave = true;
}
function body() {
  return WORLDS.find((w) => w.id === state.world) || PLANETS[2];
}
function mission() {
  return MISSIONS.find((m) => m.id === state.mission);
}
function bootError(e) {
  $("loading").hidden = true;
  $("error").hidden = false;
  $("error-text").textContent =
    "Spelet behöver WebGL. Prova att ladda om, uppdatera webbläsaren eller kontrollera att grafikacceleration är på. " +
    (e?.message || "");
  console.error(e);
}
async function boot() {
  try {
    if (!T) throw Error("3D-motorn kunde inte laddas.");
    renderer = new SpaceRenderer($("space"), state.settings.quality);
    $("load-status").textContent = "Laddar raket, stationer och månbil…";
    await renderer.load((p) => {
      $("load-progress").value = p;
    });
    renderer.setPaint(state.paint, state.model, state.wings);
    ready = true;
    $("play").disabled = false;
    $("free").disabled = false;
    $("load-progress").value = 100;
    $("loading").hidden = true;
    const sp = arrival(WORLDS.find((b) => b.id === "saturn"));
    ship.position = sp;
    requestAnimationFrame(frame);
  } catch (e) {
    bootError(e);
  }
}
function start(mode = "adventure", resume = false) {
  if (!ready) {
    toast("Grafiken behöver laddas först.");
    return;
  }
  if ((started || hasSave) && !resume) {
    showPanel("newgame");
    return;
  }
  if (!resume) {
    const settings = state.settings;
    state = freshState();
    state.settings = settings;
    state.mode = mode;
    state.mission = mode === "adventure" ? "school" : null;
  }
  started = true;
  paused = false;
  destination = state.world;
  surface = null;
  rover = false;
  transition = 0;
  auto = false;
  autoGoal = false;
  renderer.clearSurface();
  ship = {
    position: state.position || arrival(body(), state.time),
    yaw: state.yaw || 0,
    pitch: state.pitch || 0,
    speed: 0,
  };
  cameraMode = 0;
  document.body.classList.remove("photo-mode");
  $("photo-btn").hidden = true;
  renderer.lastCamera = false;
  $("home").hidden = true;
  $("hud").hidden = false;
  closePanel();
  sound.start();
  sound.set(state.settings);
  renderer.setPaint(state.paint, state.model, state.wings);
  updateGoal();
  updateHud();
  save();
  toast(
    resume
      ? "Välkommen tillbaka, rymdpilot!"
      : "W / gas för att flyga. Öppna kartan för att välja planet.",
  );
}
function acceptMission(id) {
  const m = MISSIONS.find((m) => m.id === id);
  if (!m || state.completed.includes(id)) return;
  if (!started) start(hasSave ? state.mode : "adventure", hasSave);
  if (!started) return;
  state.mission = id;
  state.step = 0;
  destination = m.world;
  closePanel();
  updateGoal();
  if (surface?.id === m.world && m.steps[0][0] === "land") stepDone();
  save();
  toast("Uppdrag: " + m.name + ". Destinationen är markerad på kartan.");
}
function stepDone() {
  const completed = completeStep(state);
  sound.effect(completed ? "mission" : "collect");
  if (completed) {
    auto = false;
    autoGoal = false;
    toast(
      "Expedition klar! +" + completed.reward + " kristaller och 3 stjärnor",
    );
  } else toast("Bra jobbat! Nästa steg är markerat.");
  updateGoal();
  save();
}
function setWorld(id) {
  state.world = id;
  if (!state.discovered.includes(id)) {
    state.discovered.push(id);
    state.credits += 10;
    toast("Upptäckt: " + body().name + "! +10 kristaller");
  }
}
function targetFor(world, type, index) {
  const b = WORLDS.find((b) => b.id === world);
  const p = worldPosition(b, state.time);
  if (surface && surface.id === world && ["sample", "rescue"].includes(type)) {
    const x = [90, -120, 180, -180][index % 4],
      z = [-130, -190, 100, 170][index % 4];
    return { x, y: renderer.terrainHeight(x, z, world) + (type === "rescue" ? 0.15 : 3), z };
  }
  if (type === "dock") return renderer.stationPosition(b, state.time);
  if (world === "saturn" && ["gate", "collect"].includes(type)) {
    const a = 0.8 + index * 0.11,
      r = b.r * 1.8;
    return {
      x: p.x + Math.cos(a) * r,
      y: p.y + Math.sin(a) * r * 0.25 + 30,
      z: p.z + Math.sin(a) * r,
    };
  }
  const a = arrival(b, state.time);
  return {
    x: a.x + (index % 2 ? -55 : 35),
    y: a.y + index * 15,
    z: a.z - 70 - index * 45,
  };
}
function updateGoal() {
  const m = mission();
  if (m) {
    const step = m.steps[state.step];
    goalType = step[0];
    goal = targetFor(m.world, goalType, state.step);
    if (surface && m.world !== surface.id) goal = null;
  } else {
    goal = null;
    goalType = "";
  }
  if (renderer?.goal) renderer.setGoal(goal, goalType);
}
function navigate(id, useAuto = false) {
  destination = id;
  auto = useAuto;
  autoGoal = false;
  closePanel();
  if (surface) {
    toast("Starta från ytan innan du flyger vidare.");
    auto = false;
    return;
  }
  if (useAuto)
    toast(
      "Autopilot till " +
        WORLDS.find((w) => w.id === id).name +
        ". Styr själv för att avbryta.",
    );
  updateHud();
}
function jump(id) {
  if (!started) start("free");
  if (!ready || !started) return;
  if (surface) renderer.clearSurface();
  document.body.classList.remove("photo-mode");
  $("photo-btn").hidden = true;
  surface = null;
  rover = false;
  transition = 0;
  auto = false;
  autoGoal = false;
  destination = id;
  setWorld(id);
  ship.position = arrival(body(), state.time);
  ship.speed = 0;
  ship.pitch = 0;
  ship.yaw = 0;
  renderer.lastCamera = false;
  cameraMode = 0;
  closePanel();
  updateGoal();
  save();
  sound.effect("warp");
  toast("Framme vid " + body().name + ". Flyg fritt eller välj ett uppdrag.");
}
function doLand() {
  const b = body();
  if (!b.land) {
    toast(
      "Den här världen har ingen landningsplats. Välj Månen, Mars eller en ismåne.",
    );
    return;
  }
  if (dist(ship.position, worldPosition(b, state.time)) > b.r * 4 + 300) {
    toast("Flyg närmare landningsmarkören eller använd kartans snabbresa.");
    return;
  }
  auto = false;
  ship.speed = 0;
  transition = 2.5;
  surface = b;
  rover = false;
  renderer.makeSurface(b);
  ship.position = { x: 0, y: 32, z: 0 };
  ship.pitch = ship.yaw = 0;
  renderer.lastCamera = false;
  updateGoal();
  toast("Automatisk landning…");
  sound.effect("land");
}
function takeOff() {
  surface = null;
  rover = false;
  transition = 0;
  renderer.clearSurface();
  ship.position = arrival(body(), state.time);
  ship.speed = 5;
  ship.pitch = ship.yaw = 0;
  renderer.lastCamera = false;
  updateGoal();
  save();
  toast("Start klar. Välj nästa destination på kartan.");
}
function dockAt(station) {
  auto = false; dockTarget = null; ship.speed = 0;
  setGasLock(false); held.gas = false;
  state.fuel = state.energy = state.shield = state.health = 100;
  if (goalType === "dock" && mission()?.world === station.body.id) stepDone();
  sound.effect("dock"); showPanel("dock"); save();
}
function beginDock(id) {
  if (!started || paused || surface || transition > 0) return;
  const station = renderer.stations?.find(s => s.body.id === id);
  if (!station) return;
  resetInput(); destination = id; dockTarget = id; autoGoal = false; auto = true;
  toast("Automatisk dockning. Styr eller bromsa för att avbryta.");
  updateHud();
}
function interact() {
  if (!started || paused) return;
  if (transition > 0) return;
  if (surface) {
    if (!rover) {
      rover = true;
      ship.position = {
        x: 12,
        y: renderer.terrainHeight(12, 10, surface.id) + 0.15,
        z: 10,
      };
      ship.speed = 0;
      toast(
        "Kör månbilen med samma kontroller. E nära raketen för att återvända.",
      );
      return;
    }
    if (
      goal &&
      ["rescue", "sample"].includes(goalType) &&
      dist(ship.position, goal) < 20
    ) {
      stepDone();
      return;
    }
    if (Math.hypot(ship.position.x, ship.position.z) < 28) {
      rover = false;
      ship.speed = 0;
      showPanel("surface");
      return;
    }
    toast("Kör till provet eller återvänd till landningsplatsen.");
    return;
  }
  if (
    goal &&
    ["repair", "rescue"].includes(goalType) &&
    dist(ship.position, goal) < 35 &&
    ship.speed < 20
  ) {
    sound.effect("repair");
    stepDone();
    return;
  }
  const station = (renderer.stations || []).find(
    (s) => dist(ship.position, s.position) < 55,
  );
  if (station) {
    if (ship.speed > 20) {
      toast("Bromsa till under 20 för att docka.");
      return;
    }
    dockAt(station);
    return;
  }
  if (body().land) {
    doLand();
    return;
  }
  toast("Närma dig en station eller ett markerat uppdragsobjekt.");
}
function changeCamera() {
  cameraMode = (cameraMode + 1) % CAMERAS.length;
  document.body.classList.toggle("photo-mode", cameraMode === 4);
  $("photo-btn").hidden = cameraMode !== 4;
  renderer.lastCamera = false;
  updateHud();
  toast(
    CAMERAS[cameraMode] +
      (cameraMode >= 3 ? " · Dra för att rotera, scrolla för att zooma." : ""),
  );
}
function photo() {
  if (!renderer || !started) return;
  renderer.screenshot();
  sound.effect("collect");
  if (
    goalType === "photo" &&
    mission()?.world === state.world &&
    dist(ship.position, goal) < 250
  )
    stepDone();
  else toast("Bilden sparas på din enhet.");
}
function closePanel() {
  if ($("panel").open) $("panel").close();
  paused = false;
  panelType = "";
  resetInput();
}
function resetInput() {
  dockTarget = null;
  setGasLock(false); gasCanLatch = false; gasHoldTime = 0;
  keys = {};
  held = {};
  joystick = { x: 0, y: 0 };
  pointer = null;
  $("stick").firstElementChild.style.transform = "";
  if (started) sound.start();
}
function factHTML(b) {
  return `<h3>${b.name}</h3><p class="fact-description">${b.fact}</p><div class="fact-grid"><div><small>DIAMETER</small>${b.diameter}</div><div><small>AVSTÅND TILL SOLEN</small>${b.distance}</div><div><small>TEMPERATUR, UNGEFÄR</small>${b.temperature}</div><div><small>MÅNAR</small>${b.moons}</div></div><p class="fact-note">Fakta: <a href="https://science.nasa.gov/${b.id === "moon" ? "moon" : b.parent ? "solar-system" : b.id}/" target="_blank" rel="noopener">NASA Science ↗</a>. Spelvärldens avstånd och storlekar är förkortade. Stationer och uppdrag är påhittade.</p>`;
}
function showPanel(type) {
  panelType = type;
  paused = started;
  resetInput();
  sound.pause();
  const el = $("panel-content");
  let title = "",
    html = "";
  if (type === "pause") {
    title = "En paus bland stjärnorna";
    html = `<div class="stack"><button data-action="resume" class="primary">Fortsätt resan</button>${surface ? '<button data-action="takeoff">Starta raketen ↑</button>' : ''}<button data-panel="map">Rymdkarta</button><button data-panel="missions">Uppdrag</button><button data-panel="facts">Om planeten</button><button data-panel="garage">Raketgarage</button><button data-panel="settings">Inställningar</button><button data-action="savehome">Spara och gå till startskärmen</button><button data-panel="newgame">Nytt spel</button></div>`;
  }
  if (type === "missions") {
    title = "Dina expeditioner";
    html =
      '<p class="controls">Välj en expedition. Res sedan dit med kartan och följ markören.</p><div class="cards">' +
      MISSIONS.map(
        (m) =>
          `<article class="card ${state.completed.includes(m.id) ? "done" : state.mission === m.id ? "active" : ""}"><small>${WORLDS.find((w) => w.id === m.world).name.toUpperCase()} · ${m.reward} KRISTALLER</small><h3>${m.name}</h3><p>${m.text}</p><button data-mission="${m.id}" ${state.completed.includes(m.id) ? "disabled" : ""}>${state.completed.includes(m.id) ? "✓ Avklarat" : state.mission === m.id ? "Starta om uppdraget" : "Välj expedition"}</button></article>`,
      ).join("") +
      "</div>";
  }
  if (type === "map") {
    title = "Ditt solsystem";
    html = `<div class="map-layout"><div><canvas id="map-canvas" width="660" height="420" aria-label="Rymdkarta med planeter"></canvas><div class="planet-list">${WORLDS.map((b) => `<button data-world="${b.id}" class="${mapWorld === b.id ? "active" : ""}">${b.name}</button>`).join("")}</div><p class="fact-note">Klicka på en planet eller välj namnet. Komprimerade omloppsbanor.</p></div><div id="map-detail"></div></div>`;
  }
  if (type === "facts") {
    title = "Upptäck " + body().name;
    html = factHTML(body());
  }
  if (type === "garage") {
    title = "Ditt raketgarage";
    html = `<p>✦ ${state.credits} kristaller · ★ ${state.stars} stjärnor</p><p class="controls">Alla förbättringar låses upp genom att spela.</p><h3>Lackering</h3><div class="swatches">${[
      ["red", "#b91e2b", "Röd", 0],
      ["blue", "#246fce", "Blå", 3],
      ["gold", "#e2ac3e", "Guld", 12],
      ["purple", "#7e3cac", "Lila", 21],
    ]
      .map(
        ([id, c, n, cost]) =>
          `<button class="swatch ${state.paint === id ? "active" : ""}" style="background:${c}" data-paint="${id}" data-stars="${cost}" title="${n} · ${cost} stjärnor" aria-label="${n}, kräver ${cost} stjärnor"></button>`,
      )
      .join("")}</div><h3>Utrustning</h3><div class="cards">${[
      ["engine", "Motor", "Högre toppfart och snabbare turbo"],
      ["tank", "Bränsletank", "Längre räckvidd med mindre förbrukning"],
    ]
      .map(
        ([id, n, desc]) =>
          `<article class="card"><small>NIVÅ ${state[id]} / 3</small><h3>${n}</h3><p>${desc}</p><button data-upgrade="${id}" ${state[id] >= 3 ? "disabled" : ""}>${state[id] >= 3 ? "Fullt uppgraderad" : "Uppgradera · " + (50 + 50 * state[id]) + " ✦"}</button></article>`,
      )
      .join(
        "",
      )}<article class="card"><small>RAKETVARIANT</small><h3>Din flygstil</h3><p>Utforskaren från start. Ranger vid 9 stjärnor. Komet vid 18.</p><select id="ship-model" aria-label="Raketvariant"><option value="explorer">Utforskaren</option><option value="ranger" ${state.stars < 9 ? "disabled" : ""}>Ranger · 9 ★</option><option value="comet" ${state.stars < 18 ? "disabled" : ""}>Komet · 18 ★</option></select></article></div><div class="settings-row"><label for="wings">Vingbredd</label><select id="wings"><option value="standard">Standard</option><option value="swept" ${state.stars < 6 ? "disabled" : ""}>Breda vingar · 6 ★</option></select></div>`;
  }
  if (type === "settings") {
    title = "Gör resan till din";
    html = `<div class="settings-row"><label for="quality">Grafikkvalitet</label><select id="quality"><option value="low">Låg · lättare för mobilen</option><option value="medium">Mellan · balanserad</option><option value="high">Hög · mer detalj och skärpa</option></select></div><div class="settings-row"><label for="music">Musik</label><input id="music" type="range" min="0" max="1" step=".05" value="${state.settings.music}"></div><div class="settings-row"><label for="sound">Ljudeffekter</label><input id="sound" type="range" min="0" max="1" step=".05" value="${state.settings.sound}"></div><div class="settings-row"><label for="sensitivity">Styrkänslighet</label><input id="sensitivity" type="range" min=".3" max="2" step=".1" value="${state.settings.sensitivity}"></div><h3>Så flyger du</h3><p class="controls">W / S: gas och broms. A / D: sväng. Pil upp / ned: höjd.<br>Shift: turbo. Space: stabilisera och stanna. C: kamera. M: karta. E: interagera. Esc: paus.<br>Mobil: styrspak för riktning och höjd, gas / broms till höger. Liggande läge ger mer plats.<br>Fri kamera och fotoläge: dra i bilden för att rotera, mushjul för zoom.<br>Ljuden är cockpit- och arkadljud. I verkligheten sprids inte ljud genom rymdens vakuum.</p><p class="fact-note">Planettexturer © <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noopener">Solar System Scope</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Originalmodeller skapade i Blender. Originalmusik syntetiserad i spelet. Version ${VERSION}.</p>`;
  }
  if (type === "surface") {
    title = "Tillbaka vid raketen";
    html =
      '<p>Alla system är redo. Du kan fortsätta utforska med månbilen eller starta från ytan.</p><div class="stack"><button data-action="rover">Kör månbil</button><button data-action="takeoff" class="primary">Starta raketen ↑</button></div>';
  }
  if (type === "dock") {
    title = "Välkommen till stationen";
    html =
      '<p>Bränsle, energi, sköld och skrov är återställda.</p><div class="stack"><button data-action="resume" class="primary">Lämna stationen</button><button data-panel="garage">Besök raketgaraget</button><button data-panel="missions">Välj expedition</button></div>';
  }
  if (type === "newgame") {
    title = "Starta en ny resa?";
    html =
      '<p>Din nuvarande expedition och dina uppgraderingar ersätts när du startar ett nytt spel.</p><div class="stack"><button data-action="new-adventure" class="primary">Nytt äventyr</button><button data-action="new-free">Nytt fritt utforskande</button><button data-action="resume">Behåll min resa</button></div>';
  }
  $("panel-title").textContent = title;
  el.innerHTML = html;
  if (!$("panel").open) $("panel").showModal();
  if (type === "map") {
    drawMap();
    mapDetail();
  }
  if (type === "settings") $("quality").value = state.settings.quality;
  if (type === "garage") {
    $("ship-model").value = state.model;
    $("wings").value = state.wings;
  }
}
function mapDetail() {
  const b = WORLDS.find((w) => w.id === mapWorld) || PLANETS[2];
  $("map-detail").innerHTML =
    factHTML(b) +
    `<div class="stack"><button class="primary" data-navigate="${b.id}">Sätt destination</button><button data-auto="${b.id}">Flyg med autopilot</button><button data-jump="${b.id}">Snabbresa till ${b.name} ✧</button>${b.land ? '<small class="fact-note">Landningsplats och månbil finns här.</small>' : '<small class="fact-note">Utforska omloppsbanan. Ingen fast landningsyta.</small>'}</div>`;
}
function drawMap() {
  const canvas = $("map-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d"),
    w = canvas.width,
    h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const center = { x: w * 0.5, y: h * 0.49 };
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.scale(1, 0.54);
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.strokeStyle = "#6888ae33";
    ctx.ellipse(0, 0, 44 + i * 32, 44 + i * 32, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  const g = ctx.createRadialGradient(
    center.x,
    center.y,
    1,
    center.x,
    center.y,
    34,
  );
  g.addColorStop(0, "#fff6bc");
  g.addColorStop(0.2, "#ffb950");
  g.addColorStop(1, "#ff9e0000");
  ctx.fillStyle = g;
  ctx.fillRect(center.x - 34, center.y - 34, 68, 68);
  ctx.font = "12px system-ui";
  mapHits = [];
  PLANETS.forEach((b, i) => {
    let a = b.phase,
      r = 44 + i * 32,
      x = center.x + Math.cos(a) * r,
      y = center.y + Math.sin(a) * r * 0.54;
    ctx.beginPath();
    ctx.arc(x, y, b.id === mapWorld ? 8 : 5, 0, Math.PI * 2);
    ctx.fillStyle = "#" + b.color.toString(16).padStart(6, "0");
    ctx.fill();
    ctx.fillStyle = "#d6e6f6";
    ctx.fillText(b.name, x + 10, y + 4);
    mapHits.push({ id: b.id, x, y });
  });
  if (started) {
    const b =
        PLANETS.find((x) => x.id === state.world) ||
        PLANETS.find((x) => x.id === body().parent),
      i = PLANETS.indexOf(b);
    if (i >= 0) {
      let r = 44 + i * 32,
        x = center.x + Math.cos(b.phase) * r,
        y = center.y + Math.sin(b.phase) * r * 0.54;
      ctx.strokeStyle = "#82edff";
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#82edff";
      ctx.fillText("DU", x - 10, y - 19);
    }
  }
}
let mapHits = [];
function handleClick(e) {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.panel) {
    showPanel(b.dataset.panel);
    return;
  }
  if (b.dataset.mission) {
    acceptMission(b.dataset.mission);
    return;
  }
  if (b.dataset.world) {
    mapWorld = b.dataset.world;
    showPanel("map");
    return;
  }
  if (b.dataset.navigate) {
    navigate(b.dataset.navigate);
    return;
  }
  if (b.dataset.auto) {
    navigate(b.dataset.auto, true);
    return;
  }
  if (b.dataset.jump) {
    jump(b.dataset.jump);
    return;
  }
  if (b.dataset.upgrade) {
    toast(
      buyUpgrade(state, b.dataset.upgrade)
        ? "Uppgraderingen är installerad!"
        : "Du behöver fler kristaller.",
    );
    save();
    showPanel("garage");
    return;
  }
  if (b.dataset.paint) {
    if (state.stars < +b.dataset.stars) {
      toast("Du behöver " + b.dataset.stars + " stjärnor.");
      return;
    }
    state.paint = b.dataset.paint;
    renderer?.setPaint(state.paint, state.model, state.wings);
    save();
    showPanel("garage");
    return;
  }
  const a = b.dataset.action;
  if (a === "resume") closePanel();
  if (a === "takeoff") {
    closePanel();
    takeOff();
  }
  if (a === "rover") {
    closePanel();
    interact();
  }
  if (a === "savehome") {
    save();
    closePanel();
    started = false;
    $("hud").hidden = true;
    $("home").hidden = false;
    $("continue").hidden = false;
    document.body.classList.remove("photo-mode");
    ship = { position: arrival(PLANETS[5]), yaw: 0, pitch: 0, speed: 0 };
    renderer.clearSurface();
    surface = null;
    rover = false;
    transition = 0;
    auto = false;
    renderer.setGoal(null, "");
  }
  if (a?.startsWith("new-")) {
    started = false;
    hasSave = false;
    closePanel();
    start(a === "new-free" ? "free" : "adventure");
  }
}
document.addEventListener("click", handleClick);
document.addEventListener("change", (e) => {
  const id = e.target.id;
  if (["quality", "music", "sound", "sensitivity"].includes(id)) {
    state.settings[id] = id === "quality" ? e.target.value : +e.target.value;
    if (id === "quality") renderer?.setQuality(state.settings.quality);
    sound.set(state.settings);
    sound.start();
    try {
      localStorage.setItem(
        "fp-rymdaventyret-settings",
        JSON.stringify(state.settings),
      );
    } catch {}
    if (started) save();
  }
  if (id === "ship-model" || id === "wings") {
    state[id === "ship-model" ? "model" : "wings"] = e.target.value;
    renderer?.setPaint(state.paint, state.model, state.wings);
    save();
  }
});
$("panel").addEventListener("click", (e) => {
  if (e.target.id === "map-canvas") {
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * e.target.width,
      y = ((e.clientY - rect.top) / rect.height) * e.target.height;
    let hit = mapHits.find((p) => Math.hypot(p.x - x, p.y - y) < 22);
    if (hit) {
      mapWorld = hit.id;
      showPanel("map");
    }
  }
});
$("panel").addEventListener("cancel", (e) => {
  e.preventDefault();
  closePanel();
});
$("close-panel").onclick = closePanel;
$("play").onclick = () => start();
$("free").onclick = () => start("free");
$("continue").onclick = () => start(state.mode, true);
$("retry").onclick = () => location.reload();
$("menu-btn").onclick = () => showPanel(started ? "pause" : "settings");
$("map-btn").onclick = () => {
  mapWorld = destination;
  showPanel("map");
};
$("camera-btn").onclick = changeCamera;
$("photo-btn").onclick = photo;
$("interact").onclick = interact;
$("takeoff-btn").onclick = () => { if (surface && transition <= 0 && !paused) takeOff(); };
$("assist-btn").onclick = () => {
  if (!mission() || surface) return;
  auto = true;
  autoGoal = true;
  destination = mission().world;
  toast("Flyghjälpen följer uppdragets markör. Styr själv för att avbryta.");
};
for (const b of WORLDS.filter(b => b.station))
  $("dock-" + b.id).onclick = () => beginDock(b.id);
$("fact-btn").onclick = () => showPanel("facts");
$("autopilot-btn").onclick = () => {
  auto = false;
  toast("Autopiloten är avstängd.");
};
// Safari uses prefixed fullscreen on some devices; iPhone may only allow video fullscreen.
$("fullscreen").onclick = async () => {
  const root = document.documentElement;
  const active = document.fullscreenElement || document.webkitFullscreenElement;
  try {
    if (active) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) await exit.call(document);
      document.body.classList.remove("immersive-mode");
    } else if (document.body.classList.contains("immersive-mode")) {
      document.body.classList.remove("immersive-mode");
    } else {
      const enter = root.requestFullscreen || root.webkitRequestFullscreen;
      if (enter) await enter.call(root);
      else {
        document.body.classList.add("immersive-mode");
        toast("Utökat spelläge. För helt dold webbläsarrad på iPhone: lägg till spelet på hemskärmen och öppna därifrån.");
      }
    }
  } catch {
    document.body.classList.add("immersive-mode");
    toast("Webbläsaren tillåter inte äkta helskärm här. Utökat spelläge är aktiverat.");
  }
};
// Prevent selection/callouts without disabling click or multi-touch pointer controls.
for (const type of ["selectstart", "contextmenu", "dragstart"])
  document.addEventListener(type, (e) => {
    if (e.target.closest?.("#hud, #topbar, button, summary, #space")) e.preventDefault();
  });
window.addEventListener("keydown", (e) => {
  if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
  if (e.code === "Escape") {
    if ($("panel").open) closePanel();
    else if (started) showPanel("pause");
    return;
  }
  if (!started || paused) return;
  if (
    ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
      e.code,
    )
  )
    e.preventDefault();
  keys[e.code] = true;
  if (!e.repeat) {
    if (e.code === "KeyC") changeCamera();
    if (e.code === "KeyM") {
      mapWorld = destination;
      showPanel("map");
    }
    if (e.code === "KeyE") interact();
    if (e.code === "KeyP" && cameraMode === 4) photo();
  }
});
window.addEventListener("keyup", (e) => delete keys[e.code]);
window.addEventListener("blur", () => {
  resetInput();
  if (started && !paused) showPanel("pause");
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    resetInput();
    save();
    sound.pause();
    if (started && !paused) showPanel("pause");
  }
});
window.addEventListener("pagehide", save);
$("space").addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
  save();
  ready = false;
  paused = true;
  resetInput();
  sound.pause();
  bootError(new Error("Grafikanslutningen avbröts. Dina senaste framsteg har sparats om sparning är tillgänglig."));
});
$("stick").addEventListener("pointerdown", (e) => {
  if (!started || paused || joystick.id !== undefined) return;
  e.preventDefault();
  $("stick").setPointerCapture(e.pointerId);
  joystick.id = e.pointerId;
  moveStick(e);
});
$("stick").addEventListener("pointermove", (e) => {
  if (joystick.id === e.pointerId) moveStick(e);
});
for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
  $("stick").addEventListener(name, () => {
    joystick = { x: 0, y: 0 };
    $("stick").firstElementChild.style.transform = "";
  });
function moveStick(e) {
  const r = $("stick").getBoundingClientRect(),
    x = (e.clientX - r.left - r.width / 2) / (r.width * 0.35),
    y = (e.clientY - r.top - r.height / 2) / (r.height * 0.35);
  const m = Math.max(1, Math.hypot(x, y));
  joystick.x = x / m;
  joystick.y = -y / m;
  $("stick").firstElementChild.style.transform =
    `translate(${joystick.x * 30}px,${-joystick.y * 30}px)`;
}
for (const b of document.querySelectorAll("[data-hold]")) {
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (!started || paused) return;
    b.setPointerCapture(e.pointerId);
    const kind = b.dataset.hold;
    if (kind === "gas") {
      gasPressStart = e.timeStamp;
      gasHoldTime = 0;
      if (gasLocked) {
        setGasLock(false); gasCanLatch = false; held.gas = false;
        return;
      }
      gasCanLatch = true;
    }
    if (kind === "brake") { setGasLock(false); gasCanLatch = false; gasHoldTime = 0; }
    held[kind] = true;
    sound.start();
  });
  b.addEventListener("pointerup", (e) => {
    if (b.dataset.hold === "gas") {
      if (gasCanLatch && e.timeStamp - gasPressStart >= 600) setGasLock(true);
      gasCanLatch = false;
    }
    held[b.dataset.hold] = false;
  });
  b.addEventListener("pointercancel", () => {
    held[b.dataset.hold] = false;
    if (b.dataset.hold === "gas") { setGasLock(false); gasCanLatch = false; gasHoldTime = 0; }
  });
  b.addEventListener("lostpointercapture", () => { held[b.dataset.hold] = false; if (b.dataset.hold === "gas") gasCanLatch = false; });
  for (const type of ["touchstart", "touchmove", "touchend"])
    b.addEventListener(type, e => e.preventDefault(), { passive: false });
}
for (const type of ["gesturestart", "gesturechange", "gestureend"])
  document.addEventListener(type, e => e.preventDefault(), { passive: false });
document.addEventListener("dblclick", e => {
  if (e.target.closest?.("#hud, #space, #topbar")) e.preventDefault();
}, { passive: false });
document.addEventListener("touchmove", e => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });
document.addEventListener("wheel", e => {
  if (e.ctrlKey || e.metaKey) e.preventDefault();
}, { passive: false });
$("space").addEventListener("pointerdown", (e) => {
  if (cameraMode < 3) return;
  pointer = { x: e.clientX, y: e.clientY };
  $("space").setPointerCapture(e.pointerId);
});
$("space").addEventListener("pointermove", (e) => {
  if (pointer && cameraMode >= 3) {
    renderer.orbit.yaw -= (e.clientX - pointer.x) * 0.007;
    renderer.orbit.pitch = clamp(
      renderer.orbit.pitch + (e.clientY - pointer.y) * 0.007,
      -1.2,
      1.3,
    );
    pointer = { x: e.clientX, y: e.clientY };
  }
});
for (const ev of ["pointerup", "pointercancel", "lostpointercapture"])
  $("space").addEventListener(ev, () => (pointer = null));
// No camera zoom from wheel/trackpad gestures, including pinch-generated wheel events.
$("space").addEventListener("wheel", e => e.preventDefault(), { passive: false });
for (const id of ["stick", "space"])
  for (const type of ["touchstart", "touchmove", "touchend"])
    $(id).addEventListener(type, e => e.preventDefault(), { passive: false });
let lastTouchEnd = -Infinity;
document.addEventListener("touchend", e => {
  if (e.timeStamp - lastTouchEnd < 350) e.preventDefault();
  lastTouchEnd = e.timeStamp;
}, { passive: false, capture: true });
function updateDockTargets() {
  for (const world of WORLDS.filter(b => b.station)) {
    const button = $("dock-" + world.id);
    const station = renderer.stations?.find(s => s.body.id === world.id);
    button.hidden = true;
    if (!started || paused || surface || transition > 0 || cameraMode === 4 || !station) continue;
    const q = renderer.project(station.position);
    if (q.z <= -1 || q.z >= 1 || Math.abs(q.x) > .9 || Math.abs(q.y) > .8 || dist(ship.position,station.position) > 2500) continue;
    if (WORLDS.some(b => segmentHitsSphere(ship.position,station.position,worldPosition(b,state.time),b.r))) continue;
    button.hidden = false;
    button.style.left = (50 + q.x * 50) + "%";
    button.style.top = (50 - q.y * 50) + "%";
    button.textContent = auto && dockTarget === world.id ? "◎ Dockar…" : "◎ Docka";
    button.disabled = auto && dockTarget === world.id;
  }
}
function updateHud() {
  if (!started) return;
  const m = mission();
  $("location").textContent = body().name + (surface ? " · ytan" : "");
  $("mode-label").textContent =
    state.mode === "free"
      ? "FRITT UTFORSKANDE"
      : rover
        ? "MÅNBIL"
        : "EXPEDITION";
  $("objective").textContent = m
    ? m.steps[state.step][1]
    : "Nästa upptäckt väntar";
  $("mission-label").textContent = m
    ? m.name.toUpperCase()
    : "UTFORSKA I DIN TAKT";
  $("mission-progress").textContent = m
    ? `Steg ${state.step + 1} av ${m.steps.length} · ${WORLDS.find((b) => b.id === m.world).name}`
    : "Öppna kartan och välj en värld.";
  $("wallet").textContent = `✦ ${state.credits}  ★ ${state.stars}`;
  $("speed").textContent = Math.round(ship.speed);
  for (const k of ["fuel", "energy", "shield", "health"]) $(k).value = state[k];
  $("camera-name").textContent = CAMERAS[cameraMode];
  const b = WORLDS.find((b) => b.id === destination);
  $("destination").textContent = b?.name || "Välj på kartan";
  const d = b ? dist(ship.position, arrival(b, state.time)) : 0;
  $("distance").textContent = surface
    ? "Utforskar ytan"
    : (d < 30 ? "Framme" : Math.round(d) + " spelenheter") +
      (auto ? " · autopilot" : "");
  $("autopilot-btn").hidden = !auto;
  $("assist-btn").hidden = !m || !!surface || auto;
  $("takeoff-btn").hidden = !surface || transition > 0;
  let action = "Interagera";
  if (surface) action = rover ? "Samla / återvänd" : "Kör månbil";
  else if (
    goal &&
    ["repair", "rescue"].includes(goalType) &&
    dist(ship.position, goal) < 35
  )
    action = "Reparera";
  else if (renderer.stations?.some((s) => dist(ship.position, s.position) < 60))
    action = "Docka";
  else if (body().land) action = "Landa";
  $("interact").hidden = action === "Docka";
  $("interact").querySelector("span").textContent = action;
  $("interact").title = action + " (E)";
  $("interact").setAttribute("aria-label", action);
  $("takeoff-btn").hidden = !surface || transition > 0;
  const p = goal || (!surface ? arrival(b, state.time) : null);
  if (p) {
    const q = renderer.project(p);
    const visible = q.z < 1 && q.z > -1;
    const x = clamp(q.x, -0.85, 0.85),
      y = clamp(q.y, -0.6, 0.6);
    $("nav-marker").hidden = false;
    $("nav-marker").style.left = 50 + x * 50 + "%";
    $("nav-marker").style.top = 50 - y * 50 + "%";
    $("nav-marker").querySelector("span").textContent =
      (goal ? m?.steps[state.step][1] : b.name) +
      " · " +
      Math.round(dist(ship.position, p)) +
      (visible ? "" : " ↶");
  } else $("nav-marker").hidden = true;
  const c = $("minimap"),
    ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "#8db5d944";
  ctx.strokeRect(1, 1, 118, 88);
  ctx.fillStyle = "#78e1ff";
  ctx.beginPath();
  ctx.arc(60, 45, 3, 0, 7);
  ctx.fill();
  if (p) {
    let dx = p.x - ship.position.x,
      dz = p.z - ship.position.z,
      scale = 38 / Math.max(100, Math.hypot(dx, dz));
    ctx.fillStyle = "#ffd68c";
    ctx.beginPath();
    ctx.arc(60 + dx * scale, 45 + dz * scale, 3, 0, 7);
    ctx.fill();
  }
}
let last = 0;
function frame(ms) {
  if (!ready) return;
  requestAnimationFrame(frame);
  const elapsed = Math.max(0.001, (ms - last) / 1000 || 0.016);
  let dt = Math.min(0.05, elapsed);
  last = ms;
  if (started && !paused && held.gas && gasCanLatch && !gasLocked) {
    gasHoldTime += elapsed;
    if (gasHoldTime >= 0.6) { setGasLock(true); gasCanLatch = false; }
  }
  let input = {
    turn:
      (keys.KeyD || keys.ArrowRight ? 1 : 0) -
      (keys.KeyA || keys.ArrowLeft ? 1 : 0) +
      joystick.x,
    pitch: (keys.ArrowUp ? 1 : 0) - (keys.ArrowDown ? 1 : 0) + joystick.y,
    gas: held.brake || keys.KeyS ? -1 : held.gas || gasLocked || keys.KeyW ? 1 : 0,
    boost: held.boost || keys.ShiftLeft || keys.ShiftRight,
    brake: held.brake || keys.Space || keys.KeyS,
  };
  if (toastTime > 0) {
    toastTime -= dt;
    if (toastTime <= 0) $("toast").classList.remove("on");
  }
  if (started && !paused && cameraMode !== 4) {
    state.time += dt;
    collisionCooldown -= dt;
    if (transition > 0) {
      transition -= dt;
      const landingHeight = renderer.landingHeight || 3.18;
      ship.position.y = landingHeight + (32 - landingHeight) * Math.max(0, transition / 2.5);
      if (transition <= 0) {
        ship.position.y = landingHeight;
        if (goalType === "land" && mission()?.world === surface.id) stepDone();
        updateGoal();
        save();
        toast("Landat! Tryck E eller Kör månbil för att utforska.");
      }
    } else if (surface) {
      if (rover) {
        ship.yaw -= input.turn * dt * 1.4;
        const target = input.gas > 0 ? 18 : input.gas < 0 ? -7 : 0;
        ship.speed += (target - ship.speed) * (1 - Math.exp(-dt * 3));
        ship.position.x = clamp(
          ship.position.x - Math.sin(ship.yaw) * ship.speed * dt,
          -630,
          630,
        );
        ship.position.z = clamp(
          ship.position.z - Math.cos(ship.yaw) * ship.speed * dt,
          -630,
          630,
        );
        ship.position.y =
          renderer.terrainHeight(ship.position.x, ship.position.z, surface.id) +
          0.15;
      }
    } else {
      if (auto) {
        if (input.turn || input.pitch || input.gas || input.brake) {
          auto = false; dockTarget = null;
          toast("Du styr nu själv.");
        } else {
          const b = WORLDS.find((w) => w.id === destination);
          let target = dockTarget ? renderer.stationPosition(b, state.time) : autoGoal && goal && goalType !== "land" ? goal : arrival(b, state.time),
            d = dist(ship.position, target);
          const flyThrough = autoGoal && ["gate", "collect"].includes(goalType);
          if (d < (flyThrough ? 8 : 22)) {
            auto = false;
            ship.speed = 0;
            setWorld(b.id);
            if (dockTarget) {
              const station = renderer.stations.find(s => s.body.id === dockTarget);
              if (station) dockAt(station);
              return;
            }
            toast(autoGoal ? "Framme vid markören. Använd Interagera eller fotoläget." : "Autopiloten har nått " + b.name);
            save();
          } else {
            for (const obstacle of [{ id: "sun", r: 600 }, ...WORLDS]) {
              const p =
                obstacle.id === "sun"
                  ? { x: 0, y: 0, z: 0 }
                  : worldPosition(obstacle, state.time);
              if (
                segmentHitsSphere(ship.position, target, p, obstacle.r * 1.3)
              ) {
                target = {
                  x: p.x + obstacle.r * 1.65,
                  y: p.y + obstacle.r * 1.4 + 150,
                  z: p.z + obstacle.r * 1.8,
                };
                break;
              }
            }
            const aligned = steerTo(ship, target, dt);
            input.gas = aligned ? clamp(d / 1200, 0.024, 1) : 0;
            input.boost = aligned && d > 900;
            // Brake early enough for precise approaches at the higher cruise speed.
            input.brake = (!aligned && ship.speed > 20) || (aligned && ship.speed > Math.max(20, d * 1.2));
          }
        }
      }
      for (const c of renderer.collectibles || []) {
        c.model.visible = !state.collected.includes(c.id);
        if (c.model.visible && dist(ship.position, c.position) < 12) {
          state.collected.push(c.id);
          state.credits += 5;
          c.model.visible = false;
          sound.effect("collect");
          toast("+5 kristaller");
          save();
        }
      }
      const before = { ...ship.position };
      advanceFlight(ship, input, dt, state);
      for (const b of WORLDS) {
        const p = worldPosition(b, state.time);
        if (
          segmentHitsSphere(before, ship.position, p, b.r + 7) &&
          dist(ship.position, p) > b.r + 7
        ) {
          ship.position = before;
          ship.speed = 0;
        }
        if (collisionResponse(ship, p, b.r, state) && collisionCooldown <= 0) {
          collisionCooldown = 1.5;
          sound.effect("collision");
          toast("Sköldkontakt! Bromsa och håll avstånd till planeten.");
        }
      }
      collisionResponse(ship, { x: 0, y: 0, z: 0 }, 600, state);
      let nearest = WORLDS.map((b) => ({
        b,
        d: dist(ship.position, worldPosition(b, state.time)) - b.r,
      })).sort((a, b) => a.d - b.d)[0];
      if (
        nearest &&
        nearest.d < nearest.b.r * 3 + 400 &&
        state.world !== nearest.b.id
      ) {
        setWorld(nearest.b.id);
        save();
      }
      for (const rock of renderer.rockBounds || []) {
        const p =
          rock.type === "rings"
            ? rock.position
                .clone()
                .applyEuler(renderer.ringRocks.rotation)
                .add(renderer.planets.get("saturn").position)
            : rock.position;
        if (dist(ship.position, p) < rock.r + 5 && collisionCooldown <= 0) {
          collisionResponse(ship, p, rock.r, state);
          collisionCooldown = 1;
          sound.effect("collision");
          break;
        }
      }
      if (state.health <= 0) {
        state.health = state.shield = state.fuel = 100;
        jump(state.world);
        toast(
          "Räddningshjälpen tog dig till en säker plats. Dina framsteg finns kvar.",
        );
      }
      if (state.fuel === 0 && ship.speed < 1) {
        toast("Bränslet är slut. Använd snabbresa på kartan till en station.");
        state.fuel = 1;
      }
    }
    updateGoal();
    if (goal && mission()?.world === state.world) {
      const d = dist(ship.position, goal);
      if (goalType === "gate" && d < 18 && !surface) stepDone();
      else if (goalType === "collect" && d < 16 && !surface) stepDone();
      else if (goalType === "sample" && rover && d < 14) stepDone();
    }
    saveTime += dt;
    if (saveTime > 10) {
      saveTime = 0;
      save();
    }
  }
  renderer.update(
    paused || cameraMode === 4 ? 0 : dt,
    ship,
    started ? state.time : 0,
    {
      cameraMode,
      home: !started,
      boost: input.boost,
      rover,
      turn: input.turn,
      landing: transition > 0,
      cameraDt: paused ? 0 : dt,
    },
  );
  updateDockTargets();
  sound.update(
    dt,
    ship.speed,
    input.boost,
    started && !paused && cameraMode !== 4,
  );
  hudTime += dt;
  if (hudTime > 0.12) {
    hudTime = 0;
    updateHud();
  }
  frames++;
  fpsTime += elapsed;
  if (fpsTime > 2) {
    $("fps").textContent =
      Math.round(frames / fpsTime) +
      " FPS · " +
      state.settings.quality.toUpperCase();
    renderer.adaptResolution?.(frames / fpsTime);
    frames = 0;
    fpsTime = 0;
  }
}
boot();
