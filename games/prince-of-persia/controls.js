"use strict";

function pause() {
  if (!ready || route.done || atlasOpen) return;
  paused = !paused;
  clearInput();
  update();
}
function cancelDemo() {
  if (demo) {
    demo = false;
    update();
  }
}
const stick = $('stick'),
  knob = stick.firstElementChild;
let stickId = null,
  stickAxis = 0;
function releaseStick() {
  stickId = null;
  stickAxis = 0;
  knob.style.transform = '';
}
function dragStick(e) {
  if (e.pointerId !== stickId) return;
  const r = stick.getBoundingClientRect(),
    dx = e.clientX - r.left - r.width / 2,
    dy = e.clientY - r.top - r.height / 2;
  const radius = r.width * .29,
    ratio = Math.min(1, radius / (Math.hypot(dx, dy) || 1));
  knob.style.transform = 'translate(' + dx * ratio + 'px,' + dy * ratio + 'px)';
  stickAxis = Math.abs(dx) < r.width * .09 ? 0 : Math.sign(dx);
}
stick.onpointerdown = e => {
  if (stickId !== null || paused || route.done) return;
  e.preventDefault();
  cancelDemo();
  stickId = e.pointerId;
  stick.setPointerCapture(stickId);
  dragStick(e);
};
stick.onpointermove = dragStick;
for (const kind of ['pointerup', 'pointercancel', 'lostpointercapture']) stick.addEventListener(kind, e => {
  if (e.pointerId === stickId) releaseStick();
});
const lens = $('worldLens'),
  stage = canvas.closest('.stage');
let viewWidth = 0,
  viewHeight = 0,
  viewScale = 1;
