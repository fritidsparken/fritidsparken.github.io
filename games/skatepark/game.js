import {
  parks,
  tricks,
  rider,
  act,
  tick,
  reset,
  multi,
  score,
  clamp,
} from "./model.js";
import { World } from "./world.js";
import { Sound } from "./audio.js";
const $ = (id) => document.getElementById(id),
  number = (n) => n.toLocaleString("sv-SE"),
  key = "fp-skatepark-v1";
const decks = [
    ["Lönn", 0xe4a963, 0],
    ["Korall", 0xff704f, 750],
    ["Polaris", 0x59dcff, 2800],
  ],
  shirts = [
    ["Havsgrön", 0x187e75, 0],
    ["Solgul", 0xffc245, 1200],
    ["Lila", 0x9761bf, 3800],
  ];
let stored = {};
try {
  stored = JSON.parse(localStorage.getItem(key)) || {};
} catch {}
const num = (n, f = 0) => (Number.isFinite(n) && n >= 0 ? n : f);
const s = {
  career: num(stored.career),
  best: parks.map((_, i) => num(stored.best?.[i])),
  music: clamp(num(stored.music, 0.45), 0, 1),
  fx: clamp(num(stored.fx, 0.72), 0, 1),
  quality: ["auto", "låg", "hög"].includes(stored.quality)
    ? stored.quality
    : "auto",
  deck: 0,
  shirt: 0,
  park: parks[stored.park] ? stored.park : 0,
};
for (const [slot, items] of [
  ["deck", decks],
  ["shirt", shirts],
])
  if (items[stored[slot]]?.[2] <= s.career) s[slot] = stored[slot];
function save() {
  try {
    localStorage.setItem(key, JSON.stringify(s));
  } catch {}
}
let world,
  sound,
  p,
  mode = "home",
  panel = "",
  messageTime = 0,
  last = 0;
const keys = {},
  sources = new Map(),
  dialog = $("dialog");
function cards() {
  $("parks").innerHTML = parks
    .map(
      (a, i) =>
        '<button class="card" data-park="' +
        i +
        '" aria-pressed="' +
        (s.park === i) +
        '"><img src="park-' +
        i +
        '.webp" alt=""><div><small>0' +
        (i + 1) +
        " / " +
        a.area +
        "</small><strong>" +
        a.name +
        "</strong><span>Rekord " +
        number(s.best[i]) +
        " p</span></div></button>",
    )
    .join("");
  $("hero").style.backgroundImage = 'url("park-' + s.park + '.webp")';
}
function flash(t, seconds = 3) {
  $("message").textContent = t;
  messageTime = seconds;
}
function event(type, val) {
  sound?.event(type, val);
  if (type === "trick") flash(tricks[val][0]);
  if (type === "bail") flash(p.summary);
  if (type === "bank") {
    const old = s.career;
    s.career += val;
    s.best[s.park] = Math.max(p.total, s.best[s.park]);
    save();
    const prize = [...decks, ...shirts].find(
      (a) => a[2] > old && a[2] <= s.career,
    );
    flash(p.summary + (prize ? " · Upplåst: " + prize[0] + "!" : ""), 4);
  }
}
function clearKeys() {
  sources.clear();
  for (const k of Object.keys(keys)) keys[k] = false;
  document
    .querySelectorAll(".pressed")
    .forEach((b) => b.classList.remove("pressed"));
}
function input(source, k, down) {
  if (mode !== "play") return;
  const before = keys[k];
  if (down) sources.set(source, k);
  else sources.delete(source);
  keys[k] = [...sources.values()].includes(k);
  document
    .querySelector('[data-key="' + k + '"]')
    ?.classList.toggle("pressed", keys[k]);
  if (keys[k] && !before) act(p, keys, k, event);
}
function start() {
  try {
    world ??= new World($("game"));
    world.build(s.park, shirts[s.shirt][1], decks[s.deck][1], s.quality);
  } catch (e) {
    console.error(e);
    $("error").textContent =
      "3D kunde inte starta. Aktivera grafikacceleration i webbläsaren och försök igen.";
    return;
  }
  p = rider();
  $("menu").hidden = true;
  $("ride").hidden = false;
  mode = "play";
  clearKeys();
  resumeAudio();
  flash(
    matchMedia("(pointer:coarse)").matches
      ? "Håll Fart för att rulla. Tryck Hopp och sedan Z!"
      : "Håll W för fart. Hoppa med mellanslag och tryck Z för en kickflip!",
    6,
  );
  last = performance.now();
}
function resumeAudio() {
  try {
    sound ??= new Sound();
    sound.start(s.park, s);
  } catch {
    flash("Ljudet kunde inte starta. Du kan fortsätta åka.");
  }
}
function pause() {
  if (mode !== "play") return;
  clearKeys();
  mode = "paused";
  sound?.stop();
  openPanel("pause");
}
function resume() {
  dialog.close();
  mode = "play";
  last = performance.now();
  resumeAudio();
}
function home() {
  dialog.close();
  clearKeys();
  mode = "home";
  sound?.stop();
  $("ride").hidden = true;
  $("menu").hidden = false;
  cards();
}
const button = (id, label) =>
  '<button data-panel="' + id + '">' + label + "</button>";
