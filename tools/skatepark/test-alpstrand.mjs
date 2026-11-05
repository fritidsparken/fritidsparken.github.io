// Run with Node 22+ from any working directory. Uses the shipped GLB/decoder.
// This exercises collision and LOD; image transcoding is tested in the browser.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {alpstrand, indexCourse} from '../../games/skatepark/alpstrand/course.js';
import {instanceScenery} from '../../games/skatepark/alpstrand/scenery.js';
import {rider, tick, act, railPoint} from '../../games/skatepark/model.js';

const require = createRequire(import.meta.url);
const T = require('../../js/vendor/three.min.js');
globalThis.window = globalThis;
globalThis.self = globalThis;
globalThis.THREE = T;
globalThis.createImageBitmap = async () => ({width:8, height:8, close(){}});
const {GLTFLoader} = await import('../../games/skatepark/kaj/vendor/GLTFLoader.js');
const {MeshoptDecoder} = await import('../../games/skatepark/alpstrand/vendor/compression/meshopt_decoder.module.js');
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
loader.setKTX2Loader({load(url, onLoad) { queueMicrotask(() => onLoad(new T.Texture())); }});

async function scene(path) {
  const bytes = await readFile(new URL('../../assets/skatepark/'+path, import.meta.url));
  return (await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
}
const park = await scene('models/alpstrand.glb');
Object.assign(alpstrand, indexCourse(park,T));
const h = alpstrand.sampleHeight;
assert(h(0,23) < -3 && h(10,29) > -.4, 'Connected lagoon and raised island');
assert(h(16,-16) < -1.5 && h(-19,-22) < -1, 'Smaller basins');
assert(h(46.5,-7.7,6) < 4 && h(46.5,-7.7) > 8, 'Separate sill and roof at portal');
assert(Math.abs(h(-21,15)) < .01, 'Spawn on flat concrete');

for (const [name,x,z,angle,run,lip] of [
  ['Summit',-6,-35.6,-44,12.9,15],['Timber',-35,-35.7,-41,11.7,9],
  ['Kraken',-32.5,23,-90,8.3,5.4],['Portal flank',46.4,-4,90,9,8.3],
  ['West quarter',-47,-8.3,-90,6.8,3.4],
]) {
  const yaw=angle*Math.PI/180;
  const p=Object.assign(rider(),{x:x-Math.sin(yaw)*(run+.65),z:z+Math.cos(yaw)*(run+.65),dir:-yaw,speed:13});
  p.y=h(p.x,p.z);
  let apex=0, launched=false, landed=false;
  for(let i=0; i<780 && !landed; i++) {
    tick(p,{go:1},alpstrand,1/120,event=>{if(launched && event==='land') landed=true;});
    launched ||= !!p.transition;
    apex=Math.max(apex,p.y);
  }
  assert(launched && landed && apex>lip+1,name+' must reach the lip, go aerial and land');
  console.log(name, 'apex', apex.toFixed(2),'m');
}
const bowl=Object.assign(rider(),{x:1,z:14,dir:Math.PI,speed:14});
bowl.y=h(bowl.x,bowl.z);
let minimum=0,exited=false;
for(let i=0;i<550;i++){
  tick(bowl,{go:1},alpstrand,1/120,()=>{});
  minimum=Math.min(minimum,bowl.y);
  assert(bowl.y >= h(bowl.x,bowl.z,bowl.y+1.1)-.02,'Board fell through the bowl');
  exited ||= bowl.z>38.5 && bowl.y>=-.2;
}
assert(minimum < -3 && exited,'Traverse both walls of the foreground bowl');
const rail=alpstrand.rails.find(r=>Math.hypot(r[2]-r[0],r[3]-r[1])>4 && r.profile[0]<1);
const [x,y,z]=railPoint(alpstrand,rail,.23);
const skater=Object.assign(rider(),{x,y:y+.05,z,speed:6,air:true,vy:-2,dir:Math.atan2(rail[0]-rail[2],rail[1]-rail[3])});
for(let i=0; i<12 && !skater.rail; i++) tick(skater,{},alpstrand,1/120,()=>{});
assert(skater.rail,'Catch rail');
act(skater,{},'x',()=>{});
assert.equal(skater.rail.id,13,'Change to boardslide');
act(skater,{},'jump',()=>{});
assert(skater.air && !skater.rail,'Ollie out of grind');

const eye=new T.Vector3(-21,3,15);
const lod=instanceScenery(park,await scene('shared/trees/elm-distance.glb'),T);
function visibleTriangles(range) {
  lod(eye,range);
  let count=0;
  park.traverseVisible(o=>{
    if(o.isMesh) count+=o.geometry.index.count/3*(o.count??1);
  });
  return count;
}
assert(visibleTriangles(28)<visibleTriangles(90),'Mobile vegetation LOD');
console.log('Course physics passed:',alpstrand.triangleCount,'rideable triangles,',alpstrand.rails.length,'grind segments.');
