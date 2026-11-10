const assert=require('node:assert/strict');const T=require('../../js/vendor/three.min.js');
(async()=>{
 const {equipment,withEquipment,boatWater,rowBoat}=await import(process.cwd()+'/games/blockvarlden/expedition/equipment.js');
 const kit=withEquipment(T,{ids:[],create(){throw Error('missing')},dispose(){}});
 for(const item of equipment){const model=kit.create(item.id),b=new T.Box3().setFromObject(model);assert(!b.isEmpty());assert(Number.isFinite(b.max.y));assert.notEqual(model,kit.create(item.id))}
 const water={at:(x,y,z)=>y<=20?25:0,solid:()=>false};assert(boatWater(water,0,0));assert(!boatWater({at:()=>0,solid:()=>false},0,0));
 const boat=kit.create('boat');boat.position.set(0,20.85,0);boat.userData.record={p:boat.position.toArray()};const p={p:new T.Vector3(),boat,yaw:0};
 assert(rowBoat(p,water,{f:1,r:0,up:false},.1));assert(boat.position.z<0);assert.equal(p.p.y,21.15);assert.deepEqual(boat.userData.record.p,boat.position.toArray());
 const old=boat.position.clone();rowBoat(p,{at:()=>0,solid:()=>false},{f:1,r:0},.1);assert(boat.position.equals(old));
 rowBoat(p,water,{up:true},.1);assert.equal(p.boat,null);
 const {createNature}=await import(process.cwd()+'/games/blockvarlden/expedition/nature.js');const scene=new T.Scene();const nature=createNature(T,scene,{...water,info:()=>({height:12})});nature.update(.1,new T.Vector3(0,21,0),false);assert(scene.children[0].children.length>0);nature.update(.1,new T.Vector3(),true);assert.equal(scene.children[0].visible,false);nature.dispose();assert.equal(scene.children.length,0);
 kit.dispose();console.log('PASS: six models, boat water restriction/movement/exit/persistence, sea fauna, no-animal visibility, disposal');
})().catch(e=>{console.error(e);process.exit(1)});
