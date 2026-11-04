import { GLTFLoader } from "./vendor/GLTFLoader.js";
import { buildPark, rails, sampleHeight } from "../../../assets/skatepark/levels/stadsgardskajen/park.js";
import { buildCity } from "../../../assets/skatepark/levels/stadsgardskajen/city.js";


const T = window.THREE;
const shared = new URL("../../../assets/skatepark/shared/", import.meta.url);
const mix = (a,b,t) => a + (b-a)*t;
const smooth = (rate,dt) => 1-Math.exp(-rate*dt);
const angleDiff = (target,current) => Math.atan2(Math.sin(target-current),Math.cos(target-current));
const limit = T.MathUtils.clamp;

export function configurePhysics(park) {
  if (park.sampleHeight) return;
  park.sampleHeight = sampleHeight;
  for (const line of rails) {
    let first, previous;
    for (let i=1;i<line.points.length;i++) {
      const [x,y,z] = line.points[i-1], [ex,ey,ez] = line.points[i];
      const segment = [x,z,ex,ez,0];
      segment.profile = [y,ey-y];
      segment.line = line;
      if (previous) { segment.prev = previous; previous.next = segment; }
      park.rails.push(segment);
      first ??= segment;
      previous = segment;
    }
    const start=line.points[0], end=line.points.at(-1);
    if (first && Math.hypot(start[0]-end[0], start[1]-end[1], start[2]-end[2])<.001) {
      first.prev=previous;
      previous.next=first;
    }
  }
}

