// Run from the repository root: node tools/blockvarlden/lava-test.mjs
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {World} from '../../games/blockvarlden/world/stream.js';
import {readFileSync} from 'node:fs';
import {LavaFlow,LAVA,REACH} from '../../games/blockvarlden/world/lava.js';
import {HEIGHT,seedNumber} from '../../games/blockvarlden/world/terrain.js';

function fixture() {
  const terrain=new Map(),liquid=new Set(),tile=(x,y,z)=>[x,y,z].join(',');
  const read=(x,y,z)=>y<1?3:liquid.has(tile(x,y,z))?LAVA:terrain.get(tile(x,y,z))||0;
  const write=(x,y,z,id)=>id?liquid.add(tile(x,y,z)):liquid.delete(tile(x,y,z));
  const sim=new LavaFlow(read,write,HEIGHT);
  function edit(x,y,z,id){
    sim.forget(x,y,z);liquid.delete(tile(x,y,z));
    terrain.set(tile(x,y,z),id);sim.wake(x,y,z);
  }
  function settle(){let t=0;while(sim.pending.size&&t++<3500)sim.tick(128);assert(t<3500)}
  return {sim,read,edit,settle,liquid};
}
const world=fixture();
world.edit(15,5,0,LAVA);
world.sim.tick();assert.equal(world.read(15,4,0),LAVA);
assert.equal(world.read(16,5,0),0,'fall before lateral spread');
world.settle();
assert.equal(world.read(15,1,0),LAVA);
assert.equal(world.read(16,1,0),LAVA,'crosses chunk boundary');
assert.equal(world.read(15+REACH+1,1,0),0);
world.edit(15,3,0,3);world.settle();
assert.equal(world.read(15,3,0),3);
assert.equal(world.read(16,4,0),LAVA,'obstacle diverts the fall');
world.edit(15,3,0,0);world.settle();
assert.equal(world.read(16,4,0),0,'upper channel dries after support removal');
world.edit(15,5,0,0);world.settle();assert.equal(world.liquid.size,0,'source removal drains the falls');

const gate=fixture();
for(let x=6;x<=16;x++)for(const z of [-1,1])gate.edit(x,1,z,3);
gate.edit(15,1,0,3);gate.edit(12,1,0,LAVA);gate.settle();
assert.equal(gate.read(16,1,0),0,'wall seals channel');
gate.edit(15,1,0,0);gate.settle();
assert.equal(gate.read(16,1,0),LAVA,'removing wall releases flow');
gate.edit(12,1,0,0);gate.settle();assert.equal(gate.liquid.size,0);

const defs=JSON.parse(readFileSync(new URL('../../assets/blockvarlden/blocks/registry.json',import.meta.url))).blocks;
const ids={water:25,lava:26,clay:8,moss:11,snow:9,crystal:82,ore:76};
const seed=seedNumber('Expedition');
globalThis.onmessage=()=>{};
let result;globalThis.postMessage=message=>result=message;
await import('../../games/blockvarlden/world/worker.js');
const request=m=>{globalThis.onmessage({data:m});return result};
request({init:true,defs:Object.fromEntries(defs.map(b=>[b.id,b])),ids,seed,legacy:false});
let generatedSource=false, visited=0;
for(let cz=-3;cz<4&&!generatedSource;cz++)for(let cx=-3;cx<4&&!generatedSource;cx++){
  const packet=request({cx,cz,rev:0,edits:[],flows:[],first:true});visited++;
  for(let i=0;i<packet.seeds.length;i+=3){
    const [x,y,z]=packet.seeds.slice(i,i+3);
    if(Math.floor(x/16)!==cx||Math.floor(z/16)!==cz||y<8)continue;
    if(packet.data[x-cx*16+1+18*(z-cz*16+1+18*(y+1))]===LAVA){generatedSource=true;break}
  }
}
assert(generatedSource,'seeded terrain includes an exposed ceiling seep');
const saved=[[15,61,5,LAVA],[15,60,5,3],[16,61,5,0]];
const packets=[0,1].map(cx=>request({cx,cz:0,rev:1,edits:saved,flows:[],first:true}));
assert(packets[1].seeds.some((n,i,a)=>i%3===0&&n===16&&a[i+1]===61&&a[i+2]===5),'restored source wakes the adjacent chunk');
const poured=request({cx:1,cz:0,rev:2,edits:saved,flows:[[16,61,5,4]],first:false});
assert.equal(poured.data[1+18*(6+18*61)],LAVA);
assert(poured.batches[1].some(arr=>arr.some((n,i)=>i%9===1&&n>61&&n<62)),'molten sheet has sloped geometry');
const dry=request({cx:1,cz:0,rev:3,edits:saved,flows:[],first:false});
assert.equal(dry.data[1+18*(6+18*61)],0,'derived flows never mask restored player edits');

// Deliver messages asynchronously through the real worker handler. This makes
// late replies and eviction reproducible without a browser or GPU.
globalThis.THREE=createRequire(import.meta.url)('../../js/vendor/three.min.js');
globalThis.window=globalThis;
const handler=globalThis.onmessage;
globalThis.Worker=class {
  postMessage(m){
    if(m.init){this.init=m;return}
    setImmediate(()=>{
      if(this.dead)return;
      let packet;globalThis.postMessage=p=>packet=p;
      handler({data:this.init});handler({data:m});this.onmessage({data:packet});
    });
  }
  terminate(){this.dead=true}
};
const registry=JSON.parse(readFileSync(new URL('../../assets/blockvarlden/blocks/registry.json',import.meta.url)));
const live=new World(new THREE.Scene(),registry,new THREE.Texture(),{seed:'Boundary'},saved);
async function settleChunks(x,z,radius){
  live.update(x,z,radius);
  for(let i=0;i<12000;i++){
    await new Promise(r=>setImmediate(r));live.nextFluidTick=0;live.update(x,z,radius);
    if(!live.jobs.size&&!live.lava.pending.size&&live.chunks.size===(2*radius+1)**2)return;
  }
  assert.fail('chunk integration did not settle');
}
await settleChunks(8,8,0);assert.equal(live.at(16,61,5),null);
await settleChunks(8,8,1);assert(live.lava.level(16,61,5)>0);
live.set(15,61,5,0);await settleChunks(8,8,1);assert.equal(live.at(16,61,5),0);
live.set(15,61,5,LAVA);live.nextFluidTick=0;live.update(8,8,1);
live.update(800,800,0);live.update(8,8,1);await settleChunks(8,8,1);
assert(live.lava.level(16,61,5)>0,'in-flight unload/reload must not turn flow into a source');
assert.equal(live.edits.get('1,0').size,1,'transient flow never writes new player edits');
live.dispose();

const load=fixture();
for(let z=0;z<5;z++)for(let x=0;x<5;x++)load.edit(x*12,25,z*12,LAVA);
const times=[];let evaluated=0;
while(load.sim.pending.size){
  const start=performance.now();evaluated+=load.sim.tick(128);times.push(performance.now()-start);
}
times.sort((a,b)=>a-b);
console.log(JSON.stringify({verified:'downward, lateral, source removal, barriers, supports, saved seed, chunk border, sloped meshes',generatedChunks:visited,
 stressSources:25,evaluated,stepBudget:128,steps:times.length,p95ms:+times[Math.floor(times.length*.95)].toFixed(2)}));
