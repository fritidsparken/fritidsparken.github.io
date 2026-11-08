// Executes the production game controller with deterministic frames and DOM/audio/render adapters.
// This verifies gameplay and UI wiring, not WebGL or pixels. Run with --experimental-vm-modules.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.window={THREE:require('../js/vendor/three.min.js')};
const { SpaceRenderer } = await import('../games/rymdaventyret/render.mjs');
import * as data from '../games/rymdaventyret/data.mjs';
import * as systems from '../games/rymdaventyret/systems.mjs';
const html = fs.readFileSync(new URL('../games/rymdaventyret/index.html',import.meta.url),'utf8');
const source = fs.readFileSync(new URL('../games/rymdaventyret/main.mjs',import.meta.url),'utf8');
async function harness() {
  const nodes = new Map(), events = {}, store = new Map();
  const context2d = new Proxy({createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]||(()=>{})});
  class Element {
    constructor(id=''){this.id=id;this.dataset={};this.style={};this.hidden=false;this.open=false;this.textContent='';this.width=660;this.height=420;this.firstElementChild={style:{}};this.classList={add(){},remove(){},toggle(){}};this.listeners={};}
    setAttribute(k,v){this[k]=v;}
    setPointerCapture(){}
    addEventListener(k,f){this.listeners[k]=f;}
    querySelector(){return this.child ||= new Element();}
    set innerHTML(s){this.html=s;for(const m of s.matchAll(/id="([^"]+)"/g)) if(!nodes.has(m[1])) nodes.set(m[1],new Element(m[1]));}
    get innerHTML(){return this.html;}
    getContext(){return context2d;}
    showModal(){this.open=true;} close(){this.open=false;}
    getBoundingClientRect(){return {left:0,top:0,width:660,height:420};}
  }
  for(const m of html.matchAll(/id="([^"]+)"/g)) nodes.set(m[1],new Element(m[1]));
  for(const kind of ['gas','boost','brake'])nodes.get(kind+'-btn').dataset.hold=kind;
  let render, nextFrame;
  class Renderer {
    constructor(){render=this;this.stations=[];this.collectibles=[];this.rockBounds=[];this.goal={};this.orbit={yaw:0,pitch:0,distance:25};}
    async load(){for(const b of data.WORLDS.filter(b=>b.station))this.stations.push({body:b,position:this.stationPosition(b,0)});}
    stationPosition(b,t){const p=data.worldPosition(b,t);return{x:p.x+b.r*.5,y:p.y+b.r*.35,z:p.z+b.r*2.1+80};}
    adaptResolution(){} setPaint(){} setQuality(){} clearSurface(){this.surface=null;} makeSurface(b){this.surface=b;} terrainHeight(x,z,id){return SpaceRenderer.prototype.terrainHeight(x,z,id);}
    setGoal(p,t){this.goalPosition=p;this.goalType=t;}
    update(dt,ship,t){for(const s of this.stations)s.position=this.stationPosition(s.body,t);}
    project(){return {x:0,y:0,z:0};} screenshot(){this.photos=(this.photos||0)+1;}
  }
  class Audio {set(){} start(){} pause(){} update(){} effect(){}}
  const sandbox = {console,Math,JSON,setTimeout:()=>{},requestAnimationFrame:f=>{nextFrame=f;},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},location:{reload(){}},window:{THREE:{},addEventListener:(k,f)=>events[k]=f},document:{body:new Element(),hidden:false,getElementById:id=>{assert.ok(nodes.has(id),'unknown DOM id '+id);return nodes.get(id);},querySelectorAll:s=>s==='[data-hold]'?['gas','boost','brake'].map(k=>nodes.get(k+'-btn')):[],addEventListener:(k,f)=>events['doc:'+k]=f}};
  const ctx=vm.createContext(sandbox);
  const deps={'./data.mjs':data,'./systems.mjs':systems,'./render.mjs':{SpaceRenderer:Renderer},'./audio.mjs':{SpaceAudio:Audio}};
  const module=new vm.SourceTextModule(source+'\nexport {state,ship,ready,started,surface,rover,transition,auto,goal,goalType,cameraMode,gasLocked};',{context:ctx});
  await module.link(spec=>{const values=deps[spec.split('?')[0]];return new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v);},{context:ctx});});
  await module.evaluate();
  await new Promise(r=>setImmediate(r));
  let ms=0;
  const tick=(n=1)=>{for(let i=0;i<n;i++){nextFrame(ms+=1000/60);}};
  const click=(id)=>{assert.ok(nodes.get(id)?.onclick,'unwired button '+id);nodes.get(id).onclick();};
  const action=dataset=>events['doc:click']({target:{closest:()=>({dataset})}});
  const key=(code,down=true)=>events[down?'keydown':'keyup']({code,target:{tagName:'CANVAS'},preventDefault(){},repeat:false});
  return {get s(){return module.namespace;},nodes,store,tick,click,action,key,render};
}
test('real start/keyboard/pause/save/continue flow preserves progress',async()=>{
  const h=await harness();assert.ok(h.s.ready);h.click('play');h.tick();
  const z=h.s.ship.position.z;h.key('KeyW');h.tick(90);h.key('KeyW',false);
  assert.ok(h.s.ship.position.z<z-10);h.click('menu-btn');const p={...h.s.ship.position};h.tick(60);assert.deepEqual({...h.s.ship.position},p);
  h.action({action:'savehome'});assert.equal(h.s.started,false);h.click('continue');assert.equal(h.s.started,true);assert.deepEqual({...h.s.ship.position},p);
});
test('quick travel during landing cancels the transition instead of crashing next frame',async()=>{
  const h=await harness();h.click('play');h.action({jump:'moon'});h.tick();h.click('interact');assert.ok(h.s.transition>0);
  h.action({jump:'saturn'});h.tick(180);assert.equal(h.s.surface,null);assert.equal(h.s.transition,0);assert.equal(h.s.state.world,'saturn');
});
test('all eleven expeditions complete through flight, interaction, landing and rover controls',async()=>{
  const h=await harness();h.click('play');
  for(const mission of data.MISSIONS){
    h.action({mission:mission.id});h.action({jump:mission.world});h.tick();
    let budget=0;
    while(h.s.state.mission && budget++<16000){
      const type=h.s.goalType;
      if(type==='land'){h.click('interact');h.tick(160);continue;}
      if(h.s.surface){
        if(!h.s.rover)h.click('interact');
        const ship=h.s.ship,g=h.s.goal;
        const desired=Math.atan2(-(g.x-ship.position.x),-(g.z-ship.position.z));
        let delta=Math.atan2(Math.sin(desired-ship.yaw),Math.cos(desired-ship.yaw));
        h.key('KeyA',delta>.03);h.key('KeyD',delta<-.03);h.key('KeyW',Math.abs(delta)<.35);
        h.tick(5);
        if(type==='rescue' && systems.dist(ship.position,g)<18)h.click('interact');
      }else{
        if(!h.s.auto)h.click('assist-btn');
        h.tick(10);
        if(['dock','repair'].includes(h.s.goalType)&&systems.dist(h.s.ship.position,h.s.goal)<30&&h.s.ship.speed<20){h.click('interact');h.action({action:'resume'});}
        if(h.s.goalType==='photo'&&systems.dist(h.s.ship.position,h.s.goal)<200){for(let i=0;i<4;i++)h.click('camera-btn');h.click('photo-btn');h.click('camera-btn');}
      }
    }
    for(const key of ['KeyA','KeyD','KeyW'])h.key(key,false);
    assert.ok(h.s.state.completed.includes(mission.id),`${mission.id} stuck on ${h.s.goalType} at distance ${systems.dist(h.s.ship.position,h.s.goal||h.s.ship.position)}`);
    if(h.s.surface){h.click('takeoff-btn');h.tick();assert.equal(h.s.surface,null);}
  }
  assert.equal(h.s.state.completed.length,11);assert.equal(h.s.state.stars,33);assert.equal(h.render.photos,2);
  assert.ok(h.store.size>0);
});
test('touch cancellation and closing panels reset the stick',async()=>{
  const h=await harness();h.click('free');h.nodes.get('stick').firstElementChild.style.transform='translate(30px,30px)';h.click('menu-btn');h.action({action:'resume'});assert.equal(h.nodes.get('stick').firstElementChild.style.transform,'');
  h.nodes.get('stick').listeners.pointercancel();h.tick();assert.equal(h.s.ship.speed,0);
});

