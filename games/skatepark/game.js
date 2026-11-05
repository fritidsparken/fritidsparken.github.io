import {
  parks,
  tricks,
  rider,
  act,
  swipeJump,
  swipeMove,
  swipeMoves,
  tick,
  reset,
  multi,
  score,
  clamp,
} from "./model.js?v=rail-3";
import { World } from "./world.js?v=park-lights-1";
import { Sound } from "./audio.js?v=river1";
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
  best: parks.map((_, i) => i===3 && !stored.riverside ? 0 : num(stored.best?.[i])),
  music: clamp(num(stored.music, 0.45), 0, 1),
  fx: clamp(num(stored.fx, 0.72), 0, 1),
  quality: ["auto", "låg", "hög"].includes(stored.quality)
    ? stored.quality
    : "auto",
  deck: 0,
  shirt: 0,
  riverside: true,
  park: (stored.park!==3 || stored.riverside) && parks[stored.park] ? stored.park : 3,
};
if (new URLSearchParams(location.search).get("bana")==="riverside") s.park=3;
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
let session=null;
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
  $("parks").innerHTML = [3, 0, 1, 2]
    .map(
      (i, position) => {
        const a = parks[i];
        return '<button class="card" data-park="' +
        i +
        '" aria-pressed="' +
        (s.park === i) +
        '"><img src="park-' +
        i +
        '.webp?v=riverside-icon-1" alt=""><div><small>0' +
        (position + 1) +
        " / " +
        a.area +
        "</small><strong>" +
        a.name +
        "</strong><span>Rekord " +
        number(s.best[i]) +
        " p</span></div></button>";
      },
    )
    .join("");
  $("hero").style.backgroundImage = 'url("park-' + s.park + '.webp?v=riverside-icon-1")';
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
const stick = createRideStick(document.querySelector(".ride-stick"));
const jumpBase = $("jumpStick");
const jumpStick = createRideStick(jumpBase);
const touchLayout = matchMedia("(pointer: coarse) and (hover: none) and (any-hover: none)");
let jumpPointer = null, keyboardUsed = false;
function updateControls() {
  const hide = !touchLayout.matches || keyboardUsed;
  if (hide && !$("touch").hidden) clearKeys();
  $("touch").hidden = hide;
}
touchLayout.addEventListener("change", () => {
  keyboardUsed = false;
  updateControls();
});
updateControls();
// Prevent Safari's double-tap zoom while playing without blocking simultaneous touches.
let lastTapEnd = 0;
document.addEventListener("touchend", (event) => {
  if (mode !== "play" || event.touches.length || event.changedTouches.length !== 1) {
    lastTapEnd = 0;
    return;
  }
  const now = performance.now();
  if (now - lastTapEnd < 300 && event.cancelable) event.preventDefault();
  lastTapEnd = now;
}, { passive: false });

