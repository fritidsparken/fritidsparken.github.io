'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const THREE=require(path.join(root,'js/vendor/three.min.js'));
const C=require(path.join(root,'games/vattenparken/core.js'));
const courses=C.courses.map((c,i)=>C.createCourse(THREE,c,i));
test('Six continuous finite courses, orthogonal frames and safe jump endpoints',()=>{
 assert.equal(new Set(courses.map(c=>c.id)).size,6);
 for(const c of courses){assert.ok(c.length>150);assert.equal(c.stars.length,24);assert.equal(c.boosts.length,4);
  for(let j=0;j<=500;j++){const f=c.frame(j/500);for(const v of [f.position,f.tangent,f.right,f.up])assert.ok(v.toArray().every(Number.isFinite));assert.ok(Math.abs(f.right.dot(f.tangent))<1e-8);assert.ok(Math.abs(f.up.length()-1)<1e-8);assert.ok(f.up.y>0);}
  assert.equal(C.jumpHeight(c,c.jump[0]),0);assert.equal(C.jumpHeight(c,c.jump[1]),0);assert.ok(Math.abs(C.jumpHeight(c,(c.jump[0]+c.jump[1])/2)-c.jump[2])<1e-8);
 }
});
test('All courses finish with braking, acceleration or steering against a wall',()=>{
 for(const c of courses)for(const input of [{},{brake:true},{forward:true,steer:1},{steer:-1}]){
  const r=new C.Ride(c);let finishes=0;
  for(let j=0;j<9000&&!r.done;j++){finishes+=r.step(1/60,input).filter(e=>e.type==='finish').length;assert.ok(Number.isFinite(r.speed));assert.ok(Math.abs(r.lane)<=2.6);}
  assert.equal(r.done,true);assert.equal(finishes,1);assert.equal(r.distance,c.length);assert.deepEqual(r.step(1/60,input),[]);assert.ok(r.result().score>=0);assert.ok(r.time<150);
 }
});
test('Stars and boosts are awarded once, and a missed boost cannot be collected later',()=>{
 const c=courses[0],r=new C.Ride(c),s=c.stars[0];r.distance=(s.u-.001)*c.length;r.lane=s.lane;
 assert.equal(r.step(.02).filter(e=>e.type==='star').length,1);for(let j=0;j<40;j++)r.step(.02);assert.equal(r.stars.size,1);
 const b=c.boosts[0],miss=new C.Ride(c);miss.distance=(b.u-.001)*c.length;miss.lane=2.6;miss.step(.05);assert.equal(miss.boosts.size,0);miss.lane=b.lane;miss.step(.05);assert.equal(miss.boosts.size,0);
 const hit=new C.Ride(c);hit.distance=(b.u-.001)*c.length;hit.lane=b.lane;assert.equal(hit.step(.05).filter(e=>e.type==='boost').length,1);assert.ok(hit.boostTime>0);assert.equal(hit.step(.05).filter(e=>e.type==='boost').length,0);
});
test('Progress unlocks in order and preserves each independent best record',()=>{
 const s=C.cleanSave(null);assert.equal(s.unlocked,1);
 for(let i=0;i<6;i++){assert.equal(C.record(s,i,{time:20+i,stars:18,rating:3,score:5000}),i<5);assert.equal(s.unlocked,Math.min(i+2,6));}
 C.record(s,0,{time:30,stars:20,rating:2,score:4000});assert.deepEqual(s.records[0],{time:20,stars:20,rating:3,score:5000});
 assert.deepEqual(C.cleanSave(JSON.parse(JSON.stringify(s))),s);
 const bad=C.cleanSave({unlocked:99,quality:'unknown',records:{0:{time:-1,stars:24},1:{time:12,stars:999}}});assert.equal(bad.unlocked,6);assert.equal(bad.quality,'auto');assert.equal(bad.records[0],undefined);assert.equal(bad.records[1].stars,24);
});
test('Actual world geometry and animated transforms remain finite',()=>{
 const ctx={window:{WaterparkCore:C},THREE,console};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'games/vattenparken/world.js'),'utf8'),ctx);
 const w=ctx.window.WaterparkWorld.create({isSoftware:true},'low');assert.equal(w.tracks.length,6);let meshes=0;
 w.select(2);assert.equal(w.tracks[0].stars[0].visible,false);assert.equal(w.tracks[2].stars[0].visible,true);
 for(let i=0;i<120;i++)w.update(1/60,new C.Ride(courses[2]));w.scene.updateMatrixWorld();
 w.scene.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.geometry){meshes++;assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));if(o.geometry.attributes.normal)assert.ok(Array.from(o.geometry.attributes.normal.array).every(Number.isFinite));}});
 assert.ok(meshes>300);w.dispose();
});
test('Hub wrapper rejects foreign close messages and restores scrolling on exit',()=>{
 let listener,rendered=0,removed=0;const frame={dataset:{src:'game'},parentElement:{style:{}},contentWindow:{},focus(){},remove(){removed++}};
 const document={body:{style:{overflow:'auto'}},getElementById:()=>frame,querySelector:()=>null};const window={addEventListener:(type,fn)=>listener=fn,FPGameHub:{render(){rendered++}}};const ctx={window,document,location:{origin:'https://fritidsparken.se'}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'js/vattenparken.js'),'utf8'),ctx);window.FPWaterpark.start();assert.equal(document.body.style.overflow,'hidden');
 listener({source:{},origin:ctx.location.origin,data:{type:'fp-game-close'}});assert.equal(removed,0);
 listener({source:frame.contentWindow,origin:'https://other.example',data:{type:'fp-game-close'}});assert.equal(removed,0);
 listener({source:frame.contentWindow,origin:ctx.location.origin,data:{type:'fp-game-close'}});assert.equal(removed,1);assert.equal(rendered,1);assert.equal(document.body.style.overflow,'auto');window.FPWaterpark.destroy();assert.equal(removed,1);
});
test('Application completes six rides, resumes without advancing time, restarts and reloads progress',()=>{
 const nodes=new Map(),listeners={},winEvents={},storage={};let raf,now=0;
 function el(selector){if(!nodes.has(selector))nodes.set(selector,{hidden:false,innerHTML:'',textContent:'',style:{},dataset:{},className:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(){},addEventListener(){},focus(){},querySelector:s=>el(selector+' '+s)});return nodes.get(selector)}
 const document={querySelector:el,querySelectorAll:()=>[],body:{dataset:{}},hidden:false,addEventListener:(k,f)=>listeners[k]=f};
 const world={scene:new THREE.Scene(),courseData:courses,tracks:courses.map(c=>({entry:c.frame(0).position,stairPoints:[new THREE.Vector3(c.x,1,-99),c.frame(0).position],stars:c.stars.map(()=>({visible:true}))})),avatar:{group:new THREE.Group(),pose(){}},secret:{visible:true},select(){},update(){},splash(){}};
 class Renderer{constructor(){this.domElement=el('canvas')}setPixelRatio(){}setSize(){}render(){}}
 class Audio{unlock(){}play(){}suspend(){}dispose(){}update(){}}
 const window={THREE:{...THREE,WebGLRenderer:Renderer},WaterparkCore:C,WaterparkWorld:{create:()=>world},WaterparkAudio:Audio,addEventListener:(k,f)=>winEvents[k]=f,matchMedia:()=>({matches:false})};window.parent=window;
 const ctx={window,document,navigator:{hardwareConcurrency:8},innerWidth:1280,innerHeight:720,devicePixelRatio:1,performance:{now:()=>now},requestAnimationFrame:f=>{raf=f;return 1},cancelAnimationFrame(){},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},location:{origin:'https://fritidsparken.se'},console};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'games/vattenparken/game.js'),'utf8'),ctx);
 const click=(action,course)=>listeners.click({target:{closest:()=>({disabled:false,dataset:course===undefined?{action}:{course:String(course)}})}});
 const step=(count=1)=>{for(let i=0;i<count;i++){now+=1000/60;raf(now)}};
 assert.equal(document.body.dataset.mode,'title');click('play');click(null,0);click('start');step(500);assert.equal(document.body.dataset.mode,'ride');
 click('pause');const before=el('#time').textContent;step(600);assert.equal(el('#time').textContent,before);assert.equal(document.body.dataset.mode,'paused');click('resume');assert.equal(document.body.dataset.mode,'ride');
 click('restart');assert.equal(el('#stars').textContent,'0');
 for(let level=0;level<6;level++){for(let j=0;j<12000&&document.body.dataset.mode!=='result';j++)step();assert.equal(document.body.dataset.mode,'result');assert.equal(JSON.parse(storage['fp-waterpark-v1']).unlocked,Math.min(level+2,6));if(level<5){click('next');assert.equal(document.body.dataset.mode,'briefing');click('start')}}
 click('map');assert.match(el('#overlay').innerHTML,/Regnbågsfallet/);assert.doesNotMatch(el('#overlay').innerHTML,/ disabled/);click('park');step(5);assert.equal(document.body.dataset.mode,'park');winEvents.blur();assert.equal(document.body.dataset.mode,'paused');click('resume');assert.equal(document.body.dataset.mode,'park');
 vm.runInContext(fs.readFileSync(path.join(root,'games/vattenparken/game.js'),'utf8'),ctx);click('play');assert.doesNotMatch(el('#overlay').innerHTML,/ disabled/);assert.match(el('#overlay').innerHTML,/24/);
});
