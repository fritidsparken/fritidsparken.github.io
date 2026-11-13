"use strict";

addEventListener('blur', () => {
  clearInput();
  if (bridge.active || ready && menu.hidden && !atlasOpen && !route.done) openMenu();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInput();
    if (bridge.active) openMenu();
    if (journey && opening.hidden) {
      persist();
      if (menu.hidden && !route.done) openMenu();
    }
    update();
  }
  last = performance.now();
});
const menu = $('titleMenu'),
  theme = $('theme');
let journey = Boolean(previous.v),
  jungleSelected = false,
  musicEnabled = true;
let jungleOpen = Boolean(previous.finished);
try {
  jungleOpen ||= localStorage.getItem('lostWorlds.jungle') === '1';
} catch {}
function unlockJungle() {
  jungleOpen = true;
  try {
    localStorage.setItem('lostWorlds.jungle', '1');
  } catch {}
}
if (jungleOpen) {
  palaceMax = 9;
  unlockJungle();
}
theme.volume = .45;
function musicLabel() {
  $('musicToggle').textContent = theme.paused ? 'Spela menymusik' : 'Stäng av musiken';
}
function playTheme() {
  if (musicEnabled && !menu.hidden && !document.hidden) theme.play().catch(musicLabel);
}
theme.onplay = theme.onpause = musicLabel;
function unlockMenuMusic(event) {
  if (event.target.closest('#musicToggle')) return;
  playTheme();
}
document.addEventListener('pointerdown', unlockMenuMusic, { capture: true });
document.addEventListener('keydown', unlockMenuMusic, { capture: true });
$('musicToggle').onclick = () => {
  if (theme.paused) {
    musicEnabled = true;
    playTheme();
  } else {
    musicEnabled = false;
    theme.pause();
  }
};
function refreshPalaceStages() {
  const picker = $('palaceStage');
  picker.replaceChildren();
  if (journey && !route.done) {
    const opt = document.createElement('option');
    opt.value = 'resume';
    opt.textContent = 'Fortsätt vid senaste fästet · ' + ROOMS[route.index].name;
    picker.append(opt);
  }
  ROOMS.forEach((room, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.disabled = i > palaceMax;
    opt.textContent = i + 1 + '. ' + room.name + (opt.disabled ? ' · låst' : '');
    picker.append(opt);
  });
  picker.value = journey && !route.done ? 'resume' : String(route.done ? route.index : 0);
}
function refreshMenu() {
  $('palacePick').hidden = jungleSelected;
  $('bridgePreview').hidden = !jungleOpen;
  $('chasePick').hidden = !jungleSelected;
  $('bridgePreview').textContent = bridge.resume ? 'Fortsätt i djungeln' : 'Provspela djungeln';
  $('palaceState').textContent = journey ? 'Värld 1 · Bana ' + (route.index + 1) + ' · ' + ROOMS[route.index].name : 'Värld 1 · Tio banor';
  $('jungleChoice').disabled = !jungleOpen;
  $('jungleState').textContent = jungleOpen ? 'Värld 2 · Tio banor' : 'Låst · Klara Solportens väg';
  $('playWorld').textContent = jungleSelected ? bridge.resume ? 'Fortsätt jakten' : 'Spela vald bana' : $('palaceStage').value === 'resume' ? 'Fortsätt spela' : 'Spela vald bana';
  $('playWorld').disabled = !ready;
  $('resetWorld').hidden = !journey || jungleSelected;
  $('palaceChoice').setAttribute('aria-pressed', String(!jungleSelected));
  $('jungleChoice').setAttribute('aria-pressed', String(jungleSelected));
}
function openMenu() {
  if (!opening.hidden) return;
  if (bridge.active) hideBridge();
  quietScore();
  stopEffects();
  paused = true;
  clearInput();
  menu.hidden = false;
  $('app').inert = true;
  refreshPalaceStages();
  refreshMenu();
  playTheme();
  $('palaceChoice').focus({
    preventScroll: true
  });
}
function enterWorld() {
  if (!ready || jungleSelected) return;
  journey = true;
  menu.hidden = true;
  $('app').inert = false;
  theme.pause();
  paused = false;
  last = performance.now();
  clearInput();
  persist();
  update();
  canvas.focus({
    preventScroll: true
  });
  prepareScore();
  scoreWanted = true;
  syncScore();
}
$('playWorld').onclick = () => {
  immersiveStart();
  if (jungleSelected && jungleOpen) startBridge();else {
    const selected = $('palaceStage').value;
    if (selected === 'resume') {
      enterWorld();
      return;
    }
    const i = Number(selected);
    if (!Number.isInteger(i) || i < 0 || i > palaceMax) return;
    route.done = false;
    route.bags[i] = 0;
    route.change(i);
    route.pickups = [];
    route.combo = 0;
    route.lastPickup = -Infinity;
    demo = false;
    clearInput();
    persist();
    update();
    if (i === 0) beginStory();else enterWorld();
  }
};
$('resetWorld').onclick = () => {
  if (confirm('Börja om från Palatspassagen? Dina framsteg i den här färden ersätts.')) {
    immersiveStart();
    startAgain();
    beginStory();
  }
};
$('palaceStage').onchange = refreshMenu;
$('palaceChoice').onclick = () => {
  jungleSelected = false;
  refreshMenu();
  playTheme();
};
$('jungleChoice').onclick = () => {
  jungleSelected = true;
  refreshMenu();
  playTheme();
};
$('touchPause').onclick = openMenu;
$('menuFull').onclick = () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});else document.documentElement.requestFullscreen?.().catch(() => {});
  playTheme();
};
$('menuAtlas').onclick = () => {
  $('app').inert = false;
  $('atlas').click();
  playTheme();
};
$('book').addEventListener('close', () => {
  if (!menu.hidden) $('app').inert = true;
});
$('worldMenu').onclick = () => {
  $('end').hidden = true;
  route.done = false;
  openMenu();
};
document.addEventListener('visibilitychange', () => {
  if (document.hidden) theme.pause();else if (!menu.hidden) playTheme();
});
function fillChaseStages(selected) {
  const picker = $('jungleStage');
  picker.replaceChildren();
  jungleCourses.forEach(([name], i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.disabled = i > jungleRecord.next;
    opt.textContent = i + 1 + '. ' + name + (opt.disabled ? ' · låst' : '');
    picker.append(opt);
  });
  picker.value = selected;
}
fillChaseStages(jungleRecord.next);
$('jungleStage').onchange = () => {
  bridge.resume = false;
  refreshMenu();
};
function replayCourse(level) {
  resetBridge(level);
  startTerrainFrames();
  prepareScore();
  scoreWanted = true;
  syncScore();
  bridgeCanvas.focus();
}
$('replayBridge').onclick = () => replayCourse(bridge.level);
$('nextChase').onclick = () => replayCourse((bridge.level + 1) % 10);
$('bridgePreview').onclick = () => {
  immersiveStart();
  startBridge();
};
