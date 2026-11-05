import {gamepadInput} from './gamepad.js';
export function controls(canvas, api) {
  const $ = id => document.getElementById(id);
  const stick = window.createRideStick($('stick'));
  const keys = new Set(), touches = new Map();
  let look = null, lastX, lastY, lastJump = -Infinity, lastForward = -Infinity, running = false;

  const pad=gamepadInput({...api,jump});
  function clear() {
    pad.reset();
    keys.clear(); touches.clear(); stick.reset(); look = null; running = false;
    lastJump = lastForward = -Infinity; api.mine(false);
  }
  function jump() {
    const now = performance.now();
    if (now - lastJump < 300) { api.fly(); lastJump = -Infinity; }
    else lastJump = now;
  }
  addEventListener('blur', clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  addEventListener('keydown', e => {
    if (!api.active() || e.metaKey || e.altKey) return;
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','F5','Escape','Tab','KeyW','KeyQ'].includes(e.code)) e.preventDefault();
    keys.add(e.code);
    if (e.repeat) return;
    if (e.code === 'Space') jump();
    if (e.code === 'KeyW') {
      const now = performance.now(); running = now-lastForward < 300; lastForward = now;
    }
    if (e.code === 'KeyE') api.pack();
    if (e.code === 'Escape') api.pause();
    if (e.code === 'F5' || e.code === 'KeyV') api.camera();
    if (e.code === 'KeyQ') api.drop(e.ctrlKey);
    if (/^Digit[1-9]$/.test(e.code)) api.slot(Number(e.code.slice(-1))-1);
  });
  addEventListener('keyup', e => { keys.delete(e.code); if (e.code === 'KeyW') running = false; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', e => {
    if (!api.active() || !e.deltaY) return;
    e.preventDefault(); api.cycle(Math.sign(e.deltaY));
  }, {passive:false});
  canvas.onpointerdown = e => {
    if (!api.active()) return;
    if (e.pointerType === 'mouse' && !document.body.classList.contains('screen-stick')) {
      if (document.pointerLockElement !== canvas) {canvas.requestPointerLock?.()?.catch?.(()=>{});return;}
      if (e.button === 0) api.mine(true);
      if (e.button === 1) { e.preventDefault(); api.pickBlock(); }
      if (e.button === 2) api.build();
    } else if (look === null) {
      look=e.pointerId; lastX=e.clientX; lastY=e.clientY; canvas.setPointerCapture(look);
    }
  };
  canvas.onpointermove = e => {
    if (!api.active()) return;
    if (e.pointerType==='mouse' && document.pointerLockElement===canvas) api.turn(e.movementX,e.movementY);
    else if (e.pointerId===look) {
      api.turn(e.clientX-lastX,e.clientY-lastY); lastX=e.clientX; lastY=e.clientY;
    }
  };
  const release = e => {
    if (e.pointerId===look) look=null;
    if (e.pointerType==='mouse' && e.button===0) api.mine(false);
  };
  window.addEventListener('pointerup',release); window.addEventListener('pointercancel',release);
  canvas.onlostpointercapture=release;
  for (const id of ['jump','down','dig']) {
    const b=$(id);
    b.onpointerdown=e=>{
      if (!api.active() || touches.has(id)) return;
      e.preventDefault(); b.setPointerCapture(e.pointerId); touches.set(id,e.pointerId);
      if (id==='jump') jump();
      if (id==='dig') api.mine(true);
    };
    b.onlostpointercapture=e=>{
      if (touches.get(id)!==e.pointerId) return;
      touches.delete(id); if(id==='dig') api.mine(false);
    };
  }
  $('build').onclick=api.build; $('pack').onclick=api.pack; $('pause').onclick=api.pause; $('cam').onclick=api.camera;
  const has=(...codes)=>codes.some(k=>keys.has(k));
  return {clear,read:(dt=0)=>{const g=pad.read(dt);return {
    f:(g.f||0)+stick.y+has('KeyW','ArrowUp')-has('KeyS','ArrowDown'),
    r:(g.r||0)+stick.x+has('KeyD','ArrowRight')-has('KeyA','ArrowLeft'),
    up:g.up||keys.has('Space')||touches.has('jump'),down:g.down||has('ShiftLeft','ShiftRight')||touches.has('down'),
    sprint:g.sprint||running||has('ControlLeft','ControlRight')||stick.y>.91
  }}};
}
