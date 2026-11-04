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

export async function loadSunnyRider(scene, low, shirt, deck) {
  const loader=new GLTFLoader();
  const suffix=low ? "-lod.glb" : ".glb";
  const group=new T.Group(), pivot=new T.Group();
  group.name="Stadsgårdskajens åkare";
  pivot.position.y=.10;
  group.add(pivot);
  scene.add(group);
  // Attach each model as it arrives so cleanup also owns partial loads.
  const result=await Promise.allSettled([
    loader.loadAsync(new URL("characters/kaj-rider"+suffix,assets).href).then(r => {
      group.add(r.scene);
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
      mixer.update(dt);
      const t=snap?1:1-Math.exp(-dt*18);
      group.position.set(p.x,p.y,p.z);
      group.rotation.order="YXZ";
      const slide=p.rail?.id===13 ? Math.PI/2 : p.rail?.id===14 ? -Math.PI/2 : 0;
      group.rotation.y=blendAngle(group.rotation.y,p.dir+p.stance+p.spin+slide,t);
      const slope=Math.atan(p.slope||0)*Math.cos(p.stance);
      const pitch=p.air?T.MathUtils.clamp(p.vy*.032,-.22,.23):slope;
      const manual=p.manual===15?.14:p.manual===16?-.15:0;
      group.rotation.x=p.loop ? p.loop.a*p.loop.sign : blendAngle(group.rotation.x,pitch+manual,t);
      group.rotation.z=blendAngle(group.rotation.z,p.air||p.rail?0:-.105*steer,t);
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
