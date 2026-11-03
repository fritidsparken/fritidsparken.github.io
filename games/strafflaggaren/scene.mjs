import {softwareRenderer} from './software.mjs?v=keeper-click-20261103';
import {keeperPose} from './physics.mjs?v=keeper-click-20261103';
import {createStadium} from './stadium.mjs';
import {createPlayers,createMatchBall} from './players.mjs?v=keeper-click-20261103';

const T=window.THREE;
const smooth=(rate,dt)=>1-Math.exp(-rate*dt);

function goal(scene){
  const steel=new T.MeshStandardMaterial({color:0xf5f3e9,roughness:.35,metalness:.34});
  const frame=new T.Group();frame.name='Penalty goal';
  scene.add(frame);
  function tube(a,b,r){
    const start=new T.Vector3(...a),end=new T.Vector3(...b),axis=end.clone().sub(start);
    const mesh=new T.Mesh(new T.CylinderGeometry(r,r,axis.length(),16),steel);
    mesh.position.copy(start).addScaledVector(axis,.5);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize());
    mesh.castShadow=true;frame.add(mesh);
  }
  for(const x of [-3.66,3.66]){
    tube([x,0,0],[x,2.44,0],.06);
    tube([x,2.44,0],[x,2.18,-1.58],.038);
    tube([x,2.18,-1.58],[x,0,-1.72],.036);
    tube([x,.04,0],[x,.04,-1.72],.035);
    const joint=new T.Mesh(new T.SphereGeometry(.061,16,12),steel);
    joint.position.set(x,2.44,0);frame.add(joint);
  }
  tube([-3.66,2.44,0],[3.66,2.44,0],.06);
  const vertices=[];
  function grid(nx,ny,point){
    for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
      const a=point(i/nx,j/ny);
      if(i<nx)vertices.push(...a,...point((i+1)/nx,j/ny));
      if(j<ny)vertices.push(...a,...point(i/nx,(j+1)/ny));
    }
  }
  grid(48,16,(u,v)=>[(u-.5)*7.32,2.18*v,-1.72+.14*v-.11*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)]);
  grid(48,10,(u,v)=>[(u-.5)*7.32,2.44-.26*v-.07*Math.sin(v*Math.PI),-1.58*v]);
  for(const x of [-3.66,3.66])grid(10,16,(u,v)=>[x,(2.44-.26*u)*v,-u*(1.72-.14*v)]);
  const geometry=new T.BufferGeometry();
  const position=new T.Float32BufferAttribute(vertices,3).setUsage(T.DynamicDrawUsage);
  geometry.setAttribute('position',position);
  const material=new T.LineBasicMaterial({color:0xf8faf2,transparent:true,opacity:.54,depthWrite:false});
  frame.add(new T.LineSegments(geometry,material));
  let impulse=null,latched=false;
  return {material,update(ball,dt,power){
    if(!ball?.net)latched=false;
    if(ball?.net&&!latched){
      latched=true;impulse={x:ball.x,y:ball.y,age:0,force:power/29};
    }
    if(!impulse)return;
    impulse.age+=dt;
    if(impulse.age>1.6||!ball){
      position.array.set(vertices);position.needsUpdate=true;impulse=null;return;
    }
    for(let j=2;j<vertices.length;j+=3){
      const distance=Math.hypot(vertices[j-2]-impulse.x,vertices[j-1]-impulse.y);
      const t=impulse.age-distance*.035;
      position.array[j]=vertices[j]-(t>0?Math.sin(t*20)*Math.exp(-t*4-distance*.85)*.38*impulse.force*Math.min(1,-vertices[j]):0);
    }
    position.needsUpdate=true;
  }};
}