function openPanel(id) {
  panel = id;
  let html = "";
  $("back").textContent = id === "pause" ? "Fortsätt åka" : "Tillbaka";
  if (id === "pause")
    html =
      "<small>FRI ÅKNING / PAUS</small><h2>" +
      parks[s.park].name +
      "</h2>" +
      button("guide", "Trickguide") +
      button("settings", "Inställningar") +
      button("home", "Byt park eller utrustning");
  if (id === "guide") {
    html =
      "<small>SKATE CLUB / HANDBOKEN</small><h2>Trickguide</h2><p>W / ↑ ger fart, S / ↓ bromsar. Styr med A/D eller ←/→. Hoppa med mellanslag. R återställer och Esc pausar. På pekskärm använder du knapparna med samma namn.</p><p>Hoppa längs ett räcke och håll trickknappen när du når det. Håll en manual efter landningen för att fortsätta serien. Släpp för att räkna poängen.</p>";
    for (const [title, a, b] of [
      ["Hopp och rotation", 0, 10],
      ["Grind och slide", 10, 15],
      ["Manualer", 15, 17],
    ])
      html +=
        "<h3>" +
        title +
        '</h3><div class="rows">' +
        tricks
          .slice(a, b)
          .map(
            (t) =>
              "<span>" + t[0] + " · " + t[1] + " p</span><b>" + t[2] + "</b>",
          )
          .join("") +
        "</div>";
  }
  if (id === "settings")
    html =
      "<small>SKATE CLUB / INSTÄLLNINGAR</small><h2>Ljud och grafik</h2>" +
      [
        ["music", "Musik"],
        ["fx", "Ljudeffekter"],
      ]
        .map(
          ([k, title]) =>
            "<label>" +
            title +
            '<input aria-label="' +
            title +
            '" type="range" min="0" max="1" step=".01" data-setting="' +
            k +
            '" value="' +
            s[k] +
            '"></label>',
        )
        .join("") +
      '<label>Grafikkvalitet<select data-setting="quality">' +
      ["auto", "låg", "hög"]
        .map(
          (t) =>
            "<option " +
            (t === s.quality ? "selected" : "") +
            ">" +
            t +
            "</option>",
        )
        .join("") +
      '</select></label><h3>Ljudkällor</h3><p>Musik: Funk Game Loop av Kevin MacLeod. Hela låten, nivåjusterad och omkodad. <a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100839" target="_blank" rel="noopener">Original</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>.</p><p>Parkljud av Joseph SARDIN och Axeline T., omkodade till mono. <a href="https://bigsoundbank.com/ambiance-skate-parc-parisien-1-s3543.html" target="_blank" rel="noopener">BigSoundBank · CC0</a>. Hav och syrsor: transitking och Ted Kerr. <a href="../minigolf/assets/audio/credits.html" target="_blank" rel="noopener">Ljudkällor och licenser</a>. Brädans rörelseljud skapas i spelet.</p>';
  if (id === "kit") {
    html =
      "<small>SKATE CLUB / UTRUSTNING</small><h2>Min utrustning</h2><p>Samla poäng i valfri park. Hittills: " +
      number(s.career) +
      " poäng.</p>";
    for (const [slot, label, list] of [
      ["deck", "Bräda", decks],
      ["shirt", "Tröja", shirts],
    ])
      html +=
        "<label>" +
        label +
        '<select data-setting="' +
        slot +
        '">' +
        list
          .map(
            ([name, , goal], i) =>
              '<option value="' +
              i +
              '" ' +
              (s[slot] === i ? "selected " : "") +
              (goal > s.career ? "disabled" : "") +
              ">" +
              name +
              (goal > s.career ? " · " + number(goal) + " p" : "") +
              "</option>",
          )
          .join("") +
        "</select></label>";
  }
  $("dialogBody").innerHTML = html;
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
}
function back() {
  if (mode === "paused") {
    if (panel === "pause") resume();
    else openPanel("pause");
  } else dialog.close();
}
dialog.addEventListener("cancel", (e) => {
  e.preventDefault();
  back();
});
$("back").onclick = back;
document.addEventListener("click", (e) => {
  const park = e.target.closest("[data-park]"),
    btn = e.target.closest("[data-panel]");
  if (park) {
    s.park = Number(park.dataset.park);
    save();
    cards();
  }
  if (btn) {
    if (btn.dataset.panel === "home") home();
    else openPanel(btn.dataset.panel);
  }
});
dialog.addEventListener("input", (e) => {
  const k = e.target.dataset.setting;
  if (!k) return;
  s[k] = k === "quality" ? e.target.value : Number(e.target.value);
  save();
  sound?.volumes(s);
  if (k === "quality" && world?.scene) world.quality(s.quality);
});
$("play").onclick = start;
$("pause").onclick = pause;
function safeReset() {
  reset(p, parks[s.park]);
  world.snap = true;
  flash("Tillbaka på säker mark");
}
$("reset").onclick = safeReset;
const codes = {
  ArrowUp: "go",
  KeyW: "go",
  ArrowDown: "brake",
  KeyS: "brake",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "jump",
  KeyZ: "z",
  KeyX: "x",
  KeyC: "c",
};
window.addEventListener("keydown", (e) => {
  if (mode !== "play") return;
  if (e.code === "Escape") {
    e.preventDefault();
    pause();
    return;
  }
  if (e.code === "KeyR" && !e.repeat) safeReset();
  if (codes[e.code]) {
    e.preventDefault();
    if (!e.repeat) input(e.code, codes[e.code], true);
  }
});
window.addEventListener("keyup", (e) => {
  if (codes[e.code]) input(e.code, codes[e.code], false);
});
for (const b of document.querySelectorAll("[data-key]")) {
  b.onpointerdown = (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    input(e.pointerId, b.dataset.key, true);
  };
  b.onpointerup =
    b.onpointercancel =
    b.onlostpointercapture =
      (e) => input(e.pointerId, b.dataset.key, false);
  b.oncontextmenu = (e) => e.preventDefault();
}
window.addEventListener("blur", pause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
window.addEventListener("resize", () => world?.resize());
function frame(now) {
  requestAnimationFrame(frame);
  if (mode !== "play") return;
  const dt = Math.min(0.08, (now - last) / 1000);
  last = now;
  const steps = Math.max(1, Math.ceil(dt * 90));
  for (let i = 0; i < steps; i++)
    tick(p, keys, parks[s.park], dt / steps, event);
  world.draw(p, keys, dt);
  sound?.roll(p, s.park);
  $("total").textContent = number(p.total);
  $("best").textContent = number(s.best[s.park]);
  if (p.combo.length) {
    $("message").textContent =
      tricks[p.combo.at(-1)][0] +
      " · ×" +
      multi(p).toLocaleString("sv-SE") +
      " · " +
      number(score(p)) +
      " p";
  } else if ((messageTime -= dt) <= 0) $("message").textContent = "";
}
cards();
requestAnimationFrame(frame);
