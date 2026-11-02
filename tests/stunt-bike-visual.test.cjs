/* Real Three.js geometry/scene tests. The GPU and Canvas drawing operations are
   stubbed: these tests deliberately do NOT claim shader, appearance or FPS QA. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const THREE={...require('../js/vendor/three.min.js')};
const context2d={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},fillRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},save(){},restore(){},translate(){},scale(){},createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})};
let width=1366,height=580;
const element={textContent:'',style:{},dataset:{},setAttribute(){},addEventListener(){},getBoundingClientRect:()=>({width,height}),getContext:()=>context2d,querySelectorAll:()=>[],querySelector:()=>element};
THREE.WebGLRenderer=class {constructor(){this.capabilities={getMaxAnisotropy:()=>8};this.shadowMap={};}setPixelRatio(r){this.ratio=r;}setSize(){}render(){}dispose(){}};
THREE.PMREMGenerator=class {fromEquirectangular(){return {texture:new THREE.Texture(),dispose(){}};}dispose(){}};
const sandbox={THREE,document:{createElement:()=>({...element}),querySelector:()=>element},window:{THREE},navigator:{hardwareConcurrency:8},innerWidth:1366,devicePixelRatio:1,AbortController,console,Uint8ClampedArray,setTimeout,clearTimeout,cancelAnimationFrame(){}};
let source=fs.readFileSync(require.resolve('../js/stunt-bike.js'),'utf8');
source=source.replace('  window.FPStuntBike={gallery,start,destroy};',`  window.FPStuntBike={gallery,start,destroy};
  window.visualTest={
    init(){root=document.querySelector();canvas=root;abort=new AbortController();save={selected:0};initRenderer();},
    build(i){level=i;ride=newRide(tracks[i]);buildWorld();rebuildBike();return {scene,world,bike,ride,camera};},
    frame(dt){render(dt);},
    profile(q){quality=q;applyQuality();return renderer.ratio;},
    particles(){particles(0,100);return fx.length;},
    cache(){return {materials:materials.size,geometries:geometries.size,textures:textures.size};},
    destroy
  };`);
vm.runInNewContext(source,sandbox);
const api=sandbox.window.visualTest;api.init();
const summary=[];
for(let pass=0;pass<2;pass++)for(let i=0;i<7;i++){
  const {scene,world,bike,ride,camera}=api.build(i);
  for(const size of [[1366,580],[1024,490],[768,580],[390,430]]){
    [width,height]=size;camera.aspect=width/height;camera.updateProjectionMatrix();
    for(let q=0;q<3;q++){assert.ok(api.profile(q)<=1.8);for(const pose of [{x:5,a:0,compression:[0,0],av:0},{x:70,a:.65,compression:[.2,.1],av:3},{x:90,a:Math.PI*2,compression:[.3,.3],av:0}]){Object.assign(ride,pose);api.frame(1/60);scene.updateMatrixWorld(true);}}
  }
  let meshes=0,instances=0,mapped=0;scene.traverse(o=>{
    assert.ok(o.matrixWorld.elements.every(Number.isFinite),'finite transforms: '+o.type);
    if(o.isMesh){meshes++;if(o.isInstancedMesh)instances+=o.count;if(o.material.map)mapped++;
      const positions=o.geometry.getAttribute('position');assert.ok([...positions.array].every(Number.isFinite),'finite vertices');
      if(o.isInstancedMesh)assert.ok([...o.instanceMatrix.array].every(Number.isFinite),'finite instance matrices');
    }
  });
  assert.equal(bike.userData.wheels.length,2);assert.equal(bike.userData.limbs.length,2);
  assert.ok(mapped>50);assert.ok(instances>100);assert.ok(scene.environment);
  assert.ok(api.particles()<=36);
  summary.push({pass,level:i+1,meshes,instances,mapped,cache:api.cache()});
}
// Rebuilding a previously visited course must not grow shared GPU resource caches.
assert.deepEqual(summary[6].cache,summary[13].cache);
api.destroy();assert.deepEqual({...api.cache()},{materials:0,geometries:0,textures:0});
console.log(JSON.stringify({passed:true,coverage:'7 scenes × 4 canvas sizes × 3 quality profiles × 3 poses, twice; cache reuse and cleanup. GPU rendering not tested.',scenes:summary.slice(0,7)},null,2));
