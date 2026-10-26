import{mat,mesh,box,ellipsoid,tube}from'./geometry.js';
const T=window.THREE;
export function createEngine(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:false});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color(0xe8d8ca);scene.fog=new T.Fog(0xe8d8ca,12,30);const camera=new T.PerspectiveCamera(35,1,.05,60);camera.position.set(5,3.5,9);
 // Original procedural studio environment baked into a PMREM for PBR reflections.
 const envScene=new T.Scene();envScene.background=new T.Color(0xa89b8c);for(const [p,s,c]of[[[0,7,0],[12,1,12],0xffe9d5],[[-5,3,2],[1,5,4],0xffefdf],[[5,2,2],[1,5,3],0xcce8e3],[[0,3,-5],[4,4,1],0xffd7c1]])box(envScene,new T.MeshBasicMaterial({color:c}),p,s);
 const pmrem=new T.PMREMGenerator(renderer),env=pmrem.fromScene(envScene,.1);scene.environment=env.texture;pmrem.dispose();envScene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
 scene.add(new T.HemisphereLight(0xfff4e8,0x8c8278,1.4));const key=new T.DirectionalLight(0xffe7d7,3);key.position.set(-3,7,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=6;key.shadow.camera.bottom=-3;key.shadow.normalBias=.03;key.shadow.bias=-.0002;scene.add(key);
 const fill=new T.DirectionalLight(0xd6ece9,1.3);fill.position.set(4,3,4);scene.add(fill);const rim=new T.DirectionalLight(0xffddbf,2);rim.position.set(0,5,-3);scene.add(rim);
 const settings=[{name:'MOBILE',scale:1,shadow:512},{name:'BALANCED',scale:1.35,shadow:512},{name:'HIGH',scale:1.7,shadow:1024},{name:'ULTRA',scale:2,shadow:2048}];let viewStation="intro",viewZoom=1,automatic=true,quality=innerWidth<700?1:2,lastChange=0,slow=0,fast=0,average=16.7;
 function resize(){const rect=canvas.getBoundingClientRect();camera.aspect=rect.width/Math.max(1,rect.height);camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,settings[quality].scale));renderer.setSize(rect.width,rect.height,false);if(targetPos)go(viewStation,viewZoom);}
 function setQuality(q){quality=q;key.shadow.mapSize.set(settings[q].shadow,settings[q].shadow);key.shadow.map?.dispose();key.shadow.map=null;resize();}

 const targetPos=new T.Vector3(0,2.65,4.3),targetLook=new T.Vector3(0,2.65,0),look=new T.Vector3(0,2.3,0);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function go(station,zoom=1){viewStation=station;viewZoom=zoom;const rect=canvas.getBoundingClientRect(),mobile=rect.width<700,short=rect.height<550;const top=mobile?235:95,bottom=station==='result'&&mobile?370:short?175:225;const usable=Math.max(180,rect.height-top-bottom),span=station==='nails'?1.95:2.55;const visibleHeight=span*rect.height/usable/zoom;const distance=visibleHeight/(2*Math.tan(camera.fov*Math.PI/360));const centerY=(top+rect.height-bottom)/2;const offset=(centerY/rect.height-.5)*visibleHeight;
 if(station==='intro'){targetPos.set(3.9,3.1,7.8);targetLook.set(.4,2,0);return;}
 const x=station==='nails'?3:0,y=(station==='nails'?1.48:2.8)+offset,z=station==='nails'?1:.6;
 targetPos.set(x+(station==='result'?.4:0),y,z+distance);targetLook.set(x,y,z);
 }
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 function update(dt,t,elapsed=dt){const ease=reduced?1:1-Math.exp(-dt*5);camera.position.lerp(targetPos,ease);look.lerp(targetLook,ease);camera.lookAt(look);average=average*.97+elapsed*1000*.03;if(automatic&&t-lastChange>12){slow=average>28?slow+dt:Math.max(0,slow-dt);fast=average<18?fast+dt:0;if(slow>4&&quality>0){setQuality(quality-1);lastChange=t;slow=0;}else if(fast>25&&quality<2){setQuality(quality+1);lastChange=t;fast=0;}}}
 return{renderer,scene,camera,go,update,resize,setQuality(name){automatic=name==='auto';if(!automatic){const i=settings.findIndex(s=>s.name===name);if(i>=0)setQuality(i);}},targetPos,targetLook,get quality(){return settings[quality].name;},get frameTime(){return average;},dispose(){observer.disconnect();env.dispose();renderer.dispose();}};
}
export function createSalon(scene){
 const plaster=mat(0xe7d8c9,.86),sage=mat(0x526b60,.8),gold=mat(0xb99361,.25,.82),stone=mat(0xe8d4bb,.38),wood=mat(0x79513b,.6),pink=mat(0xbc8a88,.68),light=new T.MeshBasicMaterial({color:0xffe7c1});
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');c.fillStyle='#e8d7c2';c.fillRect(0,0,512,512);let seed=4;for(let i=0;i<600;i++){seed=(seed*16807)%2147483647;const x=seed%512;seed=(seed*16807)%2147483647;const y=seed%512;c.strokeStyle='rgba(132,102,77,.07)';c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+40,y+4,x-5,y+22,x+90,y+35);c.stroke();}stone.map=new T.CanvasTexture(canvas);stone.map.colorSpace=T.SRGBColorSpace;stone.map.wrapS=stone.map.wrapT=T.RepeatWrapping;
 box(scene,plaster,[0,2,-2],[14,6,.2]);box(scene,stone,[0,-.03,0],[14,.12,12]);box(scene,sage,[-5.2,2,0],[.2,6,10]);
 for(let i=0;i<33;i++)box(scene,wood,[-4.8+i*.3,1,-1.85],[.035,2.1,.06]);
 for(const x of[-2.9,0,3.2]){const pts=[[-1,-1,0],[-1,.75,0],[-.7,1.35,0],[0,1.6,0],[.7,1.35,0],[1,.75,0],[1,-1,0]];tube(scene,pts.map(p=>[p[0]+x,p[1]+2.4,-1.65]),.035,gold,64,10);tube(scene,pts.map(p=>[p[0]*.96+x,p[1]*.97+2.4,-1.6]),.018,light,64,8);const mirror=mat(0xabb9b2,.09,.95);box(scene,mirror,[x,2.4,-1.78],[1.9,2.5,.03]);box(scene,stone,[x,1.1,-.7],[2.5,.14,1.35]);for(const dx of[-1,1])box(scene,gold,[x+dx,0.53,-.6],[.045,1.05,.045]);}
 for(let i=0;i<13;i++){const x=-4+i*.63;const m=mat([0x9f697c,0x6e9791,0xd2b87d,0xb3a1c2][i%4],.2);const bottle=mesh(new T.CylinderGeometry(.065,.075,.22,20),m,scene,[x,1.3,-1.05]);mesh(new T.CylinderGeometry(.04,.04,.1,16),gold,scene,[x,1.46,-1.05]);}
 ellipsoid(scene,sage,[0,.7,-.3],[.85,.55,.7]);box(scene,gold,[0,.3,-.3],[.12,.5,.12]);mesh(new T.CylinderGeometry(.5,.5,.04,48),gold,scene,[0,.06,-.3]);
 box(scene,stone,[3,.54,.9],[2.4,.14,1.5]);ellipsoid(scene,pink,[3,1,1],[.7,.13,.4]);
 // Freestanding manicure curing arch.
 const lamp=new T.Group();lamp.position.set(4.3,1,1);scene.add(lamp);box(lamp,mat(0xf0e8e0,.21),[0,.5,0],[1.75,.13,2.15]);for(const s of[-1,1])box(lamp,plaster,[s*.84,.2,0],[.08,.6,2.15]);const led=box(lamp,new T.MeshBasicMaterial({color:0x9584ff}),[0,.42,0],[1.5,.015,1.8]);led.visible=false;const uv=new T.PointLight(0x8d69ff,0,2);uv.position.set(4.3,1.15,1);scene.add(uv);
 const plant=new T.Group();plant.position.set(-3.7,0,.3);scene.add(plant);mesh(new T.CylinderGeometry(.36,.23,.65,40),mat(0xc89475,.72),plant,[0,.33,0]);for(let i=0;i<18;i++){const a=i*2.4,h=.7+(i%6)*.24;const ex=Math.sin(a)*.5,ez=Math.cos(a)*.5;tube(plant,[[0,.5,0],[ex*.4,h,ez*.4],[ex,h+.3,ez]],.014,sage,12,5);const leaf=ellipsoid(plant,mat(i%2?0x52745c:0x6a8765,.57),[ex,h+.3,ez],[.15,.35,.025]);leaf.rotation.set(.3,a,.4*Math.sin(a));}
 const ceiling=mesh(new T.TorusGeometry(.8,.028,12,64),gold,scene,[.5,4.8,0]);ceiling.rotation.x=Math.PI/2;
 return{lamp,led,uv,sage};
}
export function createBrush(scene){
 const root=new T.Group();scene.add(root);const gold=mat(0xc89e73,.22,.8),dark=mat(0x664251,.3),fiber=mat(0xc69b7f,.8);const groups={};
 const make=name=>{const g=new T.Group();root.add(g);groups[name]=g;return g;};
 const basic=make('brush');const handle=mesh(new T.CylinderGeometry(.025,.032,.42,20),dark,basic,[0,0,.31]);handle.rotation.x=Math.PI/2;const ferrule=mesh(new T.CylinderGeometry(.035,.035,.13,20),gold,basic,[0,0,.08]);ferrule.rotation.x=Math.PI/2;
 const bristles=ellipsoid(basic,fiber,[0,0,-.015],[.044,.044,.08]);for(let i=0;i<12;i++){const a=i*Math.PI/6;const strand=tube(basic,[[Math.cos(a)*.02,Math.sin(a)*.02,.035],[Math.cos(a)*.032,Math.sin(a)*.032,-.04]],.0014,fiber,4,3);}
 const lip=make('lip');const caseMesh=mesh(new T.CylinderGeometry(.045,.045,.22,24),gold,lip,[0,0,.2]);caseMesh.rotation.x=Math.PI/2;const lipstick=mesh(new T.CylinderGeometry(.033,.033,.16,24),mat(0xdc688f,.24),lip,[0,0,.025]);lipstick.rotation.x=Math.PI/2;
 const file=make('file');box(file,mat(0xc6bdc3,.9),[0,0,.12],[.075,.025,.37]);for(let i=0;i<12;i++)box(file,mat(0x958c93,.8),[0,.014,.02+i*.02],[.055,.002,.003]);
 const mascara=make('mascara');const wand=mesh(new T.CylinderGeometry(.012,.012,.4,12),dark,mascara,[0,0,.23]);wand.rotation.x=Math.PI/2;for(let i=0;i<9;i++){const ring=mesh(new T.TorusGeometry(.028,.005,5,12),dark,mascara,[0,0,-.04+i*.012]);}
 const sponge=make('sponge');ellipsoid(sponge,mat(0xe2b9a0,.9),[0,0,.06],[.075,.095,.09]);
 root.visible=false;return{root,bristles,setTool(tool,color){const id=tool==='lip'?'lip':tool==='file'?'file':tool==='mascara'?'mascara':tool==='foundation'?'sponge':'brush';for(const[n,g]of Object.entries(groups))g.visible=n===id;lipstick.material.color.set(color);fiber.color.set(tool==='polish'||tool==='gradient'?color:0xc69b7f);}};
}
