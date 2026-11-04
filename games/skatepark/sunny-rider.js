import { GLTFLoader } from "./kaj/vendor/GLTFLoader.js";

const T = window.THREE;
const assets = new URL("../../assets/skatepark/shared/", import.meta.url);
const oneShots = new Set(["Ollie", "Kickflip", "Heelflip", "PopShoveIt", "Spin180", "Spin360", "Fall", "Recover", "Land"]);
const durations = { Kickflip: .38, Heelflip: .38, PopShoveIt: .38, Fall: .22, Recover: .23, Land: .28 };
const blendAngle = (a, b, t) => a + Math.atan2(Math.sin(b-a), Math.cos(b-a))*t;

function prepareMesh(root, tint, isShirt) {
  const target = tint && new T.Color(tint);
  root.traverse(node => {
    if (!node.isMesh) return;
    node.castShadow = true;
    const colors = node.geometry.getAttribute("color");
    if (!target || !colors) return;
    for (let i=0; i<colors.count; i++) {
      const r=colors.getX(i), g=colors.getY(i), b=colors.getZ(i);
      // Only dye the coloured fabric or deck paint; preserve shoes, skin and grip tape.
      const selected=isShirt ? g>r*3 && g>b*1.35 : r>.62 && g>.24 && g<.43 && b<.10;
      if (!selected) continue;
      const shade=T.MathUtils.clamp(g/(isShirt?.23:.35), isShirt?.55:.75, isShirt?1.35:1.1);
      colors.setXYZ(i, target.r*shade,target.g*shade,target.b*shade);
    }
    colors.needsUpdate=true;
  });
}

function chooseClip(p, controls, steer, last) {
  if (p.recover>0) return p.recover>.23 ? "Fall" : "Recover";
  if (p.rail) return p.rail.id>=13 ? "Boardslide" : "Grind5050";
  if (p.air) {
    if (p.flip) {
      if (p.flip.id===3) return "Heelflip";
      return [4,7].includes(p.flip.id) ? "PopShoveIt" : "Kickflip";
    }
    if (p.spinCount>1) return "Spin360";
    if (Math.abs(p.spin)>.5) return "Spin180";
    return ["Kickflip","Heelflip","PopShoveIt"].includes(last) ? last : "Ollie";
  }
  if (p.settle>.04) return "Land";
  if (p.manual!=null) return p.manual===15 ? "Manual" : "NoseManual";
  if (Math.abs(steer)>.3) return steer>0 ? "TurnRight" : "TurnLeft";
  return controls.go && p.speed<11.5 ? "Push" : "Ride";
}

// Solve a two-link limb in world space. Keep the elbow/knee on its original bend side.
function reach(upper,lower,end,target,bend){
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 upper.getWorldPosition(a);lower.getWorldPosition(b);end.getWorldPosition(c);
 const arm=b.distanceTo(a),fore=c.distanceTo(b),ray=target.clone().sub(a);
 const dist=T.MathUtils.clamp(ray.length(),Math.abs(arm-fore)+.001,arm+fore-.001);
 ray.normalize();const along=(arm*arm+dist*dist-fore*fore)/(2*dist);
 const elbow=bend.clone().sub(a);elbow.addScaledVector(ray,-elbow.dot(ray)).normalize();
 const goal=a.clone().addScaledVector(ray,along).addScaledVector(elbow,Math.sqrt(Math.max(0,arm*arm-along*along)));
 function aim(joint,from,to){
   const q=joint.getWorldQuaternion(new T.Quaternion());
   const turn=new T.Quaternion().setFromUnitVectors(from.normalize(),to.normalize());
   joint.quaternion.copy(joint.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(turn).multiply(q));
   joint.updateWorldMatrix(false,true);
 }
 aim(upper,b.clone().sub(a),goal.sub(a));lower.getWorldPosition(b);end.getWorldPosition(c);
 aim(lower,c.sub(b),target.clone().sub(b));
}

