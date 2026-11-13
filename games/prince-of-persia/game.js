"use strict";

const $ = id => document.getElementById(id),
  canvas = $('scene'),
  ctx = canvas.getContext('2d'),
  sources = PALACE_ART,
  images = {};
const controls = new Set(),
  SAVE_KEY = 'prinsen.solportens-vag.09';
let ready = false,
  paused = false,
  demo = false,
  queued = 0,
  last = 0,
  acc = 0,
  fade = 0,
  atlasOpen = false,
  atlasIndex = 0,
  route;
function readSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    if (s.v === 25) return s;
    if (s.v !== 9) return {};
    const oldRoom = s.room ?? 0;
    if (Array.isArray(s.bags)) s.bags.splice(6, 1);
    if (oldRoom >= 7) s.room = oldRoom - 1;
    if (oldRoom === 6) {
      s.room = 6;
      s.cp = 0;
      s.atReturn = false;
    }
    return s;
  } catch {
    return {};
  }
}
function persist() {
  if (!route) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      v: 25,
      ...route.state(),
      palaceMax,
      finished: route.done
    }));
  } catch {}
}
function msg(s) {
  $('status').textContent = s;
}
function clearInput() {
  releaseStick();
  controls.clear();
  queued = 0;
  document.querySelectorAll('[data-key]').forEach(b => b.classList.remove('down'));
}
function update() {
  const r = ROOMS[route.index];
  $('roomName').textContent = r.name;
  $('counter').textContent = String(route.index + 1).padStart(2, '0') + ' / 10';
  const bag = route.bags[route.index],
    n = (bag & 1) + (bag >> 1);
  $('loot').textContent = TREASURES[route.index][0] + ' ' + n + '/2 · ' + (n === 2 ? 'Porten är öppen' : 'Samla båda för att öppna porten');
  if (route.index === 9) $('loot').textContent = n ? 'Solsigillet är ditt · Gå till östra utgången' : 'Solsigillet sitter på armbandet';
  $('hint').textContent = r.line + (route.index ? ' Gå ut till vänster för att återvända.' : '');
  $('falls').textContent = route.falls;
  $('pause').textContent = paused ? 'Fortsätt' : 'Pausa';
  $('demo').textContent = demo ? 'Avsluta visning' : 'Visa vägen';
  Array.from($('progress').children).forEach((el, i) => {
    el.className = i < route.index ? 'past' : i === route.index ? 'current' : '';
  });
}
function onEvent(e, d) {
  actionSound(e, d);
  if (e === 'treasure' && route.index === 9) {
    pickupChime(d);
    persist();
    update();
    msg('Du har väktarens sigill. Passera honom och gå ut till höger.');
  } else if (e === 'locked' && route.index === 9) {
    msg('Hämta solsigillet från armbandet först.');
  } else if (e === 'treasure') {
    pickupChime(d);
    persist();
    update();
    msg(route.bags[route.index] === 3 ? 'Båda hittade! Du kan gå vidare till höger.' : 'Första fyndet! Ett till finns i rummet.');
  } else if (e === 'locked' && route.index === 7) {
    const b = route.bags[7];
    msg(b === 0 ? 'Båda kungasigillen saknas. Ett finns före första kuben och ett vid högra valvet.' : b === 1 ? 'Det andra kungasigillet finns strax före högra valvet.' : 'Det första kungasigillet finns på vänstra brospannet, före kuben.');
  } else if (e === 'locked') {
    msg('Porten är låst. Sök efter ' + TREASURES[route.index][0].toLowerCase() + ' i rummet.');
  } else if (e === 'checkpoint') {
    persist();
    msg('Återstartspunkt nådd.');
  } else if (e === 'cleared') {
    palaceMax = Math.max(palaceMax, d + 1);
  } else if (e === 'room') {
    fade = .38;
    persist();
    update();
    msg('Du är i ' + ROOMS[d].name);
  } else if (e === 'fall') {
    if (d === 'cube') persist();
    update();
    msg(d === 'hand' ? 'Näven träffade prinsen. Håll dig utanför skuggan.' : d === 'wave' ? 'Stötvågen träffade prinsen. Hoppa när dammet närmar sig.' : d === 'cube' ? 'Kuben träffade prinsen. Du börjar om vid rummets ingång.' : d === 'gear' ? 'Kugghjulet träffade prinsen. Hoppa över det.' : d === 'thorns' ? 'Prinsen fastnade i törnsnåret. Ta sats och hoppa över.' : d === 'jet' ? 'Vattenstrålen träffade prinsen. Hoppa högre eller vänta tills den sjunker.' : d === 'spikes' ? 'Spjuten reste sig. Hoppa över dem eller vänta tills de sjunker.' : 'Du föll. Prinsen återvänder till senaste fästet.');
  } else if (e === 'respawn') {
    msg(d === 0 ? 'Tillbaka vid rummets ingång.' : 'Tillbaka vid senaste fästet.');
  } else if (e === 'finish') {
    unlockJungle();
    demo = false;
    clearInput();
    persist();
    update();
    bridge.resume = false;
    jungleSelected = true;
    fillChaseStages(0);
    $('end').hidden = true;
    beginStory(true);
  }
}
$('explore').onclick = () => {
  route.done = false;
  route.change(8, 0, true);
  $('end').hidden = true;
  clearInput();
  persist();
  update();
  msg('Gå åt vänster för att återvända.');
  scoreWanted = true;
  syncScore();
};
const previous = readSave();
let palaceMax = clamp(Math.max(Number(previous.palaceMax) || 0, Number(previous.room) || 0, Array.isArray(previous.bags) ? previous.bags.reduce((last, bag, i) => bag ? i : last, 0) : 0, previous.finished ? 9 : 0), 0, 9);
route = new PalaceRoute(onEvent, previous.finished ? {
  ...previous,
  room: 9,
  cp: 0,
  atReturn: false
} : previous);
route.done = Boolean(previous.finished);
function startAgain() {
  route = new PalaceRoute(onEvent, {});
  paused = false;
  demo = false;
  fade = .38;
  clearInput();
  $('end').hidden = true;
  persist();
  update();
  msg('Färden börjar vid Palatspassagen.');
}
function input() {
  if (demo) return route.demoInput();
  const a = stickAxis || Number(controls.has('right')) - Number(controls.has('left')),
    j = queued > 0;
  if (j) queued--;
  return {
    axis: a,
    jump: j
  };
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
}
