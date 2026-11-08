// Real game-controller code with DOM/audio/GPU adapters. These are NOT browser tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as data from '../games/rymdaventyret/data.mjs';
import * as systems from '../games/rymdaventyret/systems.mjs';

class Element {
  constructor() { this.style = {}; this.dataset = {}; this.hidden = false; this.handlers = {}; this.children = new Map(); this.classList = { add() {}, remove() {}, toggle() {} }; }
  get firstElementChild() { return this.querySelector('i'); }
  querySelector(s) { if (!this.children.has(s)) this.children.set(s, new Element()); return this.children.get(s); }
  addEventListener(n, f) { (this.handlers[n] ||= []).push(f); }
  setAttribute(k, v) { this[k] = v; }
  getContext() { return { clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, fill() {} }; }
  showModal() { this.open = true; }
  close() { this.open = false; }
}
class Renderer {
  constructor() { this.goal = {}; this.orbit = {}; this.stations = []; this.collectibles = []; this.rockBounds = []; }
  async load() {}
  setPaint() {}
  clearSurface() { this.surface = null; }
  makeSurface(b) { this.surface = b; }
  terrainHeight() { return 0; }
  setGoal(p, type) { this.goal = { p, type }; }
  stationPosition(b, t) { const p = data.worldPosition(b, t); return { x: p.x + b.r * .5, y: p.y + b.r * .35, z: p.z + b.r * 2.1 + 80 }; }
  update(dt, ship, t) { this.stations = data.WORLDS.filter(b => b.station).map(body => ({ body, position: this.stationPosition(body, t) })); }
  project() { return { x: 0, y: 0, z: 0 }; }
  screenshot() { this.photos = (this.photos || 0) + 1; }
}
class Audio { set() {} start() {} pause() {} effect() {} update() {} }
const original = await fs.readFile(new URL('../games/rymdaventyret/main.mjs', import.meta.url), 'utf8');
async function game(saved = null) {
  const elements = new Map();
  const document = { body: new Element(), hidden: false, getElementById(id) { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); }, addEventListener() {}, querySelectorAll() { return []; } };
  const storage = new Map(saved ? [[systems.SAVE_KEY, JSON.stringify(saved)]] : []);
  const localStorage = { getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v) };
  let source = original.replace(/import\s*\{([\s\S]*?)\}\s*from\s*"\.\/(.*?)";/g, (_, names, file) => `const {${names}} = deps[${JSON.stringify(file)}];`);
  source = source.replace(/boot\(\);\s*$/, '');
  const create = new Function('deps', 'document', 'window', 'localStorage', 'requestAnimationFrame', source + `
    return {boot,start,acceptMission,navigate,jump,doLand,takeOff,interact,photo,showPanel,closePanel,handleClick,frame,save,
      read:()=>({state,ship,goal,goalType,surface,rover,transition,started,paused,renderer,joystick,auto}),
      fixture:(patch)=>{if(patch.ship)Object.assign(ship,patch.ship);if(patch.joystick)joystick=patch.joystick;if(patch.cameraMode!==undefined)cameraMode=patch.cameraMode;},
      element:id=>$(id)};`);
  const g = create({ 'data.mjs': data, 'systems.mjs': systems, 'render.mjs': { SpaceRenderer: Renderer }, 'audio.mjs': { SpaceAudio: Audio } }, document, { THREE: {}, addEventListener() {} }, localStorage, () => {});
  await g.boot();
  let now = 0;
  g.tick = (count=1) => { for(let i=0;i<count;i++)g.frame(now += 16.667); };
  g.action = action => g.handleClick({ target: { closest: () => ({ dataset: { action } }) } });
  g.storage = storage;
  return g;
}
for (const mission of data.MISSIONS) test(`controller: ${mission.name} completes through interaction and frame logic`, async () => {
  const g = await game();
  g.start(); g.acceptMission(mission.id); g.jump(mission.world); g.tick();
  const initial = g.read().state.credits;
  for (const [type] of mission.steps) {
    const {state,goal} = g.read();
    assert.equal(g.read().goalType, type);
    if (type === 'land') { g.interact(); g.tick(155); }
    else if (type === 'sample' || type === 'rescue') {
      if (!g.read().rover) g.interact();
      g.fixture({ ship: { position: {...g.read().goal}, speed: 0 } });
      g.interact();
    } else if (type === 'repair' || type === 'dock') {
      g.fixture({ ship: { position: {...goal}, speed: 0 } });
      g.interact(); g.closePanel();
    } else if (type === 'photo') {
      g.fixture({ ship: { position: {...goal}, speed: 0 }, cameraMode: 4 });
      g.photo();
    } else {
      g.fixture({ ship: { position: {...goal}, speed: 0 } });
      g.tick();
    }
  }
  assert.ok(g.read().state.completed.includes(mission.id));
  assert.equal(g.read().state.credits, initial + mission.reward);
  assert.equal(g.read().state.stars, 3);
  assert.equal(JSON.parse(g.storage.get(systems.SAVE_KEY)).mission, null);
});
test('quick travel cancels an in-progress landing before the next frame', async () => {
  const g = await game();g.start();g.jump('mars');g.doLand();
  assert.ok(g.read().transition > 0);g.jump('earth');g.tick(200);
  assert.equal(g.read().transition,0);assert.equal(g.read().surface,null);
});
test('home during landing then Continue restores orbit without a stale descent', async () => {
  const g=await game();g.start();g.jump('moon');g.doLand();g.action('savehome');
  g.start('adventure',true);g.tick(200);assert.equal(g.read().surface,null);assert.equal(g.read().transition,0);
});
test('new game protects an existing save until the explicit new-game button', async () => {
  const saved=systems.freshState();saved.credits=321;
  const g=await game(saved);g.start('free');assert.equal(g.read().started,false);assert.equal(g.read().state.credits,321);
  assert.ok(g.element('panel').open);g.action('new-free');assert.equal(g.read().started,true);assert.equal(g.read().state.mode,'free');assert.equal(g.read().state.credits,0);
});
test('mission selection on the home screen resumes existing progress',async()=>{
  const saved=systems.freshState();saved.credits=321;
  const g=await game(saved);g.acceptMission('rings');assert.equal(g.read().state.credits,321);assert.equal(g.read().state.mission,'rings');assert.equal(g.read().started,true);
});
test('accepting a landing mission while already landed advances to the ground objective',async()=>{
  const g=await game();g.start();g.jump('moon');g.doLand();g.tick(155);g.acceptMission('moonwalk');
  assert.equal(g.read().goalType,'sample');assert.equal(g.read().state.step,1);
});
test('pause clears joystick capture and visual deflection',async()=>{
  const g=await game();g.start();g.fixture({joystick:{x:1,y:1,id:4}});g.element('stick').firstElementChild.style.transform='translate(30px,30px)';
  g.showPanel('pause');g.closePanel();assert.deepEqual(g.read().joystick,{x:0,y:0});assert.equal(g.element('stick').firstElementChild.style.transform,'');
});
test('surface save/reload retains sample progress and permits relanding',async()=>{
  const g=await game();g.start();g.acceptMission('moonwalk');g.jump('moon');g.doLand();g.tick(155);g.save();
  const next=await game(JSON.parse(g.storage.get(systems.SAVE_KEY)));next.start('adventure',true);next.doLand();next.tick(155);
  assert.equal(next.read().goalType,'sample');assert.equal(next.read().state.step,1);
});

test('autopilot reaches every destination from Earth without planetary collision',async()=>{
  for(const b of data.WORLDS.filter(b=>b.id!=='earth')){
    const g=await game();g.start();g.navigate(b.id,true);
    let frames=0;
    while(g.read().auto && frames++<36000)g.tick();
    assert.equal(g.read().auto,false,`autopilot stuck en route to ${b.id}`);
    assert.equal(g.read().state.world,b.id);
    assert.equal(g.read().state.health,100);
    assert.equal(g.read().state.shield,100,`planet collision en route to ${b.id}`);
  }
});
