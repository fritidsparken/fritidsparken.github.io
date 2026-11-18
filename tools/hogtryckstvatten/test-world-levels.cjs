// Exercise the real game and image pixels using the existing native Canvas test approach.
const { createCanvas, Image: NativeImage } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const root = path.resolve(__dirname, '../../games/hogtryckstvatten');
const output = process.env.WASH_QA_DIR;
if (output) fs.mkdirSync(output, { recursive: true });
let viewport = { width: 390, height: 844 };
const elements = new Map(), storage = new Map();
function box() { return { ...viewport, left: 0, top: 0, right: viewport.width, bottom: viewport.height }; }
function element(id) {
  if (elements.has(id)) return elements.get(id);
  const e = {
    id, style: {}, dataset: {}, attrs: {}, listeners: {}, open: false, hidden: false,
    textContent: '', innerHTML: '',
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(k, f) { this.listeners[k] = f; },
    showModal() { this.open = true; }, close() { this.open = false; }, focus() {},
    setPointerCapture() {}, getBoundingClientRect: box,
  };
  elements.set(id, e); return e;
}
const canvas = createCanvas(viewport.width, viewport.height);
Object.assign(canvas, element('scene'));
elements.set('scene', canvas);
class Image extends NativeImage {
  set src(v) { super.src = v.startsWith('assets/') ? fs.readFileSync(path.join(root, v)) : v; }
  get src() { return super.src; }
}
const isPortrait = () => viewport.width < viewport.height;
const sandbox = {
  console, Image, Math, Promise, Uint8Array, JSON, performance: { now: () => 0 },
  localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v) },
  innerWidth: 390, innerHeight: 844, devicePixelRatio: 1,
  matchMedia: query => ({ matches: query.includes('hover: hover') ? !isPortrait() : false }),
  ResizeObserver: class { observe() {} }, requestAnimationFrame() {},
  window: { addEventListener() {} },
  document: {
    querySelector: tag => ({ getBoundingClientRect: () => tag === 'header'
      ? { bottom: isPortrait() ? 116 : 125 }
      : { top: viewport.height - (isPortrait() ? 90 : 108) } }),
    getElementById: element, createElement: () => createCanvas(1, 1), addEventListener() {},
  },
};
vm.createContext(sandbox);
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...index.matchAll(/<script src="([^"?]+)(?:\?[^\"]*)?"/g)].map(m => m[1]);
let originalLevels;
for (const file of scripts) {
  if (file === 'game.js') continue;
  if (file.startsWith('world-levels')) originalLevels = JSON.stringify(sandbox.window.WASH_LEVELS);
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });
}
const source = fs.readFileSync(path.join(root, 'game.js'), 'utf8').replace(/\}\)\(\);\s*$/, `
  window.qa={load,render,sceneLayout,resize,measure,wash,snapshot,remainingPixels,menu,unlocked,
    get:()=>({level,W,H,ready,done,percent,initial,playing}),
    contexts:()=>({dc,surfaceContext,img}),
    resetStroke:()=>last=null,
    clearDirt:()=>dc.clearRect(0,0,W,H),
    addSpeck:(x,y)=>{dc.fillStyle='#314111';dc.fillRect(x,y,1,1)},
    setDone:value=>done=value,
    completePrevious:()=>{for(const l of levels)save.best[l.id]=60},
    getSave:()=>JSON.parse(JSON.stringify(save))
  };
})();`);
vm.runInContext(source, sandbox, { filename: 'game.js' });

