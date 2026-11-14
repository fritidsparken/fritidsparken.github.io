import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createCourse} from '../minecart-track.js';
import {buildRails} from '../minecart-rails.js';
for(let level=0;level<10;level++){
 const scene=new T.Scene(),course=createCourse(level),rails=buildRails(T,scene,course),gaps=course.routes.flatMap(r=>r.gaps||[]);
 assert.equal(rails.warningSigns.length,gaps.length*2);
 for(const sign of rails.warningSigns){assert([25,38].includes(sign.distance));const p=course.routeMap.get(sign.routeId).sample(sign.s).position;assert(sign.object.position.distanceTo(new T.Vector3(p.x,p.y,p.z))<1e-7)}
 for(const r of course.routes){const geo=rails.group.getObjectByName('Rail route '+r.id).geometry,a=geo.attributes.position;assert(a.array.every(Number.isFinite));for(const gap of r.gaps){const mid=r.sample((gap.start+gap.end)/2),p=new T.Vector3(mid.position.x,mid.position.y,mid.position.z),dir=new T.Vector3(mid.tangent.x,mid.tangent.y,mid.tangent.z).normalize();let overGap=0;for(let i=0;i<a.count;i++){const v=new T.Vector3(a.getX(i),a.getY(i),a.getZ(i)).sub(p);if(Math.abs(v.dot(dir))<(gap.end-gap.start)*.5-.25&&v.length()<3)overGap++}assert.equal(overGap,0,'Rails must end at actual jump gap')}
 }
 rails.dispose();assert.equal(scene.children.length,0);console.log('PASS level '+(level+1)+': '+gaps.length+' real rail gaps; '+gaps.length*2+' signs at 38m/25m; finite geometry & disposal');
}
