// Gold sun-coins use the palace/jungle palette and pickup choreography:
// .20s attraction, .23s lift/pulse, .37s HUD flight, nine sparks from .20–.65s.
// The rail collector is pure; rendering is optional and never decides a pickup.
export const COIN_SCHEMA='cave-coin-v1';
export const PICKUP_TIMING=Object.freeze({attract:.20,liftEnd:.43,arrival:.80,sparkStart:.20,sparkEnd:.65,bumpEnd:1.04,expires:1.1});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const validId=id=>typeof id==='string'&&/^cave-coin-v1\/[0-9]+\/(?:main|safe)-[0-9]+\/[0-9]+$/.test(id);
const copy=p=>({x:p.x,y:p.y,z:p.z});
export function createCoinLayout(course,decoys=false){
 const coins=[];
 for(const route of course.routes){
  if((route.kind==='dead')!==decoys)continue;
  // Keep coins before/after hazards clear of the jump marker and landing area.
  for(let base=12,index=0;base<route.length-12;base+=12,index++){
   const s=base+3.4*Math.sin((course.level+1)*83+index*19+route.id.length*11);
   if(route.gaps?.some(g=>s>=g.start-15&&s<=g.end+13))continue;
   const sample=route.sample(s),position=copy(sample.position);position.y+=1.7;
   coins.push({id:`${COIN_SCHEMA}/${course.level}/${route.id}/${index}`,level:course.level,routeId:route.id,index,s,position,tangent:copy(sample.tangent),phase:coins.length});
  }
 }
 return coins;
}
export class CoinState{
 constructor(course,collectedIds=[]){
  this.course=course;this.coins=createCoinLayout(course);this.byRoute=new Map();this.collected=new Set([...collectedIds].filter(validId));this.combo=0;this.lastPickup=-Infinity;this.pending=[];
  for(const coin of this.coins){if(!this.byRoute.has(coin.routeId))this.byRoute.set(coin.routeId,[]);this.byRoute.get(coin.routeId).push(coin)}
 }
 exportIds(){return [...this.collected].sort()}
 collect(previous,current,time=0){
  this.pending=this.pending.filter(e=>time-e.start<=PICKUP_TIMING.expires);
  if(!previous||!current||previous.status!=='run'||!['run','finished'].includes(current.status)||previous.respawns!==current.respawns)return [];
  const oldRoute=this.course.routeMap.get(previous.routeId),newRoute=this.course.routeMap.get(current.routeId);if(!oldRoute||!newRoute)return [];
  const spans=[];
  if(oldRoute===newRoute){if(current.s<previous.s)return [];spans.push({route:oldRoute,start:previous.s,end:current.s,offset:0})}
  else{
   const fork=oldRoute.fork,connected=oldRoute.next===newRoute.id||fork&&(fork.safeRoute===newRoute.id||fork.deadRoute===newRoute.id);
   if(!connected)return [];
   spans.push({route:oldRoute,start:previous.s,end:oldRoute.length,offset:0},{route:newRoute,start:0,end:current.s,offset:oldRoute.length-previous.s});
  }
  const distance=spans.reduce((n,p)=>n+Math.max(0,p.end-p.start),0),events=[];
  // A checkpoint/level teleport can happen to land on a graph-connected route.
  // Confirm actual odometer travel instead of sweeping the entire skipped route.
  if(Number.isFinite(previous.travel)&&Number.isFinite(current.travel)){
   const travelled=current.travel-previous.travel;if(travelled<0||Math.abs(travelled-distance)>.65)return [];
  }else if(oldRoute!==newRoute&&oldRoute.length-previous.s>2)return [];

  for(const span of spans)for(const coin of this.byRoute.get(span.route.id)||[]){
   if(this.collected.has(coin.id)||coin.s<span.start-.45||coin.s>span.end+.45)continue;
   const fraction=distance>0?clamp((span.offset+coin.s-span.start)/distance,0,1):1;
   const cartY=previous.position.y+(current.position.y-previous.position.y)*fraction+1.7;
   if(Math.abs(coin.position.y-cartY)>1.05)continue;
   this.collected.add(coin.id);this.combo=time-this.lastPickup<=7?Math.min(5,this.combo+1):1;this.lastPickup=time;
   const event={...coin,position:copy(coin.position),start:time,combo:this.combo,total:this.collected.size};events.push(event);this.pending.push(event);
  }
  return events;
 }
 summary(time=Infinity){
  const courseCount=this.coins.reduce((n,c)=>n+Number(this.collected.has(c.id)),0),pending=this.pending.filter(e=>time-e.start<PICKUP_TIMING.arrival).length;
  const bump=this.pending.reduce((n,e)=>{const age=time-e.start;return age>=PICKUP_TIMING.arrival?Math.max(n,clamp(1-(age-PICKUP_TIMING.arrival)/.24,0,1)):n},0);
  return {courseCount,courseTotal:this.coins.length,totalCount:this.collected.size,displayCourseCount:Math.max(0,courseCount-pending),displayTotalCount:Math.max(0,this.collected.size-pending),hudScale:1+.18*Math.sin(Math.PI*bump),combo:this.combo,showCombo:this.combo>1&&time-this.lastPickup<1.6};
 }
}
export function buildCoins(T,scene,course,state){
 const renderCoins=[...state.coins,...createCoinLayout(course,true)];
 const root=new T.Group();root.name='Gold sun-coins';scene.add(root);
 const geometry=[],materials=[];
 const mat=opts=>{const m=new T.MeshStandardMaterial(opts);materials.push(m);return m};
 const gold=mat({color:0xffcb58,metalness:.79,roughness:.25,emissive:0x9b5712,emissiveIntensity:.28}),edge=mat({color:0x77513a,metalness:.75,roughness:.32}),shine=mat({color:0xfff2b9,metalness:.8,roughness:.21,emissive:0xffd779,emissiveIntensity:.16});
 const disc=new T.CylinderGeometry(.31,.31,.075,28,1);disc.rotateX(Math.PI/2);geometry.push(disc);
 const rim=new T.TorusGeometry(.245,.015,5,28);geometry.push(rim);
 const shape=new T.Shape();for(let i=0;i<16;i++){const angle=i*Math.PI/8,rad=i%2?.063:.123;const x=Math.cos(angle)*rad,y=Math.sin(angle)*rad;i?shape.lineTo(x,y):shape.moveTo(x,y)}shape.closePath();
 const sun=new T.ExtrudeGeometry(shape,{depth:.013,bevelEnabled:true,bevelSize:.005,bevelThickness:.004,bevelSegments:1,steps:1});geometry.push(sun);
 const parts=[{geo:disc,mat:[edge,gold,gold],z:0},{geo:rim,mat:shine,z:.042},{geo:rim,mat:shine,z:-.042},{geo:sun,mat:shine,z:.043},{geo:sun,mat:shine,z:-.056}];
 const dummy=new T.Object3D(),local=new T.Matrix4(),matrix=new T.Matrix4(),coinMatrix=new T.Matrix4();
 const meshes=parts.map(part=>{const mesh=new T.InstancedMesh(part.geo,part.mat,renderCoins.length);mesh.frustumCulled=false;mesh.castShadow=false;root.add(mesh);return mesh});
 const sparkGeometry=new T.OctahedronGeometry(.045,0);geometry.push(sparkGeometry);
 const sparkleMaterial=new T.MeshBasicMaterial({color:0xfff2ab,transparent:true,depthWrite:false});materials.push(sparkleMaterial);
 const effects=[];
 function coinGroup(){const group=new T.Group();for(const part of parts){const mesh=new T.Mesh(part.geo,part.mat);mesh.position.z=part.z;group.add(mesh)}return group}
 function pickup(events){
  for(const event of events){const group=coinGroup(),sparkMat=sparkleMaterial.clone(),sparks=new T.InstancedMesh(sparkGeometry,sparkMat,9);sparks.frustumCulled=false;root.add(group,sparks);effects.push({event,group,sparks,sparkMat,hit:new T.Vector3(event.position.x,event.position.y,event.position.z),origin:new T.Vector3(event.position.x,event.position.y,event.position.z)})}
 }
 const body=new T.Vector3(),target=new T.Vector3(),left=new T.Vector3(),top=new T.Vector3(),world=new T.Vector3();
 function update(time,snapshot,camera,hudNDC={x:.8,y:.85}){
  for(let i=0;i<renderCoins.length;i++){
   const c=renderCoins[i],hidden=state.collected.has(c.id)||Math.abs(c.position.z-snapshot.position.z)>125;
   const pulse=1+.025*Math.sin(time*2+c.phase);
   dummy.position.set(c.position.x,c.position.y+Math.sin(time*2+c.phase)*.028,c.position.z);dummy.rotation.set(0,time*1.8+c.phase*.43,0);dummy.scale.setScalar(hidden?0:pulse);dummy.updateMatrix();coinMatrix.copy(dummy.matrix);
   for(let k=0;k<parts.length;k++){local.makeTranslation(0,0,parts[k].z);matrix.multiplyMatrices(coinMatrix,local);meshes[k].setMatrixAt(i,matrix)}
  }
  for(const mesh of meshes)mesh.instanceMatrix.needsUpdate=true;
  body.set(snapshot.position.x,snapshot.position.y+1.65,snapshot.position.z);
  camera.updateMatrixWorld();left.setFromMatrixColumn(camera.matrixWorld,0);top.setFromMatrixColumn(camera.matrixWorld,1);
  target.set(hudNDC.x,hudNDC.y,.15).unproject(camera);
  for(let i=effects.length-1;i>=0;i--){const fx=effects[i],age=time-fx.event.start;
   if(age>PICKUP_TIMING.expires){root.remove(fx.group,fx.sparks);fx.sparkMat.dispose();effects.splice(i,1);continue}
   fx.group.visible=age<PICKUP_TIMING.arrival;fx.sparks.visible=age>=.20&&age<.65;
   // The original feedback follows Navid's screen anchor. Keep the 3D
   // attraction point with the cart so fast forward motion cannot leave
   // the HUD-flight coin behind the chase camera halfway through its arc.
   fx.hit.copy(body);let scale=1;
   if(age<.20){const u=clamp(age/.20,0,1)**2;fx.hit.copy(body);world.copy(fx.origin).lerp(body,u);world.y+=.16*Math.sin(Math.PI*u)}
   else if(age<.43){const u=(age-.20)/.23;world.copy(fx.hit);world.y+=.55*u;scale=1+.85*Math.sin(u*Math.PI)-.48*u}
   else{const u=clamp((age-.43)/.37,0,1),k=u*u;world.copy(fx.hit);world.y+=.55;world.lerp(target,k);world.addScaledVector(top,1.2*Math.sin(Math.PI*u));scale=(.52+.18*u)*(1-.97*k)}
   fx.group.position.copy(world);fx.group.scale.setScalar(scale);fx.group.quaternion.copy(camera.quaternion);
   if(fx.sparks.visible){const u=(age-.20)/.45;fx.sparkMat.opacity=1-u;for(let j=0;j<9;j++){const angle=j*2.399+fx.event.index,dist=(.23+j%4*.10)*Math.sin(u*Math.PI/2);dummy.position.copy(fx.hit).addScaledVector(left,Math.cos(angle)*dist).addScaledVector(top,Math.sin(angle)*dist+.20*u);dummy.rotation.set(age*3+j,age*4+j,age*2);dummy.scale.setScalar((1+j%3*.25)*(1-u));dummy.updateMatrix();fx.sparks.setMatrixAt(j,dummy.matrix)}fx.sparks.instanceMatrix.needsUpdate=true}
  }
 }
 function dispose(){scene.remove(root);for(const fx of effects)fx.sparkMat.dispose();for(const g of geometry)g.dispose();for(const m of materials)m.dispose();effects.length=0}
 return {root,pickup,update,dispose,get activePickups(){return effects.length}};
}
