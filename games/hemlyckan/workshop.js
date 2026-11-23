/* The playable scene contains real, aligned geometry, never composited room photos. */
const T=window.THREE;
const PALETTES=[{wall:0xe6bc69,wood:0xc99b61,roof:0xad5943,cloth:0x789bb0},{wall:0x91ad88,wood:0xba8e57,roof:0xb95d46,cloth:0x81aaa0},{wall:0x7897a9,wood:0x8c6547,roof:0x526576,cloth:0xbb9b77}];
export function taskKind(room,task){
 const n=task.name.toLowerCase();
 if(task.tool==='connect')return /vatten|avlopp|rör/.test(n)?'pipes':'wires';
 if(task.tool==='clear')return 'clear';
 if(/takpann|nytt tak|tak och isolering/.test(n)||room.id==='doghouse'&&/tak/.test(n))return 'roof';
 if(/trappan/.test(n))return 'stairs';
 if(/golv|altanbräd|altan och|gång och|grund och/.test(n))return 'floor';
 if(/panel|fasad|fönster och dörr/.test(n))return 'facade';
 if(/montera|möblera|plantera|installera värme/.test(n))return 'furniture';
 return 'wall';
}
export class Workshop{
 constructor({canvas,room,tier,step,work,onWork,onReady}){
  this.canvas=canvas;this.room=room;this.task=room.tasks[step];this.step=step;this.palette=PALETTES[tier-1];this.tier=tier;this.work=work;this.onWork=onWork;this.kind=taskKind(room,this.task);this.targets=[];this.hitMeshes=[];this.parts=[];this.decor=[];this.pointer=null;this.active=null;this.selected=null;this.hover=-1;this.disposed=false;this.elapsed=0;this.hintUntil=3;this.reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.scene=new T.Scene();this.scene.background=new T.Color('#e9eee9');
  const gl=canvas.getContext('webgl2',{antialias:true})||canvas.getContext('webgl',{antialias:true});
  this.renderer=gl?new T.WebGLRenderer({canvas,context:gl,antialias:true,alpha:false,powerPreference:'low-power'}):new CanvasRenderer(canvas);
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;
  this.camera=new T.OrthographicCamera(-6,6,4,-4,.1,70);this.camera.position.set(8,7.5,11);this.camera.lookAt(0,1.35,0);
  this.raycaster=new T.Raycaster();this.scene.add(new T.HemisphereLight(0xfff7df,0x879f9a,2.4));
  const sun=new T.DirectionalLight(0xfff1d4,3.3);sun.position.set(-4,10,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.1,far:30});sun.shadow.normalBias=.035;sun.shadow.bias=-.0002;sun.shadow.radius=4;this.scene.add(sun);
  const fill=new T.DirectionalLight(0xccddff,1.1);fill.position.set(5,4,-5);this.scene.add(fill);
  this.root=new T.Group();this.scene.add(this.root);
  this.matGround=this.mat(0xe9eee9);this.box(50,.15,50,0,-.47,0,this.matGround,this.scene,0);
  this.build();this.refreshTargets();this.drawDirty=true;this.buildPointer();this.sync(work);this.fit();
  this.observer=new ResizeObserver(()=>this.fit());this.observer.observe(canvas.parentElement);
  this.handlers={pointerdown:e=>this.down(e),pointermove:e=>this.move(e),pointerup:e=>this.up(e),pointercancel:()=>this.cancel(),lostpointercapture:()=>this.cancel(),pointerleave:()=>{if(this.active===null){this.pointer=null;this.hover=-1;}}};
  Object.entries(this.handlers).forEach(([event,fn])=>canvas.addEventListener(event,fn));
  this.blur=()=>this.cancel();window.addEventListener('blur',this.blur);
  this.key=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();const i=this.work.findIndex(v=>v<1);const target=i<0?this.targets.findIndex((_,j)=>(this.work[j]||0)<1):i;if(target>=0)this.onWork(target,1);}};
  canvas.addEventListener('keydown',this.key);canvas.tabIndex=0;
  this.last=performance.now();this.tick=this.tick.bind(this);this.frame=requestAnimationFrame(this.tick);onReady?.();
 }
 mat(color,extra={}){return new T.MeshStandardMaterial({color,roughness:.8,metalness:0,...extra});}
 box(w,h,d,x,y,z,material,parent=this.root,r=.04){
  let geo;if(Math.max(w,h,d)>3&&Math.max(w,h,d)<20){geo=new T.BoxGeometry(w,h,d,Math.max(1,Math.ceil(w/.7)),Math.max(1,Math.ceil(h/.7)),Math.max(1,Math.ceil(d/.7)));}else if(r>0){const rr=Math.min(r,w/4,h/4,d/4),shape=new T.Shape(),a=-w/2+rr,b=-h/2+rr,W=w-2*rr,H=h-2*rr;
   shape.moveTo(a,b);shape.lineTo(a+W,b);shape.lineTo(a+W,b+H);shape.lineTo(a,b+H);shape.closePath();geo=new T.ExtrudeGeometry(shape,{depth:d-2*rr,bevelEnabled:true,bevelThickness:rr,bevelSize:rr,bevelSegments:2,steps:1,curveSegments:1});geo.translate(0,0,-d/2+rr);
  }else geo=new T.BoxGeometry(w,h,d);
  const mesh=new T.Mesh(geo,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 ball(r,x,y,z,color,parent=this.root){const m=new T.Mesh(new T.SphereGeometry(r,16,12),this.mat(color));m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
 cylinder(r1,r2,h,x,y,z,color,parent=this.root){const m=new T.Mesh(new T.CylinderGeometry(r1,r2,h,24),this.mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 group(x=0,y=0,z=0,parent=this.root){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
 line(points,color,width=.025,parent=this.root){const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(path,24,width,7,false),this.mat(color));parent.add(m);return m;}
 tag(text,x,y,z,size=.6,parent=this.root){const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#faf8ee';ctx.beginPath();ctx.roundRect(3,3,250,122,28);ctx.fill();ctx.fillStyle='#244d40';ctx.font='700 70px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,64);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map,depthTest:false}));sprite.scale.set(size*2,size,1);sprite.position.set(x,y,z);parent.add(sprite);return sprite;}
 target(group,index,{old=[],fresh=[],mode='replace',hit=[]}={}){
  const entry={group,index,old,fresh,mode,display:0,baseY:group.position.y,baseColor:old[0]?.material?.color?.clone()};this.targets[index]=entry;
  const meshes=hit.length?hit:[];if(!hit.length)group.traverse(m=>{if(m.isMesh)meshes.push(m);});
  meshes.forEach(m=>{m.userData.target=index;this.hitMeshes.push(m);});
  const bounds=new T.Box3().setFromObject(group),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  // Forgiving invisible hit volume covers the whole object, including the gaps.
  const proxy=new T.Mesh(new T.BoxGeometry(Math.max(size.x,.65),Math.max(size.y,.55),Math.max(size.z,.55)),new T.MeshBasicMaterial({visible:false}));proxy.position.copy(center);this.root.worldToLocal(proxy.position);this.root.add(proxy);proxy.userData.target=index;this.hitMeshes.push(proxy);entry.proxy=proxy;
  const edges=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(size.x+.025,size.y+.025,size.z+.025)),new T.LineBasicMaterial({color:0x628d58,transparent:true,opacity:0}));edges.position.copy(center);group.worldToLocal(edges.position);group.add(edges);entry.outline=edges;
  return entry;
 }
 base(){this.box(8.2,.36,5.7,0,-.12,0,this.mat(0xc9b89b),this.root,.12);this.box(8.05,.09,5.55,0,.1,0,this.mat(0xf3e4c7),this.root,.04);}
 roomShell(){this.base();this.box(8,.12,5.5,0,.16,0,this.mat(this.palette.wood));for(let i=1;i<14;i++)this.box(.012,.006,5.3,-4+i*8/14,.224,0,this.mat(0xa78254),this.root,0);this.box(8,3.7,.16,0,2,-2.7,this.mat(0xe9dfc9));this.box(.16,3.7,5.4,-4,2,0,this.mat(0xd5d8c6));this.box(7.9,.15,.12,0,.3,-2.56,this.mat(0xfaf4e4));this.box(.12,.15,5.3,-3.86,.3,0,this.mat(0xfaf4e4));this.window(-3.83,2,-.8,true);this.plant(3.25,.22,-2.0,.7);}
 outdoorShell(){this.base();this.box(8,.1,5.4,0,.18,0,this.mat(0xa2b389));for(let i=0;i<11;i++)this.box(.4,1.4,.14,-3.7+i*.74,1,-2.5,this.mat(0xc3a376));this.box(8,.16,.12,0,.75,-2.42,this.mat(0xb6966b));this.box(8,.16,.12,0,1.4,-2.42,this.mat(0xb6966b));this.plant(-3.5,.2,-1.8,1.2);this.plant(3.5,.2,-1.8,1.2);}
 window(x,y,z,side=false){const g=this.group(x,y,z);if(side)g.rotation.y=Math.PI/2;this.box(1.6,1.7,.12,0,0,0,this.mat(0xf8f0da),g);this.box(1.35,1.45,.08,0,0,.08,this.mat(0x9ec1c5,{roughness:.2}),g);this.box(.08,1.5,.12,0,0,.15,this.mat(0xfff7e3),g);this.box(1.4,.08,.12,0,0,.15,this.mat(0xfff7e3),g);this.box(1.9,.12,.35,0,-.9,.08,this.mat(0xfff6dd),g);}
 plant(x,y,z,s=1,parent=this.root){const g=this.group(x,y,z,parent);g.scale.setScalar(s);this.cylinder(.27,.2,.5,0,.25,0,0xc48760,g);this.cylinder(.25,.25,.06,0,.51,0,0x654d36,g);for(let i=0;i<5;i++){const leaf=this.ball(.28,Math.cos(i*2.4)*.22,.8+(i%2)*.25,Math.sin(i*2.4)*.22, i%2?0x7c9e68:0x547d58,g);leaf.scale.set(.65,1.5,.7);}return g;}
 build(){
  if(['wires','pipes'].includes(this.kind)){this.buildConnections();return;}
  if(this.kind==='clear'){this.buildClear();return;}
  if(this.kind==='furniture'){this.buildFurniture();return;}
  if(this.kind==='roof'){this.buildRoof();return;}
  if(this.kind==='facade'){this.buildFacade();return;}
  if(this.kind==='floor'){this.buildFloor();return;}
  if(this.kind==='stairs'){this.buildStairs();return;}
  this.buildWall();
 }
 surface(parent,index,w,h,d,x,y,z,{roof=false,floor=false,facade=false}={}){
  const g=this.group(x,y,z,parent),old=[],fresh=[],tool=this.task.tool;
  const under=this.box(w,h,d,0,0,0,this.mat(0xb7a68e),g);
  const oldColor=roof?0x8f7054:floor?0x92836c:0xb5aa91;
  const materialName=(this.task.materials?.[this.tier-1]||'').toLowerCase(),tiled=/kakla|kakel|klinker/.test(this.task.name.toLowerCase());
  const finish=roof?this.palette.roof:floor?this.palette.wood:/vitt|vit vägg|vita/.test(materialName)?0xeeeadd:/natursten|stenplatt|stenlook/.test(materialName)?0xc6bda6:/blå/.test(materialName)?0x8daebb:this.palette.wall;
  const oldMat=this.mat(oldColor),newMat=this.mat(finish);
  const skin=this.box(w*.98,h*.98,d*.96,0,0,d*.6,oldMat,g);old.push(skin);
  const newSkin=this.box(w*.98,h*.98,d*.96,0,0,d*.6,newMat,g);fresh.push(newSkin);
  if(roof||floor||facade){const count=roof?4:facade?4:3;for(let j=0;j<count;j++){
   const xx=(j-(count-1)/2)*w/count;
   if(roof){for(let k=0;k<3;k++){
    const tile=this.box(w/count-.025,h/3-.02,.075,xx,(k-1)*h/3,d*1.15,this.mat(finish+(j%2?0x080500:0)),g,.035);fresh.push(tile);
    const worn=this.box(w/count-.025,h/3-.02,.065,xx,(k-1)*h/3,d*1.12,oldMat,g,.025);old.push(worn);
   }}else{
    const seam=this.box(.018,h*.98,.015,xx+w/count/2,0,d*1.12,this.mat(0x7e694f),g,0);fresh.push(seam);
   }
  }}
  if(tiled){const cols=this.tier===3?2:4,rows=this.tier===3?2:3;for(let j=1;j<cols;j++)fresh.push(this.box(.018,h*.98,.018,-w/2+j*w/cols,0,d*1.12,this.mat(0xece8d8),g,0));for(let j=1;j<rows;j++)fresh.push(this.box(w*.98,.018,.018,0,-h/2+j*h/rows,d*1.12,this.mat(0xece8d8),g,0));}
  // Cracks and missing finish belong to the object and disappear as it is repaired.
  for(let j=0;j<2;j++){const xx=(j-.5)*w*.4;const crack=this.line([[xx-w*.12,h*.35,d*1.13],[xx+h*.02,h*.1,d*1.15],[xx-w*.08,-h*.12,d*1.15],[xx+w*.08,-h*.36,d*1.13]],0x685b49,.018,g);old.push(crack);}
  if(tool==='remove'){fresh.forEach(m=>m.visible=false);this.target(g,index,{old,fresh:[],mode:'remove'});}
  else if(tool==='install'){old.forEach(m=>m.visible=false);this.target(g,index,{old:[],fresh,mode:'install'});}
  else this.target(g,index,{old,fresh,mode:tool==='paint'?'paint':'repair'}).finishColor=new T.Color(finish);
  return g;
 }
 buildWall(){this.roomShell();for(let row=0;row<2;row++)for(let col=0;col<3;col++){const i=row*3+col;this.surface(this.root,i,2.36,1.58,.07,-2.42+col*2.42,1.15+row*1.64,-2.53);}
  this.camera.position.set(5.5,5.2,12);this.camera.lookAt(0,1.65,-.5);
 }
 buildFloor(){this.roomShell();for(let row=0;row<2;row++)for(let col=0;col<3;col++){const g=this.surface(this.root,row*3+col,2.42,2.35,.07,-2.5+col*2.5,.29,-1.2+row*2.45,{floor:true});g.rotation.x=-Math.PI/2;}
  this.camera.position.set(7,10.5,10);this.camera.lookAt(0,.55,0);
 }
 house(){this.base();if(this.room.id==='doghouse'){this.dogHouse();return;}this.box(6.4,3.5,3.7,0,1.98,-.1,this.mat(0xe7d7b1));this.window(-1.95,2.15,1.82);this.window(1.95,2.15,1.82);this.box(1.24,2.45,.14,0,1.52,1.85,this.mat(0x64887c));this.box(1.42,.1,.16,0,2.78,1.92,this.mat(0xfff1d3));this.ball(.07,.4,1.55,1.97,0xc49b57);this.box(2.2,.18,.75,0,.25,2.15,this.mat(0xb9b3a1));}
 dogHouse(){this.box(6.4,3.5,3.7,0,1.98,-.1,this.mat(this.palette.wall));for(let i=0;i<14;i++)this.box(.02,3.4,.03,-3.1+i*.47,1.98,1.77,this.mat(0xa19a75),this.root,0);const shape=new T.Shape();shape.moveTo(-1.05,0);shape.lineTo(1.05,0);shape.lineTo(1.05,1.55);shape.quadraticCurveTo(1.05,2.6,0,2.6);shape.quadraticCurveTo(-1.05,2.6,-1.05,1.55);shape.closePath();const opening=new T.Mesh(new T.ShapeGeometry(shape),this.mat(0x3b493d));opening.position.set(0,.23,1.81);this.root.add(opening);this.box(2,.13,1.1,0,.31,2.15,this.mat(0xd7b98a));this.cylinder(.4,.5,.22,2,.27,2.15,0xa0b4ac);}
 buildRoof(){this.house();for(const x of [-3.18,3.18]){const shape=new T.Shape();shape.moveTo(-1.85,0);shape.lineTo(1.85,0);shape.lineTo(0,1.25);shape.closePath();const m=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:false}),this.mat(0xe7d7b1));m.rotation.y=Math.PI/2;m.position.set(x,3.73,0);m.castShadow=true;this.root.add(m);}for(let row=0;row<2;row++)for(let col=0;col<3;col++){const front=row===1,g=this.surface(this.root,row*3+col,2.25,2.6,.1,-2.3+col*2.3,4.3,front?1.1:-1.1,{roof:true});g.rotation.x=-Math.PI/2+(front?.55:-.55);}this.box(7,.15,.22,0,4.99,0,this.mat(this.palette.roof));if(this.room.id!=='doghouse'){this.box(.65,1.35,.6,2,4.85,-.7,this.mat(0x9b6b51));this.box(.82,.16,.8,2,5.52,-.7,this.mat(0xe6c09a));}this.camera.position.set(8,14,12);this.camera.lookAt(0,2.2,0);}
 buildStairs(){this.base();this.box(.16,3.5,5.4,-3,1.8,0,this.mat(0xe5dec8));for(let i=0;i<6;i++){const y=.45+i*.4,z=1.95-i*.7;this.box(4,.4,.78,0,y-.25,z,this.mat(0xa48c6b));const step=this.surface(this.root,i,4,.76,.08,0,y,z,{floor:true});step.rotation.x=-Math.PI/2;}this.line([[2.25,1.1,2.1],[2.25,3.3,-1.8]],0xc0a074,.075);for(let i=0;i<4;i++)this.box(.07,1,.07,2.25,1+i*.6,2.05-i*1.05,this.mat(0xc0a074));this.camera.position.set(8,9,12);this.camera.lookAt(0,1.4,0);}
 buildFacade(){this.base();this.box(7.1,3.9,.4,0,2.2,0,this.mat(0xb0a087));for(let row=0;row<2;row++)for(let col=0;col<3;col++)this.surface(this.root,row*3+col,2.25,1.76,.07,-2.3+col*2.3,1.28+row*1.82,.3,{facade:true});this.box(7.7,.3,1.2,0,4.3,0,this.mat(this.palette.roof));this.box(7.3,.16,.24,0,.32,.4,this.mat(0xf5e9d1));this.plant(-3.45,.2,1.5,.7);this.plant(3.45,.2,1.5,.7);this.camera.position.set(5,5,12);this.camera.lookAt(0,1.9,0);}
 buildClear(){if(['exterior','garden','doghouse'].includes(this.room.id))this.outdoorShell();else this.roomShell();const positions=[[-2.4,-1.25],[0,-1.2],[2.35,-1.2],[-2.35,1.2],[0,1.2],[2.35,1.2]];
  positions.forEach(([x,z],i)=>{const g=this.group(x,.25,z);if(i%3===0){const carton=this.box(1.25,.8,.95,0,.43,0,this.mat(0xb78b56),g);carton.rotation.y=.15;this.box(.15,.83,.97,0,.45,0,this.mat(0xe1c08b),g);const flap=this.box(1.15,.05,.5,0,.91,-.55,this.mat(0xcba16a),g);flap.rotation.x=-.35;}
   if(i%3===1){for(let j=0;j<4;j++){const board=this.box(1.55,.12,.28,(j%2-.5)*.2,.12+j*.14,0,this.mat(j%2?0x9a7d52:0xb89b6a),g);board.rotation.y=(j-1)*.48;}this.ball(.2,.5,.3,.4,0x797e71,g);}
   if(i%3===2){for(let j=0;j<3;j++){const can=this.cylinder(.23,.21,.65,(j-1)*.39,.35,(j%2)*.3, j%2?0x9e8261:0x82989b,g);can.rotation.z=(j-1)*.15;this.cylinder(.24,.24,.04,(j-1)*.39,.69,(j%2)*.3,0xb9bcb0,g);}this.box(.8,.12,.6,-.3,.13,.7,this.mat(0xcdbb91),g);}
   this.target(g,i,{old:[...g.children],mode:'clear'});
  });this.camera.position.set(7,9,11);this.camera.lookAt(0,1,0);
 }
 buildFurniture(){if(['garden','doghouse'].includes(this.room.id))this.outdoorShell();else this.roomShell();const id=this.room.id,p=this.palette;
  const slots=[[-2.55,-1.4],[0,-1.4],[2.55,-1.4],[-2.55,1.25],[0,1.25],[2.55,1.25]];
  const kinds=id==='doghouse'?['dogbed','bowl','bowl','bone','ball','lamp']:id==='kitchen'?['cabinet','oven','cabinet','table','chair','plant']:id==='bath'?['sink','shower','cabinet','bath','plant','stool']:['bedroom','kids'].includes(id)?['bed','cabinet','lamp','rug','stool','plant']:id==='utility'?['washer','washer','cabinet','shelf','plant','stool']:id==='garden'?['plant','bench','plant','table','stool','plant']:id==='attic'?['shelf','desk','lamp','chair','rug','plant']:id==='hall'?['shelf','cabinet','lamp','bench','rug','plant']:['sofa','shelf','lamp','rug','table','plant'];
  slots.forEach(([x,z],i)=>{const g=this.group(x,.27,z);this.furnish(kinds[i],g,p);const fresh=[...g.children];const pad=this.box(1.75,.025,1.45,0,-.01,0,this.mat(0xb9c9a9),g);this.target(g,i,{fresh,old:[pad],mode:'install'});});
  this.camera.position.set(8,9,12);this.camera.lookAt(0,1,0);
 }
 furnish(kind,g,p){const wood=this.mat(p.wood),cream=this.mat(0xf5ecd7),green=this.mat(p.wall),dark=this.mat(0x485e59),cloth=this.mat(p.cloth);
  const b=(w,h,d,x,y,z,m=wood)=>this.box(w,h,d,x,y,z,m,g);
  const legs=(w=1.25,d=1,h=.7)=>{for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])b(.12,h,.12,x,h/2,z);};
  if(kind==='dogbed'){b(1.9,.4,1.5,0,.24,0,wood);b(1.6,.25,1.2,0,.55,0,cloth);b(1.7,.35,.2,0,.5,-.65,cream);return;}
  if(kind==='bowl'){this.cylinder(.63,.73,.4,0,.23,0,p.wall,g);this.cylinder(.51,.51,.05,0,.45,0,0x9dbcb9,g);return;}
  if(kind==='ball'){this.ball(.55,0,.55,0,p.cloth,g);b(1.02,.08,.08,0,.6,.3,cream);return;}
  if(kind==='bone'){b(1.2,.25,.3,0,.3,0,cream);for(const x of [-.62,.62])for(const z of [-.16,.16])this.ball(.25,x,.3,z,0xf5ecd7,g);return;}
  if(kind==='plant'){this.plant(0,0,0,1.5,g);return;}
  if(kind==='cabinet'||kind==='shelf'){b(1.65,1.65,1.05,0,.84,0,green);b(1.8,.14,1.15,0,1.72,0,wood);if(kind==='cabinet'){for(const x of [-.4,.4]){b(.73,1.35,.06,x,.85,.56,cream);this.ball(.06,x+(.12),.98,.62,0xa77c44,g);}}else{for(let y=.45;y<1.5;y+=.45){b(1.5,.08,.8,0,y,.3,wood);for(let j=0;j<4;j++)b(.15,.3,.35,-.5+j*.25,y+.19,.48,j%2?cloth:cream);}}}
  else if(kind==='oven'||kind==='washer'){b(1.6,1.55,1.3,0,.8,0,cream);if(kind==='washer'){const ring=this.cylinder(.52,.52,.12,0,.85,.71,0x506a68,g);ring.rotation.x=Math.PI/2;const glass=this.cylinder(.39,.39,.14,0,.85,.78,0x8caeb2,g);glass.rotation.x=Math.PI/2;}else{b(1.25,.8,.07,0,.7,.7,dark);b(1.2,.08,.1,0,1.17,.77,wood);b(1.5,.06,1.15,0,1.61,0,dark);for(const x of [-.4,.4])for(const z of [-.32,.32])this.cylinder(.23,.23,.04,x,1.66,z,0x293d37,g);}for(const x of [-.5,0,.5])this.ball(.055,x,1.44,.68,0x958c76,g);}
  else if(kind==='bed'){b(1.85,.35,1.9,0,.36,0);b(1.83,.95,.15,0,.65,-.95);b(1.75,.3,1.8,0,.66,0,cream);b(1.72,.1,1.2,0,.86,.3,cloth);for(const x of [-.43,.43])b(.68,.17,.45,x,.88,-.57,cream);}
  else if(kind==='sofa'||kind==='bench'){legs(1.45,.85,.35);b(1.95,.38,1.1,0,.5,0,kind==='sofa'?cloth:wood);b(1.95,.8,.22,0,.85,-.5,kind==='sofa'?cloth:wood);for(const x of [-.95,.95])b(.22,.7,1.12,x,.65,0,kind==='sofa'?cloth:wood);if(kind==='sofa')for(const x of [-.48,.48])b(.62,.5,.18,x,1,-.22,cream);}
  else if(kind==='lamp'){this.cylinder(.4,.4,.1,0,.08,0,0x9b835b,g);this.cylinder(.045,.045,1.5,0,.85,0,0xad8d54,g);this.cylinder(.37,.65,.63,0,1.83,0,0xf5d995,g);}
  else if(kind==='rug'){b(1.9,.035,1.55,0,.04,0,cloth);for(const z of [-.68,.68])b(1.85,.01,.06,0,.064,z,cream);}
  else if(kind==='shower'){b(1.7,.16,1.5,0,.1,0,cream);b(.1,2.3,.1,-.75,1.2,-.6,dark);b(1.65,.06,.1,0,2.35,-.6,dark);b(1.55,2.15,.035,0,1.22,-.6,this.mat(0xb4d3d0,{transparent:true,opacity:.45}));this.line([[-.5,1,-.7],[-.5,2.1,-.7],[0,2.1,-.3]],0xb9aa81,.045,g);}
  else if(kind==='bath'){b(1.95,.75,1.4,0,.5,0,cream);b(1.65,.06,1.1,0,.9,0,this.mat(0xb8d3ce));}
  else if(kind==='sink'){b(1.5,1.1,1.15,0,.6,0,green);b(1.7,.18,1.3,0,1.2,0,cream);this.cylinder(.42,.35,.12,0,1.3,0,0xb3c8c4,g);this.line([[0,1.25,-.4],[0,1.7,-.4],[0,1.7,0]],0xb4a47e,.05,g);}
  else if(kind==='chair'){legs(1,.85,.75);b(1.3,.18,1.1,0,.78,0,cloth);b(1.3,.8,.15,0,1.2,-.48,wood);}
  else{legs(1.25,1,kind==='stool'?.55:1);b(1.8,.16,1.4,0,kind==='stool'?.65:1.08,0,wood);if(kind==='desk'){b(.9,.6,.07,0,1.5,-.4,dark);b(.12,.25,.12,0,1.2,-.4,dark);}}
 }
 buildConnections(){
  this.base();this.camera.position.set(1,4.5,13);this.camera.lookAt(0,1.7,0);
  const board=this.group(0,.5,0);this.box(7.5,4,.35,0,1.8,0,this.mat(0xe3d3b8),board,.16);this.box(7.1,3.6,.08,0,1.8,.23,this.mat(0xf4eddd),board,.08);
  this.endpoints=[];const colors=[0xd89c45,0x538eab,0x8d78a8],labels=['●','▲','■'];
  for(let i=0;i<3;i++){const y=3.05-i*1.18,left=new T.Vector3(-2.65,y+.5,.55),right=new T.Vector3(2.65,y+.5,.55);this.endpoints.push({a:left,b:right});
   const g=this.group();const a=this.cylinder(.31,.31,.25,left.x,left.y,left.z,colors[i],g);a.rotation.x=Math.PI/2;
   const b=this.cylinder(.4,.4,.18,right.x,right.y,right.z,0x8f9f8f,g);b.rotation.x=Math.PI/2;
   const inner=this.cylinder(.27,.27,.2,right.x,right.y,right.z+.06,colors[i],g);inner.rotation.x=Math.PI/2;
   this.tag(labels[i],left.x-.67,left.y,left.z+.1,.36,g);this.tag(labels[i],right.x+.67,right.y,right.z+.1,.36,g);
   const wire=this.line([[left.x,left.y,.5],[-1.2,left.y-.2,.5],[1.2,right.y-.2,.5],[right.x,right.y,.5]],colors[i],this.kind==='pipes'?.12:.065,g);wire.visible=false;
   const lamp=this.ball(.17,right.x,right.y+.43,.55,0x778878,g);
   this.targets[i]={group:g,index:i,wire,lamp,display:0,mode:'connect',a,b,baseColor:colors[i]};
   for(const [side,mesh]of [['a',a],['b',b]]){mesh.userData.target=i;mesh.userData.side=side;this.hitMeshes.push(mesh);}
  }
  this.liveLine=null;
 }
 refreshTargets(){this.root.updateMatrixWorld(true);for(const t of this.targets){if(!t.proxy)continue;const bounds=new T.Box3().setFromObject(t.group),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());t.proxy.geometry.dispose();t.proxy.geometry=new T.BoxGeometry(Math.max(size.x,.65),Math.max(size.y,.55),Math.max(size.z,.55));t.proxy.position.copy(center);this.root.worldToLocal(t.proxy.position);}}
 buildPointer(){this.cursorMesh=new T.Mesh(new T.TorusGeometry(.23,.025,8,32),new T.MeshBasicMaterial({color:0xfff7dc,depthTest:false,transparent:true,opacity:.95}));this.cursorMesh.renderOrder=10;this.cursorMesh.visible=false;this.scene.add(this.cursorMesh);}
 fit(){const {width,height}=this.canvas.parentElement.getBoundingClientRect();if(!width||!height)return;this.width=width;this.height=height;this.renderer.setSize(width,height,false);this.root.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(this.root),view=new T.Box3();for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])view.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(this.camera.matrixWorldInverse));const a=width/height,h=Math.max((view.max.y-view.min.y)*1.12,(view.max.x-view.min.x)/a*1.12),cx=(view.min.x+view.max.x)/2,cy=(view.min.y+view.max.y)/2;this.camera.left=cx-h*a/2;this.camera.right=cx+h*a/2;this.camera.top=cy+h/2;this.camera.bottom=cy-h/2;this.camera.updateProjectionMatrix();this.drawDirty=true;}
 sync(work){this.work=work;this.drawDirty=true;}
 hit(e){const r=this.canvas.getBoundingClientRect();const ndc=new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(ndc,this.camera);this.root.updateMatrixWorld(true);const hits=this.raycaster.intersectObjects(this.hitMeshes,false);const match=hits.find(h=>(this.work[h.object.userData.target]||0)<1);if(match)return {i:match.object.userData.target,side:match.object.userData.side,point:match.point};
  // Touch-friendly magnetic snap: nearby objects count without pixel-perfect aim.
  let best=null,dist=Infinity;const radius=Math.max(38,Math.min(r.width,r.height)*.09);
  for(const target of this.targets){if((this.work[target.index]||0)>=1)continue;const items=target.mode==='connect'?[['a',target.a],['b',target.b]]:[['',target.proxy]];for(const [side,obj]of items){if(!obj)continue;const world=obj.getWorldPosition(new T.Vector3()),p=world.clone().project(this.camera),x=(p.x+1)*r.width/2+r.left,y=(1-p.y)*r.height/2+r.top,d=Math.hypot(e.clientX-x,e.clientY-y);if(d<radius&&d<dist){best={i:target.index,side,point:world};dist=d;}}}return best;
 }
 down(e){if(this.active!==null||e.button>0)return;e.preventDefault();this.canvas.focus({preventScroll:true});this.canvas.setPointerCapture(e.pointerId);this.active=e.pointerId;this.start={x:e.clientX,y:e.clientY};this.pointer=e;this.drawDirty=true;this.lastInput=this.elapsed;const hit=this.hit(e);this.hover=hit?.i??-1;
  if(this.task.tool==='connect'){if(hit){if(this.selected&&hit.i===this.selected.i&&hit.side!==this.selected.side){this.onWork(hit.i,1);this.selected=null;}else this.selected=hit;}}
  else if(hit)this.apply(hit.i,.32);
 }
 move(e){if(this.active!==null&&this.active!==e.pointerId)return;const prev=this.pointer;this.pointer=e;this.drawDirty=true;const hit=this.hit(e);this.hover=hit?.i??-1;
  if(this.active!==null&&this.task.tool!=='connect'){
   const distance=prev?Math.hypot(e.clientX-prev.clientX,e.clientY-prev.clientY):0,steps=Math.min(40,Math.max(1,Math.ceil(distance/12)));
   for(let n=1;n<=steps;n++){const sample=prev?{clientX:prev.clientX+(e.clientX-prev.clientX)*n/steps,clientY:prev.clientY+(e.clientY-prev.clientY)*n/steps}:e;const h=this.hit(sample);if(h)this.apply(h.i,Math.max(.08,Math.min(.22,distance/steps/90)));}
   this.lastInput=this.elapsed;
  }
 }
 up(e){if(e.pointerId!==this.active)return;const hit=this.hit(e);if(this.task.tool==='connect'&&this.selected&&hit&&hit.i===this.selected.i&&hit.side!==this.selected.side){this.onWork(hit.i,1);this.selected=null;}
  else if(this.task.tool!=='connect'&&hit&&Math.hypot(e.clientX-this.start.x,e.clientY-this.start.y)<18)this.apply(hit.i,1);
  this.active=null;if(e.pointerType==='touch'){this.pointer=null;this.hover=-1;}if(this.canvas.hasPointerCapture(e.pointerId))this.canvas.releasePointerCapture(e.pointerId);
 }
 cancel(){this.active=null;this.pointer=null;this.hover=-1;}
 apply(i,amount){if((this.work[i]||0)>=1)return;this.onWork(i,amount);}
 hint(){this.hintUntil=this.elapsed+5;this.drawDirty=true;}
 tick(now){if(this.disposed)return;const dt=Math.min((now-this.last)/1000,.06);this.last=now;this.elapsed+=dt;
  if(this.active!==null&&this.pointer&&this.task.tool!=='connect'){const h=this.hit(this.pointer);if(h)this.apply(h.i,dt*1.75);}
  const showHint=this.elapsed<this.hintUntil||this.elapsed-(this.lastInput||0)>5;
  this.targets.forEach(t=>{const value=this.work[t.index]||0;t.display=this.reduced?value:t.display+(value-t.display)*Math.min(1,dt*14);const v=t.display;
   if(t.mode==='connect'){t.wire.visible=value>=1;t.lamp.material.color.setHex(value>=1?0xffdc83:0x778878);t.lamp.material.emissive.setHex(value>=1?0xe6ad47:0);t.lamp.material.emissiveIntensity=value>=1?1:0;t.a.material.emissive.setHex(this.selected?.i===t.index?0x8b662f:0);return;}
   if(t.mode==='clear'){t.group.scale.setScalar(Math.max(.001,1-v));t.group.position.y=t.baseY+Math.sin(v*Math.PI)*.5;t.group.rotation.y=v*.6;}
   else if(t.mode==='remove'){t.old.forEach(m=>{m.visible=v<.99;m.scale.setScalar(Math.max(.001,1-v));});}
   else if(t.mode==='install'){t.fresh.forEach(m=>{m.visible=v>.005;m.scale.setScalar(Math.max(.001,v));});t.old.forEach(m=>m.visible=v<.96);}
   else{t.fresh.forEach(m=>m.visible=value>=1);t.old.forEach(m=>m.visible=value<1);if(value<1&&t.old[0]?.material?.color){const color=t.mode==='paint'&&t.finishColor?t.finishColor:new T.Color(0xe5dbc8);t.old[0].material.color.copy(t.baseColor).lerp(color,value);}}
   if(t.outline){t.outline.visible=value<1;t.outline.material.opacity=value>=1?0:this.hover===t.index?.9:showHint?.45:0;}
  });
  this.cursorMesh.visible=!!this.pointer&&this.task.tool!=='connect';if(this.pointer){const h=this.hit(this.pointer);if(h){this.cursorMesh.position.copy(h.point);this.cursorMesh.position.addScaledVector(this.camera.getWorldDirection(new T.Vector3()),-.08);this.cursorMesh.quaternion.copy(this.camera.quaternion);this.cursorMesh.material.color.setHex(this.active!==null?0xffce6d:0xffffff);}else this.cursorMesh.visible=false;}
  if(this.liveLine){this.root.remove(this.liveLine);this.liveLine.geometry.dispose();this.liveLine.material.dispose();this.liveLine=null;}
  if(this.selected&&this.pointer&&this.task.tool==='connect'){const pair=this.endpoints[this.selected.i],start=pair[this.selected.side];const hit=this.hit(this.pointer);const r=this.canvas.getBoundingClientRect();const ndc=new T.Vector2((this.pointer.clientX-r.left)/r.width*2-1,-(this.pointer.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(ndc,this.camera);const end=new T.Vector3();this.raycaster.ray.intersectPlane(new T.Plane(new T.Vector3(0,0,1),-.6),end);this.liveLine=this.line([[start.x,start.y,.65],[start.x*.3,end.y,.65],[end.x,end.y,.65]],this.targets[this.selected.i].baseColor,this.kind==='pipes'?.12:.065);}
  const changing=this.targets.some(t=>Math.abs((this.work[t.index]||0)-t.display)>.002),hintChanged=showHint!==this.previousHint;this.previousHint=showHint;
  if(!this.renderer.isSoftware||this.drawDirty||changing||hintChanged||this.active!==null){if(!this.renderer.isSoftware||!this.lastDraw||now-this.lastDraw>50){this.renderer.render(this.scene,this.camera);this.lastDraw=now;this.drawDirty=false;}}this.frame=requestAnimationFrame(this.tick);
 }
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.observer?.disconnect();Object.entries(this.handlers).forEach(([event,fn])=>this.canvas.removeEventListener(event,fn));this.canvas.removeEventListener('keydown',this.key);window.removeEventListener('blur',this.blur);const geometries=new Set(),materials=new Set();this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});this.renderer.dispose();this.renderer.forceContextLoss();}
}