window.addEventListener("pointerdown", e => {
  if (e.pointerType === "touch" && touchLayout.matches && keyboardUsed) {
    keyboardUsed = false;
    updateControls();
  }
}, true);
function readJumpGesture(e, release) {
  const gesture = jumpPointer;
  if (e.pointerId !== gesture?.id || gesture.fired || mode !== "play") return;
  const x = (e.clientX - gesture.x) / gesture.radius;
  const up = (gesture.y - e.clientY) / gesture.radius;
  const full = Math.hypot(x, up) >= .92;
  const id = swipeMove(x, up, full);
  $("jumpPreview").textContent = tricks[id][0];
  if (full || release) {
    gesture.fired = true;
    swipeJump(p, id, x, up, event);
  }
}
function clearJumpGesture() {
  jumpPointer = null;
  $("jumpPreview").textContent = "";
}
jumpBase.addEventListener("pointerdown", e => {
  if (!jumpBase.hasPointerCapture(e.pointerId)) return;
  jumpPointer = { id: e.pointerId, x: e.clientX, y: e.clientY,
    radius: jumpBase.clientWidth * .30, fired: false };
  $("jumpPreview").textContent = tricks[0][0];
});
jumpBase.addEventListener("pointermove", e => readJumpGesture(e, false));
jumpBase.addEventListener("pointerup", e => {
  if (e.pointerId !== jumpPointer?.id) return;
  readJumpGesture(e, true);
  clearJumpGesture();
});
for (const type of ["pointercancel", "lostpointercapture"]) {
  jumpBase.addEventListener(type, e => {
    if (e.pointerId === jumpPointer?.id) clearJumpGesture();
  });
}
function rideKeys() {
  return {
    ...keys,
    left: Math.max(Number(!!keys.left), -stick.x),
    right: Math.max(Number(!!keys.right), stick.x),
    go: Math.max(Number(!!keys.go), stick.y),
    brake: Math.max(Number(!!keys.brake), -stick.y),
  };
}
function clearKeys() {
  clearJumpGesture();
  jumpStick.reset();
  stick.reset();
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
  if (keys[k] && !before) act(p, rideKeys(), k, event);
}
async function start() {
  if (mode !== "home") return;
  const play = $("play");
  mode = "loading";
  $("menu").inert = true;
  play.textContent = "Laddar parken …";
  $("error").textContent = "";
  try {
    world ??= new World($("game"));
    await world.build(s.park, shirts[s.shirt][1], decks[s.deck][1], s.quality);
  } catch (e) {
    console.error(e);
    mode = "home";
    $("error").textContent =
      "3D kunde inte starta. Aktivera grafikacceleration i webbläsaren och försök igen.";
    return;
  } finally {
    $("menu").inert = false;
    play.textContent = "Spela ▶";
  }
  p = rider();
  if(s.park===3){p.x=-70;p.z=65;p.dir=-Math.PI/2;p.safe=[-70,65];}
  $("menu").hidden = true;
  $("ride").hidden = false;
  mode = "play";
  clearKeys();
  resumeAudio();
  flash(
    s.park===3 ? "Följ vägen genom tre loopar. Håll fart över hoppen!" : !$("touch").hidden
      ? "Styr med vänster spak. Svep med högerspaken för att hoppa åt det hållet och göra ett trick!"
      : "Håll W för fart. Hoppa med mellanslag och tryck Z för en kickflip!",
    6,
  );
  last = performance.now();
}
function resumeAudio() {
  try {
    if (!sound) sound = new Sound();
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
  session?.close();session=null;$('room-code').hidden=true;
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
      "<small>SKATE CLUB / HANDBOKEN</small><h2>Trickguide</h2><p>W / ↑ ger fart, S / ↓ bromsar. Styr med A/D eller ←/→. Hoppa med mellanslag. R återställer och Esc pausar. På mobilen styr du med vänster spak. Dra uppåt för fart och nedåt för broms. Svep högerspaken åt det håll du vill hoppa. Tricket beror på riktningen. Ett tryck i mitten ger en ollie.</p><p>Hoppa mot ett räcke i åkriktningen. Landa längs räcket för automatisk 50-50. Håll X för boardslide eller C för lipslide. På räcket byter Z till grind, X till boardslide och C till lipslide. Vänster eller höger tillsammans med Z ger 5-0 eller nosegrind. Hoppa med mellanslag, gör ett lufttrick och landa längs samma räcke för att fortsätta serien. På mobilen väljer ett svep på högerspaken lufttrick och håller hoppet längs räcket. Håll en manual efter landningen för att fortsätta serien. Släpp för att räkna poängen.</p>";
    html += '<h3>Högerspakens hopp</h3><div class="rows"><span>Tryck</span><b>Ollie</b>'
      + swipeMoves.map(([arrow,id]) => "<span>"+arrow+"</span><b>"+tricks[id][0]+"</b>").join("")
      + "<span>↓ Långt svep</span><b>360 shove-it</b></div>";
    for (const [title, a, b] of [
      ["Hopp och rotation", 0, 10],
      ["Grind och slide", 10, 15],
      ["Manualer", 15, 17],
      ["Riverside", 17, 18],
      ["Volter och grabs",18,22],
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
  if(panel==='lobby'&&mode==='home'){session?.close();session=null}
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
  KeyF:"volt", KeyB:"backflip", KeyG:"grab", KeyV:"melon",
  KeyZ: "z",
  KeyX: "x",
  KeyC: "c",
};
window.addEventListener("keydown", (e) => {
  if (codes[e.code] && !keyboardUsed) {
    keyboardUsed = true;
    updateControls();
  }
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
  if (dt <= 0) return;
  last = now;
  const steps = Math.max(1, Math.ceil(dt * 90));
  const controls = rideKeys();
  for (let i = 0; i < steps; i++)
    tick(p, controls, parks[s.park], dt / steps, event);
  session?.frame(p,controls,dt,now);
  world.draw(p, controls, dt);
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

$('together').onclick=()=>{
 panel='lobby';$('back').textContent='Tillbaka';
 $('dialogBody').innerHTML='<h2>Spela tillsammans</h2><p>Skapa ett rum på vald bana eller gå med hos en kompis. Upp till åtta åkare.</p><button id="host">Skapa rum</button><p><label>Rumskod <input id="invite" maxlength="8" autocapitalize="characters" autocomplete="off"></label></p><button id="join">Gå med</button><p id="room-error" role="status"></p>';
 dialog.showModal();
 async function enter(host){
  const code=host?'':$('invite').value.trim().toUpperCase();
  if(!host&&!/^[A-HJ-NP-Z2-9]{8}$/.test(code)){$('room-error').textContent='Ange rumskodens åtta tecken.';return}
  $('host').disabled=$('join').disabled=true;$('room-error').textContent='Ansluter …';
  try{
   const {openSession}=await import('./multiplayer.js');
   if(!dialog.open||panel!=='lobby')return;
   session=openSession(code,s.park,{
    async start(park){dialog.close();s.park=park;cards();await start();if(mode!=='play')throw Error();return world.scene},
    status(room,count){const label=$('room-code');label.hidden=false;label.textContent='Rum '+room+' · '+count+'/8'},
    lost(room){session=null;$('room-code').hidden=true;if(mode==='play'||mode==='paused'){flash('Anslutningen bröts. Du kan fortsätta åka själv.');return}
     if(dialog.open){$('room-error').textContent='Kunde inte ansluta. Kontrollera koden eller prova ett nytt rum.';$('host').disabled=$('join').disabled=false}else if(room)$('error').textContent='Kunde inte öppna parken.'}
   });
  }catch{$('room-error').textContent='Kunde inte ansluta.';$('host').disabled=$('join').disabled=false}
 }
 $('host').onclick=()=>enter(true);$('join').onclick=()=>enter(false);
};
