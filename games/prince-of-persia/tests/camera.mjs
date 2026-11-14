import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createCartCamera} from '../minecart-camera.js';
const camera=new THREE.PerspectiveCamera(), rig=createCartCamera(THREE,camera);
const p=new THREE.Vector3(0,3,15), q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),.75);
rig.update(p,q,'run',1/60,false);
const expected=new THREE.Vector3(0,3.6,-6.8).applyQuaternion(q).add(p);
assert.ok(camera.position.distanceTo(expected)<1e-10,'Camera centered behind cart at track heading');
const frozen=camera.position.clone(),rotation=camera.quaternion.clone();
for(let i=1;i<180;i++){rig.update(new THREE.Vector3(i*.02,3-i*.25,15+i*.07),q,'falling',1/60);assert.ok(camera.position.distanceTo(frozen)<1e-10,'Camera never follows fall down');assert(camera.quaternion.angleTo(rotation)<1e-7,'Camera angle stays fixed');}
assert.equal(rig.frozen,true);rig.reset();rig.update(p,q,'run',1/60,true);
assert.ok(camera.position.distanceTo(new THREE.Vector3(0,3.8,-8.3).applyQuaternion(q).add(p))<1e-10);
assert.equal(rig.frozen,false);
console.log('PASS camera: directly behind cart in curves; absolutely fixed position for entire fall; restored behind cart at checkpoint; portrait offset');