// The same large targets and saved progress remain playable on devices without WebGL.
export class FlatWorkshop{
 constructor({canvas,room,tier,step,work,onWork,onReady}){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.task=room.tasks[step];this.kind=taskKind(room,this.task);this.tier=tier;this.work=work;this.onWork=onWork;this.active=null;this.selected=null;this.showHint=true;this.cells=Array.from({length:6},(_,i)=>({x:210+i%3*300,y:230+Math.floor(i/3)*260,w:260,h:200}));this.handlers={pointerdown:e=>this.down(e),pointermove:e=>this.move(e),pointerup:e=>this.up(e),pointercancel:()=>this.active=null,lostpointercapture:()=>this.active=null};Object.entries(this.handlers).forEach(([a,b])=>canvas.addEventListener(a,b));this.key=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();const count=this.task.tool==='connect'?3:6;for(let i=0;i<count;i++)if((this.work[i]||0)<1){onWork(i,1);break;}}};canvas.addEventListener('keydown',this.key);canvas.tabIndex=0;this.blur=()=>this.active=null;window.addEventListener('blur',this.blur);this.draw();onReady?.();}
 point(e){const r=this.canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*1200/r.width,y:(e.clientY-r.top)*750/r.height};}
 hit(e){const p=this.point(e);if(this.task.tool==='connect'){const row=Math.round((p.y-195)/180);if(row>=0&&row<3&&Math.abs(p.y-(195+row*180))<85)return{i:row,side:p.x<600?'a':'b'};return null;}const i=this.cells.findIndex(c=>Math.abs(p.x-c.x)<155&&Math.abs(p.y-c.y)<130);return i<0?null:{i};}
 down(e){if(this.active!==null)return;e.preventDefault();this.canvas.setPointerCapture(e.pointerId);this.active=e.pointerId;this.last=e;this.apply(e);}
 move(e){if(e.pointerId!==this.active)return;const prev=this.last,steps=Math.max(1,Math.ceil(Math.hypot(e.clientX-prev.clientX,e.clientY-prev.clientY)/15));for(let n=1;n<=steps;n++)this.apply({clientX:prev.clientX+(e.clientX-prev.clientX)*n/steps,clientY:prev.clientY+(e.clientY-prev.clientY)*n/steps});this.last=e;}
 up(e){if(e.pointerId!==this.active)return;this.apply(e);this.active=null;}
 apply(e){const h=this.hit(e);if(!h||(this.work[h.i]||0)>=1)return;if(this.task.tool==='connect'){if(this.selected&&this.selected.i===h.i&&this.selected.side!==h.side){this.onWork(h.i,1);this.selected=null;}else if(!this.selected||this.selected.i!==h.i)this.selected=h;this.draw();}else this.onWork(h.i,1);}
 sync(work){this.work=work;this.draw();}hint(){this.showHint=true;this.draw();}
 round(x,y,w,h,r,color){const c=this.ctx;c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
 draw(){const c=this.ctx;c.clearRect(0,0,1200,750);const bg=c.createLinearGradient(0,0,0,750);bg.addColorStop(0,'#e9eee9');bg.addColorStop(1,'#d8e3d5');c.fillStyle=bg;c.fillRect(0,0,1200,750);this.round(50,70,1100,630,30,'#c9b894');this.round(65,75,1070,600,24,'#f0e6ce');
  if(this.task.tool==='connect'){const colors=['#d29c46','#5189aa','#8f75a6'],labels=['●','▲','■'];for(let i=0;i<3;i++){const y=195+i*180,done=(this.work[i]||0)>=1;c.lineWidth=done?22:9;c.strokeStyle=done?colors[i]:'#d9cfb8';c.beginPath();c.moveTo(250,y);c.bezierCurveTo(430,y+50,770,y+50,950,y);c.stroke();for(const x of [250,950]){this.round(x-65,y-65,130,130,30,colors[i]);c.fillStyle='#fff9ea';c.font='bold 65px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(labels[i],x,y);}if(done){c.fillStyle='#3e7756';c.font='bold 44px system-ui';c.fillText('✓',600,y-45);}}return;}
  for(const [i,p]of this.cells.entries()){const v=this.work[i]||0,done=v>=1,tool=this.task.tool,finish=['#d5b677','#8fae85','#7c9bac'][this.tier-1];if((tool==='clear'||tool==='remove')&&done)continue;const x=p.x-p.w/2,y=p.y-p.h/2;let color=done?finish:tool==='install'?'#d0c8b5':'#a39478';if(this.kind==='roof')color=done?['#b87750','#ba614a','#566b7a'][this.tier-1]:'#89755a';
   c.save();c.shadowColor='#50463435';c.shadowBlur=18;c.shadowOffsetY=12;this.round(x,y,p.w,p.h,14,color);c.restore();
   if(tool==='clear'){this.round(x+25,y+25,p.w-50,p.h-50,8,'#bd9661');this.round(p.x-14,y+20,28,p.h-40,0,'#e2c28a');}
   else if(!done&&tool!=='install'){c.strokeStyle='#665a48';c.lineWidth=7;c.lineJoin='round';c.beginPath();c.moveTo(x+70,y+20);c.lineTo(x+135,y+70);c.lineTo(x+105,y+115);c.lineTo(x+180,y+180);c.stroke();}
   else{c.strokeStyle='#fff8dd66';c.lineWidth=3;for(let j=1;j<4;j++){c.beginPath();c.moveTo(x+p.w*j/4,y+8);c.lineTo(x+p.w*j/4,y+p.h-8);c.stroke();}}
   if(!done&&this.showHint){c.strokeStyle='#f7cf68';c.lineWidth=5;c.setLineDash([15,10]);c.strokeRect(x-6,y-6,p.w+12,p.h+12);c.setLineDash([]);}if(done){c.fillStyle='#fff9e6';c.font='bold 44px system-ui';c.textAlign='right';c.fillText('✓',x+p.w-15,y+48);}
  }
 }
 dispose(){Object.entries(this.handlers).forEach(([a,b])=>this.canvas.removeEventListener(a,b));this.canvas.removeEventListener('keydown',this.key);window.removeEventListener('blur',this.blur);}
}
// Software projection keeps the same 3D objects playable when hardware 3D is disabled.
class CanvasRenderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.shadowMap={};this.isSoftware=true;}
 setPixelRatio(r){this.ratio=Math.min(r,1.35);}
 setSize(w,h){this.w=w;this.h=h;this.canvas.width=Math.round(w*(this.ratio||1));this.canvas.height=Math.round(h*(this.ratio||1));}
 render(scene,camera){
  const c=this.ctx;if(!this.w||!this.h)return;const W=Math.min(1100,Math.round(this.w*1.25)),H=Math.round(W*this.h/this.w);c.setTransform((this.ratio||1)*this.w/W,0,0,(this.ratio||1)*this.h/H,0,0);c.globalAlpha=1;c.fillStyle='#e9eee9';c.fillRect(0,0,W,H);
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);const vp=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),faces=[],lines=[],sprites=[];
  const sun=new T.Vector3(-.4,.8,.5).normalize(),cam=camera.position;
  const rgb=(color,light)=>{const encode=n=>Math.round(255*(n<=.0031308?n*12.92:1.055*Math.pow(n,1/2.4)-.055));return [encode(Math.min(1,color.r*light)),encode(Math.min(1,color.g*light)),encode(Math.min(1,color.b*light))];};
  const project=v=>{const p=v.clone().applyMatrix4(vp);return{x:(p.x+1)*W/2,y:(1-p.y)*H/2,z:p.z};};
  scene.traverseVisible(o=>{
   if(o.isSprite){const p=project(o.getWorldPosition(new T.Vector3())),scale=o.getWorldScale(new T.Vector3());sprites.push({p,w:scale.x*W/(camera.right-camera.left),h:scale.y*H/(camera.top-camera.bottom),image:o.material.map?.image});return;}
   if(o.isLineSegments&&o.material.opacity>0){const pos=o.geometry.attributes.position;for(let i=0;i<pos.count;i+=2){const a=project(new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld)),b=project(new T.Vector3().fromBufferAttribute(pos,i+1).applyMatrix4(o.matrixWorld));lines.push({a,b,alpha:o.material.opacity,color:o.material.color.getStyle()});}return;}
   if(!o.isMesh||o.material.visible===false||o===scene.children.find(x=>x.userData?.ground))return;
   const pos=o.geometry.attributes.position;if(!pos||o.geometry.parameters?.width===50)return;
   const mat=Array.isArray(o.material)?o.material[0]:o.material;if(mat.opacity===0)return;
   const worlds=[],screens=[];for(let i=0;i<pos.count;i++){const world=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);worlds.push(world);screens.push(project(world));}
   const idx=o.geometry.index,count=idx?idx.count:pos.count;
   for(let k=0;k<count;k+=3){const ia=idx?idx.array[k]:k,ib=idx?idx.array[k+1]:k+1,ic=idx?idx.array[k+2]:k+2,a=worlds[ia],b=worlds[ib],d=worlds[ic];if(!a||!b||!d)continue;
    const normal=new T.Vector3().subVectors(b,a).cross(new T.Vector3().subVectors(d,a)).normalize();if(normal.dot(new T.Vector3().subVectors(cam,a))<=0&&mat.side!==T.DoubleSide)continue;
    const pa=screens[ia],pb=screens[ib],pc=screens[ic];if([pa,pb,pc].every(p=>p.x<0||p.x>W||p.y<0||p.y>H))continue;
    const light=mat.isMeshBasicMaterial?1:.68+Math.max(0,normal.dot(sun))*.48,emission=mat.emissiveIntensity||0,col=mat.color.clone();if(mat.emissive&&emission)col.add(mat.emissive.clone().multiplyScalar(emission*.3));
    faces.push({a:pa,b:pb,c:pc,z:(pa.z+pb.z+pc.z)/3,color:rgb(col,light),alpha:mat.transparent?mat.opacity:1});
   }
  });
  // A soft grounded shadow, then back-to-front solid geometry.
  const origin=project(new T.Vector3(0,0,0));c.save();c.translate(origin.x,origin.y+H*.055);c.scale(1,.25);const shadow=c.createRadialGradient(0,0,0,0,0,W*.35);shadow.addColorStop(0,'#62785b30');shadow.addColorStop(1,'#62785b00');c.fillStyle=shadow;c.fillRect(-W*.4,-W*.4,W*.8,W*.8);c.restore();
  // A depth buffer preserves proper occlusion even where large floors meet furniture.
  this.buffer??=document.createElement('canvas');this.buffer.width=W;this.buffer.height=H;const bc=this.buffer.getContext('2d'),pixels=bc.createImageData(W,H),bytes=pixels.data,depth=new Float32Array(W*H);depth.fill(Infinity);
  faces.sort((a,b)=>b.z-a.z);
  for(const f of faces){const {a,b,c:p}=f,minX=Math.max(0,Math.floor(Math.min(a.x,b.x,p.x))),maxX=Math.min(W-1,Math.ceil(Math.max(a.x,b.x,p.x))),minY=Math.max(0,Math.floor(Math.min(a.y,b.y,p.y))),maxY=Math.min(H-1,Math.ceil(Math.max(a.y,b.y,p.y)));const den=(b.y-p.y)*(a.x-p.x)+(p.x-b.x)*(a.y-p.y);if(Math.abs(den)<.01)continue;const ax=(b.y-p.y)/den,ay=(p.x-b.x)/den,bx=(p.y-a.y)/den,by=(a.x-p.x)/den;for(let y=minY;y<=maxY;y++){let u=ax*(minX+.5-p.x)+ay*(y+.5-p.y),v=bx*(minX+.5-p.x)+by*(y+.5-p.y);for(let x=minX;x<=maxX;x++,u+=ax,v+=bx){if(u<-.0001||v<-.0001||u+v>1.0001)continue;const z=u*a.z+v*b.z+(1-u-v)*p.z,i=y*W+x;if(z>=depth[i])continue;depth[i]=z;const k=i*4,alpha=f.alpha;if(alpha>=.99||bytes[k+3]===0){bytes[k]=f.color[0];bytes[k+1]=f.color[1];bytes[k+2]=f.color[2];bytes[k+3]=255;}else{bytes[k]=bytes[k]*(1-alpha)+f.color[0]*alpha;bytes[k+1]=bytes[k+1]*(1-alpha)+f.color[1]*alpha;bytes[k+2]=bytes[k+2]*(1-alpha)+f.color[2]*alpha;}}}}
  bc.putImageData(pixels,0,0);c.drawImage(this.buffer,0,0);
  for(const l of lines){c.globalAlpha=l.alpha;c.strokeStyle=l.color;c.lineWidth=2;c.beginPath();c.moveTo(l.a.x,l.a.y);c.lineTo(l.b.x,l.b.y);c.stroke();}c.globalAlpha=1;
  for(const s of sprites)if(s.image)c.drawImage(s.image,s.p.x-s.w/2,s.p.y-s.h/2,s.w,s.h);
 }
 dispose(){}forceContextLoss(){}
}
