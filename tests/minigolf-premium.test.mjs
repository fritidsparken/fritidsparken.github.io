import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {courses} from '../games/minigolf/courses.mjs';
import {surfaces} from '../games/minigolf/physics.mjs';
import {boundarySegments} from '../games/minigolf/boundary.mjs';
import {puttingGeometry,stoneBoundary} from '../games/minigolf/garden.mjs';
import {environments} from '../games/minigolf/environments.mjs';
import {soundscapes} from '../games/minigolf/audio.mjs';
import {fresh,clean} from '../games/minigolf/state.mjs';
const T=createRequire(import.meta.url)('../js/vendor/three.min.js');
test('every course has its own visual and sound profile',()=>{assert.equal(environments.length,18);assert.equal(new Set(environments.map(e=>e.style)).size,18);assert.equal(new Set(soundscapes.map(e=>JSON.stringify(e))).size,18);});
for(const c of courses)test(`render geometry ${c.id+1}: finite vertices, upward turf, closed stone contours`,()=>{
 const seg=surfaces(c).filter(s=>!c.features.some(f=>f.type==='movingBridge'&&f.node===s.i));
 const g=puttingGeometry(T,c,seg,.4);assert(g.attributes.position.count>0);
 for(const a of Object.values(g.attributes))assert(a.array.every(Number.isFinite));
 for(let i=0;i<g.attributes.normal.count;i++)assert(g.attributes.normal.getY(i)>0,'turf faces upwards');
 const ray=new T.Raycaster(new T.Vector3(c.path[0][0],c.path[0][1]+10,c.path[0][2]),new T.Vector3(0,-1,0));
 const green=new T.Mesh(g,new T.MeshBasicMaterial());green.updateMatrixWorld();const hit=ray.intersectObject(green)[0];assert(hit);assert(Math.abs(hit.point.y-c.path[0][1]+.018)<.02);
 for(const f of c.features.filter(f=>f.gap)){const a=c.path[f.node],b=c.path[f.exit],x=(a[0]+b[0])/2,z=(a[2]+b[2])/2;let near=Infinity;for(const {a,b}of seg){const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz)));near=Math.min(near,Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz));}if(near>c.width/2+.5){ray.set(new T.Vector3(x,30,z),new T.Vector3(0,-1,0));assert.equal(ray.intersectObject(green).length,0,'authored gap stays open');}}
 const edge=stoneBoundary(T,boundarySegments(c,.4));assert(edge.attributes.position.count>0);assert(edge.attributes.position.array.every(Number.isFinite));g.dispose();edge.dispose();green.material.dispose();
});
test('saved audio settings survive reload and clamp malformed values',()=>{const s=clean({...fresh(),musicVolume:.34,effectVolume:.89});assert.equal(s.musicVolume,.34);assert.equal(s.effectVolume,.89);assert.equal(clean({...fresh(),musicVolume:5,effectVolume:-2}).effectVolume,0);});
