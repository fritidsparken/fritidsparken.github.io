import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,base),'utf8'),moduleFrom=s=>import('data:text/javascript;base64,'+Buffer.from(s).toString('base64'));
const {createCourse,CartPhysics}=await moduleFrom(read('minecart-track.js'));
const {CoinState,createCoinLayout,buildCoins,PICKUP_TIMING}=await moduleFrom(read('minecart-coins.js'));
let allIds=[];
for(let level=0;level<10;level++){
 const c=createCourse(level),p=new CartPhysics(c),state=new CoinState(c,allIds),layout=createCoinLayout(c);
 assert.equal(new Set(layout.map(c=>c.id)).size,layout.length);assert.deepEqual(layout,createCoinLayout(c));assert(layout.length>0);assert(layout.every(coin=>c.routeMap.get(coin.routeId).kind!=='dead'));
 for(const route of c.routes.filter(r=>r.kind!=='dead'))assert(layout.some(coin=>coin.routeId===route.id));
 let time=0,previous=p.snapshot(),events=0;
 while(p.status!=='finished'&&time<200){const s=p.snapshot();if(s.pending)p.choose(s.pending.safeSide);if(s.canJump)p.jump();p.update(1/90);time+=1/90;const current=p.snapshot();events+=state.collect(previous,current,time).length;previous=current}
 assert.equal(p.status,'finished');assert.equal(state.summary().courseCount,layout.length);assert.equal(events,layout.length);assert.equal(state.summary(time+2).displayCourseCount,layout.length);
 const saved=state.exportIds(),restored=new CoinState(c,saved);p.restoreCheckpoint({routeId:c.startRoute,s:0});previous=p.snapshot();for(let i=0;i<400;i++){p.update(1/90);const curr=p.snapshot();assert.equal(restored.collect(previous,curr,time+i/90).length,0);previous=curr}
 allIds=saved;assert.equal(restored.summary().totalCount,allIds.length);console.log(`PASS course${level+1}: ${layout.length} reachable deterministic coins; every safe route covered, retry/reload cannot farm`);
}
{
 const c=createCourse(0),state=new CoinState(c),r=c.routeMap.get(c.startRoute);
 const snap=(route,s,status='run',respawns=0)=>({routeId:route.id,s,status,respawns,position:route.sample(s).position});
 const picks=state.collect(snap(r,0),snap(r,51),1);assert.equal(picks.length,4,'sweep catches coins at high speed');assert.equal(state.summary(1).displayTotalCount,0);assert.equal(state.summary(1.8).displayTotalCount,4);assert(state.summary(1.92).hudScale>1);assert.equal(state.summary(2.1).hudScale,1);assert.equal(picks.at(-1).combo,4);
 const dead=c.routeMap.get('dead-0'),safe=c.routeMap.get('safe-0');const b=new CoinState(c);
 assert.equal(b.collect(snap(dead,0),snap(dead,dead.length),1).length,0,'cannot pick safe-branch coins through wall');assert.equal(b.collect(snap(r,10),snap(safe,40),1).length,0,'non-edge teleport must not award a full route');
 assert.equal(b.collect(snap(r,0),snap(r,50,'falling'),1).length,0);assert.equal(b.collect(snap(r,0),snap(r,50,'run',1),1).length,0);assert.equal(b.collect(snap(r,50),snap(r,0),1).length,0);
 const crossing=new CoinState(c);assert.equal(crossing.collect(snap(r,r.length-.1),snap(safe,30),1).length,2,'high-speed sweep across a valid switch');
 console.log('PASS high-speed sweeps, delayed HUD arrival/bounce, branch isolation and reset/fall rejection');
}
{
 const T=await moduleFrom(read('vendor/three.module.js')),scene=new T.Scene(),c=createCourse(0),state=new CoinState(c),field=buildCoins(T,scene,c,state),camera=new T.PerspectiveCamera(64,1.5,.1,200),p=new CartPhysics(c),first=state.coins[0];
 camera.position.set(0,5,-8);camera.lookAt(0,1,10);camera.updateMatrixWorld();field.update(0,p.snapshot(),camera);
 const r=c.routeMap.get(first.routeId),prev={...p.snapshot(),s:first.s-1,travel:first.s-1,position:r.sample(first.s-1).position},next={...p.snapshot(),s:first.s+1,travel:first.s+1,position:r.sample(first.s+1).position};const events=state.collect(prev,next,1);field.pickup(events);assert.equal(field.activePickups,1);
 for(const t of [1,1.1,1.3,1.5,1.79,1.81])field.update(t,next,camera);assert.equal(field.activePickups,1);field.update(2.11,next,camera);assert.equal(field.activePickups,0);field.dispose();assert.equal(scene.children.length,0);assert.equal(PICKUP_TIMING.arrival,.8);console.log('PASS real Three geometry, pickup stages, particle lifetime and disposal');
}
console.log(`PASS grand total persists across all10 courses: ${allIds.length} coins`);
