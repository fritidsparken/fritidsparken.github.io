/* Original procedural models and track meshes. No remote models or textures. */
(function(root){'use strict';
const T=THREE,C=root.WaterparkCore;
function createWorld(renderer,quality){
 const low=quality==='low'||renderer.isSoftware;
 const scene=new T.Scene();scene.background=new T.Color('#9cdef0');scene.fog=new T.Fog('#b2e4e9',180,580);
 const resort=!renderer.isSoftware&&root.WaterparkResort?.create(scene,renderer,quality);
 const lagoon=!renderer.isSoftware&&root.WaterparkLagoon?.create(renderer,scene,quality);
 const high=quality==='high';scene.fog=new T.Fog('#c9dfec',low?140:220,low?370:610);
 const materials=new Map(),geometries=new Map(),animated=[],waters=[];
 const m=(color,extra={})=>{const key=color+JSON.stringify(extra);if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.62,...extra}));return materials.get(key)};
 const geo=(key,fn)=>{if(!geometries.has(key))geometries.set(key,fn());return geometries.get(key)};
 const sphere=(r=1)=>geo('sphere'+r,()=>new T.SphereGeometry(r,low?8:14,low?6:10));
 const box=(x,y,z)=>geo(`box${x}/${y}/${z}`,()=>new T.BoxGeometry(x,y,z));
 const cyl=(r1,r2,h,s=12)=>geo(`cyl${r1}/${r2}/${h}/${s}`,()=>new T.CylinderGeometry(r1,r2,h,s));
 function add(g,mat,x=0,y=0,z=0,parent=scene){const o=new T.Mesh(g,mat);o.position.set(x,y,z);parent.add(o);return o;}
 function ellipsoid(color,x,y,z,sx,sy,sz,parent=scene){const o=add(sphere(),m(color),x,y,z,parent);o.scale.set(sx,sy,sz);return o;}
 function rod(a,b,r,color,parent=scene){const d=new T.Vector3().subVectors(b,a),mid=a.clone().add(b).multiplyScalar(.5);const o=add(cyl(1,1,1,8),m(color),mid.x,mid.y,mid.z,parent);o.scale.set(r,d.length(),r);o.userData.fixedRod=true;o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
 scene.add(new T.HemisphereLight('#d3eaff','#d1b289',1.25));const sun=new T.DirectionalLight('#fff2d4',2.35);sun.position.set(-100,170,90);scene.add(sun);
 if(resort&&!low){renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 sun.castShadow=true;sun.shadow.mapSize.setScalar(high?2048:1024);Object.assign(sun.shadow.camera,{left:-164,right:164,top:157,bottom:-157,near:1,far:420});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.09;sun.shadow.bias=-.00025;}
 // An oval island, rim of pale sand and the surrounding sea.
 const sea=add(new T.PlaneGeometry(1800,1800),m('#29afc6',{roughness:.24,metalness:.25}),0,-3,0);sea.rotation.x=-Math.PI/2;sea.userData.softwareLayer=-10;
 const island=add(cyl(1,1,3,64),m('#f1d9a3'),0,-1.1,0);island.scale.set(173,1,145);island.userData.softwareLayer=-9;
 const grass=add(cyl(1,1,.5,64),m('#89cda2'),0,.5,-19);grass.scale.set(151,1,112);grass.userData.softwareLayer=-8;
 const plaza=add(cyl(1,1,.2,64),m('#fff0cb'),0,.85,94);plaza.scale.set(138,1,29);plaza.userData.softwareLayer=-7;
 for(let i=0;i<6;i++){const path=add(box(7,.16,181),m('#f6e6c3'),C.courses[i].x,.8,-3);path.position.x-=15;path.userData.softwareLayer=-6;}
 // Water shader is restricted to displacement and color; no expensive scene copies.
 function water(x,z,rx,rz,y=1){if(lagoon){const pool=lagoon.pool(x,z,rx,rz,y+.045);waters.push(pool);return pool;}const g=new T.CircleGeometry(1,low?24:48);g.rotateX(-Math.PI/2);let mat;
  if(renderer.isSoftware)mat=m('#43ceda',{roughness:.2});else {
   mat=new T.MeshStandardMaterial({color:'#27cad9',transparent:true,opacity:.86,metalness:.25,roughness:.2,side:T.DoubleSide});
   mat.onBeforeCompile=s=>{s.uniforms.uTime={value:0};mat.userData.shader=s;s.vertexShader='uniform float uTime;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.y += sin(position.x*12.0+uTime*1.5)*0.008 + cos(position.z*15.0+uTime)*0.006;');s.fragmentShader='uniform float uTime;\n'+s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat ripple=sin(vViewPosition.x*1.5+uTime)*sin(vViewPosition.z*1.7-uTime*.8); diffuseColor.rgb += max(0.0,ripple-.5)*.18;');};
  }
  const o=add(g,mat,x,y,z);o.scale.set(rx,1,rz);waters.push(o);o.userData.softwareLayer=-5;
  const rim=add(new T.TorusGeometry(1,.035,6,low?32:64),m('#fff9e6'),x,y-.1,z);rim.rotation.x=Math.PI/2;rim.scale.set(rx,rz,1.1);return o;
 }
 const wavePool=water(-4,110,49,18);water(0,23,9,9,1.1);
 if(resort){island.material=resort.surface('sand',54,46);grass.material=resort.surface('sand',48,40,'#f3dfbd');plaza.material=resort.surface('sand',35,9);for(const obj of scene.children)if(obj.userData.softwareLayer===-6)obj.material=resort.surface('wood',2,38);}
 // Hand-shaped curved leaves, batched into two draw calls for the whole park.
 const leafPos=[],leafIdx=[];for(let i=0;i<=7;i++){const u=i/7,w=Math.sin(Math.PI*u)*.8;for(let s of [-1,1])leafPos.push(u*5.8,Math.sin(u*Math.PI)*.8-u*u*1.5,w*s);if(i<7){let j=i*2;leafIdx.push(j,j+2,j+1,j+1,j+2,j+3)}}
 const leafGeo=new T.BufferGeometry();leafGeo.setAttribute('position',new T.Float32BufferAttribute(leafPos,3));leafGeo.setIndex(leafIdx);leafGeo.computeVertexNormals();
 const palmBlade=resort?resort.blade(0,7.2,4.35,1.82,1.45):leafGeo;
 const treeLocations=[];for(let i=0;i<(low?38:75);i++){let angle=i*2.399,rad=70+(i%7)*12;let x=Math.cos(angle)*rad,z=Math.sin(angle)*rad*.76-14;if(z>85&&Math.abs(x)<36)continue;treeLocations.push([x,z,.7+(i%4)*.13]);}
 // Extra jungle vegetation, kept away from the ride lane.
 treeLocations.push([-23,122,1.8],[28,125,1.65],[-40,91,1.48],[45,94,1.55],[-33,114,1.38]);for(let i=0;i<12;i++)treeLocations.push([-63+(i%2?18:-19),-75+i*11,.9]);
 const trunks=new T.InstancedMesh(cyl(.3,.57,8,12),resort?resort.surface('bark',2,4):m('#ad8058'),treeLocations.length),leaves=new T.InstancedMesh(palmBlade,resort?resort.foliage.clone():m('#329b68',{side:T.DoubleSide}),treeLocations.length*9);scene.add(trunks,leaves);const temp=new T.Object3D();
 treeLocations.forEach(([x,z,s],i)=>{temp.position.set(x,4*s+.8,z);temp.rotation.set(0,i*.7,.08*Math.sin(i));temp.scale.set(s,s,s);temp.updateMatrix();trunks.setMatrixAt(i,temp.matrix);for(let j=0;j<9;j++){temp.position.set(x-.45*s*Math.sin(i),8*s+.8,z);temp.rotation.set(0,j*Math.PI*2/9+i,Math.cos(j+i)*.26);temp.scale.set(s,s,s);temp.updateMatrix();leaves.setMatrixAt(i*9+j,temp.matrix);leaves.setColorAt(i*9+j,new T.Color(j%2?'#b1c89a':'#fbf2b6'));}});
 if(resort){leaves.material.color.set('#e5e5ca');leaves.material.onBeforeCompile=shader=>{shader.uniforms.uWind=resort.clock;shader.vertexShader='uniform float uWind;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.y+=sin(instanceMatrix[3].x*.24+uWind*1.4+position.x*.5)*position.x*.037;');};}
 const rocks=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),resort?resort.surface('rock',2,2):m('#91ada0'),38);scene.add(rocks);for(let i=0;i<38;i++){let a=i*2.4;temp.position.set(Math.cos(a)*(125+i%4*8),1,Math.sin(a)*(86+i%5*6));temp.rotation.set(i,.3*i,i*.2);temp.scale.set(2+i%3,1.2+i%2,2.6);temp.updateMatrix();rocks.setMatrixAt(i,temp.matrix);}
 // Distant islands and a low resort hotel add depth beyond the playing area.
 for(let i=0;i<7;i++){const hill=ellipsoid(i%2?'#627f72':'#708d77',-330+i*100,0,-250,78,25+i%3*15,55);if(resort){hill.material=resort.surface('rock',5,3,'#78967b');hill.geometry=new T.IcosahedronGeometry(1,3);const p=hill.geometry.attributes.position;for(let j=0;j<p.count;j++){const x=p.getX(j),y=p.getY(j),z=p.getZ(j);p.setY(j,y*(1+.21*Math.sin(x*7+i)+.1*Math.cos(z*13+i)));}hill.geometry.computeVertexNormals();}hill.userData.skipSoftware=low;}
 for(let i=0;i<4;i++){add(box(22,13,18),m('#f7e9cc'),-50+i*30,6,-165);add(box(24,1,20),m('#6eaea1'),-50+i*30,13,-165);for(let j=0;j<4;j++)add(box(3,3,.1),m('#7ac0cb'),-58+i*30+j*5,7,-155.9);}
 // Parasols, recliners, bridge and ice cream stand.
 function parasol(x,z,color){add(cyl(.1,.1,4.5,6),m('#e7c58a'),x,3,z);add(new T.ConeGeometry(3.5,1.4,12),m(color),x,5.6,z);const seat=add(box(2,.25,4.2),resort?resort.surface('wood',1,2):m('#fff9e9'),x+4,1.2,z);seat.rotation.x=.12;const back=add(box(2,.22,1.9),m('#e4d6b4'),x+4,1.71,z-1.78);back.rotation.x=.68;if(resort){for(const side of [-1,1]){add(box(.12,.6,4.1),m('#855e3e'),x+4+side*.87,.99,z);}}}
 for(let i=0;i<10;i++)parasol(-129+i*23,98+(i%3)*2,i%2?'#e8dec7':'#fff3d7');
 const kiosk=new T.Group();scene.add(kiosk);kiosk.position.set(43,0,116);add(box(10,5,7),m('#ffdd9a'),0,3,0,kiosk);add(box(11,1,8),m('#ee7b72'),0,6,0,kiosk);add(box(7,2,.2),m('#469b98'),0,3.6,3.6,kiosk);add(new T.ConeGeometry(1,2.5,8),m('#e4ae65'),0,7.5,0,kiosk).rotation.z=Math.PI;ellipsoid('#fff2d7',0,9,0,1.3,1.3,1.3,kiosk);ellipsoid('#f796a8',.5,10.1,0,1,1,1,kiosk);
 if(!resort)add(box(20,.4,5),m('#d4aa77'),-31,1.1,111);for(let i=0;i<7;i++){rod(new T.Vector3(-40+i*3,1,108.5),new T.Vector3(-40+i*3,3,108.5),.08,'#fff6dc');rod(new T.Vector3(-40+i*3,1,113.5),new T.Vector3(-40+i*3,3,113.5),.08,'#fff6dc');}
 // Waterfall grotto; opening is made of separate rocks so it can be entered.
 const cave=new T.Group();scene.add(cave);cave.position.set(-143,0,37);ellipsoid('#739d89',-5,5,0,4,6,4,cave);ellipsoid('#86aa94',5,5,0,4,6,4,cave);ellipsoid('#95b69e',0,10,0,7,3,5,cave);
 const fall=add(new T.PlaneGeometry(6,10),m('#8ce9e9',{transparent:true,opacity:.62,side:T.DoubleSide}),0,5,2,cave);animated.push({object:fall,type:'fall'});
 if(resort){fall.material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{t:resort.clock},vertexShader:'varying vec2 st;void main(){st=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 st;uniform float t;void main(){float stream=sin(st.x*97.+sin(st.y*5.+t)*1.3)*.5+.5;float spray=sin(st.y*52.+t*11.+stream*7.)*.5+.5;float edge=smoothstep(0.,.11,min(st.x,1.-st.x));gl_FragColor=vec4(mix(vec3(.38,.69,.7),vec3(.94,1.,.98),stream*.55+spray*.34),edge*(.44+stream*.35));}'});
 for(const side of [-1,1]){const curtain=fall.clone();curtain.position.set(6*side,5.7,2.4);curtain.scale.set(.48,1.15,1);cave.add(curtain);}
 }

 const secret=add(new T.OctahedronGeometry(.8),m('#ffe277',{emissive:'#bf8f24',emissiveIntensity:.5}),-143,2,36);
 // Main fountain and two side fountains.
 const fountains=[];for(const [x,z] of [[0,23],[-128,76],[128,76]]){if(x)water(x,z,4,4);add(cyl(.35,.65,2.3,10),m('#f2e8c8'),x,2,z);fountains.push(new T.Vector3(x,3.1,z));}
 if(resort){
  const falls=fall.clone();falls.position.set(0,6.6,64);falls.scale.set(1.25,1.2,1);scene.add(falls);
  fountains.push(new T.Vector3(0,1.3,64));
 }
 const clouds=[];for(let i=0;i<(resort?0:14);i++){const group=new T.Group();group.position.set(-300+i*48,93+(i%4)*9,-130+(i%3)*80);scene.add(group);for(let j=0;j<3;j++)ellipsoid('#f8ffff',j*8,Math.sin(j)*2,0,9,3.4+j%2,5,group);clouds.push(group);}
 const birds=[];for(let i=0;i<5;i++){const group=new T.Group();scene.add(group);rod(new T.Vector3(-1,0,.1),new T.Vector3(0,.3,0),.055,'#426b70',group);rod(new T.Vector3(0,.3,0),new T.Vector3(1,0,.1),.055,'#426b70',group);birds.push(group);}
 function avatar(color='#12b7c7',skin='#eeb487',detailed=true){
  const group=new T.Group();const ring=add(new T.TorusGeometry(.8,.25,8,20),m('#ffcc59'),0,.45,0,group);ring.rotation.x=Math.PI/2;
  // Contoured silhouettes share anatomical profiles across visitors.
  function profile(points,mat,x,y,z,depth,parent=group){
    const shape=geo('body'+JSON.stringify(points),()=>new T.LatheGeometry(points.map(([h,r])=>new T.Vector2(r,h)),low?10:18));
    const o=add(shape,m(mat),x,y,z,parent);o.scale.z=depth;return o;
  }
  const torso=profile([[0,.245],[.17,.27],[.36,.25],[.56,.34],[.71,.31],[.78,.12]],skin,0,.91,0,.67);
  profile([[0,.11],[.19,.115]],skin,0,1.62,0,.94);
  profile([[0,.08],[.055,.15],[.13,.2],[.27,.222],[.37,.21],[.45,.14],[.48,.02]],skin,0,1.74,0,.93);
  const hair=profile([[0,.211],[.08,.229],[.19,.19],[.24,.09],[.25,.01]],'#493124',0,2.02,.016,.98);
  hair.rotation.x=.18;
  if(detailed){
   const hairShade=['#513827','#60412b','#463021'];
   for(let i=0;i<13;i++){const a=i*2.399,rad=.07+(i%3)*.04;
     const lock=ellipsoid(hairShade[i%3],Math.cos(a)*rad,2.19+.035*Math.cos(i),Math.sin(a)*rad,.055,.041,.109,group);lock.rotation.y=a*.45;}
   for(const side of [-1,1]){
     const brow=ellipsoid('#664331',side*.083,2.045,-.185,.038,.008,.014,group);brow.rotation.z=side*.08;
     ellipsoid(skin,side*.199,1.968,.05,.042,.066,.029,group);
   }
  }
  for(const side of [-1,1]){ellipsoid(skin,side*.211,1.99,0,.044,.067,.039,group);
    if(detailed)ellipsoid('#503d31',side*.081,2.006,-.19,.022,.012,.008,group);}
  ellipsoid(skin,0,1.965,-.199,.034,.043,.049,group);
  profile([[0,.265],[.16,.286],[.29,.25]],color,0,.77,0,.76);
  profile([[0,.258],[.044,.255]],'#e4efe1',0,1.025,0,.77);
  const limbs=[];for(const side of [-1,1]){
    const arm=new T.Group();arm.position.set(side*.3,1.56,0);group.add(arm);
    profile([[-.63,.047],[-.55,.061],[-.38,.079],[-.31,.071],[-.14,.087],[0,.09],[.045,.055]],skin,side*.05,0,0,.9,arm);
    ellipsoid(skin,side*.05,-.65,-.012,.064,.098,.048,arm);
    const leg=new T.Group();leg.position.set(side*.137,.89,0);group.add(leg);
    profile([[-.81,.059],[-.64,.067],[-.51,.09],[-.41,.088],[-.33,.095],[-.14,.118],[0,.121]],skin,0,0,0,1,leg);
    profile([[-.28,.124],[-.12,.143],[.015,.131]],color,0,0,0,.97,leg);
    ellipsoid(skin,0,-.82,-.065,.075,.063,.142,leg);
    limbs.push({arm,leg,side});
  }
  function pose(type,time=0,lean=0){ring.visible=type==='ride'||type==='swim'||type==='celebrate';torso.rotation.x=type==='ride'?-.18:0;limbs.forEach(l=>{l.arm.rotation.z=l.side*(type==='celebrate'?1.8:type==='swim'?1.3:type==='ride'?.6:.15);l.arm.rotation.x=type==='walk'?Math.sin(time*9)*l.side*.55:0;l.leg.rotation.x=type==='ride'?-1.35:type==='swim'?Math.sin(time*3)*l.side*.3:type==='walk'?Math.sin(time*9)*l.side*.7:0;});group.rotation.z=lean;}
  return{group,pose};
 }
 const avatarMain=avatar();scene.add(avatarMain.group);
 const npcs=[];for(let i=0;i<(low?5:14);i++){const a=avatar(['#ef8876','#6a87d0','#f0b541','#8e75bc'][i%4],['#bd835e','#f2c5a1','#8f5d43'][i%3],false);scene.add(a.group);a.group.scale.setScalar(.8+(i%3)*.1);npcs.push({...a,index:i});}
 const courseData=C.courses.map((c,i)=>C.createCourse(T,c,i)),tracks=[];
 const starShape=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.25:.56;i?starShape.lineTo(Math.cos(a)*r,Math.sin(a)*r):starShape.moveTo(Math.cos(a)*r,Math.sin(a)*r)}starShape.closePath();
 const starGeo=new T.ExtrudeGeometry(starShape,{depth:.16,bevelEnabled:!low,bevelSegments:1,steps:1,bevelSize:.04,bevelThickness:.04});
 for(const c of courseData){
  const group=new T.Group();scene.add(group);const pos=[],norm=[],uv=[],indices=[],segments=low?82:260,sides=low?8:16;
  for(let i=0;i<=segments;i++){const u=i/segments,f=c.frame(u);for(let j=0;j<=sides;j++){const a=(j/sides-.5)*Math.PI,px=Math.sin(a)*3.55,py=(1-Math.cos(a))*3.15;const p=f.position.clone().addScaledVector(f.right,px).addScaledVector(f.up,py);pos.push(p.x,p.y,p.z);uv.push(j/sides,u*25);if(i<segments&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  if(c.index===5){const colors=[];const rainbow=['#f36cab','#fa765b','#ffca42','#39be75','#18bce3','#9a6aef'];for(let i=0;i<=segments;i++){const color=new T.Color(rainbow[Math.floor(i/segments*18)%6]);for(let j=0;j<=sides;j++)colors.push(color.r,color.g,color.b);}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));}
  const trackMaterial=m(c.index===5?'#ffffff':c.color,{side:T.DoubleSide,roughness:.21,metalness:.19,vertexColors:c.index===5});const shell=add(g,trackMaterial,0,0,0,group);
  // Continuous white lips, split at the jump gap.
  for(const side of [-1,1])for(const [a,b] of [[0,1]]){const pts=[];for(let i=0;i<=Math.ceil((b-a)*80);i++){const f=c.frame(a+(b-a)*i/Math.ceil((b-a)*80));pts.push(f.position.addScaledVector(f.right,side*3.55).addScaledVector(f.up,3.15));}add(new T.TubeGeometry(new T.CatmullRomCurve3(pts),low?28:80,.1,5,false),m('#fff6db'),0,0,0,group);}
  // Soft turquoise water ribbon at the bottom of the chute.
  const ribbonPos=[],ribbonIdx=[],ribbonSides=low?2:4;for(let i=0;i<=segments;i++){const f=c.frame(i/segments);for(let j=0;j<=ribbonSides;j++){const angle=(j/ribbonSides-.5)*Math.PI/4,p=f.position.clone().addScaledVector(f.right,Math.sin(angle)*3.55).addScaledVector(f.up,(1-Math.cos(angle))*3.15+.055);ribbonPos.push(p.x,p.y,p.z)}if(i<segments)for(let j=0;j<ribbonSides;j++){let k=i*(ribbonSides+1)+j;ribbonIdx.push(k,k+ribbonSides+1,k+1,k+1,k+ribbonSides+1,k+ribbonSides+2)}}
  const ribbonG=new T.BufferGeometry();ribbonG.setAttribute('position',new T.Float32BufferAttribute(ribbonPos,3));const ribbonUV=[];for(let i=0;i<=segments;i++)for(let j=0;j<=ribbonSides;j++)ribbonUV.push(j/ribbonSides,i/segments*c.length);
  ribbonG.setAttribute('uv',new T.Float32BufferAttribute(ribbonUV,2));ribbonG.setIndex(ribbonIdx);ribbonG.computeVertexNormals();const film=m('#abf6f6',{transparent:true,opacity:.36,side:T.DoubleSide,roughness:.13,depthWrite:false});
  if(resort)film.onBeforeCompile=s=>{s.uniforms.flowTime=resort.clock;s.vertexShader='varying vec2 flowUV;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nflowUV=uv;');s.fragmentShader='uniform float flowTime; varying vec2 flowUV;\n'+s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat crest=sin(flowUV.y*2.7-flowTime*9.+sin(flowUV.x*22.+flowUV.y*.15));diffuseColor.a=.19+.23*pow(max(crest,0.),5.);');};add(ribbonG,film,0,0,0,group);
  for(let u=.03;u<.96;u+=.11){const f=c.frame(u);for(let side of [-1,1]){const p=f.position.clone().addScaledVector(f.right,side*2.4);rod(new T.Vector3(p.x,1,p.z),p,.16,'#c8ddce',group);}rod(f.position.clone().addScaledVector(f.right,-2.8),f.position.clone().addScaledVector(f.right,2.8),.12,'#f6f3d8',group);}
  if(resort){
   // A curved sheet follows the outlet into the receiving pool.
   const outlet=c.frame(1),p=outlet.position,rows=16,vertices=[],indices=[],uvs=[];
   for(let k=0;k<=rows;k++){const u=k/rows;for(let j=0;j<=6;j++){const w=(j/6-.5)*(3.1+u*1.8);
     const q=p.clone().addScaledVector(outlet.tangent,4.8*u).addScaledVector(outlet.right,w);
     q.y=T.MathUtils.lerp(p.y+.11,1.08,u*u)+.07*Math.sin(j*4+u*7);
     vertices.push(q.x,q.y,q.z);uvs.push(j/6,u*6);if(k<rows&&j<6){const n=k*7+j;indices.push(n,n+7,n+1,n+1,n+7,n+8);}}}
   const sheet=new T.BufferGeometry();sheet.setAttribute('position',new T.Float32BufferAttribute(vertices,3));sheet.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));sheet.setIndex(indices);sheet.computeVertexNormals();add(sheet,film,0,0,0,group);
   fountains.push(p.clone().addScaledVector(outlet.tangent,4.8).setY(1.12));
  }
  const start=c.frame(0).position;add(box(9,.6,9),m('#e3b882'),start.x,start.y-.3,start.z-3,group);
  for(let side of [-1,1]){rod(new T.Vector3(start.x+side*4,1,start.z-6),new T.Vector3(start.x+side*4,start.y+3,start.z-6),.23,'#fff1d1',group);}
  add(new T.ConeGeometry(7,3,4),resort?resort.surface('wood',2,2,'#876e51'):m(c.color),start.x,start.y+5.7,start.z-3,group).rotation.y=Math.PI/4;
  // Stair path used by the climb animation. All steps are one instanced draw.
  const steps=Math.ceil(start.y/.6),stairs=new T.InstancedMesh(box(2.6,.35,1.1),m('#e6c48f'),steps);group.add(stairs);const stairPoints=[];
  for(let i=0;i<steps;i++){const a=i/steps*Math.PI*4,r=5.6;temp.position.set(start.x+Math.cos(a)*r,1+i/steps*(start.y-1),start.z-3+Math.sin(a)*r);temp.rotation.set(0,-a,0);temp.scale.set(1,1,1);temp.updateMatrix();stairs.setMatrixAt(i,temp.matrix);stairPoints.push(temp.position.clone());}
  const entry=new T.Vector3(start.x+5.6,1,start.z-3);
  let tunnel=null;const rings=[];
  if(c.tunnel){const[a,b]=c.tunnel,pts=[];for(let i=0;i<=70;i++){const f=c.frame(a+(b-a)*i/70);pts.push(f.position.addScaledVector(f.up,2.9));}
   tunnel=add(new T.TubeGeometry(new T.CatmullRomCurve3(pts),low?35:100,4.55,low?10:18,false),m(c.index===4?'#30235b':c.index===3?'#756b76':'#508567',{side:T.DoubleSide,roughness:.25,metalness:.19}),0,0,0,group);
   for(let u=a+.012;u<b;u+=.038){const f=c.frame(u),p=f.position.clone().addScaledVector(f.up,2.9);const color=['#62f3ef','#e9a1ff','#fff092'][rings.length%3];const ring=add(new T.TorusGeometry(4.46,.095,5,low?16:28),new T.MeshBasicMaterial({color}),p.x,p.y,p.z,group);ring.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),f.tangent);rings.push(ring);}
  }
  // Volcano is an open crater surrounding the tunnel, never a hazard.
  if(!resort&&c.index===3){const mountain=add(new T.ConeGeometry(18,29,11,1,true),m('#8f9392',{side:T.DoubleSide}),c.x+1,15,-43);mountain.scale.z=1.35;mountain.userData.skipSoftware=false;}
  water(c.x,76,19.7,24);const stars=[],boosts=[],obstacles=[];
  for(const s of c.stars){const f=c.frame(s.u),p=f.position.clone().addScaledVector(f.right,s.lane).addScaledVector(f.up,1.3+C.jumpHeight(c,s.u));const o=add(starGeo,m('#ffde65',{metalness:.25,roughness:.3,emissive:'#a97a16',emissiveIntensity:.3}),p.x,p.y,p.z,group);stars.push(o);}
  c.boosts.forEach(s=>{const f=c.frame(s.u),p=f.position.clone().addScaledVector(f.right,s.lane).addScaledVector(f.up,.25);const o=add(box(2.8,.12,3),m('#fff585',{emissive:'#cc9f18',emissiveIntensity:.4}),p.x,p.y,p.z,group);const basis=new T.Matrix4().makeBasis(f.right,f.up,f.tangent.clone().negate());o.quaternion.setFromRotationMatrix(basis);boosts.push(o);});
  c.obstacles.forEach(s=>{const f=c.frame(s.u),p=f.position.clone().addScaledVector(f.right,s.lane).addScaledVector(f.up,.5);const o=add(new T.TorusGeometry(.65,.2,6,14),m('#ff8c78'),p.x,p.y,p.z,group);o.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),f.up);obstacles.push(o);});
  const jets=[];for(let u of [.32,.71]){const f=c.frame(u),p=f.position.clone().addScaledVector(f.right,-4.4).addScaledVector(f.up,1);const gun=add(new T.CylinderGeometry(.23,.35,1.8,8),m('#ffdf71'),p.x,p.y,p.z,group);gun.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),f.right);jets.push({position:p,direction:f.right});}
  if(resort)resort.decorate(c);
  tracks.push({group,stars,boosts,obstacles,rings,entry,stairPoints,jets,config:c});
 }
 if(resort){resort.finish();
 for(const parent of [scene,...tracks.map(t=>t.group)]){
   const byMaterial=new Map();
   for(const obj of parent.children){if(!obj.userData.fixedRod)continue;
     if(!byMaterial.has(obj.material))byMaterial.set(obj.material,[]);byMaterial.get(obj.material).push(obj);}
   for(const [material,objects] of byMaterial){const mesh=new T.InstancedMesh(objects[0].geometry,material,objects.length);
     objects.forEach((obj,i)=>{obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);parent.remove(obj);});parent.add(mesh);}
 }
 scene.traverse(o=>{if(o.isMesh&&!o.material.transparent){o.receiveShadow=true;o.castShadow=!o.material.isShaderMaterial&&o.geometry.type!=='PlaneGeometry'&&o.userData.softwareLayer===undefined;}});}
 // Reusable splash droplets: one instanced draw, never allocations per particle.
 const particleCount=low?70:180,particles=[],particleMesh=new T.InstancedMesh(sphere(.12),m('#d9ffff',{roughness:.1}),particleCount);scene.add(particleMesh);particleMesh.frustumCulled=false;
 for(let i=0;i<particleCount;i++){particles.push({life:0,p:new T.Vector3(),v:new T.Vector3()});temp.position.set(0,-1000,0);temp.scale.set(0,0,0);temp.updateMatrix();particleMesh.setMatrixAt(i,temp.matrix);}
 function splash(p,count=25,power=1,direction=null){if(lagoon&&p.y<2)lagoon.ripple(p,Math.min(1.4,power));for(let j=0;j<count;j++){const d=particles.find(x=>x.life<=0);if(!d)break;d.life=.45+Math.random()*.7;d.p.copy(p);d.v.set((Math.random()-.5)*7*power,Math.random()*6*power+2,(Math.random()-.5)*7*power);if(direction)d.v.addScaledVector(direction,9);}}
 const wake=[];for(let i=0;i<18;i++){const o=add(new T.SphereGeometry(.12,5,4),m('#e2ffff',{transparent:true,opacity:.7}),0,-1000,0);o.scale.set(1,.2,2.8);wake.push(o);}
 let active=-1,clock=0,fountainClock=0;
 function select(index){active=index;tracks.forEach((t,i)=>{t.group.visible=!renderer.isSoftware||index<0||i===index;t.stars.forEach(o=>o.visible=i===index);t.boosts.forEach(o=>o.visible=i===index);t.obstacles.forEach(o=>o.visible=i===index);t.rings.forEach(o=>o.visible=true)});}
 function update(dt,ride=null){clock+=dt;if(resort)resort.clock.value=clock;if(lagoon)lagoon.time.value=clock;waters.forEach(o=>{if(o.material.userData.shader)o.material.userData.shader.uniforms.uTime.value=clock});wavePool.position.y=1.055+Math.sin(clock*1.6)*.12;
  clouds.forEach((o,i)=>o.position.x+=dt*.35);birds.forEach((o,i)=>{o.position.set(Math.sin(clock*.13+i)*95,43+i*3,Math.cos(clock*.13+i)*65);o.rotation.y=clock*.13+i;o.rotation.z=Math.sin(clock*2+i)*.1});
  animated.forEach(a=>a.object.material.opacity=.58+Math.sin(clock*3)*.08);secret.rotation.y=clock;secret.position.y=2+Math.sin(clock*2)*.2;
  npcs.forEach((a,i)=>{if(i%5===2){const c=courseData[i%6],u=(clock*.052+i*.13)%1,f=c.frame(u);a.group.position.copy(f.position).addScaledVector(f.up,.25);a.group.rotation.y=Math.atan2(-f.tangent.x,-f.tangent.z);a.pose('ride',clock);return;}
  if(i%5===3){const t=tracks[i%6],p=t.stairPoints[Math.floor((clock*.9+i*3)%t.stairPoints.length)];a.group.position.copy(p);a.pose('walk',clock);return;}
  const swim=i%5===0;a.group.position.set(swim?-4+Math.sin(clock*.1+i)*13:-130+(i*19)%260,swim?1.05+Math.sin(clock*2+i)*.1:1,swim?111+Math.cos(clock*.13+i)*7:94+Math.sin(clock*.3+i)*4);a.group.rotation.y=Math.sin(clock*.3+i);a.pose(swim?'swim':'walk',clock*.4+i)});
  fountainClock-=dt;if(fountainClock<=0){fountainClock=.12;fountains.forEach(p=>splash(p,1,.6));if(resort)splash(new T.Vector3(-143,1.3,40),2,.58);if(active>=0)tracks[active].jets.forEach(j=>splash(j.position,1,.25,j.direction));}
  for(let i=0;i<particles.length;i++){const d=particles[i];if(d.life>0){d.life-=dt;d.v.y-=10*dt;d.p.addScaledVector(d.v,dt);temp.position.copy(d.p);temp.scale.setScalar(Math.min(1,d.life*4));}else{temp.position.set(0,-1000,0);temp.scale.setScalar(0)}temp.rotation.set(0,0,0);temp.updateMatrix();particleMesh.setMatrixAt(i,temp.matrix);}particleMesh.instanceMatrix.needsUpdate=true;
  tracks.forEach((t,i)=>{if(i===active)t.stars.forEach(o=>o.rotation.y+=dt*1.9)});
  wake.forEach((o,i)=>{if(ride&&!ride.done){const u=Math.max(0,ride.distance/ride.course.length-i*.003-.005),f=ride.course.frame(u);o.position.copy(f.position).addScaledVector(f.right,ride.lane+Math.sin(clock*9+i)*.3).addScaledVector(f.up,.18+C.laneHeight(ride.lane));o.visible=true;}else o.visible=false});
 }
 return{reflect:lagoon?.reflect,scene,courseData,tracks,avatar:avatarMain,wavePool,secret,select,update,splash,low,waters,dispose(){if(resort)resort.dispose();if(lagoon)lagoon.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())}})}};
}
root.WaterparkWorld={create:createWorld};
})(window);
