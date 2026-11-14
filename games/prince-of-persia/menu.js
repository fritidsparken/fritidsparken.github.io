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
  jungleSelected = false;
let jungleOpen = true;
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
function playTheme() {
  if (!menu.hidden && !document.hidden) theme.play().catch(() => {});
}
playTheme();
theme.addEventListener('loadedmetadata', playTheme);
theme.addEventListener('canplay', playTheme);
window.addEventListener('pageshow', playTheme);
function unlockMenuMusic() {
  playTheme();
}
document.addEventListener('pointerdown', unlockMenuMusic, { capture: true });
document.addEventListener('keydown', unlockMenuMusic, { capture: true });
document.addEventListener('touchstart', unlockMenuMusic, { capture: true, passive: true });
document.addEventListener('click', unlockMenuMusic, { capture: true });
window.addEventListener('focus', playTheme);
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
let moonSelected = false, caveSelected = false;
const moonNames=['Månskärans tröskel','Den blå cisternens djup','Kedjornas smedja','Trädgårdarna ovan molnen','Prismornas passage','Klockornas djup','Himlens sluss','Tidvattnets hjärta','Bron under förmörkelsen','Vägen förbi väktaren'];
const caveNames=['Lyktornas nedfärd','Färden mot blådjupet','Kristallernas tunnel','Koppargruvans kurvor','Ekoklyftans stup','De glömda spåren','Elddjupets ras','Månstenens mörker','Avgrundens växlar','Färden till flöjtens källa'];
function fillWorldStages(id,names,saveKey){
 let save={};try{save=JSON.parse(localStorage.getItem(saveKey))||{}}catch{}
 const max=9;
 const picker=$(id);picker.replaceChildren();names.forEach((name,i)=>{const option=document.createElement('option');option.value=i;option.disabled=i>max;option.textContent=(i+1)+'. '+name+(option.disabled?' · låst':'');picker.append(option)});
 picker.value=String(Math.min(9,Math.max(0,Number(save.stage)||Number(save.level)||0)));
}
fillWorldStages('moonStage',moonNames,'lostWorlds.moon.v2');fillWorldStages('caveStage',caveNames,'lostWorlds.minecart3d.v2');
let moonOpen = true;
try { moonOpen ||= localStorage.getItem('lostWorlds.moon') === '1'; } catch {}
function unlockMoon() {
  moonOpen = true;
  try { localStorage.setItem('lostWorlds.moon','1'); } catch {}
}
function refreshMenu() {
  let caveOpen=true;
  try {caveOpen ||= localStorage.getItem('lostWorlds.cave')==='1'||!!JSON.parse(localStorage.getItem('lostWorlds.moon.v2'))?.finished} catch {}
  $('caveChoice').disabled=!caveOpen;
  $('caveState').textContent=caveOpen?'Värld 4 · Tio banor':'Låst · Klara Månens akvedukt';
  $('moonChoice').disabled = !moonOpen;
  $('moonState').textContent = moonOpen ? 'Värld 3 · Tio banor' : 'Låst · Klara Djungelvärlden';
  $('moonChoice').setAttribute('aria-pressed', String(moonSelected));
  $('palacePick').hidden = jungleSelected || moonSelected || caveSelected;
  $('moonPick').hidden=!moonSelected; $('cavePick').hidden=!caveSelected;
  $('bridgePreview').hidden = !jungleOpen || moonSelected || caveSelected;
  $('chasePick').hidden = !jungleSelected || caveSelected;
  $('bridgePreview').textContent = bridge.resume ? 'Fortsätt i djungeln' : 'Provspela djungeln';
  $('palaceState').textContent = journey ? 'Värld 1 · Bana ' + (route.index + 1) + ' · ' + ROOMS[route.index].name : 'Värld 1 · Tio banor';
  $('jungleChoice').disabled = !jungleOpen;
  $('jungleState').textContent = jungleOpen ? 'Värld 2 · Tio banor' : 'Låst · Klara Solportens väg';
  $('playWorld').textContent = caveSelected ? 'Spela Flöjtens eko' : moonSelected ? 'Spela Månens akvedukt' : jungleSelected ? bridge.resume ? 'Fortsätt jakten' : 'Spela vald bana' : $('palaceStage').value === 'resume' ? 'Fortsätt spela' : 'Spela vald bana';
  $('playWorld').disabled = !ready;
  $('resetWorld').hidden = !journey || jungleSelected || moonSelected || caveSelected;
  $('palaceChoice').setAttribute('aria-pressed', String(!jungleSelected && !moonSelected && !caveSelected));
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
  if (caveSelected) { location.assign('cave.html?from=menu&stage='+encodeURIComponent($('caveStage').value)); return; }
  if (moonSelected && moonOpen) { location.assign('moon.html?from=menu&stage='+encodeURIComponent($('moonStage').value)); return; }
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
$('caveChoice').onclick = () => { caveSelected=true; moonSelected=false; jungleSelected=false; refreshMenu(); };
$('moonChoice').onclick = () => { moonSelected = true; caveSelected=false; jungleSelected = false; refreshMenu(); };
$('palaceChoice').onclick = () => {
  moonSelected = false;
  caveSelected = false;
  jungleSelected = false;
  refreshMenu();
  playTheme();
};
$('jungleChoice').onclick = () => {
  moonSelected = false;
  caveSelected = false;
  jungleSelected = true;
  refreshMenu();
  playTheme();
};
$('touchPause').onclick = openMenu;
$('menuFull').onclick = () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});else document.documentElement.requestFullscreen?.().catch(() => {});
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
    opt.disabled = false;
    opt.textContent = i + 1 + '. ' + name + (opt.disabled ? ' · låst' : '');
    picker.append(opt);
  });
  picker.value = selected;
}
jungleRecord.next=9;
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
$('nextChase').onclick = () => bridge.level === 9 ? location.assign("moon.html") : replayCourse(bridge.level + 1);
$('bridgePreview').onclick = () => {
  immersiveStart();
  startBridge();
};