export async function loadSunnyRider(scene, low, shirt, deck) {
  const loader=new GLTFLoader();
  const suffix=low ? "-lod.glb" : ".glb";
  const group=new T.Group(), pivot=new T.Group();
  group.name="Stadsgårdskajens åkare";
  pivot.position.y=.10;
  // Keep the chase heading and slope separate from rotation about the rider’s hips.
  const somersault=new T.Group(), equipment=new T.Group();
  somersault.position.y=.76;
  equipment.position.y=-.76;
  group.add(somersault);
  somersault.add(equipment);
  equipment.add(pivot);
  scene.add(group);
  // Attach each model as it arrives so cleanup also owns partial loads.
  const result=await Promise.allSettled([
    loader.loadAsync(new URL("characters/kaj-rider"+suffix,assets).href).then(r => {
      equipment.add(r.scene);
      prepareMesh(r.scene,shirt,true);
      return r;
    }),
    loader.loadAsync(new URL("skateboards/kaj-deck"+suffix,assets).href).then(r => {
      pivot.add(r.scene);
      r.scene.position.y=-.10;
      prepareMesh(r.scene,deck,false);
    }),
  ]);
  for (const load of result) if (load.status==="rejected") throw load.reason;
  const rider=result[0].value;
  const mixer=new T.AnimationMixer(rider.scene);
  const actions=new Map(rider.animations.map(clip=>[clip.name,mixer.clipAction(clip)]));
  const joints={},names={UpperArm:"upper",Forearm:"fore",Hand:"hand",Thigh:"thigh",Shin:"shin",Foot:"shoe"};
  rider.scene.traverse(o=>{
    if(!o.isBone)return;
    if(o.name==="Spine")joints.spine=o;
    const match=o.name.match(/^(UpperArm|Forearm|Hand|Thigh|Shin|Foot)[._]?([LR])$/);
    if(match)joints[names[match[1]]+match[2]]=o;
  });
  const restored=new Map(),right=new T.Vector3(),up=new T.Vector3(),back=new T.Vector3(),basis=new T.Matrix4();
  let last;
  return {
    update(p, controls, dt, snap) {
      const steer=(controls.right||0)-(controls.left||0);
      const name=chooseClip(p,controls,steer,last);
      if (name!==last) {
        const action=actions.get(name);
        const once=oneShots.has(name);
        action.reset().setLoop(once?T.LoopOnce:T.LoopRepeat,once?1:Infinity);
        if (durations[name]) action.setDuration(durations[name]);
        action.clampWhenFinished=once;
        action.play();
        if (last) action.crossFadeFrom(actions.get(last),.10,false);
        last=name;
      }
      for(const [bone,rotation] of restored)bone.quaternion.copy(rotation);
      restored.clear();rider.scene.position.y=0;pivot.position.y=.1;
      mixer.update(dt);
      const t=snap?1:1-Math.exp(-dt*18);
      group.position.set(p.x,p.y,p.z);
      group.rotation.order="YXZ";
      const slide=p.rail?.id===13 ? Math.PI/2 : p.rail?.id===14 ? -Math.PI/2 : 0;
      group.rotation.y=blendAngle(group.rotation.y,p.dir+p.stance+p.spin+slide,t);
      const slope=Math.atan(p.slope||0)*Math.cos(p.stance);
      const pitch=p.air?T.MathUtils.clamp(p.vy*.032,-.22,.23):slope;
      const manual=p.rail?.id===11?.19:p.rail?.id===12?-.19:p.manual===15?.14:p.manual===16?-.15:0;
      group.rotation.x=p.loop ? p.loop.a*p.loop.sign : blendAngle(group.rotation.x,pitch+manual,t);
      group.rotation.z=blendAngle(group.rotation.z,p.air||p.rail?0:-.105*steer,t);
      if(p.loop){
        const {a,track,sign}=p.loop;
        up.set(-Math.sin(a),Math.cos(a),0);
        back.set(track.r*Math.cos(a),track.r*Math.sin(a),track.drift*(1-Math.cos(a))/(2*Math.PI)).normalize().multiplyScalar(-sign);
        right.crossVectors(up,back).normalize();group.quaternion.setFromRotationMatrix(basis.makeBasis(right,up,back));
      }
      somersault.rotation.x=0;
      const stunt=p.stunt;
      if(stunt){
        const u=Math.min(1,stunt.t/stunt.duration),w=Math.sin(Math.PI*u);
        if(stunt.id<20)somersault.rotation.x=(stunt.id===18?-1:1)*Math.PI*2*u*u*(3-2*u);
        else{
          // Bring the board up, fold both knees and bring the grabbing hand to its edge.
          const side=stunt.id===20?"R":"L",edge=side==="R"?.115:-.115;
          for(const name of ["upper"+side,"fore"+side,"thighR","thighL","shinR","shinL","spine"]){
            const j=joints[name];restored.set(j,j.quaternion.clone());
          }
          group.updateWorldMatrix(true,true);
          const feet=["L","R"].map(s=>group.worldToLocal(joints["shoe"+s].getWorldPosition(new T.Vector3())));
          rider.scene.position.y=-.18*w;pivot.position.y=.1+.36*w;
          joints.spine.rotateZ(.47*w);group.updateWorldMatrix(true,true);
          for(const [n,s] of ["L","R"].entries()){
            feet[n].y+=.36*w;
            reach(joints["thigh"+s],joints["shin"+s],joints["shoe"+s],group.localToWorld(feet[n]),group.localToWorld(new T.Vector3(.64,.65,s==="L"?-.22:.22)));
          }
          const hand=joints["hand"+side],goal=hand.getWorldPosition(new T.Vector3()).lerp(group.localToWorld(new T.Vector3(edge,.16+.36*w,side==="R"?.09:-.08)),w);
          reach(joints["upper"+side],joints["fore"+side],hand,goal,group.localToWorld(new T.Vector3(.57,.79,side==="R"?.35:-.35)));
        }
      }
      const id=p.flip?.id;
      const turn=p.flip?Math.PI*2*Math.min(1,p.flip.t/p.flip.duration):0;
      pivot.rotation.z=blendAngle(pivot.rotation.z,[4,7].includes(id)?0:(id===3?-turn:turn),t);
      const yaw=[4,8].includes(id)?turn*.5:[7,9].includes(id)?turn:0;
      pivot.rotation.y=blendAngle(pivot.rotation.y,p.deckYaw+yaw,t);
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(rider.scene);
    }
  };
}
