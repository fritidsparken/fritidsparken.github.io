const T=window.THREE;
// One shared, reduced-resolution planar probe for all five lanes, not five mirrors.
export class LaneReflection {
 constructor(material){
 this.target=new T.WebGLRenderTarget(768,384,{type:T.HalfFloatType,depthBuffer:true});this.camera=new T.PerspectiveCamera();this.matrix=new T.Matrix4();this.enabled={value:0};this.tick=0;
 const map={value:this.target.texture},matrix={value:this.matrix},enabled=this.enabled;
 material.onBeforeCompile=shader=>{
 Object.assign(shader.uniforms,{laneReflection:map,laneMatrix:matrix,laneReflectionEnabled:enabled});
 shader.vertexShader='uniform mat4 laneMatrix;varying vec4 laneUV;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nlaneUV=laneMatrix*modelMatrix*vec4(transformed,1.);');
 shader.fragmentShader='uniform sampler2D laneReflection;uniform float laneReflectionEnabled;varying vec4 laneUV;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`vec2 reflectedUV=laneUV.xy/laneUV.w;
 if(laneReflectionEnabled>.5&&laneUV.w>0.&&all(greaterThan(reflectedUV,vec2(0.)))&&all(lessThan(reflectedUV,vec2(1.)))){
 vec3 reflectionColor=texture2D(laneReflection,reflectedUV).rgb;
 float grazing=pow(1.-clamp(dot(normal,geometryViewDir),0.,1.),3.);
 outgoingLight=mix(outgoingLight,reflectionColor,.12+.22*grazing);
 }
 #include <opaque_fragment>`);
 };material.customProgramCacheKey=()=> 'bowling-lane-polish-v1';material.needsUpdate=true;
 }
 resize(quality){const w=quality==='high'?768:256;this.target.setSize(w,w/2);}
 render(renderer,scene,camera,floors,quality){
 if(quality!=='high'){this.enabled.value=0;return;}if(this.tick++%6!==0)return;
 const mirror=this.camera;camera.updateMatrixWorld();mirror.copy(camera,false);mirror.position.copy(camera.position);mirror.position.y=-camera.position.y;
 const aim=new T.Vector3();camera.getWorldDirection(aim);aim.add(camera.position);aim.y=-aim.y;mirror.up.set(0,-1,0);mirror.lookAt(aim);mirror.updateMatrixWorld();mirror.projectionMatrix.copy(camera.projectionMatrix);
 this.matrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
 const target=renderer.getRenderTarget(),tone=renderer.toneMapping,clips=renderer.clippingPlanes,shadowUpdate=renderer.shadowMap.autoUpdate;
 const visible=floors.map(m=>m.visible);floors.forEach(m=>m.visible=false);this.enabled.value=0;
 try{renderer.shadowMap.autoUpdate=false;renderer.clippingPlanes=[new T.Plane(new T.Vector3(0,1,0),-.015)];renderer.toneMapping=T.NoToneMapping;renderer.setRenderTarget(this.target);renderer.render(scene,mirror);this.enabled.value=1;}
 finally{renderer.setRenderTarget(target);renderer.toneMapping=tone;renderer.clippingPlanes=clips;renderer.shadowMap.autoUpdate=shadowUpdate;floors.forEach((m,i)=>m.visible=visible[i]);}
 }
 dispose(){this.target.dispose();}
}
