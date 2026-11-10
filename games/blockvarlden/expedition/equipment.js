// Small reusable models; every catalogue item has a gameplay action.
export const equipment=[
 {id:'campfire',name:'Brasa',category:'Inredning'},
 {id:'shelf',name:'Förvaringshylla',category:'Inredning'},
 {id:'boat',name:'Roddbåt',category:'Föremål'},
 {id:'map',name:'Världskarta',category:'Verktyg'},
 {id:'outfit_sailor',name:'Sjömanskläder',category:'Verktyg'},
 {id:'outfit_explorer',name:'Utforskarkläder',category:'Verktyg'}
];
export function withEquipment(T,kit){
 const templates=new Map();
 function model(id){
  const g=new T.Group();
  function box(x,y,z,w,h,d,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.85}));m.position.set(x,y,z);g.add(m);return m}
  if(id==='shelf'){
   for(const x of [-.44,.44])box(x,.8,0,.09,1.6,.48,0x68452d);
   for(const y of [.08,.58,1.08,1.58])box(0,y,0,.95,.08,.5,0xb98650);
   box(0,.8,.22,.9,1.6,.04,0x825937);
  }else if(id==='boat'){
   box(0,.08,0,.95,.14,1.9,0x88552e);
   for(const x of [-.53,.53])box(x,.27,0,.13,.42,1.9,0xc18a4e);
   for(const z of [-.94,.94])box(0,.27,z,1.16,.42,.13,0xa76e3d);
   for(const z of [-.5,.5])box(0,.32,z,1,.09,.24,0xe0b476);
   for(const x of [-.85,.85]){const o=box(x,.42,0,.07,.07,1.65,0xe0b476);o.rotation.y=x>0?.4:-.4;}
  }else if(id==='campfire'){
   for(let i=0;i<8;i++){const a=i*Math.PI/4;box(Math.cos(a)*.36,.1,Math.sin(a)*.36,.22,.2,.22,0x7d827f)}
   for(const a of [-.65,.65]){const log=box(0,.19,0,.16,.16,.7,0x633e23);log.rotation.y=a}
   const flame=new T.Mesh(new T.ConeGeometry(.22,.65,5),new T.MeshBasicMaterial({color:0xffa832}));flame.position.y=.48;flame.name='flame';g.add(flame);
   const core=new T.Mesh(new T.ConeGeometry(.12,.42,5),new T.MeshBasicMaterial({color:0xffef8e}));core.position.set(0,.37,.06);g.add(core);
  }else if(id==='map'){
   box(0,.3,0,.55,.04,.65,0xefdfaa);for(let i=0;i<4;i++)box((i-1.5)*.1,.325,Math.sin(i)*.12,.07,.01,.3,0x65945c);
  }else{
   const blue=id==='outfit_sailor';box(0,.42,0,.45,.5,.2,blue?0xece9d8:0xd69b40);
   for(const x of [-.3,.3])box(x,.45,0,.16,.4,.2,blue?0x284b80:0x5d7340);
   for(const x of [-.12,.12])box(x,.05,0,.18,.28,.2,0x34445a);
  }
  return g;
 }
 return {ids:[...kit.ids,...equipment.map(x=>x.id)],create(id){if(!equipment.some(x=>x.id===id))return kit.create(id);if(!templates.has(id))templates.set(id,model(id));return templates.get(id).clone(true)},dispose(){kit.dispose();for(const g of templates.values())g.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})}};
}
export function boatWater(world,x,z){
 for(const dx of [-.65,0,.65])for(const dz of [-1.05,0,1.05])if(world.at(x+dx,20,z+dz)!==25||world.solid(x+dx,21,z+dz))return false;
 return true;
}
export function rowBoat(player,world,keys,dt){
 const boat=player.boat;if(!boat)return false;
 if(keys.up){player.boat=null;player.p.y=21.5;player.v=4;return true}
 const norm=Math.max(1,Math.hypot(keys.f,keys.r)),speed=5.8*dt;
 const dx=(-Math.sin(player.yaw)*keys.f+Math.cos(player.yaw)*keys.r)/norm*speed;
 const dz=(-Math.cos(player.yaw)*keys.f-Math.sin(player.yaw)*keys.r)/norm*speed;
 if(boatWater(world,boat.position.x+dx,boat.position.z+dz)){boat.position.x+=dx;boat.position.z+=dz}
 boat.rotation.y=player.yaw;boat.userData.record.p=boat.position.toArray();boat.userData.record.rot=boat.rotation.y;
 player.p.set(boat.position.x,21.15,boat.position.z);player.v=0;player.fly=false;player.swim=false;player.moving=!!(keys.f||keys.r);return true;
}
