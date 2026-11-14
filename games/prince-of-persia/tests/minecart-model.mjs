import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildCart} from '../minecart-model.js';
THREE.TextureLoader.prototype.load=function(url,onLoad){const texture=new THREE.Texture();texture.userData.source=url;queueMicrotask(()=>onLoad(texture));return texture};
async function setup(){const cart=buildCart(THREE);await cart.ready;const hero=cart.group.getObjectByName('Navid — original character design');const positions=hero.geometry.attributes.position;const base=positions.array.slice();return {cart,hero,positions,base};}
const sample=(s)=>s.positions.array.slice();
const difference=(a,b)=>Math.sqrt(a.reduce((n,x,i)=>n+(x-b[i])**2,0)/a.length);
const maximumStep=(a,b)=>a.reduce((m,x,i)=>Math.max(m,Math.abs(x-b[i])),0);
const s=await setup();
assert(s.hero.material.isMeshBasicMaterial,'Authored hair/cloth must not be relit by moving lamps');
assert.equal(s.hero.material.toneMapped,false,'Scene exposure must not bleach the authored dark hair');
assert.equal(s.hero.material.color.getHex(),0xffffff,'No recolouring of the original Navid texture');
assert.equal(s.hero.material.map.colorSpace,THREE.SRGBColorSpace);
assert(s.hero.material.map.userData.source.endsWith('navid-seated-original.webp'));
assert.equal(s.hero.material.transparent,false,'Opaque alpha test avoids sorting flicker');
assert(s.hero.customDepthMaterial.alphaTest>0,'Character casts silhouette rather than rectangle shadows');
let previous=sample(s),maxMovingStep=0;const poses=[];
for(let frame=1;frame<=1200;frame++){
 s.cart.update(frame/60,frame*.3,18,1/60);const pose=sample(s);assert(pose.every(Number.isFinite));maxMovingStep=Math.max(maxMovingStep,maximumStep(pose,previous));previous=pose;
 if(frame%120===0)poses.push(pose);
}
assert(maxMovingStep<.025,'Cloth must not snap between rendering frames');
const movingPose=sample(s);assert(maximumStep(movingPose,s.base)>.045,'Moving cape must visibly flutter more than the previous tiny wave');
for(let i=0;i<s.positions.count;i++)if(Math.abs(s.base[i*3])>=.33||s.base[i*3+1]>=1.82){assert.equal(movingPose[i*3],s.base[i*3]);assert.equal(movingPose[i*3+1],s.base[i*3+1]);assert.equal(movingPose[i*3+2],s.base[i*3+2]);}
for(let i=0;i<30;i++)s.cart.update(20,360,0,1/60);
assert.deepEqual(sample(s),movingPose,'Pause freezes exact cloth pose despite ongoing render calls');
s.cart.update(20+1/60,360,0,1/60);assert(maximumStep(sample(s),movingPose)<.025,'Braking does not instantly collapse the cape');
for(let f=2;f<=720;f++)s.cart.update(20+f/60,360,0,1/60);
assert(maximumStep(sample(s),s.base)<.012,'Zero-speed cape settles to subtle ambient movement');
assert(difference(poses[2],poses[3])>1e-4 && difference(poses[2],poses[5])>1e-4,'No repeating two- or six-second pose loop');
// Equal real elapsed time gives the same wind/pressure state across refresh rates.
const a=await setup(),b=await setup();for(let f=1;f<=180;f++)a.cart.update(f/60,f*.3,18,1/60);for(let f=1;f<=360;f++)b.cart.update(f/120,f*.15,18,1/120);
assert(maximumStep(sample(a),sample(b))<1e-5,'Motion should not depend on 60/120 Hz rendering');
// All input mistakes remain finite, and a frozen clock cannot advance the wind.
a.cart.update(3,54,NaN,1/60);a.cart.update(3.01,54,-8,0.01);assert(sample(a).every(Number.isFinite));
for(const item of [s,a,b])item.cart.dispose();
console.log('PASS: authored dark hair material, fixed anchors, visible smooth flutter, pause, brake/zero-speed settling, nonrepeating phases, 60/120 Hz consistency, finite geometry');
