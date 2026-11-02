const assert = require('node:assert/strict');
const {tracks,surface,newRide,step,wrap}=require('../js/stunt-bike.js');
const dt=1/120;
const flat={...tracks[0],points:[[-100,0],[1000,0]],length:900,checkpoints:[5]};
function run(b,t,input,seconds=5){let events=[];for(let i=0;i<seconds*120&&!b.failed&&!b.complete;i++){step(b,t,input(i,b),dt);events.push(...b.events);}return events;}
let idle=newRide(flat);run(idle,flat,()=>({}));assert.equal(idle.score,0,'standing still cannot earn points');assert.ok(!idle.failed);
let brake=newRide(flat);run(brake,flat,()=>({gas:true}),2);const speed=brake.vx;run(brake,flat,()=>({brake:true}),1);assert.ok(brake.vx<speed);run(brake,flat,()=>({brake:true}),3);assert.ok(brake.vx<0,'brake reverses at low speed');
for(const dir of ['left','right']){let b=newRide(flat);let events=run(b,flat,i=>({jump:i===1,[dir]:i/120<.54}));assert.ok(events.some(e=>e.type==='land'&&e.turns===1),dir+' flip lands');assert.ok(!b.failed);}
let double=newRide(flat);double.y=8;double.vy=14;double.contact=[false,false];let de=run(double,flat,i=>({left:i/120<.97}),7);assert.ok(de.some(e=>e.type==='land'&&e.turns===2));assert.equal(double.doubles,1);assert.ok(!double.failed);
let bad=newRide(flat);let events=run(bad,flat,i=>({jump:i===1,left:true}));assert.ok(bad.failed);assert.equal(bad.tricks,0,'failed flip has no confirmed trick');
const results=[];
for(const t of tracks){let b=newRide(t);run(b,t,(_,b)=>{let target=b.contact.some(Boolean)?Math.atan(surface(t,b.x+1).s):0;let u=wrap(target-b.a)*4-b.av*1.5;return {gas:true,left:u>.3,right:u<-.3};},120);assert.ok(b.complete&&!b.failed,t.name+' is completable');assert.ok(b.checkpoint>5);assert.ok(Number.isFinite(b.score));results.push({track:t.name,time:+b.time.toFixed(2),score:b.score});}
assert.equal(tracks.length,20);assert.equal(tracks.filter(t=>t.night).length,10);
assert.equal(new Set(tracks.map(t=>t.id)).size,20);
assert.equal(new Set(tracks.slice(7).map(t=>JSON.stringify(t.points))).size,13,'all new course profiles differ');
assert.equal(new Set(tracks.slice(7).map(t=>t.theme)).size,13,'every new route has its own environment theme');
for(const t of tracks.slice(7)){
  const elevations=t.points.filter(p=>p[1]>-20).map(p=>p[1]);
  assert.ok(Math.max(...elevations)-Math.min(...elevations)>=7,t.name+' has major elevation changes');
  assert.ok(t.points[2][0]<70,t.name+' begins with a ramp, not a long flat runway');
}
for(const t of tracks.slice(7)){
  assert.ok(t.loops.length&&t.ravines.length);
  for(const ring of t.loops){
    const b=newRide(t,ring.x-.1);b.vx=23;let completed=false;
    for(let i=0;i<1800&&!b.failed;i++){step(b,t,{gas:true},dt);if(b.events.some(e=>e.label==='LOOP!')){completed=true;break;}}
    assert.ok(completed,t.name+' loop completes with throttle');assert.ok(!b.loop);assert.ok(Math.abs(wrap(b.a))<.2);
    const slow=newRide(t,ring.x-.05);slow.vx=2;
    run(slow,t,()=>({brake:true}),4);assert.ok(!slow.events.some(e=>e.label==='LOOP!'));assert.equal(slow.score,0,'braking cannot auto-complete a loop');
  }
  for(const gap of t.ravines){
    assert.ok(surface(t,(gap.from+gap.to)/2).y<t.base-20,'ravine has no hidden recovery road');
    const fall=newRide(t,(gap.from+gap.to)/2);fall.y=t.base;fall.contact=[false,false];run(fall,t,()=>({}),5);assert.ok(fall.failed,'missed ravine triggers checkpoint retry');
  }
  for(const cp of t.checkpoints.slice(1)){
    const b=newRide(t,cp);run(b,t,(_,b)=>{let a=b.contact.some(Boolean)?Math.atan(surface(t,b.x+1).s):0,u=wrap(a-b.a)*4-b.av*1.5;return {gas:true,left:u>.3,right:u<-.3};},120);assert.ok(b.complete&&!b.failed,t.name+' restarts at '+cp);
  }
}
console.log(JSON.stringify({passed:true,checks:['idle','acceleration','brake','reverse','front flip','back flip','double flip','failed trick','twenty courses','10 day / 10 night','loops','ravines','checkpoint restarts','checkpoints'],courses:results},null,2));
