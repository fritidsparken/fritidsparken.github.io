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
assert.equal(tracks.length,7);
console.log(JSON.stringify({passed:true,checks:['idle','acceleration','brake','reverse','front flip','back flip','double flip','failed trick','seven courses','checkpoints'],courses:results},null,2));
