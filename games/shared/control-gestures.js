// Apply only to game controls, including controls added after a game starts.
(() => {
  const scope = '[data-game-page], .games-page, #gameStage, body:has(.game-running)';
  const controls = 'button, [role="button"], a[href], input[type="button"], input[type="submit"], #stick, [data-move]';
  const editable = 'input:not([type="button"]):not([type="submit"]), textarea, select, [contenteditable]:not([contenteditable="false"])';
  for (const type of ['selectstart', 'dragstart', 'contextmenu']) {
    document.addEventListener(type, event => {
      const element = event.target instanceof Element ? event.target : event.target.parentElement;
      if (!element || element.closest(editable)) return;
      const control = element.closest(controls);
      if (control?.closest(scope)) event.preventDefault();
    }, true);
  }
})();
