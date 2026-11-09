/* A small, optional window-depth experiment for the home hero. */
(() => {
  'use strict';
  const hero = document.querySelector('.std-hero');
  if (!hero) return;
  const mobile = matchMedia('(pointer: coarse)').matches;
  let sensors = false, baseline = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'home-depth-toggle';
  let enabled = !mobile && !reduced.matches, frame = 0, x = 0, y = 0, tx = 0, ty = 0;
  function render() {
    frame = 0;
    x += (tx - x) * .12; y += (ty - y) * .12;
    hero.style.setProperty('--depth-x', `${x.toFixed(2)}px`);
    hero.style.setProperty('--depth-y', `${y.toFixed(2)}px`);
    if (Math.abs(tx-x)+Math.abs(ty-y) > .05) frame = requestAnimationFrame(render);
  }
  function target(a,b) {tx=a;ty=b;if(!frame)frame=requestAnimationFrame(render);}
  function sync() {
    hero.classList.toggle('home-depth', enabled);
    button.textContent = enabled ? 'Djup: på' : mobile ? 'Aktivera rörelse' : 'Djup: av';
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', 'Djupeffekt i välkomstbilden');
    target(0,0);
  }
  const clamp = n => Math.max(-1, Math.min(1, n));
  function orientation(event) {
    if (!enabled || document.hidden || !document.body.classList.contains('std-home') || event.beta == null || event.gamma == null) return;
    if (!baseline) baseline = {beta:event.beta, gamma:event.gamma};
    const a = (screen.orientation?.angle ?? window.orientation ?? 0) * Math.PI / 180;
    const dx = ((event.gamma-baseline.gamma+540)%360)-180;
    const dy = ((event.beta-baseline.beta+540)%360)-180;
    target(clamp((dx*Math.cos(a)+dy*Math.sin(a))/25)*16,
      clamp((dy*Math.cos(a)-dx*Math.sin(a))/25)*10);
  }
  button.addEventListener('click', async () => {
    if (enabled) {enabled=false; baseline=null; sync(); return;}
    if (mobile && !sensors) {
      try {
        const api = window.DeviceOrientationEvent;
        if (!api) throw new Error('unavailable');
        if (typeof api.requestPermission === 'function' && await api.requestPermission() !== 'granted') throw new Error('denied');
        window.addEventListener('deviceorientation', orientation, {passive:true});
        sensors=true;
      } catch (_) {
        button.textContent='Rörelse nekad – försök igen';
        return;
      }
    }
    baseline=null; enabled=true; sync();
  });
  window.addEventListener('orientationchange',()=>{baseline=null;target(0,0);});
  screen.orientation?.addEventListener('change',()=>{baseline=null;target(0,0);});
  hero.append(button);
  hero.addEventListener('pointermove', event => {
    if (sensors || !enabled || !document.body.classList.contains('std-home')) return;
    const r=hero.getBoundingClientRect();
    target(((event.clientX-r.left)/r.width-.5)*32, ((event.clientY-r.top)/r.height-.5)*20);
  },{passive:true});
  for(const name of ['pointerleave','pointerup','pointercancel']) hero.addEventListener(name,()=>{if(!sensors)target(0,0);},{passive:true});
  reduced.addEventListener('change',()=>{enabled=false;baseline=null;sync();});
  document.addEventListener('visibilitychange',()=>{baseline=null;if(document.hidden)target(0,0);});
  sync();
})();
