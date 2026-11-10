export function createNature(T,scene,world){
 const root=new T.Group();scene.add(root);const animals=[];let time=0,last=-100;
 const materials=new Map(),geometries=new Set();
 function piece(g,size,p,color){if(!materials.has(color))materials.set(color,new T.MeshLambertMaterial({color}));const geo=new T.BoxGeometry(...size);geometries.add(geo);const m=new T.Mesh(geo,materials.get(color));m.position.set(...p);g.add(m);return m}
 function spawn(x,z,i){
  const sea=world.at(x,20,z)===25&&world.at(x,19,z)===25;
  const g=new T.Group(),bird=!sea;let wings=[];
  if(bird){piece(g,[.18,.16,.36],[0,0,0],0xeee8d3);piece(g,[.08,.08,.14],[0,0,-.24],0xf2b844);for(const side of [-1,1]){const pivot=new T.Group();g.add(pivot);piece(pivot,[.48,.035,.2],[side*.27,0,0],0x586571);wings.push(pivot)}}
  else if(i%3===0){piece(g,[.7,.23,.85],[0,0,0],0x467b54);piece(g,[.22,.18,.28],[0,0,-.53],0x83aa68);for(const a of [-1,1])for(const b of [-1,1])piece(g,[.35,.07,.2],[a*.43,-.02,b*.27],0x83aa68)}
  else{piece(g,[.18,.3,.65],[0,0,0],i%2?0xf1b548:0x61b8cf);const tail=piece(g,[.07,.32,.26],[0,0,.4],0x3c6f9b);wings=[tail];piece(g,[.19,.045,.05],[0,.07,-.25],0x172e3b)}
  const y=bird?Math.max(27,world.info(x,z).height+7):19.6;
  g.position.set(x,y,z);root.add(g);animals.push({g,x,z,y,bird,wings,phase:i*2.4});
 }
 function clear(){root.clear();animals.length=0;for(const g of geometries)g.dispose();geometries.clear()}
 return {update(dt,p,quiet){root.visible=!quiet;if(quiet)return;time+=dt;
  if(time-last>4){last=time;for(let i=animals.length-1;i>=0;i--)if(animals[i].g.position.distanceTo(p)>65){animals[i].g.traverse(o=>{if(o.geometry){o.geometry.dispose();geometries.delete(o.geometry)}});root.remove(animals[i].g);animals.splice(i,1)}
   if(animals.length<20){for(let i=0;i<6;i++){const a=time+i*2.4,r=12+i*5;const x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;if(world.at(x,0,z)!==null)spawn(x,z,i)}}}
  for(const a of animals){const t=time*(a.bird?.35:.24)+a.phase,x=a.x+Math.cos(t)*4,z=a.z+Math.sin(t)*4;
   if(a.bird||world.at(x,19,z)===25){a.g.position.set(x,(a.bird?Math.max(a.y,world.info(x,z).height+5):a.y)+Math.sin(t*2)*.2,z);a.g.rotation.y=-t}
   a.wings.forEach((w,i)=>{if(a.bird)w.rotation.z=Math.sin(time*7+a.phase)*(i?1:-1)*.45;else w.rotation.y=Math.sin(time*6+a.phase)*.35});
  }
 },dispose(){clear();scene.remove(root);for(const m of materials.values())m.dispose()}};
}
