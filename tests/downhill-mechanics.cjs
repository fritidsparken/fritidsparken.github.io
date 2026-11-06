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
      run={s:0,l:0,side:0,v:5,y:c.height(0),vy:0,air:false,t:0,score:0,chain:0,trick:null,next:0,checkpoint:0,crashes:0,phase:0,compression:0,dist:0,lean:0,airStart:0,lock:0,clean:0,mode:3,b:bikes[0],pitch:0,groundYaw:trailYaw(0),trickCounts:{},airX:0,airZ:0,airVX:0,airVZ:0,airYaw:0,airTilt:0,airTime:0};
      input.clear(); held.clear(); stick.reset(); jumpBuffer=0; acc=0; ghost=null;
    }
    function simulate(id, fps) {
      resetTest(id);
      for(let frame=0;frame<fps*300 && state==='ride';frame++) {
        acc += 1/fps;
        while(acc+1e-12>=FIXED_STEP && state==='ride') {
          // A repeatable bounded steering pilot follows the existing authored centerline.
          const dx=(c.center(run.s+.4)-c.center(run.s-.4))/.8, metric=Math.hypot(1,dx);
          const curv=(c.center(run.s+1)-2*c.center(run.s)+c.center(run.s-1))/metric**3;
          const e=c.feature(run.s);
          const mat=e?.type==='i'?'is':e&&['b','r'].includes(e.type)?'trä':c.surface;
          const grip=({jord:1,grus:.82,lera:.65,'snö':.72,is:.39,'trä':.98}[mat]||1)*run.b[2];
          const drift=clamp(-(curv+(c.turn(run.s+.5)-c.turn(run.s-.5))/metric)*run.v*run.v*.3/(grip*run.b[3]),-6,6);
          if(run.air) {
            const future=run.s+run.v*.22/metric;
            const target=c.place(c.center(future),future);
            const wanted=Math.atan2(run.airX-target[0],run.airZ-target[1]);
            stick.x=clamp(-angleDifference(wanted,run.airYaw)*5,-1,1);
            const grade=(c.height(run.s+.25,run.l)-c.height(run.s-.25,run.l))/.5/metric;
            stick.y=clamp((Math.atan(grade)-clamp(run.vy*.025,-.3,.3)-run.airTilt)*3,-1,1);
          } else {
            const avoid=c.events.some(e=>e.type==='o'&&e.s-run.s>-2&&e.s-run.s<10)?1.2:0;
            stick.x=clamp((-drift+(avoid-run.l)*3)/(2.6+run.v*.13),-1,1);
            const turnAhead=Math.abs(trailYaw(run.s+6)-trailYaw(run.s));
            const targetSpeed=turnAhead>.3?8:12;
            stick.y=run.v<targetSpeed?1:run.v>targetSpeed+1?-1:0;
          }
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
t.eval(`const reasons={}; const actualCrash=crash; crash=(reason)=>{reasons[reason]=(reasons[reason]||0)+1;actualCrash(reason)};`);
for(let id=0;id<10;id++) {
  const a=t.eval(`simulate(${id},30)`), b=t.eval(`simulate(${id},60)`);
  assert.ok(a.finite && b.finite,`finite track ${id}`);
  assert.ok(a.finished && b.finished,`finish track ${id}: ${JSON.stringify(a)} ${t.eval("JSON.stringify(reasons)")}`);
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
t.eval(`resetTest(); jump(0); run.vy=-2; run.y=c.height(0)+.001; act('jump',true,'Space'); step(FIXED_STEP);`);
assert.equal(t.eval('run.air'),false,'first step lands');
assert.ok(Math.abs(t.eval('run.y-ground(run.s,run.l)'))<1e-9,'landing snaps wheels to ground');
t.eval('step(FIXED_STEP)');
assert.equal(t.eval('run.air'),true,'early hop fires on following grounded tick');
t.eval(`resetTest(); jumpBuffer=.13; run.combo=900; run.chain=3; crash();`);
assert.equal(t.eval('run.combo'),0);
assert.equal(t.eval('jumpBuffer'),0);
for(const bad of ['null','[]','"invalid"','{']) assert.equal(makeContext(bad).eval('Object.keys(record).length'),0);
assert.equal(t.storage.get('fp-downhill-v1'),'{"0-2":{"time":42,"ghost":[[0,0,0],[1,0,0]]},"2-1":{"score":999}}','free ride must never overwrite legacy saves');
console.log(JSON.stringify({passed:true,checks:['10 extended tracks completed at 30/60 render FPS with identical simulation','legacy saves untouched','jump buffer and repeat suppression','stable landing','stationary steering','crash clears combo','invalid saves'],courses},null,2));
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
for(let id=0;id<10;id++) assert.ok(t.eval(`testCamera(${id})`)<25,`bounded camera on course ${id}`);
console.log('Camera transform checks: 1,010 samples across all 10 courses passed (not a visual/GPU test).');
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
// Course length, identity and extension semantics.
assert.equal(t.eval('layouts.length'),10);
assert.equal(t.eval('new Set(routeIds).size'),10);
for(let i=0;i<10;i++) {
  assert.equal(t.eval(`course(${i}).len/course(${i}).originalLength`),3);
  assert.equal(t.eval(`course(${i}).events.length`),t.eval(`layouts[${i}][7].split(' ').length*3`));
  assert.notEqual(t.eval(`saveKey(course(${i}),2)`),t.eval(`course(${i}).id+'-2'`));
}
// No hidden path magnet: position and facing remain on the takeoff world vector.
const flight=t.eval(`(() => {
  resetTest(1); run.s=c.originalLength*.45; run.y=c.height(run.s)+8; run.v=16; run.l=0; jump(3.3);
  const start=[run.airX,run.airZ], yaw=run.airYaw, vx=run.airVX, vz=run.airVZ;
  let maxCross=0,maxProjection=0;
  for(let i=0;i<25;i++) {
    step(FIXED_STEP);
    const dx=run.airX-start[0], dz=run.airZ-start[1];
    maxCross=Math.max(maxCross,Math.abs(dx*vz-dz*vx));
    const reconstructed=c.place(c.center(run.s)+run.l,run.s);
    maxProjection=Math.max(maxProjection,Math.hypot(reconstructed[0]-run.airX,reconstructed[1]-run.airZ));
  }
  return {maxCross,maxProjection,headingChange:angleDifference(run.airYaw,yaw),routeChange:angleDifference(trailYaw(run.s),yaw)};
})()`);
assert.ok(flight.maxCross<1e-8,JSON.stringify(flight));
assert.ok(flight.maxProjection<.001,JSON.stringify(flight));
assert.equal(flight.headingChange,0);
assert.ok(Math.abs(flight.routeChange)>.01,'test route actually bends during flight');
t.eval('input.add("right");');
const before=t.eval('run.airYaw');t.eval('step(FIXED_STEP)');
assert.ok(t.eval('run.airYaw')<before,'deliberate right control changes heading right');
// Isolated level/slope fixtures still exercise the actual step(), jump(), trick().
t.eval(`
function flatFixture(speed=10, grade=0) {
  resetTest();
  Object.assign(c,{center:()=>0,turn:()=>0,height:s=>s*grade,base:s=>s*grade,
    feature:()=>null,events:[],gap:()=>false,fork:()=>0,half:()=>4,
    place:(x,s)=>[x,-s],project:(x,z)=>({s:-z,l:x})});
  run.s=10;run.y=10*grade;run.v=speed;run.groundYaw=0;
}
function hopMeasurement(speed,grade) {
  flatFixture(speed,grade);jump(3.3);
  let elapsed=0,maxHeight=0,startY=run.y;
  while(run.air&&elapsed<3) {step(FIXED_STEP);elapsed+=FIXED_STEP;maxHeight=Math.max(maxHeight,run.y-startY);}
  return {seconds:+elapsed.toFixed(3),metres:+run.airDistance.toFixed(3),height:+maxHeight.toFixed(3),crashes:run.crashes};
}
`);
const hops=[10,20].flatMap(speed=>[0,-.15].map(grade=>({speed,grade,...t.eval(`hopMeasurement(${speed},${grade})`)})));
for(const hop of hops) {assert.equal(hop.crashes,0);assert.ok(hop.seconds<.65);assert.ok(hop.metres<13);assert.ok(hop.height<.3);}
t.eval('flatFixture();run.y=20;jump(4);trick(0);for(let i=0;i<23;i++)step(FIXED_STEP);');
assert.equal(t.eval('run.score'),0,'a completed airborne trick has no banked points yet');
const first=t.eval('run.combo');t.eval('trick(0);for(let i=0;i<23;i++)step(FIXED_STEP);');
const repeated=t.eval('run.combo')-first;
assert.ok(repeated<first,'same-trick repeat is discounted');
t.eval('trick(2);for(let i=0;i<30;i++)step(FIXED_STEP);');
assert.ok(t.eval('run.combo')-first-repeated>150,'new trick earns variety multiplier');
t.eval('run.y=c.height(run.s)+.001;run.vy=-2;run.airYaw=0;run.airTilt=0;step(FIXED_STEP)');
assert.ok(t.eval('run.score')>0,'completed combo banks only on clean landing');
t.eval('flatFixture();jump(3);run.combo=500;trick(4);run.y=.001;run.vy=-2;step(FIXED_STEP)');
assert.equal(t.eval('run.crashes'),1,'unfinished flip fails touchdown');
assert.equal(t.eval('run.score'),0,'failed trick never banks its combo');
t.eval('flatFixture();jump(3);run.airYaw=.9;run.y=.001;run.vy=-2;step(FIXED_STEP)');
assert.equal(t.eval('run.crashes'),1,'sideways landing fails');
t.eval('flatFixture();jump(3);run.airX=9;run.y=.001;run.vy=-2;step(FIXED_STEP)');
assert.equal(t.eval('run.crashes'),1,'off-trail touchdown fails');
assert.equal(t.eval('run.score'),0,'off-trail touchdown cannot award points');
console.log(JSON.stringify({worldSpaceFlight:flight,bunnyHopMeasurements:hops,trickChecks:'variety, repeat discount, clean banking, incomplete/sideways/off-trail rejection passed'},null,2));
const stationary=t.eval('hopMeasurement(0,0)');
assert.equal(stationary.crashes,0,'neutral stationary hop must land without a false pitch crash');
assert.equal(stationary.metres,0);
const firstFrame=t.eval(`(() => {
  flatFixture(12);run.s=300;run.y=0;previousRun={...run};acc=FIXED_STEP*.25;
  jump(3.3);env.update=()=>{};renderer={render(){}};aim=V();cam=new T.PerspectiveCamera(63,1,.08,620);
  mount={group:new T.Group(),pose(){}};cameraSnap=false;view=0;renderRide(1/60);
  return Math.hypot(mount.group.position.x-run.airX,mount.group.position.z-run.airZ);
})()`);
assert.ok(firstFrame<1e-9,'first takeoff render must not interpolate from stale zero world coordinates');
console.log('Stationary hop and first airborne render at 300 m passed.');
