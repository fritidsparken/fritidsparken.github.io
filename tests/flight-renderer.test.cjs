const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function harness(){
 const real=require('../js/vendor/three.min.js'),THREE={...real};let scene;
 const gradient={addColorStop(){}};const ctx={fillRect(){},createRadialGradient(){return gradient;}};
 const canvas=()=>({style:{},dataset:{},setAttribute(){},getContext(type){return type==='2d'?ctx:{};},addEventListener(){},removeEventListener(){},remove(){}});
 THREE.WebGLRenderer=class{constructor(){this.domElement=canvas();this.shadowMap={};this.capabilities={getMaxAnisotropy:()=>4};}setSize(){}setPixelRatio(){}render(s){scene=s;}dispose(){}};
 THREE.CubeCamera=class extends real.Object3D{update(){}};
 const storage=new Map(),window={THREE},context={window,document:{createElement:canvas},navigator:{hardwareConcurrency:8},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},devicePixelRatio:1,performance,console};
 vm.createContext(context);vm.runInContext(fs.readFileSync('js/plane-pilot.js','utf8'),context);vm.runInContext(fs.readFileSync('js/plane-pilot-3d.js','utf8'),context);
 const host=canvas();host.after=()=>{};const view=window.FPFlight3D.create(host);return{view,P:window.FPFlightPhysics,get scene(){return scene;}};
}
test('all five scenes build at all three quality levels with finite geometry and working camera changes',()=>{
 const h=harness();let frames=0;
 for(const quality of ['low','medium','high']){h.view.setQuality(quality);assert.equal(h.view.getQuality(),quality);for(let stage=0;stage<5;stage++){
 const s=h.P.newFlight(stage);s.phase='flight';s.y=70;s.d=500;h.view.resize(1280,720);h.view.paint(s,{color:'#ffffff',trim:'#bb2222'},{preview:false,dt:1/60,angle:0});h.view.toggleCamera();h.view.paint(s,{color:'#ffffff',trim:'#bb2222'},{preview:false,dt:1/60,angle:0});
 let meshes=0,instances=0;h.scene.traverse(o=>{if(o.isMesh){meshes++;if(o.isInstancedMesh){instances+=o.count;assert([...o.instanceMatrix.array].every(Number.isFinite));}assert([...o.geometry.attributes.position.array].every(Number.isFinite));}});assert(meshes>100);assert(instances>500);frames++;
 }}assert.equal(frames,15);h.view.destroy();
});
