import assert from 'node:assert/strict';
import {createCourse,CartPhysics} from '../minecart-track.js';
import {createCoinLayout} from '../minecart-coins.js';
for(let level=0;level<10;level++){
 const c=createCourse(level),decoys=createCoinLayout(c,true);
 for(const dead of c.routes.filter(r=>r.kind==='dead'))assert(decoys.some(x=>x.routeId===dead.id),'Every false branch has convincing coins');
 for(const route of c.routes)for(const gap of route.gaps){
  assert(gap.end-gap.start>=10);
  const p=new CartPhysics(c);p.routeId=route.id;p.s=gap.start-.2;p.speed=c.maxSpeed;
  while(p.status==='run')p.update(1/90);
  assert.equal(p.status,'falling');
  const a=gap.worldStart,b=gap.worldEnd,dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz;
  for(let i=0;i<200;i++){p.update(1/90);const q=p.snapshot().position,t=((q.x-a.x)*dx+(q.z-a.z)*dz)/l2;assert(t>=0&&t<.85,'Missed jump remains above the hole, before landing rails');}
  const j=new CartPhysics(c);j.routeId=route.id;j.s=gap.end+11.8;j.speed=c.baseSpeed;
  for(let i=0;i<10;i++)j.update(1/90);
  assert.deepEqual(j.snapshotCheckpoint(),{routeId:route.id,s:gap.end+12});const saved=j.snapshotCheckpoint();j.restart();assert.equal(j.s,saved.s);assert(new CartPhysics(c).restoreCheckpoint(saved));
 }
 const p=new CartPhysics(c);let downhill=0,uphill=0,dn=0,up=0;
 for(let i=0;i<24000&&p.status!=='finished';i++){const s=p.snapshot();if(s.pending)p.choose(s.pending.safeSide);if(s.canJump)p.jump();p.update(1/90);const slope=p.route.sample(p.s).tangent.y;if(slope<-.20){downhill+=p.speed;dn++}if(slope>.01){uphill+=p.speed;up++}}
 assert(dn>0&&up>0);assert(downhill/dn>uphill/up,'Downhill travel is faster');assert.equal(p.respawns,0);assert.equal(p.status,'finished');
 console.log(`PASS course ${level+1}: false-branch coins, larger gaps, fall containment, landing checkpoints, downhill acceleration, end-to-end completion`);
}
