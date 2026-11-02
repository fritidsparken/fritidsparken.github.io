import {environments} from './environments.mjs?v=premium-2';
import {buildGardenDetails,stoneBoundary,puttingGeometry} from './garden.mjs?v=premium-2';
import {Materials,worldUV,atmosphere} from './materials.mjs?v=premium-2';
import {boundarySegments,boundaryGeometry} from './boundary.mjs?v=premium-2';
import {createRenderer} from './software.mjs?v=premium-2';
import {surfaces,obstacle,R} from './physics.mjs';
import {buildScenery} from './scenery.mjs?v=premium-2';
const T=window.THREE;
export class View{
 constructor(host){this.renderer=createRenderer(T);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;host.append(this.renderer.domElement);this.camera=new T.PerspectiveCamera(50,1,.1,550);this.look=new T.Vector3();this.ray=new T.Raycaster();this.scene=new T.Scene();this.resize=()=>{this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.fov=innerWidth<600?62:50;this.camera.updateProjectionMatrix();};addEventListener('resize',this.resize);this.resize();this.quality('auto');}
 quality(q){const auto=(navigator.deviceMemory||4)<4?'low':innerWidth>900&&(navigator.deviceMemory||4)>=8&&(navigator.hardwareConcurrency||4)>6?'high':'medium';this.requestedQuality=q;this.q=this.renderer.isSoftware?'low':q==='auto'?auto:q;this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.q==='high'?1.8:this.q==='medium'?1.25:1));this.renderer.shadowMap.enabled=this.q!=='low';this.adaptiveRatio=Math.min(devicePixelRatio,this.q==='high'?1.8:this.q==='medium'?1.25:1);if(this.c&&this.ball){const color='#'+this.ball.material.color.getHexString();this.build(this.c,color);}}
 mat(color,opts={}){return new T.MeshStandardMaterial({color,roughness:.78,...opts});}
 mesh(g,m,x=0,y=0,z=0,parent=this.scene){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 beam(a,b,r,mat,parent=this.scene){const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=this.mesh(new T.CylinderGeometry(r,r,av.distanceTo(bv),10),mat,0,0,0,parent);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(new T.Vector3(...a)).normalize());return o;}
 build(c,color){for(const g of this.railFrames||[])g.dispose();this.atmosphere?.dispose();this.materials?.dispose();const gs=new Set(),ms=new Set(),ts=new Set();this.scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){ms.add(m);for(const value of Object.values(m))if(value?.isTexture)ts.add(value);}}if(o.isLight)o.shadow?.map?.dispose();});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());this.scene.clear();this.scenery?.dispose?.();this.materials=new Materials(T,this.renderer);this.c=c;const theme=environments[c.id];this.theme=theme;this.renderer.toneMappingExposure=theme.exposure;this.moving=[];this.particles=[];
 this.atmosphere=atmosphere(T,this.renderer,this.scene,theme.visualWorld,theme);
 this.scene.add(new T.HemisphereLight(theme.horizon,theme.ground,theme.ambient));
 const sun=new T.DirectionalLight(theme.sun,theme.intensity);sun.position.set(-20,35,10);sun.castShadow=true;sun.shadow.mapSize.set(this.q==='high'?2048:1024,this.q==='high'?2048:1024);Object.assign(sun.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:1,far:110});sun.shadow.bias=-.0002;sun.shadow.normalBias=.025;sun.shadow.radius=3;this.scene.add(sun,sun.target);this.sun=sun;
 const turf=this.materials.get('turf',theme.night?'#91bb92':'#719a72',{normalScale:new T.Vector2(.22,.22)}),edge=this.materials.get('rock',theme.night?'#babebd':'#c7c0aa'),base=this.materials.get('rock','#a69c85');

 for(const {a,b,i} of surfaces(c)){const av=new T.Vector3(...a),bv=new T.Vector3(...b),length=av.distanceTo(bv),mid=av.clone().add(bv).multiplyScalar(.5);const g=new T.Group();g.position.copy(mid);g.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),bv.clone().sub(av).normalize());this.scene.add(g);const moving=c.features.find(f=>f.type==='movingBridge'&&f.node===i);const width=moving?2.1:c.width;this.mesh(new T.BoxGeometry(width,.3,length+.12),base,0,-.18,0,g);if(moving){const greenGeo=new T.PlaneGeometry(width,length+.14);const uv=greenGeo.attributes.uv;for(let u=0;u<uv.count;u++)uv.setXY(u,uv.getX(u)*width*.7,uv.getY(u)*length*.7);this.mesh(greenGeo,turf,0,-.022,0,g).rotation.x=-Math.PI/2;}if(moving)this.moving.push({type:'bridge',mesh:g,origin:mid.clone()});}
 // Static putting surfaces are one clipped union, never stacked coplanar tiles.
 const staticSegments=surfaces(c).filter(s=>!c.features.some(f=>f.type==='movingBridge'&&f.node===s.i));
 this.mesh(puttingGeometry(T,c,staticSegments,this.q==='low'?.4:.24),turf);
 if(![4,6,9,14,16].includes(c.id)){const walk=this.mesh(puttingGeometry(T,c,staticSegments,.45,true),this.materials.get('sand','#d4c9b1'));walk.castShadow=false;walk.userData.noOcclusion=true;}
 // One continuous outer boundary, never one pair of rails per overlapping tile.
 this.railFrames=c.features.some(f=>f.type==='movingBridge')?Array.from({length:17},(_,i)=>stoneBoundary(T,boundarySegments(c,.3,(i/16*2-1)*.9))):[stoneBoundary(T,boundarySegments(c,this.q==='low'?.4:.28))];edge.vertexColors=true;edge.color.multiplyScalar(2.2);this.rail=this.mesh(this.railFrames[Math.floor(this.railFrames.length/2)],edge);
 if(theme.id===16){const pts=boundarySegments(c,.4).flatMap(pair=>pair.flatMap(p=>[p[0],p[1]+.16,p[2]]));const lineGeo=new T.BufferGeometry();lineGeo.setAttribute('position',new T.Float32BufferAttribute(pts,3));this.scene.add(new T.LineSegments(lineGeo,new T.LineBasicMaterial({color:'#70eee1',toneMapped:false})));}

 this.scene.traverse(o=>{if(o.isMesh)o.userData.courseSurface=true;});
 const cup=c.path.at(-1);this.mesh(new T.CylinderGeometry(.39,.34,.1,32),this.mat('#13262b'),cup[0],cup[1]-.015,cup[2]);const rim=this.mesh(new T.TorusGeometry(.39,.035,8,40),this.mat('#f4eccd'),cup[0],cup[1]+.01,cup[2]);rim.rotation.x=Math.PI/2;this.beam([cup[0],cup[1],cup[2]],[cup[0],cup[1]+2.8,cup[2]],.035,this.mat('#fff8df'));const flag=this.mesh(new T.PlaneGeometry(.95,.6,6,2),this.mat('#f77669',{side:T.DoubleSide}),cup[0]+.48,cup[1]+2.42,cup[2]);this.flag=flag;
 for(const f of c.features){const a=c.path[f.node],b=c.path[f.exit??f.node];const metal=this.mat('#43546b',{metalness:.65,roughness:.3});
 if(['bumper','barrel','windmill'].includes(f.type)){const o=obstacle(c,f,0),m=this.mesh(new T.CylinderGeometry(o.r*.9,o.r,1,24),this.materials.get('wood',f.type==='bumper'?'#ddc8a2':'#c7ad8b'),o.x,a[1]+.5,o.z);for(const y of [-.32,.32])this.mesh(new T.TorusGeometry(o.r,.045,8,24),metal,0,y,0,m).rotation.x=Math.PI/2;this.moving.push({type:'obstacle',mesh:m,f});
 if(f.type==='windmill'){const tower=this.mesh(new T.ConeGeometry(2,5,24),this.materials.get('rock','#e8d4aa'),a[0]-c.width,a[1]+2.5,a[2]);const rotor=new T.Group();rotor.position.set(a[0]-c.width,a[1]+4,a[2]+1);this.scene.add(rotor);for(let k=0;k<4;k++){const arm=this.mesh(new T.BoxGeometry(.4,3,.12),this.mat('#faf0d4'),0,1.4,0,rotor);arm.rotation.z=k*Math.PI/2;arm.position.set(Math.sin(-k*Math.PI/2)*1.4,Math.cos(k*Math.PI/2)*1.4,0);}this.moving.push({type:'rotor',mesh:rotor});}}
 if(['tunnel','underwaterTunnel','ship','logShortcut'].includes(f.type)){
 const clear=c.width*.57,glass=f.type==='underwaterTunnel',ship=f.type==='ship',log=f.type==='logShortcut';
 const structure=new T.Group();structure.position.set(...a);const next=c.path[Math.min(f.node+1,c.path.length-1)];structure.rotation.y=Math.atan2(-(next[0]-a[0]),-(next[2]-a[2]));this.scene.add(structure);
 const lining=glass?new T.MeshPhysicalMaterial({color:'#b0edf0',transparent:true,opacity:.16,roughness:.12,metalness:.15,side:T.DoubleSide,depthWrite:false}):this.materials.get(ship||log?'wood':'rock',ship?'#b48c62':log?'#9b7951':'#c6c0aa',{side:T.DoubleSide});
 // An open half-cylinder forms a continuous vault; the lower half stays clear of the green.
 const vault=new T.CylinderGeometry(clear,clear,3.4,32,1,true,0,Math.PI);vault.rotateZ(Math.PI/2);vault.rotateY(Math.PI/2);this.mesh(vault,lining,0,0,-1.2,structure);
 const frame=glass?metal:this.materials.get(ship||log?'wood':'rock',glass?'#b5dce0':'#d6c4a7');
 for(let j=0;j<5;j++)this.mesh(new T.TorusGeometry(clear,.13,8,32,Math.PI),frame,0,0,.5-j*.85,structure);
 for(const side of [-1,1]){this.beam([side*clear,.1,.6],[side*clear,.1,-3],.1,metal,structure);
 const light=this.mesh(new T.SphereGeometry(.11,8,6),this.mat('#ffe6b0',{emissive:'#ffd49a',emissiveIntensity:1.8}),side*clear*.76,clear*.62,-1.2,structure);}
 if(ship){for(const side of [-1,1]){this.mesh(new T.BoxGeometry(.22,1.2,9),lining,side*(clear+.35),.5,-2,structure);for(let j=0;j<7;j++)this.beam([side*(clear+.35),1,-5+j],[side*(clear+.35),1.7,-5+j],.045,metal,structure);this.beam([side*(clear+.35),1.7,-5],[side*(clear+.35),1.7,1],.07,lining,structure);}
 const mast=this.beam([clear+1,0,-2],[clear+1,8,-2],.14,lining,structure);const sail=this.mesh(new T.PlaneGeometry(3.8,3.2,12,8),this.mat('#f2e4c8',{side:T.DoubleSide}),clear+2.8,5.8,-2,structure);const vertices=sail.geometry.attributes.position;for(let k=0;k<vertices.count;k++)vertices.setZ(k,Math.cos(vertices.getX(k)*.65)*.4);sail.geometry.computeVertexNormals();}
 }
 if(f.type==='loop'){const points=[];for(let j=0;j<=100;j++){const u=j/100;points.push(new T.Vector3(a[0]+(b[0]-a[0])*u,a[1]+(1-Math.cos(u*Math.PI*2))*3.1,a[2]+(b[2]-a[2])*u-Math.sin(u*Math.PI*2)*3.1));}const curve=new T.CatmullRomCurve3(points);this.mesh(new T.TubeGeometry(curve,120,.32,12,false),this.mat(c.world===3?'#e589b1':'#db9772'));for(const side of [-.42,.42]){const pts=points.map(p=>p.clone().add(new T.Vector3(side,0,0)));this.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),120,.08,8,false),this.mat('#f8e9ca'));}}
 if(f.type==='cannon'){const tube=this.mesh(new T.CylinderGeometry(.65,.45,2.6,24,1,true),metal,a[0],a[1]+.8,a[2]);tube.rotation.x=-Math.PI/2-.4;for(const side of [-1,1]){const wheel=this.mesh(new T.TorusGeometry(.55,.17,10,24),this.mat('#7c6248'),a[0]+side*.75,a[1]+.5,a[2]+.3);wheel.rotation.y=Math.PI/2;}}
 if(f.type==='portal'||f.type==='returnPortal'){for(const [p,offset]of [[a,f.offset||0],[b,0]]){const ring=this.mesh(new T.TorusGeometry(1,.16,12,48),this.mat(f.type==='returnPortal'?'#ff91cb':'#8df6ec',{emissive:f.type==='returnPortal'?'#d84399':'#31cabc',emissiveIntensity:2}),p[0]+offset,p[1]+1,p[2]);this.moving.push({type:'portal',mesh:ring});}}
 if(f.type==='jump'){const arrow=this.mesh(new T.ConeGeometry(.5,1.4,3),this.mat('#ffe28c'),a[0],a[1]+.1,a[2]+1);arrow.rotation.x=-Math.PI/2;arrow.scale.z=.1;}
 }
 this.ball=this.mesh(new T.SphereGeometry(R,40,28),this.mat(color,{roughness:.33,metalness:0,normalMap:ballNormal(T),normalScale:new T.Vector2(.28,.28)}));this.shadow=this.mesh(new T.CircleGeometry(.27,24),new T.MeshBasicMaterial({color:0x17362b,transparent:true,opacity:.22,depthWrite:false}));this.shadow.rotation.x=-Math.PI/2;this.aim=new T.ArrowHelper(new T.Vector3(0,0,-1),new T.Vector3(),2.5,0xffefb3,.4,.28);this.scene.add(this.aim);const metal=this.mat('#43546b',{metalness:.65,roughness:.3});this.club=new T.Group();this.beam([0,.1,.5],[0,1.8,1],.025,metal,this.club);this.mesh(new T.BoxGeometry(.65,.15,.22),metal,0,.12,.5,this.club);this.scene.add(this.club);this.scenery=buildScenery(T,this.scene,c,this.materials,this.q);this.garden=buildGardenDetails(T,this.scene,c,this.materials,this.q,theme);this.occluders=[];this.hiddenForView=[];
 this.scene.traverse(o=>{if(o.isMesh&&!o.userData.noOcclusion&&!o.userData.courseSurface&&o!==this.ball&&o!==this.shadow&&!this.club.getObjectById(o.id)&&!this.aim.getObjectById(o.id))this.occluders.push(o);});
 this.camera.position.set(c.path[0][0]+9,c.path[0][1]+12,c.path[0][2]+14);this.look.set(...c.path[0]);
 }
 point(x,y,height){this.ray.setFromCamera(new T.Vector2(x/innerWidth*2-1,1-y/innerHeight*2),this.camera);return this.ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-height),new T.Vector3());}
 burst(p){for(let i=0;i<70;i++){const m=this.mesh(new T.PlaneGeometry(.12,.22),this.mat(['#ffc66d','#eb8bae','#8ce7d4'][i%3],{side:T.DoubleSide}),p.x,p.y+1,p.z);this.particles.push({m,v:new T.Vector3((Math.random()-.5)*6,3+Math.random()*6,(Math.random()-.5)*6),life:2.5});}}
 update(dt,p,{aim=[0,-1],ready=false,intro=0,overview=false,home=false,swing=0}={}){const time=p.time;if(this.railFrames.length>1)this.rail.geometry=this.railFrames[Math.round((Math.sin(time*.65)+1)*8)];
 // Follow the active green with the shadow camera instead of wasting resolution on the entire world.
 // Snap the shadow camera to texels; keep directional illumination constant.
 const texel=52/(this.q==='high'?2048:1024),sx=Math.round(p.x/texel)*texel,sz=Math.round(p.z/texel)*texel;
 this.sun.position.set(sx-20,35,sz+10);this.sun.target.position.set(sx,0,sz-5);
 // Sustained slow frames lower only resolution, retaining PBR and scene detail.
 this.frameAverage=(this.frameAverage||.016)*.98+dt*.02;this.qualityTimer=(this.qualityTimer||0)+dt;
 if(this.requestedQuality==='auto'&&!this.renderer.isSoftware&&this.qualityTimer>6){this.qualityTimer=0;if(this.frameAverage>.029&&this.adaptiveRatio>.7){this.adaptiveRatio=Math.max(.7,this.adaptiveRatio-.15);this.renderer.setPixelRatio(this.adaptiveRatio);}}
this.scenery?.update(time);this.garden?.update(time,this.camera);this.ball.position.set(p.x,p.y,p.z);this.ball.rotateZ(-p.vx*dt/R);this.ball.rotateX(p.vz*dt/R);this.shadow.position.set(p.x,nearestY(this.c,p.x,p.z)+.015,p.z);this.shadow.visible=!p.travel;this.aim.visible=ready;this.aim.position.set(p.x,p.y+.03,p.z);this.aim.setDirection(new T.Vector3(aim[0],0,aim[1]).normalize());this.club.visible=ready||swing>0;this.club.position.set(p.x,p.y-R,p.z);this.club.rotation.y=Math.atan2(-aim[0],-aim[1]);this.club.rotation.x=swing?Math.sin(swing*Math.PI)*.5:0;
 for(const o of this.moving){if(o.type==='obstacle'){const q=obstacle(this.c,o.f,time);o.mesh.position.x=q.x;o.mesh.position.z=q.z;}if(o.type==='bridge')o.mesh.position.x=o.origin.x+Math.sin(time*.65)*.9;if(o.type==='rotor')o.mesh.rotation.z=time;if(o.type==='portal')o.mesh.rotation.z=time*.4;}
 this.flag.rotation.y=Math.sin(time*2)*.12;for(let i=this.particles.length-1;i>=0;i--){const q=this.particles[i];q.life-=dt;q.v.y-=dt*7;q.m.position.addScaledVector(q.v,dt);q.m.rotation.x+=dt*4;if(q.life<0){this.scene.remove(q.m);q.m.geometry.dispose();q.m.material.dispose();this.particles.splice(i,1);}}
 let target=new T.Vector3(p.x,p.y,p.z),pos;if(home||overview){const bounds=new T.Box3().setFromPoints(this.c.path.map(q=>new T.Vector3(...q)));bounds.getCenter(target);const size=bounds.getSize(new T.Vector3()),extent=Math.max(size.z,size.x/this.camera.aspect)+this.c.width*2;const distance=extent/(2*Math.tan(this.camera.fov*Math.PI/360))*.88;pos=target.clone().add(new T.Vector3(distance*.35,distance*.9,distance*.7));}else if(intro>0){const u=1-intro/2.8,index=Math.min(this.c.path.length-2,Math.floor(u*(this.c.path.length-1))),f=u*(this.c.path.length-1)-index;target.set(...this.c.path[index]).lerp(new T.Vector3(...this.c.path[index+1]),f);pos=target.clone().add(new T.Vector3(6,10,12));}else{const flight=!!p.travel;pos=target.clone().add(new T.Vector3(0,flight?15:11,flight?20:15));target.z-=3;}
 const alpha=1-Math.exp(-dt*4);this.camera.position.lerp(pos,alpha);this.look.lerp(target,alpha);this.camera.lookAt(this.look);
 for(const o of this.hiddenForView)o.visible=true;this.hiddenForView=[];
 if(!home&&!overview&&intro===0){
 this.scene.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);
 const hidden=new Set(),origin=this.camera.position,side=new T.Vector3(-aim[1],0,aim[0]);
 const targets=[];
 for(const distance of [0,1,2.5,4,6,9])for(const lateral of [-1.3,-.65,0,.65,1.3])targets.push(new T.Vector3(p.x+aim[0]*distance,p.y+.12,p.z+aim[1]*distance).addScaledVector(side,lateral));
 // Bounding boxes also catch back-facing surfaces and cameras inside scenery.
 const box=new T.Box3(),hit=new T.Vector3(),ray=new T.Ray();
 for(const o of this.occluders){
 if(o.isInstancedMesh){if(!o.boundingBox)o.computeBoundingBox();}else if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
 box.copy(o.isInstancedMesh?o.boundingBox:o.geometry.boundingBox).applyMatrix4(o.matrixWorld).expandByScalar(.18);
 if(box.containsPoint(origin)){hidden.add(o);continue;}
 for(const goal of targets){const direction=goal.clone().sub(origin),limit=direction.length()-.35;ray.set(origin,direction.normalize());if(ray.intersectBox(box,hit)&&hit.distanceTo(origin)<limit){hidden.add(o);break;}}
 }
 this.ray.far=Infinity;for(const o of hidden){o.visible=false;this.hiddenForView.push(o);}
 }
 this.renderer.render(this.scene,this.camera);
 }
}
function nearestY(c,x,z){let best=Infinity,y=0;for(const {a,b}of surfaces(c)){const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz))),d=Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t);if(d<best){best=d;y=a[1]+(b[1]-a[1])*t;}}return y;}

function ballNormal(T){const size=256,canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d'),im=ctx.createImageData(size,size);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=(x/16+(Math.floor(y/16)%2)*.5)%1-.5,v=y%16/16-.5,r=Math.hypot(u,v),f=r<.36?Math.sin(r/.36*Math.PI)*.6:0,i=(y*size+x)*4;im.data[i]=128+(r?u/r*f:0)*127;im.data[i+1]=128+(r?v/r*f:0)*127;im.data[i+2]=245;im.data[i+3]=255;}ctx.putImageData(im,0,0);const tex=new T.CanvasTexture(canvas);return tex;}
