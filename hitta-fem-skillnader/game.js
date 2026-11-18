/* Hitta 5 skillnader. All game state stays in this tab. */
(() => {
  'use strict';
  if (new URLSearchParams(window.location.search).get('embedded') === '1') {
    document.body.classList.add('is-embedded');
  }
  const $ = (id) => document.getElementById(id);
  const svgNS = 'http://www.w3.org/2000/svg';
  const ui = {
    area: $('playArea'), image: $('originalImage'), canvas: $('changedImage'),
    boards: [$('boardOne'), $('boardTwo')], marks: [$('marksOne'), $('marksTwo')],
    progress: $('progressText'), dots: Array.from($('progressDots').children),
    hint: $('hintButton'), replay: $('replayButton'), retry: $('retryButton'),
    load: $('loadState'), loadMessage: $('loadMessage'), feedback: $('feedback'),
    live: $('liveMessage'), help: $('helpDialog'), completion: $('completionDialog')
  };
  const state = {
    level: null, found: new Set(), ready: false, loading: 0, ratio: 1.5,
    cursor: {x: .5, y: .5}, hintId: null, hintTimer: 0, feedbackTimer: 0,
    completeTimer: 0, layoutFrame: 0
  };

  function announce(message) {
    ui.live.textContent = '';
    requestAnimationFrame(() => { ui.live.textContent = message; });
  }

  function feedback(message, duration = 2000) {
    clearTimeout(state.feedbackTimer);
    ui.feedback.textContent = message;
    ui.feedback.classList.add('show');
    state.feedbackTimer = setTimeout(() => ui.feedback.classList.remove('show'), duration);
    announce(message);
  }

  function sizeBoards() {
    cancelAnimationFrame(state.layoutFrame);
    state.layoutFrame = requestAnimationFrame(() => {
      const portrait = matchMedia('(max-width:700px) and (orientation:portrait)').matches;
      const areaStyle = getComputedStyle(ui.area);
      const width = ui.area.clientWidth - parseFloat(areaStyle.paddingLeft) - parseFloat(areaStyle.paddingRight);
      const height = ui.area.clientHeight - parseFloat(areaStyle.paddingTop) - parseFloat(areaStyle.paddingBottom);
      const gap = parseFloat(areaStyle.gap) || 0;
      const availableWidth = portrait ? width : (width - gap) / 2;
      const availableHeight = portrait ? (height - gap) / 2 : height;
      // Account for the card border: only the picture inside it has the scene's ratio.
      ui.boards.forEach((board) => {
        const card = board.parentElement;
        const border = parseFloat(getComputedStyle(card).borderLeftWidth) * 2;
        const pictureWidth = Math.max(1, Math.min(availableWidth - border, (availableHeight - border) * state.ratio));
        card.style.width = `${pictureWidth + border}px`;
        card.style.height = `${pictureWidth / state.ratio + border}px`;
      });
    });
  }

  function validateLevel(level) {
    if (!level || !level.image || !level.removedImage || !Array.isArray(level.targets) || level.targets.length !== 5) {
      throw new Error('Banan behöver två bilder och fem skillnader.');
    }
    const ids = new Set();
    for (const target of level.targets) {
      if (!target.id || ids.has(target.id) || !['x', 'y', 'rx', 'ry'].every((key) => Number.isFinite(target[key])) || target.rx <= 0 || target.ry <= 0 || target.x < 0 || target.x > 1 || target.y < 0 || target.y > 1) {
        throw new Error('Banans skillnader kunde inte läsas.');
      }
      ids.add(target.id);
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        if (image.naturalWidth && image.naturalHeight) resolve(image);
        else reject(new Error('Bilden är tom.'));
      };
      image.onerror = () => reject(new Error('Bilden kunde inte laddas.'));
      image.src = src;
    });
  }

  function targetMask(target) {
    return {...target, ...(target.mask || {})};
  }

  function drawMask(ctx, mask, width, height) {
    const points = mask.points;
    if (Array.isArray(points) && points.length >= 3) {
      ctx.beginPath();
      points.forEach((point, i) => {
        const x = (Array.isArray(point) ? point[0] : point.x) * width;
        const y = (Array.isArray(point) ? point[1] : point.y) * height;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(mask.x * width, mask.y * height, mask.rx * width, mask.ry * height, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function composeMissingObjects(original, removed, level) {
    const width = original.naturalWidth;
    const height = original.naturalHeight;
    ui.canvas.width = width;
    ui.canvas.height = height;
    const ctx = ui.canvas.getContext('2d');
    if (!ctx) throw new Error('Din webbläsare kunde inte visa bilden.');
    // Both panels start from precisely the same original pixels. The separately
    // edited picture is revealed only inside the five authored removal masks.
    ctx.drawImage(original, 0, 0, width, height);
    const patch = document.createElement('canvas');
    patch.width = width;
    patch.height = height;
    const patchCtx = patch.getContext('2d');
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!patchCtx || !maskCtx) throw new Error('Din webbläsare kunde inte visa bilden.');
    maskCtx.fillStyle = '#fff';
    for (const target of level.targets) drawMask(maskCtx, targetMask(target), width, height);
    patchCtx.drawImage(removed, 0, 0, width, height);
    patchCtx.globalCompositeOperation = 'destination-in';
    // A tiny softened border avoids a hard cut while keeping the rest identical.
    // Canvas filter is optional; browsers without it still get the exact mask.
    if ('filter' in patchCtx) patchCtx.filter = `blur(${level.maskFeather ?? 1.3}px)`;
    patchCtx.drawImage(maskCanvas, 0, 0);
    patchCtx.filter = 'none';
    ctx.drawImage(patch, 0, 0);
  }

  function ellipse(attributes) {
    const element = document.createElementNS(svgNS, 'ellipse');
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    return element;
  }

  function drawFound(target, animate = true) {
    const ring = target.ring || target;
    ui.marks.forEach((layer) => {
      const group = document.createElementNS(svgNS, 'g');
      group.dataset.target = target.id;
      if (animate) group.setAttribute('class', 'found-group');
      const position = {cx: ring.x * 1000, cy: ring.y * 1000, rx: ring.rx * 1000, ry: ring.ry * 1000};
      group.append(ellipse({...position, class: 'found-ring-outline'}), ellipse({...position, class: 'found-ring'}));
      layer.append(group);
    });
  }

  function updateProgress() {
    ui.progress.textContent = `${state.found.size} av 5 hittade`;
    ui.dots.forEach((dot, index) => dot.classList.toggle('found', index < state.found.size));
    ui.hint.disabled = !state.ready || state.found.size === 5;
  }

  function clearHint() {
    clearTimeout(state.hintTimer);
    state.hintId = null;
    ui.marks.forEach((layer) => layer.querySelectorAll('.hint-ring').forEach((ring) => ring.remove()));
  }

  function showHint() {
    if (!state.ready || state.found.size === 5) return;
    const remaining = state.level.targets.filter((target) => !state.found.has(target.id));
    const target = remaining.find((item) => item.id === state.hintId) || remaining[Math.floor(Math.random() * remaining.length)];
    clearHint();
    state.hintId = target.id;
    const rx = Math.min(.16, Math.max(target.rx * 1.8, .1));
    const ry = Math.min(.2, Math.max(target.ry * 1.8, .13));
    ui.marks.forEach((layer) => layer.append(ellipse({cx: target.x * 1000, cy: target.y * 1000, rx: rx * 1000, ry: ry * 1000, class: 'hint-ring'})));
    // A keyboard player can continue searching inside the same indicated region.
    state.cursor = {x: target.x, y: target.y};
    updateCursors();
    const horizontal = target.x < .34 ? 'till vänster' : target.x > .66 ? 'till höger' : 'i mitten';
    const vertical = target.y < .34 ? 'högt upp' : target.y > .66 ? 'långt ner' : 'på mitten';
    feedback(`Titta lite närmare ${vertical}, ${horizontal}.`, 3300);
    state.hintTimer = setTimeout(clearHint, 4200);
  }

  function showMiss(x, y, boardIndex) {
    const dot = ellipse({cx: x * 1000, cy: y * 1000, rx: 17, ry: 17 * state.ratio, class: 'miss-ring'});
    ui.marks[boardIndex].append(dot);
    setTimeout(() => dot.remove(), 600);
    feedback('Titta vidare – du hittar snart en!', 1700);
  }

  function selectPoint(x, y, boardIndex, touch = false) {
    if (!state.ready || state.found.size === 5 || x < 0 || y < 0 || x > 1 || y > 1) return;
    const rect = ui.boards[boardIndex].getBoundingClientRect();
    const padding = touch ? 8 : 3;
    const candidates = state.level.targets.map((target) => {
      const rx = target.rx + padding / rect.width;
      const ry = target.ry + padding / rect.height;
      return {target, distance: ((x - target.x) / rx) ** 2 + ((y - target.y) / ry) ** 2};
    }).filter((item) => item.distance <= 1).sort((a, b) => a.distance - b.distance);
    const match = candidates.find((item) => !state.found.has(item.target.id));
    if (!match) {
      if (candidates.length) feedback('Den har du redan hittat!', 1700);
      else showMiss(x, y, boardIndex);
      return;
    }
    const target = match.target;
    state.found.add(target.id);
    clearHint();
    drawFound(target);
    updateProgress();
    const name = target.label ? `${target.label} hittad!` : 'Bra spanat!';
    feedback(`${name} ${state.found.size} av 5.`, 1700);
    if (state.found.size === 5) {
      clearTimeout(state.completeTimer);
      state.completeTimer = setTimeout(() => {
        if (state.found.size !== 5) return;
        ui.completion.showModal();
        $('playAgainButton').focus();
        announce('Du hittade alla fem skillnader!');
      }, 900);
    }
  }

  function updateCursors() {
    ui.boards.forEach((board) => {
      const cursor = board.querySelector('.keyboard-cursor');
      cursor.style.left = `${state.cursor.x * 100}%`;
      cursor.style.top = `${state.cursor.y * 100}%`;
    });
  }

  function resetRound() {
    clearTimeout(state.completeTimer);
    clearHint();
    if (ui.completion.open) ui.completion.close();
    state.found.clear();
    state.cursor = {x: .5, y: .5};
    ui.marks.forEach((layer) => layer.replaceChildren());
    ui.boards.forEach((board) => { board.querySelector('.keyboard-cursor').hidden = true; });
    updateCursors();
    updateProgress();
    ui.feedback.classList.remove('show');
    announce('Ny omgång. Hitta de fem sakerna som saknas i bild 2.');
  }

  async function start() {
    const ticket = ++state.loading;
    state.ready = false;
    resetRound();
    ui.area.setAttribute('aria-busy', 'true');
    ui.load.hidden = false;
    ui.load.classList.remove('error');
    ui.retry.hidden = true;
    ui.loadMessage.textContent = 'Gör i ordning bilderna…';
    ui.hint.disabled = true;
    ui.replay.disabled = true;
    try {
      const level = window.FP_DIFFERENCE_LEVELS?.[0];
      validateLevel(level);
      state.level = level;
      state.ratio = (level.width || 1536) / (level.height || 1024);
      $('levelLabel').textContent = `Bana 1 · ${level.title || 'Parken'}`;
      sizeBoards();
      const [original, removed] = await Promise.all([loadImage(level.image), loadImage(level.removedImage)]);
      if (ticket !== state.loading) return;
      state.ratio = original.naturalWidth / original.naturalHeight;
      composeMissingObjects(original, removed, level);
      ui.image.src = original.src;
      if (ui.image.decode) await ui.image.decode();
      if (ticket !== state.loading) return;
      state.ready = true;
      ui.area.setAttribute('aria-busy', 'false');
      ui.load.hidden = true;
      ui.replay.disabled = false;
      updateProgress();
      sizeBoards();
      announce('Bilderna är klara. Fem saker saknas i bild 2.');
    } catch (error) {
      if (ticket !== state.loading) return;
      ui.area.setAttribute('aria-busy', 'true');
      ui.load.classList.add('error');
      ui.loadMessage.textContent = 'Bilderna kunde inte laddas. Kontrollera anslutningen och försök igen.';
      ui.retry.hidden = false;
      announce('Bilderna kunde inte laddas. Tryck på Försök igen.');
      console.warn('Hitta 5 skillnader:', error.message);
    }
  }

  ui.boards.forEach((board, index) => {
    let pointer = null;
    board.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      pointer = {id: event.pointerId, x: event.clientX, y: event.clientY};
      board.querySelector('.keyboard-cursor').hidden = true;
    });
    board.addEventListener('pointercancel', () => { pointer = null; });
    board.addEventListener('pointerleave', () => { pointer = null; });
    board.addEventListener('pointerup', (event) => {
      if (!pointer || event.pointerId !== pointer.id) return;
      const moved = Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y);
      pointer = null;
      if (moved > 14) return;
      const rect = board.getBoundingClientRect();
      selectPoint((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height, index, event.pointerType !== 'mouse');
    });
    board.addEventListener('focus', () => {
      if (board.matches(':focus-visible')) {
        board.querySelector('.keyboard-cursor').hidden = false;
        updateCursors();
      }
    });
    board.addEventListener('blur', () => { board.querySelector('.keyboard-cursor').hidden = true; });
    board.addEventListener('keydown', (event) => {
      if (!state.ready) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const step = event.shiftKey ? .008 : .03;
      const directions = {ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step]};
      if (directions[event.key]) {
        event.preventDefault();
        const [dx, dy] = directions[event.key];
        state.cursor.x = Math.max(.005, Math.min(.995, state.cursor.x + dx));
        state.cursor.y = Math.max(.005, Math.min(.995, state.cursor.y + dy));
        board.querySelector('.keyboard-cursor').hidden = false;
        updateCursors();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!event.repeat) selectPoint(state.cursor.x, state.cursor.y, index);
      } else if (event.key.toLowerCase() === 'h') {
        event.preventDefault();
        if (!event.repeat) showHint();
      }
    });
  });

  ui.hint.addEventListener('click', showHint);
  ui.replay.addEventListener('click', resetRound);
  ui.retry.addEventListener('click', start);
  $('helpButton').addEventListener('click', () => ui.help.showModal());
  $('closeHelpButton').addEventListener('click', () => ui.help.close());
  $('playAgainButton').addEventListener('click', () => { resetRound(); ui.boards[0].focus(); });
  $('viewPictureButton').addEventListener('click', () => { ui.completion.close(); ui.replay.focus(); });
  ui.help.addEventListener('click', (event) => {
    const rect = ui.help.getBoundingClientRect();
    if (event.target === ui.help && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) ui.help.close();
  });
  if (window.ResizeObserver) new ResizeObserver(sizeBoards).observe(ui.area);
  window.addEventListener('resize', sizeBoards);
  window.visualViewport?.addEventListener('resize', sizeBoards);
  start();
})();