export function createWorld(host){
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(37,1,.08,420);
  let renderer;
  try{const canvas=document.createElement('canvas'),options={alpha:false,antialias:true,powerPreference:'high-performance'};const context=canvas.getContext('webgl2',options)||canvas.getContext('webgl',options);renderer=context?new T.WebGLRenderer({...options,canvas,context}):softwareRenderer(T);}
  catch{renderer=softwareRenderer(T);}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.55));
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.04;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  host.append(renderer.domElement);
  const stadium=createStadium(T,scene,renderer),net=goal(scene);
  const {animate,kit,gloves}=createPlayers(T,scene),{ball,ballMat}=createMatchBall(T,scene);
  if(!renderer.isSoftware){
    // Linear radiance includes the bright sky above the pitch and a warm sun patch.
    const w=64,h=32,radiance=new Float32Array(w*h*4);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const elevation=Math.sin((y/h-.5)*Math.PI),sky=Math.max(0,elevation);
      const sun=Math.exp(-((x/w-.33)**2+(y/h-.71)**2)*950)*2.5;
      const i=(y*w+x)*4;radiance.set([.14+.42*sky+sun,.18+.55*sky+sun*.83,.10+.73*sky+sun*.52,1],i);
    }
    const env=new T.DataTexture(radiance,w,h,T.RGBAFormat,T.FloatType);
    env.mapping=T.EquirectangularReflectionMapping;env.needsUpdate=true;
    const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(env).texture;pmrem.dispose();env.dispose();
  }
  const contactCanvas=document.createElement('canvas');contactCanvas.width=contactCanvas.height=64;
  const ctx=contactCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,1,32,32,31);
  gradient.addColorStop(0,'rgba(12,20,5,.8)');gradient.addColorStop(1,'rgba(12,20,5,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const contactMap=new T.CanvasTexture(contactCanvas);
  function contact(width,depth){
    const mesh=new T.Mesh(new T.PlaneGeometry(width,depth),new T.MeshBasicMaterial({map:contactMap,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
    mesh.rotation.x=-Math.PI/2;scene.add(mesh);return mesh;
  }
  const ballShadow=contact(.46,.38),keeperShadow=contact(1.15,.7),kickerShadow=contact(.8,.64);
  const target=new T.Mesh(new T.RingGeometry(.09,.12,32),new T.MeshBasicMaterial({color:0xf3ffb5,side:T.DoubleSide,transparent:true,opacity:.88}));
  target.name='Penalty aim';scene.add(target);target.visible=false;
  const home=new T.Vector3(),focus=new T.Vector3(),look=new T.Vector3(),destination=new T.Vector3();
  const targetLook=new T.Vector3();
  const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,0,1),0);
  let role='shoot',quality=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function view(r,snap=false){
    role=r;const aspect=camera.aspect,portrait=aspect<.9;
    if(r==='save'){
      // Keep the camera inside the clear strip between the goal and the boards.
      const distance=Math.min(11,Math.max(7.1,2+4.35/(aspect*Math.tan(19*Math.PI/180))));
      home.set(0,5.25,-distance);
      focus.set(0,1.28,1.4);camera.fov=Math.max(38,2*Math.atan(4.5/((distance-1.9)*aspect))*180/Math.PI);
    }else{
      home.set(-.35,portrait?2.35:1.85,portrait?18.7:17.85);
      focus.set(0,portrait?.82:.56,3);
      camera.fov=portrait?Math.max(45,2*Math.atan(4.5/(16.5*aspect))*180/Math.PI):32;
    }
    camera.updateProjectionMatrix();
    // Snap between opposite sides of the goal instead of travelling through the net.
    camera.position.copy(home);look.copy(focus);camera.lookAt(look);camera.updateMatrixWorld();
    net.material.opacity=r==='save'?.26:.60;
  }
  function resize(){camera.aspect=innerWidth/innerHeight;renderer.setSize(innerWidth,innerHeight);view(role,true);}
  function aim(x,y){ray.setFromCamera(new T.Vector2(x/innerWidth*2-1,1-2*y/innerHeight),camera);return ray.ray.intersectPlane(plane,new T.Vector3())||new T.Vector3();}
  function project(v){const p=new T.Vector3(v.x,v.y,v.z).project(camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};}
  function cosmetics(b,k,g,n){
    ballMat.color.set(['#fff9ed','#f6d069','#ffc17e','#b7eeff','#caff98'][b]);
    ballMat.metalness=b===1?.42:.035;
    kit.color.set(['#efc326','#68b8a6','#9baadb'][k]);gloves.color.set(['#dbed89','#e5b1c4','#b7d7eb'][g]);
    net.material.color.set(n?'#c3eaff':'#f8faf2');
  }
  function update(state,dt,time){
    const b=state.ball,pose=keeperPose(state.keeper);
    ball.position.set(b?.x??0,b?.y??.11,b?.z??11);
    if(b){ball.rotation.x+=b.vz*dt/.11;ball.rotation.z-=b.vx*dt/.11;}else ball.rotation.set(0,0,0);
    ballShadow.position.set(ball.position.x,.025,ball.position.z);ballShadow.material.opacity=.72/(1+ball.position.y);
    keeperShadow.position.set(pose.x,.026,.48);
    const stride=state.phase==='run'?Math.min(1,state.clock/.65):b?1:0;
    kickerShadow.position.set(-.65+.46*stride,.026,12.6-1.3*stride);
    animate(state,pose,dt,time);stadium.update(time,state);net.update(b,dt,state.power);
    destination.copy(home);targetLook.copy(focus);
    if(!reduced.matches&&b){
      const weight=state.replay?.95:.25;
      if(role==='shoot'){destination.x+=Math.min(1,b.age)*weight;destination.z-=Math.min(1,b.age)*weight*1.65;}
      targetLook.x+=Math.max(-3.6,Math.min(3.6,b.x))*(role==='save'?.045:weight*.35);
    }
    camera.position.lerp(destination,smooth(4,dt));look.lerp(targetLook,smooth(5,dt));camera.lookAt(look);
    renderer.setState?.(state,pose,'#'+ballMat.color.getHexString(),'#'+kit.color.getHexString());
    renderer.render(scene,camera);
  }
  resize();
  return {renderer,scene,camera,update,view,resize,aim,project,cosmetics,target,setArena:n=>stadium.setArena(n),score(){},lowQuality(){
    if(quality)return;quality=true;renderer.setPixelRatio(1);stadium.lowQuality();resize();
  }};
}
