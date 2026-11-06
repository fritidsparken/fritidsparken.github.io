// Run: node tests/downhill-assets.cjs
// Real Three.js, GLTFLoader, exported GLBs, asset cache, courses, world and rider.
// Only browser canvas painting and texture image IO are stubbed. This verifies
// CPU scene correctness, not WebGL shader compilation, GPU FPS or screenshots.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const game = path.join(root, 'games/downhill');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const canvas = () => ({ width: 256, height: 256, getContext() {
  return new Proxy({ createImageData(w,h) { return {data:new Uint8ClampedArray(w*h*4)}; },
    createLinearGradient() { return {addColorStop(){}}; },
    createRadialGradient() { return {addColorStop(){}}; }, measureText(s) {return {width:s.length*12};}
  }, {get(o,k) {return k in o?o[k]:()=>{};}, set(o,k,v){o[k]=v;return true;}});
}});
const quality = { value: process.argv.find(a=>a.startsWith('--quality='))?.split('=')[1] || 'medium' };
assert.ok(['low','medium','high'].includes(quality.value),'valid quality');
const ctx = vm.createContext({console,TextDecoder,TextEncoder,ArrayBuffer,Uint8Array,Uint8ClampedArray,
  Float32Array,Uint16Array,Uint32Array,DataView,URL,Blob,fetch,setTimeout,clearTimeout,performance,
  document:{createElement:canvas,getElementById:id=>id==='quality'?quality:null}});
ctx.window=ctx;ctx.self=ctx;
vm.runInContext(read('js/vendor/three.min.js'),ctx);
// Existing module depends on a topology helper only for non-triangle primitives;
// every exported mesh uses the standard TRIANGLES mode.
vm.runInContext(read('games/skatepark/kaj/vendor/GLTFLoader.js')
  .replace(/^import .*$/mg,'').replace('export { GLTFLoader };','window.GLTFLoader=GLTFLoader;'),ctx);
ctx.GLTFLoader.prototype.loadAsync = function(url) {
  const filename = path.resolve(game, url.split('?')[0]);
  assert.ok(filename.startsWith(root + path.sep),'asset must resolve within repository');
  const data = fs.readFileSync(filename);
  return new Promise((resolve,reject)=>this.parse(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'',resolve,reject));
};
ctx.THREE.TextureLoader.prototype.load = function() { return new ctx.THREE.Texture(); };
vm.runInContext(read('games/downhill/assets.js').replace(
  "await import('../skatepark/kaj/vendor/GLTFLoader.js')",'({ GLTFLoader: window.GLTFLoader })'),ctx);
