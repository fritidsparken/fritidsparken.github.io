// Run: node tests/downhill-mechanics.cjs. Exercises the shipped controller, not a copy.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '../games/downhill');
function makeContext(saved = '{}') {
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { value: '0', selectedIndex: 0, style: {}, dataset: {}, classList: {add(){},remove(){}}, add(){}, append(){}, insertBefore(){}, setAttribute(){}, replaceChildren(){}, addEventListener(){}, animate(){}, close(){this.open=false}, showModal(){this.open=true} });
    return nodes.get(id);
  };
  const storage = new Map([['fp-downhill-v1', saved]]);
  const ctx = vm.createContext({ console, Math, Number, JSON, Map, Set, Array, performance, window: {addEventListener(){}},
    document: { getElementById: node, querySelector: node, querySelectorAll: () => [], createElement: () => node(Symbol()), addEventListener(){}, documentElement:{} },
    localStorage: { getItem:k=>storage.get(k)||null, setItem:(k,v)=>storage.set(k,v) },
    sound:{configure(){}, tick(){},land(){},quiet(){},init(){}},
    createRideStick:()=>({x:0,y:0,reset(){this.x=this.y=0}}), Option:function(){},
    addEventListener(){}, requestAnimationFrame(){}, cancelAnimationFrame(){}, matchMedia:()=>({matches:false}),
  });
  vm.runInContext(fs.readFileSync(path.join(root,'courses.js'),'utf8'),ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'game.js'),'utf8'),ctx);
  vm.runInContext(`
    function resetTest(id = 0) {
      c = course(id); state = 'ride'; env = {ridge:(s,l)=>c.height(s,l)};
      run={s:0,l:0,side:0,v:5,y:c.height(0),vy:0,air:false,t:0,score:0,chain:0,trick:null,next:0,checkpoint:0,crashes:0,phase:0,compression:0,dist:0,lean:0,airStart:0,lock:0,clean:0,mode:3,b:bikes[0],pitch:0};
      input.clear(); held.clear(); stick.reset(); jumpBuffer=0; acc=0; ghost=null;
    }
    function simulate(id, fps) {
      resetTest(id);
      for(let frame=0;frame<fps*180 && state==='ride';frame++) {
        acc += 1/fps;
        while(acc+1e-12>=FIXED_STEP && state==='ride') {
          // A repeatable bounded steering pilot follows the existing authored centerline.
          const dx=(c.center(run.s+.4)-c.center(run.s-.4))/.8, metric=Math.hypot(1,dx);
          const curv=(c.center(run.s+1)-2*c.center(run.s)+c.center(run.s-1))/metric**3;
          const e=c.feature(run.s);
          const mat=e?.type==='i'?'is':e&&['b','r'].includes(e.type)?'trä':c.surface;
          const grip=({jord:1,grus:.82,lera:.65,'snö':.72,is:.39,'trä':.98}[mat]||1)*run.b[2];
          const drift=clamp(-(curv+(c.turn(run.s+.5)-c.turn(run.s-.5))/metric)*run.v*run.v*.22/(grip*run.b[3]),-4.8,4.8);
          stick.x=clamp((-drift-run.l*3)/(3.1+run.v*.16),-1,1); stick.y=1;
          // Obstacles are jumped with the same action used by the player.
          if(c.events.some(e=>e.type==='o' && e.s-run.s>1.5 && e.s-run.s<3.5) && !run.air) jumpBuffer=.13;
          step(FIXED_STEP); acc-=FIXED_STEP;
        }
      }
      return {finished:state==='finish',s:run.s,t:run.t,crashes:run.crashes,score:run.score,finite:[run.s,run.l,run.y,run.v].every(Number.isFinite)};
    }
  `,ctx);
  return { ctx, storage, eval:s=>vm.runInContext(s,ctx) };
}
const t=makeContext('{"0-2":{"time":42,"ghost":[[0,0,0],[1,0,0]]},"2-1":{"score":999}}');
assert.equal(t.eval('record["0-2"].time'),42);
assert.equal(t.eval('record["2-1"].score'),999);
const courses=[];
for(let id=0;id<20;id++) {
  const a=t.eval(`simulate(${id},30)`), b=t.eval(`simulate(${id},60)`);
  assert.ok(a.finite && b.finite,`finite track ${id}`);
  assert.ok(a.finished && b.finished,`finish track ${id}: ${JSON.stringify(a)}`);
  assert.ok(Math.abs(a.t-b.t)<1e-7,`frame independent time track ${id}`);
  assert.equal(a.score,b.score,`frame independent score track ${id}`);
  courses.push({id:id+1,time:+a.t.toFixed(2),crashes:a.crashes});
}
t.eval(`resetTest(); act('jump',true,'Space'); step(FIXED_STEP);`);
assert.equal(t.eval('run.air'),true);
assert.equal(t.eval('jumpBuffer'),0);
t.eval(`act('jump',true,'Space');`);
assert.equal(t.eval('jumpBuffer'),0,'held press must not repeatedly queue hops');
t.eval(`resetTest(); run.v=0; input.add('brake'); input.add('right'); step(FIXED_STEP)`);
assert.ok(Math.abs(t.eval('run.l'))<1e-9,'stationary bike must not strafe');
t.eval(`resetTest(); run.air=true; run.vy=-2; run.y=c.height(0)+.001; act('jump',true,'Space'); step(FIXED_STEP);`);
assert.equal(t.eval('run.air'),false,'first step lands');
assert.ok(Math.abs(t.eval('run.y-ground(run.s,run.l)'))<1e-9,'landing snaps wheels to ground');
t.eval('step(FIXED_STEP)');
assert.equal(t.eval('run.air'),true,'early hop fires on following grounded tick');
t.eval(`resetTest(); jumpBuffer=.13; run.combo=900; run.chain=3; crash();`);
assert.equal(t.eval('run.combo'),0);
assert.equal(t.eval('jumpBuffer'),0);
for(const bad of ['null','[]','"invalid"','{']) assert.equal(makeContext(bad).eval('Object.keys(record).length'),0);
assert.equal(t.storage.get('fp-downhill-v1'),'{"0-2":{"time":42,"ghost":[[0,0,0],[1,0,0]]},"2-1":{"score":999}}','free ride must never overwrite legacy saves');
console.log(JSON.stringify({passed:true,checks:['20 tracks completed at 30/60 render FPS with identical simulation','legacy saves untouched','jump buffer and repeat suppression','stable landing','stationary steering','crash clears combo','invalid saves'],courses},null,2));
// Render-transform QA uses the project's pinned Three.js math, without a GPU.
vm.runInContext(fs.readFileSync(path.resolve(root,'../../js/vendor/three.min.js'),'utf8'),t.ctx);
t.eval(`
  const T=THREE, V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  function testCamera(id) {
    resetTest(id); renderer={render(){}};
    env={ridge:(s,l)=>c.height(s,l),update(){}};
    mount={group:new T.Group(),pose(){}};
    cam=new T.PerspectiveCamera(63,1,.08,620); aim=V(); view=0;
    let maxSeparation=0;
    for(let i=0;i<=100;i++) {
      run.s=c.len*i/100; run.y=c.height(run.s); run.v=20; run.l=0;
      run.trick={p:.5,type:'Backflip'};
      renderRide(1/60,true);
      if(![cam.position.x,cam.position.y,cam.position.z,cam.fov].every(Number.isFinite)) throw Error('nonfinite camera');
      if(cam.up.x!==0||cam.up.z!==0) throw Error('rolled horizon');
      if(cam.fov<59||cam.fov>64) throw Error('unbounded FOV');
      if(cam.position.y<=run.y) throw Error('camera below rider');
      maxSeparation=Math.max(maxSeparation,cam.position.distanceTo(mount.group.position));
    }
    return maxSeparation;
  }
`);
for(let id=0;id<20;id++) assert.ok(t.eval(`testCamera(${id})`)<25,`bounded camera on course ${id}`);
console.log('Camera transform checks: 2,020 samples across all 20 courses passed (not a visual/GPU test).');
// Separate Web Audio bus controls remain independent and preserve master routing.
const gains=[];
const gainParam=()=>({value:0,setValueAtTime(){},setTargetAtTime(v){this.value=v},exponentialRampToValueAtTime(){}});
function audioNode(){return {gain:gainParam(),frequency:gainParam(),connect(){return this},disconnect(){},start(){},stop(){}};}
class AudioContextStub {
  constructor(){this.currentTime=0;this.sampleRate=100;this.destination={};}
  createGain(){const g=audioNode();gains.push(g);return g;}
  createBuffer(){return{getChannelData:()=>new Float32Array(200)}}
  createBufferSource(){return audioNode()}
  createBiquadFilter(){return audioNode()}
  createOscillator(){return audioNode()}
  resume(){return Promise.resolve()}
  suspend(){return Promise.resolve()}
}
const a=vm.createContext({window:{AudioContext:AudioContextStub},Math,rng:()=>()=>.5});
vm.runInContext(fs.readFileSync(path.join(root,'audio.js'),'utf8'),a);
vm.runInContext('sound.init();sound.configure({music:false,effects:true});sound.tick(10,"jord",false,true,false)',a);
assert.equal(gains[1].gain.value,0);
assert.equal(gains[2].gain.value,.65);
vm.runInContext('sound.configure({music:true,effects:false});sound.tick(10,"trä",false,true,false)',a);
assert.equal(gains[1].gain.value,.75);
assert.equal(gains[2].gain.value,0);
console.log('Independent music/effect bus routing checks passed (not a listening test).');
