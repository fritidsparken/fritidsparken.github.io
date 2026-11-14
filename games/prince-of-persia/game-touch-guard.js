// Guard game gestures without cancelling single taps or double-tap jumping.
(() => {
  const playing = () => { const menu = document.getElementById('titleMenu'); return !menu || menu.hidden; };
  for (const name of ['gesturestart','gesturechange','gestureend']) document.addEventListener(name, e => { if (playing()) e.preventDefault(); }, {passive:false});
  document.addEventListener('touchmove', e => { if (playing() && e.touches.length > 1) e.preventDefault(); }, {passive:false});
  for (const name of ['selectstart','dragstart','contextmenu']) document.addEventListener(name, e => { if (playing()) e.preventDefault(); });
  document.addEventListener('wheel', e => { if (playing() && e.ctrlKey) e.preventDefault(); }, {passive:false});
  document.addEventListener('keydown', e => { if (playing() && (e.ctrlKey || e.metaKey) && ['+','-','=','0'].includes(e.key)) e.preventDefault(); });
})();