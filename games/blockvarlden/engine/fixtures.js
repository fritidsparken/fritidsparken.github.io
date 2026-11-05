import {isTree,trunkHit} from './trunks.js';

// Walkable horizontal surfaces and body blockers in model-local coordinates.
const specs = {
  stairs:[.50,.50,1], slab:[.50,.50,.5], bed:[.44,.86,.62],
  chest:[.45,.31,.67], table:[.56,.385,.8275], workbench:[.51,.40,.8575],
  chair:[.245,.235,.4875], door:[.475,.09,1.98], window:[.50,.075,1],
  fence:[.51,.09,.95], railing:[.50,.075,.905]
};
function local(p,o,pad) {
  const id=o.userData.record?.id,b=specs[id];
  if (!b) return null;
  const dx=p.x-o.position.x, dz=p.z-o.position.z;
  const c=Math.cos(o.rotation.y),s=Math.sin(o.rotation.y);
  const x=dx*c-dz*s,z=dx*s+dz*c;
  if(Math.abs(x)>=b[0]+pad||Math.abs(z)>=b[1]+pad) return null;
  const top=id==='stairs' ? (Math.floor(Math.max(0,Math.min(.999,.5-z))*4)+1)/4 : b[2];
  return o.position.y+top;
}

export function fixtureHit(root,p,ignore=null,pad=.28,height=1.73) {
  for(const o of root.children) {
    if(o===ignore) continue;
    const id=o.userData.record?.id;
    if(!id) continue;
    if(trunkHit(id,o.position.x,o.position.y,o.position.z,o.rotation.y,o.scale.x,p,pad,height)) return true;
    const top=local(p,o,pad);
    if(top!==null && p.y<top-.002 && p.y+height>o.position.y) return true;
  }
  return false;
}
export function stepHeight(root,p) {
  let top=p.y;
  for(const o of root.children) {
    const h=local(p,o,.28);
    if(h!==null && h>=p.y-.01 && h<=p.y+.52) top=Math.max(top,h);
  }
  return top;
}

function terrainClear(world,p,pad,height) {
  for(let x=Math.floor(p.x-pad);x<=Math.floor(p.x+pad);x++)
    for(let z=Math.floor(p.z-pad);z<=Math.floor(p.z+pad);z++)
      for(let y=Math.floor(p.y+.002);y<=Math.floor(p.y+height-.002);y++)
        if(world.solid(x,y,z)) return false; // Unloaded columns count as solid.
  return true;
}
const seatHeight=1.28;
const lampRadius=.24;
const lampHeight=.77;