test('autopilot reaches worlds across the system without passing through planets',async()=>{
  const h=await harness();h.click('free');
  for(const id of ['moon','mars','saturn','mercury','neptune']) {
    h.action({auto:id});let i=0;
    while(h.s.auto && i++<18000)h.tick(10);
    assert.equal(h.s.auto,false,`autopilot stuck en route to ${id}`);
    assert.equal(h.s.state.world,id);
    const dest=data.WORLDS.find(b=>b.id===id);
    assert.ok(systems.dist(h.s.ship.position,data.arrival(dest,h.s.state.time))<25);
  }
});

test('long press locks gas; taps never lock; one press stops; turbo works', async()=>{
 const h=await harness();h.click('play');
 const event=t=>({timeStamp:t,pointerId:1,preventDefault(){}});
 const gas=h.nodes.get('gas-btn'),boost=h.nodes.get('boost-btn');
 gas.listeners.pointerdown(event(100));gas.listeners.pointerup(event(150));
 gas.listeners.pointerdown(event(250));gas.listeners.pointerup(event(300));
 assert.equal(h.s.gasLocked,false);
 gas.listeners.pointerdown(event(500));h.tick(40);
 assert.equal(h.s.gasLocked,true);assert.equal(gas['aria-pressed'],'true');
 gas.listeners.pointerup(event(1200));gas.listeners.lostpointercapture();
 boost.listeners.pointerdown(event(1300));h.tick(60);boost.listeners.pointerup(event(2300));
 assert.ok(h.s.state.energy<100);assert.equal(h.s.gasLocked,true);
 gas.listeners.pointerdown(event(2400));assert.equal(h.s.gasLocked,false);gas.listeners.pointerup(event(2450));
 gas.listeners.pointerdown(event(2600));gas.listeners.pointerup(event(3300));assert.equal(h.s.gasLocked,true);
 h.click('menu-btn');assert.equal(h.s.gasLocked,false);
});

test('station marker flies and docks automatically at all four stations',async()=>{
 const h=await harness();h.click('play');
 for(const world of data.WORLDS.filter(b=>b.station)) {
   h.action({jump:world.id});h.tick();
   h.s.state.fuel=80;h.s.state.shield=50;
   h.click('dock-'+world.id);
   for(let i=0;i<2400 && h.s.auto;i++)h.tick();
   assert.equal(h.s.auto,false,'arrival at '+world.id);
   assert.equal(h.nodes.get('panel-title').textContent,'Välkommen till stationen');
   assert.equal(h.s.ship.speed,0);assert.equal(h.s.state.fuel,100);assert.equal(h.s.state.shield,100);
   h.action({action:'resume'});
 }
 h.action({jump:'earth'});h.tick();h.click('dock-earth');h.key('KeyS');h.tick();h.key('KeyS',false);
 assert.equal(h.s.auto,false,'manual braking cancels docking approach');
});