(async () => {
  const levels = sandbox.window.WASH_LEVELS, qa = sandbox.window.qa;
  assert.strictEqual(levels.length, 100, '76 original + 24 new levels');
  assert.strictEqual(JSON.stringify(levels.slice(0, 76)), originalLevels, 'Original levels and order are unchanged');
  assert.strictEqual(new Set(levels.map(l => l.id)).size, levels.length, 'All IDs are unique');
  assert.strictEqual(levels.filter(l => l.alphaMask).length, 24);
  const result = [];
  for (let i = 76; i < levels.length; i++) {
    const l = levels[i];
    await qa.load(i);
    const state = qa.get();
    assert(state.ready && !state.done, `${l.id}: loads with dirt`);
    const { dc, surfaceContext, img } = qa.contexts();
    const clean = createCanvas(state.W, state.H), cc = clean.getContext('2d');
    cc.drawImage(img, 0, 0);
    const original = cc.getImageData(0, 0, state.W, state.H).data;
    const mask = surfaceContext.getImageData(0, 0, state.W, state.H).data;
    const dirty = dc.getImageData(0, 0, state.W, state.H).data;
    const bounds = qa.sceneLayout(viewport.width, viewport.height).bounds;
    let area = 0, lastPixel = -1;
    for (let p = 3; p < mask.length; p += 4) {
      const expected = original[p] >= l.alphaMask;
      assert.strictEqual(mask[p] > 0, expected, `${l.id}: mask matches sprite at pixel ${(p-3)/4}`);
      if (!expected) assert.strictEqual(dirty[p], 0, `${l.id}: no dirt in sky or holes`);
      if (dirty[p]) {
        const n=(p-3)/4, x=n%state.W, y=Math.floor(n/state.W);
        assert(x>=bounds.x && y>=bounds.y && x<bounds.x+bounds.w && y<bounds.y+bounds.h, `${l.id}: all required dirt is inside the visible render clip`);
      }
      if (expected) { area++; lastPixel = (p - 3) / 4; }
    }
    assert(area > 10000, `${l.id}: meaningful washable area`);
    for (const [width, height] of [[320,568], [390,844], [430,932], [768,1024], [1366,768]]) {
      viewport = { width, height }; qa.resize();
      const layout = qa.sceneLayout(width, height, { top: isPortrait() ? 126 : 135, bottom: height - (isPortrait() ? 100 : 118) });
      const t = layout.target, a = layout.actor;
      assert(t.x >= 0 && t.y >= 0 && t.x+t.w <= width+.01 && t.y+t.h <= height+.01, `${l.id}: complete building fits ${width}x${height}`);
      assert(a.x+a.w <= t.x+.01 || a.y >= t.y+t.h-.01, `${l.id}: washer does not cover building`);
      qa.render(16);
      if (output && ((width === 390) || (width === 1366 && [76,77,85,87,88,90,99].includes(i))))
        fs.writeFileSync(path.join(output, `${l.id}-${width}.png`), canvas.toBuffer('image/png'));
    }
    // Almost clean must never complete; even a single remaining real pixel matters.
    qa.clearDirt();
    const x = lastPixel % state.W, y = Math.floor(lastPixel / state.W);
    qa.addSpeck(x,y); qa.measure();
    assert(!qa.get().done && qa.remainingPixels(), `${l.id}: one dirt pixel blocks completion`);
    if (i === 77) {
      qa.snapshot(); await qa.load(i, true);
      assert(qa.remainingPixels(), 'Saved landmark dirt survives resume');
    }
    qa.resetStroke(); qa.wash(.04, {x,y}); qa.measure();
    assert(qa.get().done && !qa.remainingPixels(), `${l.id}: actual spray removes final pixel and completes`);
    assert(Number.isFinite(qa.getSave().best[l.id]), `${l.id}: result is saved`);
    if (i < 99) assert(qa.unlocked(i+1), `${l.id}: next mission unlocks`);
    result.push({ id:l.id, size:[state.W,state.H], washablePixels:area, complete:true });
  }
  // A representative full wash traverses every thin Eiffel girder and roof edge.
  viewport = {width:390,height:844}; qa.resize(); await qa.load(77); qa.render(16);
  const {W,H} = qa.get();
  for(let pass=0;pass<2 && !qa.get().done;pass++) {
    for(let y=0;y<=H+16;y+=16) {
      qa.resetStroke();
      for(let x=0;x<=W+16;x+=16) qa.wash(.04,{x,y});
    }
    qa.measure();
  }
  assert(qa.get().done, 'Entire Eiffel mission completes through real spray strokes');
  // Existing house and carnival still use their original polygon masks.
  for(const i of [0,61]) {
    await qa.load(i); assert(qa.get().ready && !qa.get().done, `Existing mission ${i} still loads`);
    assert(qa.remainingPixels(), `Existing mission ${i} retains dirt`);
  }
  qa.menu(16);
  assert(element('panelBody').innerHTML.includes('Sida 17 / 17'), 'Pagination includes all 100 missions');
  assert(element('panelBody').innerHTML.includes('Australien'), 'World mission cards show location');
  if(output) fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(result,null,2));
  console.log(`PASS: ${result.length} world levels, exact alpha masks, holes stay clean, 5 layouts each, all last-pixel completions, resume, full Eiffel wash, unlock/save, old-level regression and menu.`);
})().catch(e => { console.error(e); process.exit(1); });