function skyDome() {
  const material = new T.ShaderMaterial({
    side:T.BackSide, depthWrite:false, fog:false,
    uniforms:{
      zenith:{value:new T.Color(0x127de8)}, horizon:{value:new T.Color(0xb5e9fb)}
    },
    vertexShader:'varying vec3 ray; void main(){ray=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform vec3 zenith,horizon; varying vec3 ray;
      void main(){float h=pow(clamp(normalize(ray).y*2.3,0.,1.),0.56);
      gl_FragColor=vec4(mix(horizon,zenith,h),1.);
      #include <colorspace_fragment>
      }`
  });
  const sky = new T.Mesh(new T.SphereGeometry(340,24,16),material);
  sky.renderOrder=-100;
  return sky;
}

function contactShade() {
  const shadow = new T.Mesh(new T.PlaneGeometry(1.18,1.5),new T.ShaderMaterial({
    uniforms:{opacity:{value:0.3}}, transparent:true, depthWrite:false,
    vertexShader:'varying vec2 v;void main(){v=uv-.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform float opacity;varying vec2 v;void main(){float a=1.-smoothstep(.04,.48,length(v));gl_FragColor=vec4(.09,.06,.055,opacity*a);}'
  }));
  shadow.rotation.x=-Math.PI/2;
  shadow.renderOrder=1;
  return shadow;
}

export class KajWorld {
  constructor(renderer) {
    this.renderer=renderer;
    this.scene=new T.Scene();
    this.camera=new T.PerspectiveCamera(50,1,.065,390);
    this.target=new T.Vector3();
    this.camGoal=new T.Vector3();
    this.snap=true;
  }

  async build(request, shirt, deckTint) {
    const quality = request === "auto"
      ? (matchMedia("(pointer:coarse)").matches || (navigator.hardwareConcurrency || 8)<=4 ? "low" : "medium")
      : request;
    const high=quality==="high", low=quality==="low";
    const render=this.renderer;
    this.saved = {tone:render.toneMapping, exposure:render.toneMappingExposure, shadows:render.shadowMap.enabled,
      ratio:render.getPixelRatio(),shadowType:render.shadowMap.type};
    render.toneMapping=T.NoToneMapping;
    render.toneMappingExposure=1;
    render.shadowMap.enabled=!low;
    render.shadowMap.type=T.PCFSoftShadowMap;
    this.tier=quality;
    this.pixelCap=low ? .92 : high ? 1.7 : 1.25;
    this.dynamicScale=1;
    this.frameTimes=[];
    this.resize();
    this.scene.background=new T.Color(0xb7e1ed);
    this.scene.fog=new T.FogExp2(0xbdddea,.0029);
    this.sky=skyDome();
    this.scene.add(this.sky,new T.HemisphereLight(0xfff9ef,0xc4ad9e,1.62));
    const sun=new T.DirectionalLight(0xffe7c9,2.32);
    sun.castShadow=!low;
    sun.shadow.mapSize.setScalar(high ? 2048 : 1024);
    Object.assign(sun.shadow.camera,{left:-29,right:29,bottom:-29,top:29,near:.5,far:140});
    sun.shadow.normalBias=.025;
    sun.shadow.bias=-.00018;
    this.scene.add(sun,sun.target);
    this.sun=sun;
    const loader=new GLTFLoader();
    // Wait for all groups even after one failure, so partial builds can be disposed once.
    const suffix=low ? "-lod.glb" : ".glb";
    const results=await Promise.allSettled([
      buildPark(T,loader,this.scene,quality),buildCity(T,loader,this.scene,quality),
      loader.loadAsync(new URL("characters/kaj-rider"+suffix,shared).href),
      loader.loadAsync(new URL("skateboards/kaj-deck"+suffix,shared).href)
    ]);
    const [, , rider, board]=results.map(result=>result.value);
    this.city=results[1].value;
    if (rider) this.scene.add(rider.scene);
    if (board) this.scene.add(board.scene);
    const error=results.find(result=>result.status==="rejected");
    if(error) throw error.reason;
    this.pose=new T.Group();
    this.balance=new T.Group();
    this.boardPivot=new T.Group();
    this.board=board.scene;
    this.avatar=rider.scene;
    this.boardPivot.position.y=.10;
    this.board.position.y=-.10;
    this.boardPivot.add(this.board);
    this.balance.add(this.boardPivot,this.avatar);
    this.pose.add(this.balance);
    for (const obj of [this.board,this.avatar]) obj.traverse(node=>{
      if(!node.isMesh) return;
      node.castShadow=true;
      node.receiveShadow=false;
      // Colours are baked into the single-draw Blender mesh. Preserve seams and soles.
      const tint=obj===this.avatar ? shirt : deckTint;
      if (!tint) return;
      const colours=node.geometry.getAttribute("color");
      if (!colours) return;
      const target=new T.Color(tint), sample=new T.Color();
      for (let i=0;i<colours.count;i++) {
        sample.fromBufferAttribute(colours,i);
        const {r,g,b}=sample;
        if (obj===this.avatar ? g>r*3 && g>b*1.35 : r>.62 && g>.24 && g<.43 && b<.10) {
          const shade=obj===this.avatar ? limit(g/.23,.55,1.35) : limit(g/.35,.75,1.1);
          colours.setXYZ(i,target.r*shade,target.g*shade,target.b*shade);
        }
      }
      colours.needsUpdate=true;
    });
    this.contact=contactShade();
    this.scene.add(this.pose,this.contact);
    if (low) {
      // The matte scenery keeps its authored pigments with per-vertex lighting on small GPUs.
      const matte=new Map();
      const simplified=source=>{
        if(!source.isMeshStandardMaterial || source.metalness>.45 || source.transparent) return source;
        if(!matte.has(source)) {
          const m=new T.MeshLambertMaterial({color:source.color,map:source.map,
            vertexColors:source.vertexColors,side:source.side,alphaTest:source.alphaTest,
            opacity:source.opacity,emissive:source.emissive,fog:source.fog});
          m.name=source.name;
          matte.set(source,m);
        }
        return matte.get(source);
      };
      this.scene.traverse(o=>{
        if(o.isMesh) o.material=Array.isArray(o.material)?o.material.map(simplified):simplified(o.material);
      });
      for(const m of matte.keys()) m.dispose();
    }
    this.mixer=new T.AnimationMixer(this.avatar);
    this.actions=Object.fromEntries(rider.animations.map(clip=>[clip.name,this.mixer.clipAction(clip)]));
    this.changePose("Ride");
  }

  changePose(name) {
    if(this.clip===name) return;
    const next=this.actions[name] || this.actions.Ride;
    if(!next) return;
    const previous=this.actions[this.clip];
    const once=["Ollie","Kickflip","Heelflip","PopShoveIt","Spin180","Spin360","Land","Fall","Recover"].includes(name);
    next.reset().setLoop(once ? T.LoopOnce : T.LoopRepeat,once ? 1 : Infinity);
    next.timeScale=1;
    const duration={Land:.28,Fall:.49,Recover:.46,Kickflip:.38,Heelflip:.38,PopShoveIt:.38}[name];
    if (duration) next.setDuration(duration);
    next.clampWhenFinished=once;
    next.enabled=true;
    next.play();
    if(previous && previous!==next) next.crossFadeFrom(previous,.10,false);
    this.clip=name;
  }

  draw(p,k,dt) {
    const y=sampleHeight(p.x,p.z);
    const forwardX=-Math.sin(p.dir),forwardZ=-Math.cos(p.dir);
    const steer=(k.right||0)-(k.left||0);
    const phase=p.flip ? limit(p.flip.t/p.flip.duration,0,1) : 0;
    const flip=p.flip?.id;
    let clip="Ride";
    if(p.recover>0) clip=p.recover>.46 ? "Fall":"Recover";
    else if(p.rail) clip=p.rail.id>=13?"Boardslide":"Grind5050";
    else if(p.air) {
      if (flip!=null) clip=flip===3?"Heelflip":[4,7].includes(flip)?"PopShoveIt":"Kickflip";
      else if(p.spinCount>1) clip="Spin360";
      else if(Math.abs(p.spin)>.5) clip="Spin180";
      else clip=this.wasAir && ["Kickflip","Heelflip","PopShoveIt"].includes(this.clip)?this.clip:"Ollie";
    } else if(p.settle>.04) clip="Land";
    else if(p.manual!=null) clip=p.manual===15?"Manual":"NoseManual";
    else if(Math.abs(steer)>.3) clip=steer>0?"TurnRight":"TurnLeft";
    else if(k.go && p.speed<11.5) clip="Push";
    this.changePose(clip);
    this.mixer.update(dt);
    this.wasAir=p.air;
    const t=this.snap?1:smooth(13,dt);
    const pose=this.pose;
    pose.position.set(p.x,p.y,p.z);
    pose.rotation.order="YXZ";
    const yaw=p.dir+(p.air?p.spin:0)+(p.rail?.id>=13?Math.PI*.5:0);
    pose.rotation.y+=angleDiff(yaw,pose.rotation.y)*t;
    const pitch=p.rail?Math.atan(p.slope||0):p.air?limit(p.vy*.032,-.22,.23):
      Math.atan2(sampleHeight(p.x+.27*forwardX,p.z+.27*forwardZ)-sampleHeight(p.x-.27*forwardX,p.z-.27*forwardZ),.54);
    pose.rotation.x=mix(pose.rotation.x,pitch,t);
    this.balance.rotation.x=mix(this.balance.rotation.x,p.manual===15?.14:p.manual===16?-.15:0,t);
    this.balance.rotation.z=mix(this.balance.rotation.z,!p.air && !p.rail ? -.105*steer*limit(p.speed/6,0,1):0,t);
    this.boardPivot.rotation.z=flip!=null && ![4,7].includes(flip)?(flip===3?-1:1)*phase*Math.PI*2:0;
    this.boardPivot.rotation.y=(p.deckYaw||0)+([4,8].includes(flip)?Math.PI*phase:[7,9].includes(flip)?2*Math.PI*phase:0);
    this.contact.position.set(p.x,y+.032,p.z);
    this.contact.rotation.order="YXZ";
    this.contact.rotation.y=p.dir;
    this.contact.rotation.x=-Math.PI/2+(!p.air?pitch:0);
    this.contact.material.uniforms.opacity.value=.30/(1+Math.max(0,p.y-y)*1.5);
    this.sun.target.position.set(p.x,0,p.z);
    this.sun.position.set(p.x-44,65,p.z+33);
    this.updateCamera(p,dt);
    this.camera.updateMatrixWorld();
    this.city?.userData.updateVisibility?.(this.camera,dt);
    this.sky.position.copy(this.camera.position);
    this.adaptResolution();
    this.renderer.render(this.scene,this.camera);
    this.snap=false;
  }

  updateCamera(p,dt) {
    const t=this.snap?1:smooth(6,dt);
    if(this.snap) this.heading=p.dir;
    else this.heading+=angleDiff(p.dir,this.heading)*smooth(8,dt);
    const dx=-Math.sin(this.heading),dz=-Math.cos(this.heading);
    const portrait=this.camera.aspect<.9;
    const distance=(portrait?4.65:3.95)+p.speed*.042;
    const x=limit(p.x-dx*distance,-52.8,52.8), z=limit(p.z-dz*distance,-56.8,56.8);
    let cy=p.y+(portrait?2.02:1.84)+p.speed*.012;
    for(let i=1;i<=8;i++) {
      const u=i/8;
      const terrain=sampleHeight(mix(p.x,x,u),mix(p.z,z,u));
      // Lift the camera until its full sightline clears the back of a transition.
      cy=Math.max(cy,p.y+1.02+(terrain+.25-p.y-1.02)/u);
    }
    this.camGoal.set(x,cy,z);
    this.camera.position.lerp(this.camGoal,t);
    const c=this.camera.position;
    c.y=Math.max(c.y,sampleHeight(c.x,c.z)+.28);
    const ahead=3.45+p.speed*.14;
    const groundAhead=sampleHeight(p.x+dx*ahead,p.z+dz*ahead);
    const targetY=p.air?mix(p.y,groundAhead,.3):mix(p.y,groundAhead,.18);
    this.camGoal.set(p.x+dx*ahead,targetY+.84,p.z+dz*ahead);
    this.target.lerp(this.camGoal,t);
    this.camera.lookAt(this.target);
  }

  adaptResolution() {
    const now=performance.now();
    const elapsed=now-this.lastDraw;
    this.lastDraw=now;
    if (!(elapsed>1 && elapsed<300)) return;
    this.frameTimes.push(elapsed);
    if(this.frameTimes.length<30) return;
    const sample=this.frameTimes.sort((a,b)=>a-b)[15];
    this.frameTimes.length=0;
    const min=this.tier==="low" ? .60 : this.tier==="medium" ? .70 : .82;
    const scale=sample>37 ? Math.max(min,this.dynamicScale-.10) :
      sample<18 ? Math.min(1,this.dynamicScale+.05) : this.dynamicScale;
    if (scale!==this.dynamicScale) {this.dynamicScale=scale; this.resize();}
  }

  resize() {
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,this.pixelCap||1)*(this.dynamicScale||1));
    this.renderer.setSize(innerWidth,innerHeight,false);
    this.camera.aspect=innerWidth/innerHeight;
    this.camera.fov=this.camera.aspect<1?62:53;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.mixer?.stopAllAction();
    const resources=new Set();
    this.scene.traverse(node=>{
      if(node.isInstancedMesh) node.dispose();
      if(node.geometry) resources.add(node.geometry);
      if(node.skeleton) resources.add(node.skeleton);
      if(node.shadow) resources.add(node.shadow);
      for(const mat of [].concat(node.material||[])) {
        resources.add(mat);
        for(const value of Object.values(mat)) if(value?.isTexture) resources.add(value);
      }
    });
    for(const resource of resources) resource.dispose();
    this.scene.clear();
    if(this.saved){
      this.renderer.toneMapping=this.saved.tone;
      this.renderer.toneMappingExposure=this.saved.exposure;
      this.renderer.shadowMap.enabled=this.saved.shadows;
      this.renderer.shadowMap.type=this.saved.shadowType;
      this.renderer.setPixelRatio(this.saved.ratio);
      this.renderer.renderLists.dispose();
    }
  }
}
