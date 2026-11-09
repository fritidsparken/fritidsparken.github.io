/* A small, optional window-depth experiment for the home hero. */
(() => {
  'use strict';
  const hero = document.querySelector('.std-hero');
  if (!hero) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'home-depth-toggle';
  let enabled = !reduced.matches, frame = 0, x = 0, y = 0, tx = 0, ty = 0;
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
    button.textContent = enabled ? 'Djup: på' : 'Djup: av';
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', 'Djupeffekt i välkomstbilden');
    target(0,0);
  }
  button.addEventListener('click',()=>{enabled=!enabled;sync();});
  hero.append(button);
  hero.addEventListener('pointermove', event => {
    if (!enabled || !document.body.classList.contains('std-home')) return;
    const r=hero.getBoundingClientRect();
    target(((event.clientX-r.left)/r.width-.5)*32, ((event.clientY-r.top)/r.height-.5)*20);
  },{passive:true});
  for(const name of ['pointerleave','pointerup','pointercancel']) hero.addEventListener(name,()=>target(0,0),{passive:true});
  reduced.addEventListener('change',()=>{enabled=!reduced.matches;sync();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)target(0,0);});
  sync();
})();
