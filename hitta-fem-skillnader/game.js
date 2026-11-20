/* Hitta 5 skillnader. Progress is stored only in this browser. */
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
    live: $('liveMessage'), help: $('helpDialog'), completion: $('completionDialog'),
    levelSelect: $('levelSelect'), previous: $('previousLevel'), next: $('nextLevel'),
    difficulty: $('difficultyLabel'), zoom: $('zoomButton'), nextComplete: $('completionNextButton')
  };
  const allLevels = window.FP_DIFFERENCE_LEVELS || [];
  let levels = allLevels;
  const storageKey = 'fp-five-differences-progress-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch {}
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) saved = {};
  const validIds = new Set(allLevels.map(level => level.id));
  const state = {
    level: null, found: new Set(), ready: false, loading: 0, ratio: 1.5,
    cursor: {x: .5, y: .5}, hintId: null, hintTimer: 0, feedbackTimer: 0,
    completeTimer: 0, layoutFrame: 0, levelIndex: Math.max(0, levels.findIndex(level => level.id === saved.current)),
    completed: new Set((Array.isArray(saved.completed) ? saved.completed : []).filter(id => validIds.has(id))),
    rounds: saved.rounds && typeof saved.rounds === 'object' && !Array.isArray(saved.rounds) ? saved.rounds : {},
    zoom: 1, camera: {x: .5, y: .5}
  };

  function saveProgress() {
    if (!state.level) return;
    state.rounds[state.level.id] = [...state.found];
    const rounds = Object.fromEntries(allLevels.map(level => [level.id,
      (Array.isArray(state.rounds[level.id]) ? state.rounds[level.id] : []).filter(id => level.targets.some(target => target.id === id))
    ]));
    try { localStorage.setItem(storageKey, JSON.stringify({current: state.level.id, completed: [...state.completed], rounds})); } catch {}
  }

  function updateNavigation() {
    ui.levelSelect.replaceChildren(...levels.map((level, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `${index + 1}/${levels.length} · ${level.title}${state.completed.has(level.id) ? ' ✓' : ''}`;
      return option;
    }));
    ui.levelSelect.value = String(state.levelIndex);
    ui.previous.disabled = state.levelIndex <= 0;
    ui.next.disabled = state.levelIndex >= levels.length - 1;
    ui.difficulty.textContent = levels[state.levelIndex]?.difficultyLabel || 'Start';
    ui.difficulty.dataset.difficulty = String(levels[state.levelIndex]?.difficulty || 0);
  }

  function cameraBounds() {
    const half = .5 / state.zoom;
    state.camera.x = Math.max(half, Math.min(1 - half, state.camera.x));
    state.camera.y = Math.max(half, Math.min(1 - half, state.camera.y));
    return {left: state.camera.x - half, top: state.camera.y - half};
  }

  function applyZoom() {
    const {left, top} = cameraBounds();
    ui.boards.forEach(board => {
      board.querySelector('.scene-stage').style.transform = `translate(${-left * 100 * state.zoom}%, ${-top * 100 * state.zoom}%) scale(${state.zoom})`;
      board.classList.toggle('is-zoomed', state.zoom > 1);
    });
    ui.zoom.setAttribute('aria-pressed', String(state.zoom > 1));
    ui.zoom.setAttribute('aria-label', state.zoom > 1 ? 'Visa hela bilderna' : 'Förstora båda bilderna');
    ui.zoom.title = state.zoom > 1 ? 'Visa hela bilderna' : 'Förstora båda bilderna';
    $('zoomText').textContent = state.zoom > 1 ? 'Översikt' : 'Förstora';
  }

  function toggleZoom() {
    if (!state.ready) return;
    state.zoom = state.zoom === 1 ? 2 : 1;
    if (state.zoom === 1) state.camera = {x: .5, y: .5};
    applyZoom();
    feedback(state.zoom > 1 ? 'Dra i bilden – båda följer med.' : 'Nu ser du hela bilderna.', 2600);
  }

  function keepCursorVisible() {
    if (state.zoom === 1) return;
    const {left, top} = cameraBounds();
    const margin = .07 / state.zoom;
    if (state.cursor.x < left + margin || state.cursor.x > left + 1 / state.zoom - margin) state.camera.x = state.cursor.x;
    if (state.cursor.y < top + margin || state.cursor.y > top + 1 / state.zoom - margin) state.camera.y = state.cursor.y;
    applyZoom();
  }

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
    if (state.zoom > 1) { state.camera = {...state.cursor}; applyZoom(); }
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
      const rx = target.rx + padding / (rect.width * state.zoom);
      const ry = target.ry + padding / (rect.height * state.zoom);
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
    if (state.found.size === 5) state.completed.add(state.level.id);
    saveProgress();
    clearHint();
    drawFound(target);
    updateProgress();
    const name = target.label ? `Du hittade ${target.label.toLocaleLowerCase('sv')}!` : 'Bra spanat!';
    feedback(`${name} ${state.found.size} av 5.`, 1700);
    if (state.found.size === 5) {
      updateNavigation();
      const hasNext = state.levelIndex < levels.length - 1;
      ui.nextComplete.hidden = !hasNext;
      $('completionTitle').textContent = state.completed.size === levels.length ? 'Alla banor är klara!' : 'Du hittade alla fem!';
      $('completionMessage').textContent = hasNext
        ? `${state.level.title} är klar! Nästa bana är ${levels[state.levelIndex + 1].title}. ${state.completed.size} av ${levels.length} banor klarade.`
        : `${state.completed.size} av ${levels.length} banor klarade. Vilka skarpa ögon!`;
      clearTimeout(state.completeTimer);
      state.completeTimer = setTimeout(() => {
        if (state.found.size !== 5) return;
        ui.completion.showModal();
        (hasNext ? ui.nextComplete : $('playAgainButton')).focus();
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

  function resetRound(save = true) {
    clearTimeout(state.completeTimer);
    clearHint();
    if (ui.completion.open) ui.completion.close();
    state.found.clear();
    state.cursor = {x: .5, y: .5};
    state.zoom = 1;
    state.camera = {x: .5, y: .5};
    applyZoom();
    ui.marks.forEach((layer) => layer.replaceChildren());
    ui.boards.forEach((board) => { board.querySelector('.keyboard-cursor').hidden = true; });
    updateCursors();
    updateProgress();
    ui.feedback.classList.remove('show');
    if (save) saveProgress();
    announce('Ny omgång. Hitta de fem sakerna som saknas i bild 2.');
  }

  async function start(index = state.levelIndex) {
    const ticket = ++state.loading;
    state.ready = false;
    resetRound(false);
    state.levelIndex = Math.max(0, Math.min(levels.length - 1, Number(index) || 0));
    updateNavigation();
    ui.area.setAttribute('aria-busy', 'true');
    ui.load.hidden = false;
    ui.load.classList.remove('error');
    ui.retry.hidden = true;
    ui.loadMessage.textContent = 'Gör i ordning bilderna…';
    ui.hint.disabled = true;
    ui.replay.disabled = true;
    ui.zoom.disabled = true;
    try {
      const level = levels[state.levelIndex];
      validateLevel(level);
      state.level = level;
      state.ratio = (level.width || 1536) / (level.height || 1024);
      sizeBoards();
      const [original, removed] = await Promise.all([loadImage(level.image), loadImage(level.removedImage)]);
      if (ticket !== state.loading) return;
      if (original.naturalWidth !== removed.naturalWidth || original.naturalHeight !== removed.naturalHeight) throw new Error('Bildernas storlek stämmer inte överens.');
      state.ratio = original.naturalWidth / original.naturalHeight;
      composeMissingObjects(original, removed, level);
      ui.image.src = original.src;
      if (ui.image.decode) await ui.image.decode();
      if (ticket !== state.loading) return;
      state.ready = true;
      const foundIds = Array.isArray(state.rounds[level.id]) ? state.rounds[level.id] : [];
      for (const target of level.targets) {
        if (foundIds.includes(target.id)) { state.found.add(target.id); drawFound(target, false); }
      }
      ui.area.setAttribute('aria-busy', 'false');
      ui.load.hidden = true;
      ui.replay.disabled = false;
      ui.zoom.disabled = false;
      updateProgress();
      sizeBoards();
      saveProgress();
      announce(`${level.title}. ${state.found.size} av 5 hittade. Fem saker saknas i bild 2.`);
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
      pointer = {id: event.pointerId, x: event.clientX, y: event.clientY, camera: {...state.camera}, moved: false};
      if (state.zoom > 1) board.setPointerCapture(event.pointerId);
      board.querySelector('.keyboard-cursor').hidden = true;
    });
    board.addEventListener('pointercancel', () => { pointer = null; });
    board.addEventListener('pointerleave', () => { if (state.zoom === 1) pointer = null; });
    board.addEventListener('pointermove', event => {
      if (!pointer || pointer.id !== event.pointerId || state.zoom === 1) return;
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      if (Math.hypot(dx, dy) < 6 && !pointer.moved) return;
      pointer.moved = true;
      const rect = board.getBoundingClientRect();
      state.camera = {x: pointer.camera.x - dx / (rect.width * state.zoom), y: pointer.camera.y - dy / (rect.height * state.zoom)};
      applyZoom();
    });
    board.addEventListener('pointerup', (event) => {
      if (!pointer || event.pointerId !== pointer.id) return;
      const moved = pointer.moved || Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 14;
      pointer = null;
      if (board.hasPointerCapture(event.pointerId)) board.releasePointerCapture(event.pointerId);
      if (moved) return;
      const rect = board.getBoundingClientRect();
      const {left, top} = cameraBounds();
      selectPoint(left + (event.clientX - rect.left) / (rect.width * state.zoom), top + (event.clientY - rect.top) / (rect.height * state.zoom), index, event.pointerType !== 'mouse');
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
        keepCursorVisible();
        board.querySelector('.keyboard-cursor').hidden = false;
        updateCursors();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!event.repeat) selectPoint(state.cursor.x, state.cursor.y, index);
      } else if (event.key.toLowerCase() === 'h') {
        event.preventDefault();
        if (!event.repeat) showHint();
      } else if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (!event.repeat) toggleZoom();
      }
    });
  });

  // Difficulty selection keeps each level's stored progress when switching groups.
  const difficultySelect = document.createElement('select');
  difficultySelect.setAttribute('aria-label', 'Välj svårighetsgrad');
  difficultySelect.style.cssText = 'font:inherit;max-width:7.2em;padding:.35em;border-radius:.6em;border:1px solid #90b8b5;background:white;color:#07575b';
  for (const [value, label] of [['alla','Alla'], ['latt','Lätt'], ['medel','Medel'], ['svar','Svår']]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    difficultySelect.append(option);
  }
  ui.difficulty.replaceWith(difficultySelect);
  ui.difficulty = document.createElement('span');
  function difficultyGroup(level) {
    return level.difficulty <= 3 ? 'latt' : level.difficulty <= 6 ? 'medel' : 'svar';
  }
  difficultySelect.addEventListener('change', () => {
    const currentId = state.level?.id;
    levels = difficultySelect.value === 'alla' ? allLevels : allLevels.filter(level => difficultyGroup(level) === difficultySelect.value);
    const currentIndex = levels.findIndex(level => level.id === currentId);
    start(currentIndex < 0 ? 0 : currentIndex);
  });

  ui.hint.addEventListener('click', showHint);
  ui.replay.addEventListener('click', () => resetRound());
  ui.retry.addEventListener('click', () => start());
  ui.zoom.addEventListener('click', toggleZoom);
  ui.levelSelect.addEventListener('change', () => start(Number(ui.levelSelect.value)));
  ui.previous.addEventListener('click', () => start(state.levelIndex - 1));
  ui.next.addEventListener('click', () => start(state.levelIndex + 1));
  ui.nextComplete.addEventListener('click', () => start(state.levelIndex + 1));
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
