import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createCourse} from '../minecart-track.js';
import {buildCave} from '../cave-environment.js';
const load=THREE.TextureLoader.prototype.load;
THREE.TextureLoader.prototype.load=function(_url,onLoad){const t=new THREE.Texture();queueMicrotask(()=>onLoad?.(t));return t};
const close=(a,b,t=1e-6)=>assert(Math.abs(a-b)<=t,`${a} != ${b}`);
try{
 for(let level=0;level<10;level++){
  const course=createCourse(level),scene=new THREE.Scene(),cave=buildCave(THREE,scene,course,level);await cave.ready;
  assert.equal(cave.doorLeaves.length,2);assert.equal(cave.door.userData.openAmount,0);
  const origin=cave.door.position.clone(),forward=new THREE.Vector3(course.finishTangent.x,0,course.finishTangent.z).normalize();
  const hinges=cave.doorLeaves.map(h=>h.position.clone());
  for(const hinge of cave.doorLeaves){
   close(hinge.rotation.y,0);close(Math.abs(hinge.position.x),2.8);
   const solid=hinge.getObjectByName('Solid arched door leaf');assert(solid.geometry.isBufferGeometry);solid.geometry.computeBoundingBox();assert(solid.geometry.boundingBox.max.z-solid.geometry.boundingBox.min.z>.25);
   const face=hinge.children.find(c=>c.name.startsWith('Original door ')),uv=face.geometry.attributes.uv,values=[];for(let i=0;i<uv.count;i++)values.push(uv.getX(i));
   const expected=hinge.userData.side===1?[0,.5]:[.5,1];close(Math.min(...values),expected[0]);close(Math.max(...values),expected[1]);
  }
  let oldAmount=0,oldAngle=0;
  for(let distance=40;distance>=0;distance-=.2){
   const p=origin.clone().addScaledVector(forward,-distance);cave.update((40-distance)/20,p);
   const amount=cave.door.userData.openAmount;assert(amount>=oldAmount-1e-9,'Opening is monotonic and cannot snap shut');
   assert(Math.abs(cave.doorLeaves[0].rotation.y-oldAngle)<.028,'Small movement causes a small rotation');
   if(distance>=28)close(amount,0);if(distance<=9.999)close(amount,1);
   close(cave.doorLeaves[0].rotation.y,-cave.doorLeaves[1].rotation.y);
   close(cave.door.position.distanceTo(origin),0);cave.doorLeaves.forEach((h,i)=>close(h.position.distanceTo(hinges[i]),0));
   oldAmount=amount;oldAngle=cave.doorLeaves[0].rotation.y;
  }
  assert(oldAmount===1);assert(cave.doorLeaves[0].rotation.y>1.5,'Leaves clear the track before arrival');
  cave.update(4,origin.clone().addScaledVector(forward,-50));close(cave.door.userData.openAmount,1);
  assert(cave.passage.children.some(c=>c.isPointLight),'Actual depth lighting');
  const extent=new THREE.Box3().setFromObject(cave.passage);assert(extent.getSize(new THREE.Vector3()).length()>20,'Physical passage has volume and depth');
  const geos=new Set(),mats=new Set(),tex=new Set();cave.root.traverse(o=>{if(o.geometry)geos.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){mats.add(m);for(const field of ['map','normalMap','bumpMap','roughnessMap'])if(m[field])tex.add(m[field])}});
  const disposed=[new Set(),new Set(),new Set()];[geos,mats,tex].forEach((set,i)=>set.forEach(resource=>resource.addEventListener('dispose',()=>disposed[i].add(resource))));
  cave.dispose();assert.equal(scene.children.length,0);[geos,mats,tex].forEach((set,i)=>assert.equal(disposed[i].size,set.size,'All door/passsage resources disposed'));
  const reset=buildCave(THREE,scene,course,level);await reset.ready;close(reset.door.userData.openAmount,0);reset.dispose();
  console.log(`PASS level ${level+1}: hinged textured halves, smooth 28→10m opening, fixed destination, lit depth passage, reset and disposal`);
 }
}finally{THREE.TextureLoader.prototype.load=load}
