import {HEIGHT, column,seedNumber} from './terrain.js';
const key=(x,z)=>x+','+z, chunk=n=>Math.floor(n/16);
function makeMaterial(atlas,reg,clear){
 const T=window.THREE, mat=new T.MeshLambertMaterial({map:atlas,transparent:clear,opacity:clear?.72:1,depthWrite:!clear,side:clear?T.DoubleSide:T.FrontSide});
 mat.onBeforeCompile=s=>{
  s.vertexShader='attribute float tile; varying float tileID;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntileID=tile;');
  s.fragmentShader='varying float tileID;\n'+s.fragmentShader.replace('#include <map_fragment>',`vec2 tileXY=vec2(mod(tileID,${reg.columns}.0),${reg.rows-1}.0-floor(tileID/${reg.columns}.0));vec2 tileUV=(tileXY+(0.5+fract(vMapUv)*${reg.tileSize-1}.0)/${reg.tileSize}.0)/vec2(${reg.columns}.0,${reg.rows}.0);diffuseColor*=texture2D(map,tileUV);`);
 };return mat;
}
export class World {
 constructor(scene,reg,atlas,meta,edits){
  this.scene=scene;this.seed=seedNumber(meta.seed);this.defs=Object.fromEntries(reg.blocks.map(b=>[b.id,b]));this.edits=new Map();this.chunks=new Map();this.wanted=new Map();this.revs=new Map();this.jobs=new Set();this.radius=2;this.legacy=meta.legacy;
  for(const entry of edits)this.record(...entry);
  this.materials=[false,true].map(clear=>makeMaterial(atlas,reg,clear));
  this.workers=Array.from({length:Math.min(2,navigator.hardwareConcurrency||1)},()=>{const w=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});w.postMessage({init:true,defs:this.defs,ids:{water:25,lava:26,clay:8,moss:11,snow:9,crystal:82,ore:76},seed:this.seed,legacy:this.legacy});w.onmessage=e=>this.receive(w,e.data);w.onerror=e=>this.error=e.message||'Världsgenereringen misslyckades';return w});
 }
 record(x,y,z,id){const k=key(chunk(x),chunk(z));if(!this.edits.has(k))this.edits.set(k,new Map());this.edits.get(k).set(x+','+y+','+z,[x,y,z,id])}
 update(x,z,radius){const cx=chunk(x),cz=chunk(z),sig=[cx,cz,radius].join();if(sig!==this.sig){this.sig=sig;this.wanted.clear();const order=[];
  for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++)order.push([cx+dx,cz+dz,dx*dx+dz*dz]);
  order.sort((a,b)=>a[2]-b[2]);for(const [a,b] of order)this.wanted.set(key(a,b),[a,b]);for(const [k,c] of this.chunks)if(!this.wanted.has(k)){this.remove(c);this.chunks.delete(k);this.revs.delete(k)}
 }this.pump()}
 pump(){for(const w of this.workers){if(w.busy)continue;for(const [k,[cx,cz]] of this.wanted){const rev=this.revs.get(k)||0;if(this.jobs.has(k)||this.chunks.get(k)?.rev===rev)continue;
  const edits=[];for(let z=cz-1;z<=cz+1;z++)for(let x=cx-1;x<=cx+1;x++){const list=this.edits.get(key(x,z));if(list)edits.push(...list.values())}
  w.busy=true;this.jobs.add(k);w.postMessage({cx,cz,rev,edits});break}
 }}
 receive(w,{cx,cz,rev,data,batches}){w.busy=false;const k=key(cx,cz);this.jobs.delete(k);if(this.wanted.has(k)&&rev===(this.revs.get(k)||0)){
 const old=this.chunks.get(k);if(old)this.remove(old);const group=new THREE.Group();group.position.set(cx*16,0,cz*16);
 for(let pass=0;pass<2;pass++)for(const arr of batches[pass]){const g=new THREE.BufferGeometry(),buf=new THREE.InterleavedBuffer(arr,9);for(const [name,size,offset] of [['position',3,0],['normal',3,3],['uv',2,6],['tile',1,8]])g.setAttribute(name,new THREE.InterleavedBufferAttribute(buf,size,offset));g.computeBoundingSphere();const mesh=new THREE.Mesh(g,this.materials[pass]);mesh.receiveShadow=true;group.add(mesh)}
 this.scene.add(group);this.chunks.set(k,{rev,data,group})}this.pump()}
 remove(c){this.scene.remove(c.group);for(const obj of c.group.children)obj.geometry.dispose()}
 at(x,y,z){x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);if(y<0)return 3;if(y>=HEIGHT)return 0;const cx=chunk(x),cz=chunk(z),c=this.chunks.get(key(cx,cz));return c?c.data[x-cx*16+1+18*(z-cz*16+1+18*y)]:null}
 solid(x,y,z){const id=this.at(x,y,z);return id===null||!!(id&&this.defs[id]?.collision)}
 surface(x,z){if(this.at(x,0,z)===null)return null;for(let y=HEIGHT-1;y>=0;y--)if(this.solid(x,y,z))return y+1;return 0}
 info(x,z){return column(Math.floor(x),Math.floor(z),this.seed)}
 set(x,y,z,id){if(y<0||y>=HEIGHT||this.at(x,y,z)===null)return false;this.record(x,y,z,id);const cx=chunk(x),cz=chunk(z);
 this.chunks.get(key(cx,cz)).data[x-cx*16+1+18*(z-cz*16+1+18*y)]=id;
 for(const k of new Set([[x,z],[x-1,z],[x+1,z],[x,z-1],[x,z+1]].map(([a,b])=>key(chunk(a),chunk(b)))))this.revs.set(k,(this.revs.get(k)||0)+1);
 this.pump();return true}
 dispose(){for(const w of this.workers)w.terminate();for(const c of this.chunks.values())this.remove(c);for(const m of this.materials)m.dispose()}
}
