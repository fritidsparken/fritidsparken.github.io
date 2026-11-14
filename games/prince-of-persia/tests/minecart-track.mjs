import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../minecart-track.js',import.meta.url),'utf8');
const {createCourse,CartPhysics}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const tick=(p,input={})=>p.update(1/120,input);
for(let level=0;level<5;level++){
 const c=createCourse(level),p=new CartPhysics(c);
 for(const r of c.routes){assert(r.length>0);for(let i=1;i<r.points.length;i++){assert(Number.isFinite(r.points[i].y));assert(r.arc[i]>r.arc[i-1])}for(const target of r.fork?[r.fork.safeRoute,r.fork.deadRoute]:r.next?[r.next]:[]){const end=r.sample(r.length),start=c.routeMap.get(target).sample(0);assert(Math.hypot(end.position.x-start.position.x,end.position.y-start.position.y,end.position.z-start.position.z)<1e-8);assert(end.tangent.x*start.tangent.x+end.tangent.y*start.tangent.y+end.tangent.z*start.tangent.z>.999)}}
 let ticks=0;while(p.status!=='finished'&&ticks++<25000){const s=p.snapshot();if(s.pending)p.choose(s.pending.safeSide);if(s.canJump)p.jump();tick(p,{accelerate:level%2===1,brake:level===4})}
 assert.equal(p.status,'finished');assert.equal(p.respawns,0);assert.equal(p.snapshot().progress,1);assert(Math.hypot(...Object.values({x:p.snapshot().position.x-c.finish.x,y:p.snapshot().position.y-c.finish.y,z:p.snapshot().position.z-c.finish.z}))<1e-6);
 console.log(`PASS course ${level+1}: joins/tangents, safe branches, intended jump, door arrival`);
}
{
 const p=new CartPhysics(createCourse(0));assert.equal(p.choose(1),false);assert.equal(p.jump(),false);
 while(!p.pendingFork())tick(p);assert(p.choose(-1));assert(p.choose(1));assert.equal(p.snapshot().choice,1);
 while(!p.locked)tick(p);assert.equal(p.route.kind,'dead');assert.equal(p.choose(-1),false);
 while(p.status!=='falling')tick(p);const before=p.snapshot().position.y;tick(p);tick(p);assert(p.snapshot().position.y<before);while(!p.respawns)tick(p);assert.equal(p.routeId,'main-0');assert.equal(p.s,0);
 console.log('PASS latest choice, locked dead route, physical gravity fall, automatic checkpoint respawn');
}
{
 const p=new CartPhysics(createCourse(1));for(let i=0;i<60;i++)tick(p);const a=p.speed;for(let i=0;i<60;i++)tick(p,{accelerate:true});assert(p.speed>a);const b=p.speed;for(let i=0;i<60;i++)tick(p,{brake:true});assert(p.speed<b);
 while(p.routeId!=='main-1'){const s=p.snapshot();if(s.pending)p.choose(s.pending.safeSide);tick(p)}const cp=p.snapshotCheckpoint();assert.equal(cp.routeId,'main-1');p.restart();assert.equal(p.routeId,'main-1');assert.equal(p.s,0);const restored=new CartPhysics(createCourse(1));assert(restored.restoreCheckpoint(cp));assert.equal(restored.routeId,'main-1');assert.equal(restored.restoreCheckpoint({routeId:'dead-0'}),false);
 console.log('PASS smooth acceleration/braking, checkpoint restart and restore');
}
{
 const p=new CartPhysics(createCourse(0));p.restoreCheckpoint({routeId:'main-3'});while(p.status==='run')tick(p);assert.equal(p.status,'falling');assert(p.fallPosition.z>0);
 console.log('PASS unjumped intended gap falls; arbitrary jumps rejected');
}
{
 const p=new CartPhysics(createCourse(1));while(!p.locked)tick(p);assert.equal(p.choice,-1);assert.equal(p.route.kind,'dead');
 console.log('PASS no-input default is deterministic left');
}
