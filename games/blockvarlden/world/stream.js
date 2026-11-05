import {HEIGHT, worldColumn,seedNumber} from './terrain.js';
import {LAVA,LavaFlow} from './lava.js';
const key=(x,z)=>x+','+z, chunk=n=>Math.floor(n/16);
function surfaceTable(reg){
 const bytes=new Uint8Array(reg.columns*reg.rows*4);
 for(const block of reg.blocks)for(const variant of [block.tiles,...block.variants])for(const t of Object.values(variant)){
  bytes.set([Math.round(block.roughness*255),Math.round(block.opacity*255),Math.round(block.light/15*255),block.id===25?255:block.id===LAVA?128:0],t*4)}
 const tex=new THREE.DataTexture(bytes,reg.columns,reg.rows);tex.needsUpdate=true;return tex;
}
function makeMaterial(atlas,reg,clear,table,clock){
 const T=window.THREE,mat=new T.MeshStandardMaterial({map:atlas,roughness:1,transparent:clear,depthWrite:!clear,side:clear?T.DoubleSide:T.FrontSide});
 mat.onBeforeCompile=s=>{
  s.uniforms.surfaceTable={value:table};s.uniforms.waveTime=clock;
  s.vertexShader='attribute float tile; varying float tileID; varying vec3 blockWorld;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntileID=tile;blockWorld=(modelMatrix*vec4(position,1.)).xyz;');
  s.fragmentShader='uniform sampler2D surfaceTable; uniform float waveTime; varying float tileID; varying vec3 blockWorld;\n'+s.fragmentShader.replace('#include <map_fragment>',`
   vec2 cell=vec2(mod(tileID,${reg.columns}.0),floor(tileID/${reg.columns}.0));
   vec2 size=vec2(${reg.columns}.0,${reg.rows}.0);
   vec4 surfaceData=texture2D(surfaceTable,(cell+0.5)/size);
   vec2 tileXY=vec2(cell.x,${reg.rows-1}.0-cell.y);
   float wave=sin(blockWorld.x*1.5+waveTime)*cos(blockWorld.z*.9+waveTime*.7);
   float molten=step(.45,surfaceData.a)*(1.-step(.75,surfaceData.a));
   float water=step(.75,surfaceData.a);
   float curl=sin(blockWorld.x*1.2+blockWorld.y*.9-waveTime*.65)+cos(blockWorld.z*1.7-waveTime*.33);
   vec2 localUV=fract(vMapUv+water*vec2(wave*.023,waveTime*.035)
     +molten*vec2(curl*.044+waveTime*.025,waveTime*.095));
   vec2 tileUV=(tileXY+(0.5+localUV*${reg.tileSize-1}.0)/${reg.tileSize}.0)/size;
   vec4 pigment=texture2D(map,tileUV);
   float vein=pow(1.-abs(sin(4.8*localUV.x+5.6*localUV.y+curl)),3.);
   vec3 hotRock=mix(pigment.rgb*.74,vec3(1.,.34,.034),vein*.85);
   diffuseColor.rgb*=mix(pigment.rgb,hotRock,molten)*(1.+water*wave*.10);
   diffuseColor.a*=surfaceData.g;`)
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=max(.12,surfaceData.r);')
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=mix(pigment.rgb*.85,hotRock*(1.08+vein*.43),molten)*surfaceData.b;');
 };return mat;
}
export class World {
 constructor(scene,reg,atlas,meta,edits){
  this.scene=scene;this.seed=seedNumber(meta.seed);this.defs=Object.fromEntries(reg.blocks.map(b=>[b.id,b]));this.edits=new Map();this.chunks=new Map();this.wanted=new Map();this.revs=new Map();this.jobs=new Set();this.radius=2;this.legacy=meta.legacy;
  for(const entry of edits)this.record(...entry);
  this.fluidDirty=new Set();this.nextFluidTick=0;
  this.lava=new LavaFlow((x,y,z)=>this.at(x,y,z),(x,y,z,id)=>{
   this.writeLoaded(x,y,z,id);this.markNeighbors(x,z,this.fluidDirty);
  },HEIGHT);
  this.clock={value:0};this.table=surfaceTable(reg);this.materials=[false,true].map(clear=>makeMaterial(atlas,reg,clear,this.table,this.clock));
  this.workers=Array.from({length:Math.min(2,navigator.hardwareConcurrency||1)},()=>{const w=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});w.postMessage({init:true,defs:this.defs,ids:{water:25,lava:26,clay:8,moss:11,snow:9,crystal:82,ore:76},seed:this.seed,legacy:this.legacy});w.onmessage=e=>this.receive(w,e.data);w.onerror=e=>this.error=e.message||'Världsgenereringen misslyckades';return w});
 }
 record(x,y,z,id){const k=key(chunk(x),chunk(z));if(!this.edits.has(k))this.edits.set(k,new Map());this.edits.get(k).set(x+','+y+','+z,[x,y,z,id])}
 update(x,z,radius){const cx=chunk(x),cz=chunk(z),sig=[cx,cz,radius].join();if(sig!==this.sig){this.sig=sig;this.wanted.clear();const order=[];
  for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++)order.push([cx+dx,cz+dz,dx*dx+dz*dz]);
  order.sort((a,b)=>a[2]-b[2]);for(const [a,b] of order)this.wanted.set(key(a,b),[a,b]);for(const [k,c] of this.chunks)if(!this.wanted.has(k)){this.remove(c);this.chunks.delete(k);this.lava.unload(c.cx,c.cz);
   if(this.jobs.has(k))this.revs.set(k,(this.revs.get(k)||0)+1);else this.revs.delete(k)}
 }
 const now=performance.now();
 if(now>=this.nextFluidTick){
  this.nextFluidTick=now+235;this.lava.tick();
  for(const k of this.fluidDirty)this.revs.set(k,(this.revs.get(k)||0)+1);
  this.fluidDirty.clear();
 }
 this.pump()}
 pump(){for(const w of this.workers){if(w.busy)continue;for(const [k,[cx,cz]] of this.wanted){const rev=this.revs.get(k)||0;if(this.jobs.has(k)||this.chunks.get(k)?.rev===rev)continue;
  const edits=[],flows=[];for(let z=cz-1;z<=cz+1;z++)for(let x=cx-1;x<=cx+1;x++){const list=this.edits.get(key(x,z));if(list)edits.push(...list.values());for(const flow of this.lava.entries(x,z))flows.push(flow)}
  w.busy=true;this.jobs.add(k);w.postMessage({cx,cz,rev,edits,flows,first:!this.chunks.has(k)});break}
 }}
 receive(w,{cx,cz,rev,data,batches,seeds}){w.busy=false;const k=key(cx,cz);this.jobs.delete(k);if(!this.wanted.has(k))this.revs.delete(k);if(this.wanted.has(k)&&rev===(this.revs.get(k)||0)){
 const old=this.chunks.get(k);if(old)this.remove(old);const group=new THREE.Group();group.position.set(cx*16,0,cz*16);
 for(let pass=0;pass<2;pass++)for(const arr of batches[pass]){const g=new THREE.BufferGeometry(),buf=new THREE.InterleavedBuffer(arr,9);for(const [name,size,offset] of [['position',3,0],['normal',3,3],['uv',2,6],['tile',1,8]])g.setAttribute(name,new THREE.InterleavedBufferAttribute(buf,size,offset));g.computeBoundingSphere();const mesh=new THREE.Mesh(g,this.materials[pass]);mesh.receiveShadow=true;mesh.castShadow=!pass;group.add(mesh)}
 this.scene.add(group);this.chunks.set(k,{cx,cz,rev,data,group});
 if(!old){
  for(let i=0;i<seeds.length;i+=3)this.lava.enqueue(seeds[i],seeds[i+1],seeds[i+2]);
  for(const [dx,dz] of [[0,1],[0,-1],[-1,0],[1,0]])for(const [x,y,z] of this.lava.entries(cx+dx,cz+dz)){
   const nx=x-dx,nz=z-dz;if(chunk(nx)===cx&&chunk(nz)===cz){this.lava.enqueue(x,y,z);this.lava.enqueue(nx,y,nz)}
  }
 }}this.pump()}
 remove(c){this.scene.remove(c.group);for(const obj of c.group.children)obj.geometry.dispose()}
 at(x,y,z){x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);if(y<0)return 3;if(y>=HEIGHT)return 0;const cx=chunk(x),cz=chunk(z),c=this.chunks.get(key(cx,cz));return c?c.data[x-cx*16+1+18*(z-cz*16+1+18*y)]:null}
 solid(x,y,z){const id=this.at(x,y,z);return id===null||!!(id&&this.defs[id]?.collision)}
 surface(x,z){if(this.at(x,0,z)===null)return null;for(let y=HEIGHT-1;y>=0;y--)if(this.solid(x,y,z))return y+1;return 0}
 info(x,z){return worldColumn(Math.floor(x),Math.floor(z),this.seed,this.legacy)}
 writeLoaded(x,y,z,id){const cx=chunk(x),cz=chunk(z);
  this.chunks.get(key(cx,cz)).data[x-cx*16+1+18*(z-cz*16+1+18*y)]=id;
 }
 markNeighbors(x,z,dirty){
  for(const dx of [-1,0,1])for(const dz of [-1,0,1]){
   const k=key(chunk(x+dx),chunk(z+dz));
   if(this.wanted.has(k))dirty.add(k);
  }
 }
 set(x,y,z,id){
  if(y<0||y>=HEIGHT||this.at(x,y,z)===null)return false;
  this.lava.forget(x,y,z);this.record(x,y,z,id);this.writeLoaded(x,y,z,id);
  const dirty=new Set();this.markNeighbors(x,z,dirty);
  for(const k of dirty)this.revs.set(k,(this.revs.get(k)||0)+1);
  this.lava.wake(x,y,z);this.pump();return true;
 }
 dispose(){for(const w of this.workers)w.terminate();for(const c of this.chunks.values())this.remove(c);for(const m of this.materials)m.dispose();this.table.dispose()}
}
