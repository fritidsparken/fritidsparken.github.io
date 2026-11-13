"use strict";

openMenu();
let count = 0;
Promise.all([loadSoundEffects(), Promise.all(Object.entries(cubeArt).map(async ([id, src]) => {
  cubeImages[id] = await loadImage(src);
})), Promise.all(Object.entries(SCENERY).map(async ([k, s]) => {
  [flowImages[k], fireImages[k], hearthImages[k]] = await Promise.all([loadImage(s.map), loadImage(s.flames), loadImage(s.hearth)]);
})), Promise.all(Object.entries(sources).map(async ([k, src]) => {
  images[k] = await loadImage(src);
  $('loadingText').textContent = 'Öppnar palatset · ' + ++count + ' / ' + Object.keys(sources).length;
}))]).then(() => {
  openPalace();
  ready = true;
  document.querySelectorAll('[data-load]').forEach(b => b.disabled = false);
  $('loading').hidden = true;
  refreshMenu();
  update();
  msg(previous.v && !previous.finished ? 'Du fortsätter från ditt senaste fäste.' : 'Gå åt höger för att börja. Hoppa nära kanten.');
  last = performance.now();
  requestAnimationFrame(frame);
}).catch(() => {
  $('loadingText').textContent = 'Spelets bilder kunde inte laddas. Ladda om sidan och försök igen.';
});