vm.runInContext(read('games/downhill/courses.js'),ctx);
vm.runInContext(read('games/downhill/world.js'),ctx);
vm.runInContext(read('games/downhill/rider.js'),ctx);
const finite = (array,label) => { for(const v of array) assert.ok(Number.isFinite(v),label+' contains non-finite value'); };
const checked = new Set();
function checkGeometry(g) {
  if(checked.has(g))return;checked.add(g);
  const p=g.attributes.position;assert.ok(p&&p.count>0,'geometry has positions');finite(p.array,'positions');
  if(g.index)for(const i of g.index.array)assert.ok(i>=0&&i<p.count,'index outside position attribute');
  if(g.attributes.normal)finite(g.attributes.normal.array,'normals');
  g.computeBoundingBox();g.computeBoundingSphere();
  finite(g.boundingBox.min.toArray().concat(g.boundingBox.max.toArray()),'bounds');
  assert.ok(Number.isFinite(g.boundingSphere.radius),'finite sphere');
}
function checkScene(scene) {
  scene.updateMatrixWorld(true);
  const stats={meshes:0,instances:0,triangles:0,drawCalls:0,sharedMeshes:0,visibleInstances:0};
  scene.traverse(o=>{
    finite(o.matrixWorld.elements,o.name+' matrix');
    if(!o.geometry)return;checkGeometry(o.geometry);
    if(o.isInstancedMesh){finite(o.instanceMatrix.array,'instance matrices');if(o.instanceColor)finite(o.instanceColor.array,'instance colors');}
    if(o.isMesh) {
      stats.meshes++;stats.instances+=o.isInstancedMesh?o.count:1;
      if(o.geometry.userData.downhillShared)stats.sharedMeshes++;
    }
  });
  scene.traverseVisible(o=>{
    if(!o.geometry)return;
    const groups=Array.isArray(o.material)?Math.max(o.geometry.groups.length,1):1;
    stats.drawCalls+=groups;
    if(o.isMesh)stats.visibleInstances+=o.isInstancedMesh?o.count:1;
    if(o.isMesh)stats.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);
  });
  return stats;
}
// Flatten actual runtime meshes with shared geometry IDs. Matrix arrays use
// Three.js/glTF column-major convention; coordinates remain Y-up metres.
function snapshot() {
  const c=ctx.course(0),scene=new ctx.THREE.Scene(),env=ctx.world(scene,c);
  const camera=new ctx.THREE.PerspectiveCamera(63,16/9,.08,620);
  const lag=-8, lead=4.8, [cx,cz]=c.place(c.center(lag),lag);
  camera.position.set(cx,c.height(0)+3.2,cz);
  const [lx,lz]=c.place(c.center(lead),lead);camera.lookAt(lx,c.base(lead)+.82,lz);camera.updateMatrixWorld(true);
  const rider=ctx.rider(scene,0,'#f97931'),[rx,rz]=c.place(c.center(0),0);
  rider.group.position.set(rx,c.height(0)+.09,rz);
  rider.group.rotation.y=-Math.atan(c.center(.5)-c.center(-.5));
  rider.pose(0,5,0,0,0,0,null,false);
  env.update(c.center(0),c.height(0),0,camera,0);scene.updateMatrixWorld(true);
  const geometries={},objects=[];
  scene.traverseVisible(o=>{
    if(!o.isMesh||o.material?.isShaderMaterial)return;
    const g=o.geometry;
    if(!geometries[g.uuid]) {
      const attrs={};for(const name of ['position','normal','color','uv'])if(g.attributes[name])attrs[name]={itemSize:g.attributes[name].itemSize,array:Array.from(g.attributes[name].array)};
      geometries[g.uuid]={attributes:attrs,index:g.index?Array.from(g.index.array):null,groups:g.groups};
    }
    const materials=[].concat(o.material).map(m=>({name:m.name,color:m.color?.toArray()||[1,1,1],emissive:m.emissive?.toArray()||[0,0,0],roughness:m.roughness??.7,metalness:m.metalness??0,vertexColors:!!m.vertexColors,opacity:m.opacity,side:m.side}));
    const base={name:o.name,geometry:g.uuid,materials,matrix:o.matrixWorld.toArray()};
    if(o.isInstancedMesh) {
      base.instances=Array.from(o.instanceMatrix.array.slice(0,o.count*16));
      if(o.instanceColor)base.instanceColors=Array.from(o.instanceColor.array.slice(0,o.count*3));
    }
    objects.push(base);
  });
  const lights=[];scene.traverse(o=>{if(o.isLight)lights.push({type:o.type,color:o.color.toArray(),intensity:o.intensity,position:o.getWorldPosition(new ctx.THREE.Vector3()).toArray(),target:o.target?.getWorldPosition(new ctx.THREE.Vector3()).toArray()});});
  const payload={format:'downhill-runtime-snapshot-v1',note:'Actual CPU runtime world, Blender QA is not proof of WebGL output. Matrices column-major; positions Y-up.',camera:{matrix:camera.matrixWorld.toArray(),position:camera.position.toArray(),target:[lx,c.base(lead)+.82,lz],fov:camera.fov,aspect:camera.aspect},background:scene.background?.toArray?.()||[.3,.65,1],geometries,objects,lights};
  const arg=process.argv.find(a=>a.startsWith('--snapshot='));
  const output=arg?path.resolve(arg.slice('--snapshot='.length)):path.resolve(root,'../downhill-runtime-snapshot.json');
  fs.writeFileSync(output,JSON.stringify(payload));console.log('Runtime scene snapshot:',output,fs.statSync(output).size,'bytes');
}
async function main() {
  await ctx.DownhillAssets.load();
  // These names form the checked contract between Blender, loader and world.
  for(const name of ['spruce0','spruce1','spruce2','palm','oak','rock','plank','post','cloud','mountain0','mountain1','mountain2','mountain3']) {
    const asset=ctx.DownhillAssets.mesh(name);assert.ok(asset,'Missing Blender asset '+name);
    assert.equal(asset.geometry.userData.downhillShared,true);checkGeometry(asset.geometry);
  }
  for(const name of ['rabbit','squirrel','bird','butterfly','otter'])
    assert.ok(ctx.DownhillAssets.get('wildlife').getObjectByName(name),'Missing animal '+name);
  const rows=[];
  for(let i=0;i<20;i++) {
    const c=ctx.course(i),scene=new ctx.THREE.Scene(),env=ctx.world(scene,c),camera=new ctx.THREE.PerspectiveCamera(63,16/9,.08,620);
    let maximum;
    // Start, mid-course and finish exercise curved-course placement, visibility
    // toggling, dust reuse, flying wings and water time without changing courses.
    for(const s of [0,9,40,c.len/2,c.len-1]) {
      const [x,z]=c.place(c.center(s),s);camera.position.set(x,c.height(s)+4,z+8);
      env.update(c.center(s),c.height(s),s,camera,1/30);
      const stats=checkScene(scene);
      assert.ok(stats.sharedMeshes>0,'World must use real Blender geometry');
      if(!maximum||stats.drawCalls>maximum.drawCalls)maximum=stats;
    }
    rows.push({course:i+1,name:c.name,drawCalls:maximum.drawCalls,triangles:Math.round(maximum.triangles),instances:maximum.visibleInstances,blenderMeshes:maximum.sharedMeshes});
    // Scene-local buffers may be released; shared Blender cache remains usable.
    const gs=new Set(),ms=new Set();
    scene.traverse(o=>{if(o.geometry&&!o.geometry.userData.downhillShared)gs.add(o.geometry);for(const m of [].concat(o.material||[]))if(!m.userData.downhillShared)ms.add(m);});
    gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());scene.environment?.dispose();
  }
  const original=ctx.DownhillAssets.get('rider');
  const sharedFrame=original.getObjectByName('Frame');
  const originalColors=[];sharedFrame.traverse(o=>{if(o.isMesh)originalColors.push(...[].concat(o.material).map(m=>m.color.getHex()));});
  let poses=0;
  for(let bike=0;bike<8;bike++) {
    const scene=new ctx.THREE.Scene(),r=ctx.rider(scene,bike,'#ef3366');
    for(const type of ['','Whip','Tabletop','Barspin','Superman','Backflip','Frontflip','360 spin'])
      for(const p of [0,.25,.5,.75,1]){
        r.pose(p*13,16,.3,.2,.5,p*Math.PI*2,{p,type},true);checkScene(scene);poses++;
      }
  }
  const after=[];sharedFrame.traverse(o=>{if(o.isMesh)after.push(...[].concat(o.material).map(m=>m.color.getHex()));});
  assert.deepEqual(after,originalColors,'Bike recoloring must not mutate shared source');
  if(process.argv.some(a=>a==='--snapshot'||a.startsWith('--snapshot=')))snapshot();
  console.table(rows);
  console.log(`PASS (${quality.value}): 20 courses, ${checked.size} unique geometries, ${poses} rider poses across 8 bike variants; finite bounds, transforms and instances; shared cache unmodified.`);
  console.log('Draw calls/triangles are visible-parent upper bounds before camera frustum culling, excluding shadow passes. No GPU timing claim.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
