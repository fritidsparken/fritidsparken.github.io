import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createCourse,CartPhysics} from '../minecart-track.js';
import {buildCave} from '../cave-environment.js';
import {buildRails} from '../minecart-rails.js';
import {buildCart} from '../minecart-model.js';
import {createCartCamera} from '../minecart-camera.js';
import {renderCoursePreview} from '../course-preview.js';
const originalLoad=T.TextureLoader.prototype.load;
T.TextureLoader.prototype.load=function(url,onLoad){const t=new T.Texture();t.name=url;queueMicrotask(()=>onLoad?.(t));return t};
try{
 for(let level=0;level<10;level++){
  const c=createCourse(level);
  for(const rng of [0,.999])for(const explicit of [0,-1,1]){
   let calls=0;const p=new CartPhysics(c,()=>{calls++;return rng}),r=p.route;
   p.s=r.length-.01;p.speed=c.baseSpeed;if(explicit)p.choose(explicit);p.update(1/90);
   const side=explicit||(rng<.5?-1:1);assert.equal(p.choice,side);assert.equal(p.routeId,side===r.fork.safeSide?r.fork.safeRoute:r.fork.deadRoute);assert.equal(calls,explicit?0:1);assert(p.locked);assert.equal(p.choose(-side),false);
  }
  let target=null,rendered=0,sceneUsed;const renderer={getRenderTarget:()=>target,setRenderTarget:t=>{target=t},render(scene,camera){rendered++;sceneUsed=scene;assert(scene.getObjectByName('Navid — timber minecart'));assert(scene.getObjectByName('Sculpted continuous limestone tunnel'));assert(camera.position.z<0);assert.equal(camera.aspect,16/9);assert(target.isWebGLRenderTarget)}};
  const preview=await renderCoursePreview(T,renderer,{createCourse,buildCave,buildRails,buildCart,createCartCamera},level);
  assert(preview.texture.isTexture);assert.equal(target,null);assert.equal(rendered,level===9?0:1);if(sceneUsed)assert(!sceneUsed.getObjectByName('Cave architecture'),'Temporary world released');preview.dispose();
  console.log(`PASS ${level+1}: random unchosen switch, explicit choice wins, lock, real next-start scene render, render target restoration and cleanup`);
 }
}finally{T.TextureLoader.prototype.load=originalLoad}
