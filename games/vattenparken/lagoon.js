// A single reflected view is shared by all pools. The low tier samples the sky only.
(function(root){
'use strict';
const T=THREE;
function create(renderer,scene,quality){
 const high=quality==='high', low=quality==='low', time={value:0}, surfaces=[];
 const target=high?new T.WebGLRenderTarget(512,256,{type:T.HalfFloatType}):null;
 const virtual=new T.PerspectiveCamera(), projection={value:new T.Matrix4()}, direction=new T.Vector3();
 const sky=new T.TextureLoader().load('assets/summer-sky.webp');
 sky.mapping=T.EquirectangularReflectionMapping;sky.colorSpace=T.SRGBColorSpace;
 scene.background=scene.environment=sky;scene.backgroundIntensity=.94;
 const sand=new T.TextureLoader().load('../minigolf/assets/materials/sand-color.webp');
 sand.colorSpace=T.SRGBColorSpace;sand.wrapS=sand.wrapT=T.RepeatWrapping;
 const rings=new Float32Array(8*4);let ringIndex=0;
 function ripple(p,strength){const offset=(ringIndex++%8)*4;rings.set([p.x,p.z,time.value,strength],offset);}
 function pool(x,z,rx,rz,y){
   const geo=new T.PlaneGeometry(rx*2,rz*2,low?10:40,low?10:32);geo.rotateX(-Math.PI/2);
   const mat=new T.ShaderMaterial({
     uniforms:{rings:{value:rings},time,projection,reflection:{value:target?.texture||sky},floorMap:{value:sand},skyMap:{value:sky}},
     defines:high?{MIRROR:1}:{},vertexShader:`
       uniform float time; uniform mat4 projection; varying vec3 pos; varying vec2 local; varying vec4 refl;
       void main(){local=uv*2.-1.; vec4 p=modelMatrix*vec4(position,1.);
       p.y+=.034*sin(p.x*1.13+time)+.024*sin(p.z*.78-time*1.3);
       pos=p.xyz;refl=projection*p;gl_Position=projectionMatrix*viewMatrix*p;}`,
     fragmentShader:`
       uniform vec4 rings[8]; uniform float time; uniform sampler2D floorMap,reflection,skyMap;
       varying vec3 pos;varying vec2 local; varying vec4 refl;
       void main(){
         float r=length(local);if(r>1.)discard;
         vec2 p=pos.xz; float t=time; vec2 w=vec2(cos(p.x*1.13+t)+.52*cos(dot(p,vec2(2.1,.7))-1.6*t),sin(p.y*.78-1.3*t)+.57*sin(dot(p,vec2(-.8,2.3))+t))*.073;
         float ripple=0.;
         for(int i=0;i<8;i++){vec2 d=p-rings[i].xy;float age=t-rings[i].z,rad=length(d);
           float wave=exp(-12.*abs(rad-age*2.6))*max(0.,1.-age*.6)*rings[i].w;
           ripple+=wave;w+=wave*.14*d/(rad+.01);}
         vec3 n=normalize(vec3(w.x,1.,w.y)),v=normalize(cameraPosition-pos),ray=reflect(-v,n);
         float depth=smoothstep(.0,.8,1.-r);
         vec3 bottom=texture2D(floorMap,p*.18+w*.38*depth).rgb;
         float caustic=pow(max(0.,1.-abs(sin(p.x*1.7+p.y*.83+w.x*8.+t*.28)+sin(p.y*1.42-t*.24)) ),9.);
         vec3 water=mix(bottom*vec3(.94,1.12,.97),vec3(.009,.43,.48),.38+depth*.56)+caustic*vec3(.18,.27,.17)*(1.-.5*depth);
         vec3 env=texture2D(skyMap,vec2(atan(ray.z,ray.x)*.15915+.5,asin(clamp(ray.y,-1.,1.))*.31831+.5)).rgb;
         #ifdef MIRROR
         if(refl.w>0.){vec2 uv=refl.xy/refl.w*.5+.5+w*.014;if(all(greaterThan(uv,vec2(.005)))&&all(lessThan(uv,vec2(.995))))env=texture2D(reflection,uv).rgb;}
         #endif
         float fresnel=.07+.51*pow(1.-max(dot(n,v),0.),3.);
         vec3 c=mix(water,env,fresnel)+vec3(1.,.91,.68)*pow(max(dot(ray,normalize(vec3(-.45,.8,.43))),0.),150.)*.85;
         c+=ripple*.16;c=mix(c,vec3(.83,.96,.91),smoothstep(.965,.999,r+.009*sin(p.x*1.7+t))*.48);
         gl_FragColor=vec4(c,1.);
         #include <tonemapping_fragment>
         #include <colorspace_fragment>
       }`
   });
   const mesh=new T.Mesh(geo,mat);mesh.position.set(x,y,z);scene.add(mesh);surfaces.push(mesh);return mesh;
 }
 let elapsed=0;
 function reflect(camera,dt){
   if(!target)return;
   elapsed+=dt;if(elapsed<.14)return;elapsed=0;
   camera.updateMatrixWorld();virtual.copy(camera,false);virtual.position.y=2-camera.position.y;
   camera.getWorldDirection(direction);direction.y=-direction.y;
   virtual.up.set(0,-1,0);virtual.lookAt(direction.add(virtual.position));virtual.updateMatrixWorld();
   // Oblique near plane excludes the opaque island below the mirror.
   const plane=new T.Plane(new T.Vector3(0,1,0),-1.02).applyMatrix4(virtual.matrixWorldInverse);
   const clip=new T.Vector4(plane.normal.x,plane.normal.y,plane.normal.z,plane.constant);
   const proj=virtual.projectionMatrix.elements,q=new T.Vector4((Math.sign(clip.x)+proj[8])/proj[0],(Math.sign(clip.y)+proj[9])/proj[5],-1,(1+proj[10])/proj[14]);
   clip.multiplyScalar(2/clip.dot(q));proj[2]=clip.x;proj[6]=clip.y;proj[10]=clip.z+1;proj[14]=clip.w;
   projection.value.multiplyMatrices(virtual.projectionMatrix,virtual.matrixWorldInverse);
   surfaces.forEach(o=>o.visible=false);const old=renderer.getRenderTarget(),update=renderer.shadowMap.autoUpdate;
   renderer.shadowMap.autoUpdate=false;renderer.setRenderTarget(target);
   renderer.render(scene,virtual);renderer.setRenderTarget(old);renderer.shadowMap.autoUpdate=update;surfaces.forEach(o=>o.visible=true);
 }
 return {pool,reflect,ripple,time,dispose(){target?.dispose();sand.dispose();sky.dispose();}};
}
root.WaterparkLagoon={create};
})(window);