export function createFixtureInteractions({world,root,land}) {
  const T=globalThis.THREE;
  const probe=new T.Vector3();
  const propBounds=new T.Box3();
  let posed=null;
  function collides(p,pad=.28,height=1.73,ignore=null) {
    return fixtureHit(root,p,ignore,pad,height)||land.collides(p,pad,height);
  }
  function clear(p,pad,height,ignore) {
    return terrainClear(world,p,pad,height)&&!collides(p,pad,height,ignore);
  }
  function clearPassage(a,b,chair,height) {
    const steps=Math.max(1,Math.ceil(a.distanceTo(b)/.12));
    for(let i=1;i<=steps;i++) {
      probe.lerpVectors(a,b,i/steps);
      if(!clear(probe,.275,height,chair)) return false;
    }
    return true;
  }
  function standingPosition(player) {
    const chair=player.seat;
    if(!chair) return player.p.clone();
    const base=chair.position, rotation=chair.rotation.y;
    const points=[];
    if(player.seatEntry) points.push(player.seatEntry.clone());
    // Prefer the open front, then the two sides. Never stand inside a wall or over a void.
    for(const a of [0, Math.PI/2,-Math.PI/2,Math.PI,Math.PI/4,-Math.PI/4]) {
      const x=base.x+Math.sin(rotation+a)*.94,z=base.z+Math.cos(rotation+a)*.94;
      points.push(new T.Vector3(x,base.y,z));
    }
    for(const p of points) {
      if(Math.abs(base.y-p.y)>.65 || Math.hypot(base.x-p.x,base.z-p.z)>2.5) continue;
      const under=world.at(p.x,p.y-.03,p.z);
      if(under===null || !(world.solid(p.x,p.y-.03,p.z) || fixtureHit(root,{x:p.x,y:p.y-.04,z:p.z},chair,.02,.035))) continue;
      if(clear(p,.28,1.73,null)&&clearPassage(base,p,chair,seatHeight+.18)) return p;
    }
    return null;
  }
  function mount(player,chair) {
    if(player.seat || chair?.userData.record?.id!=='chair' || chair.parent!==root) return false;
    const base=chair.position;
    if(Math.hypot(player.p.x-base.x,player.p.z-base.z)>2.5 || Math.abs(player.p.y-base.y)>.65) return false;
    if(world.at(base.x,base.y-.02,base.z)===null || !clear(base,.28,seatHeight+.18,chair) ||
        !clearPassage(player.p,base,chair,seatHeight+.18)) return false;
    player.seat=chair;
    player.seatEntry=player.p.clone();
    if(!standingPosition(player)) {player.seat=null;player.seatEntry=null;return false;}
    player.p.copy(base);player.yaw=chair.rotation.y+Math.PI;
    player.pitch=0;player.v=0;player.fly=false;player.sneak=false;player.swim=false;
    player.grounded=true;player.moving=false;
    return true;
  }
  function releasePose() {
    if(!posed) return;
    for(const [bone,quaternion] of posed.saved) bone.quaternion.copy(quaternion);
    posed=null;
  }
  function dismount(player) {
    if(!player.seat) return true;
    const exit=standingPosition(player);
    if(!exit) return false;
    player.p.copy(exit);player.v=0;player.seat=null;player.seatEntry=null;
    releasePose();return true;
  }
  function poseSeated(scene,player) {
    if(!player.seat || !player.third) {releasePose();return;}
    if(!posed) {
      const rig=scene.getObjectByName('stigfinnare');
      if(!rig) return;
      const bones=['leg-1_0','leg1_0','arm-1','arm1'].map(n=>rig.getObjectByName(n));
      if(bones.some(b=>!b)) return;
      posed={root:rig.parent,bones,saved:bones.map(b=>[b,b.quaternion.clone()])};
    }
    const chair=player.seat;
    posed.root.position.copy(chair.position);
    // Rest animation lowers the hips by .07 m; the chair seat is .49 m high.
    posed.root.position.y-=.18;
    posed.root.rotation.y=chair.rotation.y;
    posed.bones.forEach((b,i)=>b.rotation.set(i<2 ? -1.03 : -.31,0,0));
  }
  // Search only downward from the requested height: a cave or overhang must
  // not send a lamp up through a ceiling. Fixture support allows tables and slabs.
  function locateLantern(record,player=null,ignore=null) {
    const [x,start,z]=record.p;
    if(![x,start,z].every(Number.isFinite) || start<0 || world.at(x,0,z)===null) return null;
    let y=-Infinity;
    for(let row=Math.floor(start-.002);row>=0;row--) {
      if(world.solid(x,row,z)) {y=row+1;break;}
    }
    for(const o of root.children) {
      if(o===ignore) continue;
      const top=local({x,z},o,-.02);
      if(top!==null && top<=start+.002 && top>y) y=top;
    }
    if(!Number.isFinite(y)) return null;
    const p=new T.Vector3(x,y,z);
    if(!clear(p,lampRadius,lampHeight,ignore)) return null;
    for(const o of root.children) {
      if(o===ignore) continue;
      const id=o.userData.record?.id;
      if(!id || isTree(id) || Math.abs(o.position.x-x)>2 || Math.abs(o.position.z-z)>2) continue;
      // Walkable surfaces were checked above. The remaining small props still occupy
      // space for placement even when they do not stop a walking player.
      if(!specs[id]) {
        propBounds.setFromObject(o);
        if(propBounds.max.y>y+.005 && propBounds.min.y<y+lampHeight &&
            propBounds.max.x>x-lampRadius && propBounds.min.x<x+lampRadius &&
            propBounds.max.z>z-lampRadius && propBounds.min.z<z+lampRadius) return null;
      }
    }
    if(player && player.p.y<y+lampHeight && player.p.y+1.73>y &&
        Math.abs(player.p.x-x)<lampRadius+.28 && Math.abs(player.p.z-z)<lampRadius+.28) return null;
    return [x,y,z];
  }
  function settleLanterns(onBlocked) {
    let changed=false;
    for(const o of [...root.children]) {
      const record=o.userData.record;
      if(record?.id!=='lantern' || world.at(record.p[0],0,record.p[2])===null) continue;
      const p=locateLantern(record,null,o);
      if(!p) {onBlocked(o);changed=true;}
      else if(Math.abs(record.p[1]-p[1])>.002) {
        record.p=p;o.position.fromArray(p);changed=true;
      }
    }
    return changed;
  }
  return {collides,mount,dismount,standingPosition,poseSeated,locateLantern,settleLanterns,
    seatEye(player) {return player.seat?seatHeight:1.55-(player.sneak?.23:0);}
  };
}
