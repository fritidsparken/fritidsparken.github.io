import test from 'node:test';
import assert from 'node:assert/strict';
import {BlenderPlayer} from '../origami/js/blender-player.mjs';
import {readFileSync} from 'node:fs';

const model={id:'plane',name:'Plane',steps:Array(4),blender:{base:'./assets/plane/',frames:48,fps:24}};
function fixture() {
  const timers=new Map();let next=0;
  const previous={setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout,document:globalThis.document};
  globalThis.setTimeout=fn=>{timers.set(++next,fn);return next;};
  globalThis.clearTimeout=id=>timers.delete(id);
  globalThis.document={hidden:false};
  const video={hidden:true,currentTime:0,seeking:false,plays:0,loads:0,pause(){},load(){this.loads++;},play(){this.plays++;return Promise.resolve();},setAttribute(){}};
  const image={hidden:false},status={textContent:''};
  const player=new BlenderPlayer({querySelector:s=>s==='img'?image:s==='video'?video:status});
  let errors=0,done=0;
  return {player,video,image,timers,fail:()=>errors++,done:()=>done++,errors:()=>errors,completed:()=>done,
    tick(){const callbacks=[...timers.values()];timers.clear();callbacks.forEach(fn=>fn());},
    restore(){player.stop();Object.assign(globalThis,previous);}};
}
test('poster remains until video is playing; inline video is visible during startup',()=>{
 const f=fixture();try{
  f.player.play(model,1,1,f.done,f.fail);
  assert.equal(f.video.hidden,false);assert.equal(f.image.hidden,false);assert.equal(f.video.playsInline,true);
  f.video.onplaying();assert.equal(f.image.hidden,true);
  f.video.onended();assert.equal(f.completed(),1);assert.equal(f.timers.size,0);
 }finally{f.restore();}
});
test('stalled media falls back once, invalidating late events',()=>{
 const f=fixture();try{
  f.player.play(model,1,1,f.done,f.fail);
  const late=f.video.onplaying,error=f.video.onerror;
  f.tick();error();late();
  assert.equal(f.errors(),1);assert.equal(f.image.hidden,false);assert.equal(f.video.hidden,true);
 }finally{f.restore();}
});
test('rejected playback falls back',async()=>{
 const f=fixture();try{
  f.video.play=()=>Promise.reject(new Error('NotSupportedError'));
  f.player.play(model,1,1,f.done,f.fail);await Promise.resolve();await Promise.resolve();
  assert.equal(f.errors(),1);
 }finally{f.restore();}
});
test('pause suspends timeout, resume restores it, stop cancels it',()=>{
 const f=fixture();try{
  f.player.play(model,1,1,f.done,f.fail);f.player.pause(true);f.tick();assert.equal(f.errors(),0);
  f.player.pause(false);assert.equal(f.timers.size,1);
  const late=f.video.onerror;f.player.stop();late();f.tick();assert.equal(f.errors(),0);
 }finally{f.restore();}
});
test('continuous playback installs metadata handler before load and seeks to matching step',async()=>{
 const f=fixture();try{
  f.player.preload=()=>Promise.resolve('blob:plane');
  f.video.load=()=>{assert.equal(typeof f.video.onloadedmetadata,'function');f.video.onloadedmetadata();};
  let step;
  await f.player.playAll(model,3,.5,n=>step=n,f.done,f.fail);
  assert.equal(f.video.currentTime,4);assert.equal(f.video.playbackRate,.5);assert.equal(f.video.plays,1);
  f.video.ontimeupdate();assert.equal(step,3);
 }finally{f.restore();}
});
test('stuck full-film preload times out and cannot start after fallback',async()=>{
 const f=fixture();try{
  let resolve;f.player.preload=()=>new Promise(r=>resolve=r);
  const pending=f.player.playAll(model,1,1,()=>{},f.done,f.fail);
  f.tick();assert.equal(f.errors(),1);resolve('blob:late');await pending;
  assert.equal(f.video.plays,0);assert.equal(f.video.loads,0);
 }finally{f.restore();}
});
test('pausing during preload does not play a previous clip when resuming',async()=>{
 const f=fixture();try{
  let resolve;f.player.preload=()=>new Promise(r=>resolve=r);
  const pending=f.player.playAll(model,1,1,()=>{},f.done,f.fail);
  f.player.pause(true);f.player.pause(false);assert.equal(f.video.plays,0);
  resolve('blob:plane');await pending;f.video.onloadedmetadata();assert.equal(f.video.plays,1);
 }finally{f.restore();}
});
test('explicit motion setting allows animation even when system prefers reduced motion',()=>{
 const source=readFileSync(new URL('../origami/js/studio.mjs',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('function animate(){'),source.indexOf('function finish(){'));
 let plays=0,finishes=0;
 const run=new Function('$','reduced','blender','finish',`
  let automatic=false,preview=false,elapsed=0,last=0,playing=false,renderMode='blender',current={},step=1,speed=1;
  function stop(){} function update(){}
  ${body}
  animate();
 `);
 run(id=>({checked:false}),{matches:true},{play(){plays++;}},()=>finishes++);
 assert.equal(plays,1);assert.equal(finishes,0);
 run(id=>({checked:true}),{matches:true},{play(){plays++;}},()=>finishes++);
 assert.equal(plays,1);assert.equal(finishes,1);
});
