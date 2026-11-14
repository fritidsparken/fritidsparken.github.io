import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../minecart-track.js',import.meta.url),'utf8');
const {createCourse,CartPhysics,COURSE_NAMES,COURSE_COUNT}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const tick=(p,input={})=>p.update(1/90,input);
const gapCounts=[],forkCounts=[],profiles=[];
assert.equal(COURSE_COUNT,10);assert.equal(new Set(COURSE_NAMES).size,10);
for(let level=0;level<COURSE_COUNT;level++){
 const c=createCourse(level),p=new CartPhysics(c);gapCounts.push(c.routes.reduce((n,r)=>n+r.gaps.length,0));forkCounts.push(c.junctions.length);
 profiles.push([c.length,c.routes.at(-1).points.at(-1).y,c.routes.find(r=>r.kind==='safe').length].map(n=>n.toFixed(2)).join(','));
 for(const r of c.routes){assert(r.length>0);for(let i=1;i<r.points.length;i++){assert(Number.isFinite(r.points[i].y));assert(r.arc[i]>r.arc[i-1])}
  for(const target of r.fork?[r.fork.safeRoute,r.fork.deadRoute]:r.next?[r.next]:[]){const end=r.sample(r.length),start=c.routeMap.get(target).sample(0);assert(Math.hypot(end.position.x-start.position.x,end.position.y-start.position.y,end.position.z-start.position.z)<1e-8);assert(end.tangent.x*start.tangent.x+end.tangent.y*start.tangent.y+end.tangent.z*start.tangent.z>.999)}
  for(const g of r.gaps)assert(g.start>=42&&g.end+12<r.length,'warnings and landing runway');
 }
 let ticks=0,warnings=0,lastWarning='',jumps=0;
 while(p.status!=='finished'&&ticks++<18000){const s=p.snapshot();if(s.pending)p.choose(s.pending.safeSide);if(s.jumpWarning&&s.nextGap.routeId+':'+s.nextGap.start!==lastWarning){assert(s.nextGap.distance>=39.6,'warn40m ahead');lastWarning=s.nextGap.routeId+':'+s.nextGap.start;warnings++}if(s.canJump&&!s.jumpQueued){assert(p.jump());jumps++}tick(p)}
 assert.equal(p.status,'finished');assert.equal(p.respawns,0);assert.equal(p.snapshot().progress,1);assert.equal(warnings,c.gapCount);assert.equal(jumps,c.gapCount);assert(Math.hypot(...Object.values({x:p.snapshot().position.x-c.finish.x,y:p.snapshot().position.y-c.finish.y,z:p.snapshot().position.z-c.finish.z}))<1e-6);
 console.log(`PASS ${level+1} ${c.name}: ${c.junctions.length} forks, ${c.gapCount} jumps, 40m warnings, complete (${Math.round(c.length)}m)`);
 // Every course must recover deterministically from a wrong choice.
 const wrong=new CartPhysics(c);while(!wrong.pendingFork())tick(wrong);const f=wrong.pendingFork();assert(wrong.choose(f.safeSide));assert(wrong.choose(-f.safeSide));
 while(!wrong.locked)tick(wrong);assert.equal(wrong.route.kind,'dead');assert.equal(wrong.choose(f.safeSide),false);assert.equal(wrong.jump(),false);
 while(wrong.status!=='falling')tick(wrong);const initial=wrong.snapshot().position;for(let i=0;i<60;i++)tick(wrong);assert(wrong.snapshot().position.y<initial.y-1);while(!wrong.respawns)tick(wrong);assert.equal(wrong.routeId,c.startRoute);assert.equal(wrong.s,0);assert.equal(wrong.choice,0);
 // Gap failure returns to the latest safe main route, with no unintended jump.
 const fail=new CartPhysics(c);const cp={routeId:c.routes.at(-1).id,s:0};assert(fail.restoreCheckpoint(cp));assert.equal(fail.jump(),false);
 while(!fail.snapshot().canJump)tick(fail);while(fail.status==='run')tick(fail);assert.equal(fail.status,'falling');while(!fail.respawns)tick(fail);assert.deepEqual(fail.snapshotCheckpoint(),cp);assert.equal(fail.s,0);
}
assert.equal(new Set(profiles).size,10);assert.deepEqual(gapCounts,[1,1,2,2,2,3,3,3,4,4]);assert.deepEqual(forkCounts,[2,3,3,4,4,5,5,6,6,7]);
{
 const a=new CartPhysics(createCourse(9)),b=new CartPhysics(createCourse(9));for(let i=0;i<350;i++){tick(a);tick(b,{accelerate:i%2===0,brake:i%2===1});assert.deepEqual(a.snapshot(),b.snapshot())}assert(a.speed>0);console.log('PASS automatic speed: throttle/brake input cannot alter motion');
}
{
 const p=new CartPhysics(createCourse(4));while(p.routeId!=='main-1'){const s=p.snapshot();if(s.pending)p.choose(s.pending.safeSide);if(s.canJump)p.jump();tick(p)}const cp=p.snapshotCheckpoint();p.restart();assert.equal(p.routeId,cp.routeId);assert.equal(p.s,0);const restored=new CartPhysics(createCourse(4));assert(restored.restoreCheckpoint(cp));assert.equal(restored.routeId,cp.routeId);assert.equal(restored.restoreCheckpoint({routeId:'dead-0'}),false);console.log('PASS checkpoint serialization and validation');
}
console.log('PASS all ten wrong branches, gravity falls, automatic restarts and missed-jump recovery');