function fitView() {
  viewWidth = stage.clientWidth;
  viewHeight = stage.clientHeight;
  viewScale = Math.max(viewWidth / 1672, viewHeight / 941);
}
function followPlayer() {
  const p = route.game.p;
  const x = clamp(viewWidth * .5 - p.x * viewScale, viewWidth - 1672 * viewScale, 0);
  const y = clamp(viewHeight * .52 - (p.y - 90) * viewScale, viewHeight - 941 * viewScale, 0);
  lens.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + viewScale + ')';
}
fitView();
new ResizeObserver(() => {
  fitView();
  followPlayer();
}).observe(stage);
function immersiveStart() {
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;
  try {
    document.documentElement.requestFullscreen().catch(() => {});
  } catch {}
}
function manual(k) {
  enablePickupAudio();
  if (!ready || paused || atlasOpen || route.done) return;
  canvas.focus({
    preventScroll: true
  });
  cancelDemo();
  controls.add(k);
  if (k === 'jump') queued = Math.min(2, queued + 1);
  if (k === 'double' && !route.game.p.dead) {
    const p = route.game.p;
    queued = p.jumping ? p.boosted ? 0 : 1 : p.ground || p.coyote > 0 ? 2 : 0;
  }
}
const key = c => ({
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'jump',
  KeyW: 'jump',
  ArrowUp: 'jump'
})[c];
addEventListener('keydown', e => {
  if (e.code === 'ArrowDown' && jungleOpen && jungleSelected && !menu.hidden && ready && !atlasOpen && opening.hidden && !['SELECT', 'INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
    e.preventDefault();
    if (!e.repeat) {
      immersiveStart();
      startBridge();
      if (bridge.active) bridgeKeys.add('forward');else if (!opening.hidden) storyDown = true;
    }
    return;
  }
  if (bridge.active) {
    if (e.code === 'ArrowUp') {
      e.preventDefault();
      return;
    }
    if (e.code === 'Escape') {
      e.preventDefault();
      openMenu();
      return;
    }
    if (bridge.done) return;
    const k = jungleKey(e.code);
    if (k) {
      e.preventDefault();
      if (k === 'jump') {
        if (!e.repeat) bridgeJump();
      } else bridgeKeys.add(k);
    }
    return;
  }
  if (!opening.hidden) {
    if (jungleStory && e.code === 'ArrowDown') {
      e.preventDefault();
      storyDown = true;
    }
    if (e.code === 'Escape' && !e.repeat) {
      e.preventDefault();
      finishStory();
    }
    return;
  }
  if (atlasOpen || !menu.hidden) return;
  if (e.code === 'Escape' && !e.repeat) {
    openMenu();
    return;
  }
  const k = key(e.code);
  if (!k || ['SELECT', 'INPUT'].includes(document.activeElement?.tagName)) return;
  if (e.code === 'Space' && document.activeElement?.tagName === 'BUTTON') return;
  e.preventDefault();
  if (!e.repeat) manual(k);
});
addEventListener('keyup', e => {
  if (e.code === 'ArrowDown' && !opening.hidden) storyDown = false;
  bridgeKeys.delete(jungleKey(e.code));
  controls.delete(key(e.code));
});
for (const b of document.querySelectorAll('[data-key]')) {
  const k = b.dataset.key;
  b.onpointerdown = e => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    b.classList.add('down');
    manual(k);
  };
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, () => {
    controls.delete(k);
    b.classList.remove('down');
  });
}
$('pause').onclick = pause;
$('retry').onclick = () => {
  clearInput();
  demo = false;
  paused = false;
  route.retry();
  persist();
  update();
  canvas.focus({
    preventScroll: true
  });
};
$('new').onclick = $('again').onclick = () => {
  startAgain();
  beginStory();
};
$('demo').onclick = () => {
  enablePickupAudio();
  if (route.done) startAgain();
  demo = !demo;
  paused = false;
  clearInput();
  update();
  canvas.focus({
    preventScroll: true
  });
  msg(demo ? 'Prinsen visar vägen. Använd en rörelseknapp för att ta över.' : 'Du styr prinsen.');
};
$('full').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();else await $('app').requestFullscreen();
  } catch {
    msg('Helskärm är inte tillgänglig i den här vyn.');
  }
};
function resetBridgeStick() {
  bridgeAxis = bridgeForward = 0;
  bridgePointer = null;
  $('bridgeStick').firstElementChild.style.transform = '';
}
const jStick = $('bridgeStick');
function steerBridge(e) {
  const box = jStick.getBoundingClientRect(),
    x = (e.clientX - box.left - box.width / 2) / (box.width * .38),
    y = (box.top + box.height / 2 - e.clientY) / (box.height * .38);
  const n = Math.max(1, Math.hypot(x, y));
  bridgeAxis = x / n;
  bridgeForward = -y / n;
  jStick.firstElementChild.style.transform = 'translate(' + bridgeAxis * box.width * .25 + 'px,' + bridgeForward * box.height * .25 + 'px)';
}
jStick.onpointerdown = e => {
  e.preventDefault();
  if (bridgePointer !== null) return;
  bridgePointer = e.pointerId;
  jStick.setPointerCapture(e.pointerId);
  steerBridge(e);
};
jStick.onpointermove = e => {
  if (e.pointerId === bridgePointer) steerBridge(e);
};
for (const kind of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  jStick.addEventListener(kind, e => {
    if (e.pointerId === bridgePointer) resetBridgeStick();
  });
}
$('bridgeJump').onpointerdown = e => {
  e.preventDefault();
  if (bridge.jumps === 0) bridgeJump();
};
for (const el of document.querySelectorAll('.jumpPair button,#stick,#bridgeStick,#bridgeJump,#bridgeDouble')) {
  for (const kind of ['contextmenu', 'selectstart', 'dragstart']) el.addEventListener(kind, e => e.preventDefault());
}
$('bridgePause').onclick = $('bridgeBack').onclick = openMenu;
function jungleKey(code) {
  return {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowDown: 'forward',
    Space: 'jump'
  }[code];
}
