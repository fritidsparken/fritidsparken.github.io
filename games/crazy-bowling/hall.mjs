const T=window.THREE;
// All furniture, foliage, fixtures and lettering come from the authored GLB kit.
export function buildHall(v){
 const p=v.palette,scene=v.scene;v.detailLights=[];v.accentSpots=[];v.floorMeshes=[];
 const brick=v.pbr('brick','#656477',1,[13,2.5],{normalScale:new T.Vector2(.7,.7),aoMapIntensity:.7});
 const sideBrick=v.pbr('brick','#656477',1,[10,2.5],{normalScale:new T.Vector2(.7,.7)});
 const dark=v.mat('#10131e',{roughness:.85});
 v.box(72,.3,66,v.pbr('concrete','#697080',1,[12,12]),0,-.72,-9);
 v.box(72,13,.45,brick,0,6,-35);v.box(.45,13,66,sideBrick,-36,6,-9);v.box(.45,13,66,sideBrick,36,6,-9);
 v.box(72,.3,66,dark,0,12.8,-9);
 v.box(72,.22,17,v.pbr('oak','#edc78e',.36,[8,2]),0,-.17,12.5);
 for(const z of [-30,-18,-6,6,18]){v.box(72,.4,.32,p.shell,0,12.35,z);for(const x of [-25,-15,-5,5,15,25]){const truss=v.asset('truss');truss.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});truss.position.set(x,11.8,z);}}
 const pins=[];
 for(const x of [-20,-10,0,10,20]){
  if(x!==0){const lane=v.box(7.6,.6,36,v.wood,x,-.3,-14);v.floorMeshes.push(lane);for(let row=0;row<4;row++)for(let col=0;col<=row;col++)pins.push([x+(col-row/2)*.86,.55,-26-row*.8]);}
  for(const side of [-1,1]){
   const gutter=v.asset('gutter');gutter.position.set(x+side*4.5,-.05,-14);gutter.scale.set(1.9,1,36);
   v.box(.09,.055,36,p.blueNeon,x+side*4.86,.1,-14);v.box(.045,.025,36,p.pinkNeon,x+side*4.73,.12,-14);
   v.box(.15,.16,36,p.shell,x+side*4.98,.02,-14);
  }
  v.box(7.6,.018,.15,p.rubber,x,.015,.7);v.markings(x);
  // Open pin deck: the fascia is above the sightline, with a dark recess behind.
  v.box(8.8,3,.2,p.rubber,x,1.2,-33);v.box(8.8,1.1,1.5,p.shell,x,2.8,-31.6);
  for(const side of [-1,1])v.box(.25,2.6,1.5,p.metal,x+side*4.3,1,-31.6);
  v.box(8.65,.045,.06,p.blueNeon,x,3.35,-30.8);v.box(8.65,.04,.06,p.pinkNeon,x,2.24,-30.8);
  v.label(String((x+20)/10+1).padStart(2,'0'),.9,.62,x-3.3,2.82,-30.79);
  const deckLight=new T.PointLight('#aacdff',14,8,2);deckLight.position.set(x,2.1,-28.5);scene.add(deckLight);v.detailLights.push(deckLight);
  if(x===-10||x===10){const ret=v.asset('return');ret.position.set(x/2,0,6.8);}
 }
 const bg=v.models.get('pin'),instances=new T.InstancedMesh(bg.geometry,p.pin,pins.length);pins.forEach((a,i)=>instances.setMatrixAt(i,new T.Matrix4().makeTranslation(...a)));instances.receiveShadow=true;scene.add(instances);
 // Clear neon lettering, without decorative pins in front of the sign.
 const sign=v.asset('sign');sign.name='crazy-bowling-neon-sign';sign.traverse(o=>{if(o.isMesh)o.castShadow=false;});sign.position.set(0,7.0,-34.1);sign.scale.setScalar(1.3);
 const glowCanvas=document.createElement('canvas');glowCanvas.width=256;glowCanvas.height=256;const gc=glowCanvas.getContext('2d');const gradient=gc.createRadialGradient(128,128,4,128,128,128);gradient.addColorStop(0,'rgba(50,130,255,.55)');gradient.addColorStop(.55,'rgba(160,35,230,.24)');gradient.addColorStop(1,'rgba(40,50,255,0)');gc.fillStyle=gradient;gc.fillRect(0,0,256,256);const glowMap=new T.CanvasTexture(glowCanvas);glowMap.colorSpace=T.SRGBColorSpace;v.textures.add(glowMap);const glowMaterial=new T.MeshBasicMaterial({map:glowMap,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});v.materials.add(glowMaterial);const halo=v.mesh(new T.PlaneGeometry(31,8),glowMaterial);halo.position.set(0,8,-34.3);halo.castShadow=false;halo.receiveShadow=false;
 const emblem=v.asset('ball');emblem.position.set(0,9.35,-32.7);emblem.scale.setScalar(2.15);
 for(const x of [-18,18]){const monitor=v.asset('monitor');monitor.position.set(x,8.4,-34);monitor.scale.setScalar(1.6);v.monitors.push(monitor);}
 // Side lounge and equipment display remain outside the active camera corridor.
 v.decor=new T.Group();scene.add(v.decor);
 for(const z of [-26,-17,-8]){
  const sofa=v.asset('sofa',v.decor);sofa.position.set(-29,0,z);sofa.rotation.y=Math.PI/2;
  const table=v.asset('table',v.decor);table.position.set(-26.3,0,z);v.contact(-29,.01,z,2.6,.4);
 }
 const displayMaterials=['#3444e7','#bb268b','#e68e17','#217a4d','#a5361c'].map(color=>v.resin(color));
 for(const z of [-29,-17]){const rack=v.asset('rack',v.decor);rack.position.set(29.5,0,z);rack.rotation.y=-.35;
  for(let row=0;row<3;row++)for(let i=0;i<5;i++){
   const resin=displayMaterials[(i+row)%5];
   const ball=v.asset('ball',v.decor,{...p,resin});ball.position.set(27.5+i, .35+row*1.15+.5,z+.15);ball.scale.setScalar(.95);
  }
 }
 for(const [x,z] of [[-25,-30],[25,-30],[-32,-12],[32,-7]]){const plant=v.asset('planter');plant.position.set(x,0,z);plant.scale.setScalar(1.6);v.contact(x,.01,z,.9,.45);}
 for(const side of [-1,1]){v.box(.08,.1,57,p.blueNeon,side*35.7,3,-8);v.box(7,.08,.1,p.pinkNeon,side*30,6.5,-34.6);}
 // Real spotlights, warm lane pools, blue/pink wall washers. No flashing lights.
 const positions=[[-19,-23,'#ffce91',200],[0,-24,'#ffdeb0',250],[19,-23,'#ffce91',200],[-10,-8,'#83baff',170],[10,-8,'#d49aff',170],[0,2,'#ffe5c1',180]];
 for(const [x,z,color,power]of positions){const fixture=v.asset('spot');fixture.position.set(x,11.2,z);const light=new T.SpotLight(color,power,37,.65,.85,2);light.position.set(x,10.8,z);light.target.position.set(x*.85,0,z-2);scene.add(light,light.target);if(x!==0)v.accentSpots.push(light);if(x===0&&z===-24){v.laneLight=light;light.castShadow=false;light.shadow.mapSize.set(1024,1024);light.shadow.bias=-.0002;light.shadow.normalBias=.04;}}
 for(const [x,color]of [[-22,'#276bff'],[-11,'#ad30ff'],[0,'#147aff'],[11,'#c42dff'],[22,'#246bff']]){const light=new T.SpotLight(color,110,17,.75,.9,2);light.position.set(x,.7,-32.8);light.target.position.set(x,8,-34.5);scene.add(light,light.target);v.detailLights.push(light);}
 const lounge=new T.PointLight('#ffb35f',110,24,2);lounge.position.set(-29,4.5,-22);scene.add(lounge);
}
