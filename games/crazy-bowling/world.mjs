import {FinishPass} from './post.mjs?v=20261102-visibility';
const T=window.THREE;
// Render the textured scene directly on every tier. The optional finish pass
// stays disabled until it has passed real WebGL validation.
const QUALITY={high:{ratio:1.8,shadow:2048,probe:256,detail:true,post:false},medium:{ratio:1.3,shadow:1024,probe:128,detail:true,post:false},low:{ratio:1,shadow:0,probe:64,detail:false,post:false}};
export class BowlingView{
 constructor(host,assets){
 this.host=host;this.assets=assets;this.geometries=new Set();this.materials=new Set();this.textures=new Set();this.models=assets.models;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2',{antialias:true})||canvas.getContext('webgl',{antialias:true});
 this.renderer=gl?new T.WebGLRenderer({canvas,context:gl,antialias:true,powerPreference:'high-performance'}):window.BowlingSoftware.create(T);
 this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
 this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(49,1,.1,180);this.camera.position.set(10,10,14);this.look=new T.Vector3(0,0,-13);host.append(this.renderer.domElement);
 this.clock=0;this.samples=[];this.auto=true;this.quality=innerWidth<600?'low':navigator.hardwareConcurrency<=4?'medium':'high';
 this.resize=()=>{const q=QUALITY[this.quality];this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,q.ratio));this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.fov=innerWidth<600?62:49;this.camera.updateProjectionMatrix();if(this.post){const s=this.renderer.getDrawingBufferSize(new T.Vector2());this.post.resize(s.x,s.y);}};addEventListener('resize',this.resize);this.setQuality(this.quality);
 host.dataset.renderer=this.renderer.isSoftware?'canvas':'webgl';
 }
 setQuality(name,manual=false){if(!QUALITY[name])return;this.quality=name;if(manual)this.auto=false;const q=QUALITY[name];this.renderer.shadowMap.enabled=!!q.shadow&&!this.renderer.isSoftware;
 if(this.sun){this.sun.shadow.map?.dispose();this.sun.shadow.map=null;this.sun.shadow.mapSize.set(q.shadow||512,q.shadow||512);}if(this.decor)this.decor.visible=q.detail;
 this.post?.dispose();this.post=null;if(q.post&&this.renderer.capabilities?.isWebGL2&&this.renderer.extensions.has('EXT_color_buffer_float'))this.post=new FinishPass(this.renderer);
 for(const m of this.materials)m.needsUpdate=true;this.samples=[];this.resize();this.host.dataset.quality=name;
 }
 mat(color,opts={}){const m=new T.MeshStandardMaterial({color,roughness:.45,metalness:0,...opts});this.materials.add(m);return m;}
 map(name,repeat=[1,1]){const t=this.assets.textures[name].clone();t.repeat.set(...repeat);t.needsUpdate=true;t.anisotropy=Math.min(8,this.renderer.capabilities?.getMaxAnisotropy?.()||1);this.textures.add(t);return t;}
 pbr(name,color,roughness,repeat=[1,1],extra={}){const orm=this.map(name+'-orm',repeat);return this.mat(color,{map:this.map(name,repeat),normalMap:this.map(name+'-normal',repeat),normalScale:new T.Vector2(.18,.18),roughnessMap:orm,roughness,aoMap:orm,aoMapIntensity:.25,...extra});}
 mesh(geo,mat,parent=this.scene){this.geometries.add(geo);const m=new T.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 box(w,h,d,mat,x=0,y=0,z=0,parent=this.scene){const m=this.mesh(new T.BoxGeometry(w,h,d),mat,parent);m.position.set(x,y,z);return m;}
 asset(name,parent=this.scene,materials=this.palette){const root=this.models.get(name).clone(true);root.traverse(o=>{if(o.isMesh){o.material=materials[o.material.name]||o.material;o.castShadow=true;o.receiveShadow=true;}});parent.add(root);return root;}
 clear(){this.scene.traverse(o=>{if(o.isLight&&o.shadow)o.shadow.map?.dispose();});for(const g of this.geometries)g.dispose();for(const m of this.materials)m.dispose();for(const t of this.textures)t.dispose();this.geometries.clear();this.materials.clear();this.textures.clear();this.environment?.dispose();this.environment=null;this.scene.environment=null;this.scene.clear();}
 build(physics,level,spec){
 this.clear();this.physics=physics;this.level=level;this.parts=[];this.pinMeshes=[];this.particles=[];this.contacts=[];this.monitors=[];this.clock=0;this.resetAge=2;this.renderer.configure?.(physics,level,spec);this.scene.background=new T.Color('#15242d');this.scene.fog=new T.Fog('#15242d',65,135);
 const neon=['neon','final'].includes(level.kind);this.scene.add(new T.HemisphereLight('#c3d5e1','#5c4735',1.35));this.sun=new T.DirectionalLight('#ffead0',2.6);this.sun.position.set(-9,17,-9);this.sun.castShadow=true;Object.assign(this.sun.shadow.camera,{left:-13,right:13,top:27,bottom:-27,near:1,far:65});this.sun.shadow.bias=-.00012;this.sun.shadow.normalBias=.035;this.sun.shadow.mapSize.set(QUALITY[this.quality].shadow||512,QUALITY[this.quality].shadow||512);this.scene.add(this.sun);
 const fill=new T.DirectionalLight('#a3cde3',1.1);fill.position.set(12,8,10);this.scene.add(fill);
 this.palette={pin:this.mat('#ffffff',{map:this.map('pin'),roughness:.18}),resin:this.pbr('resin',spec.color,.7,[1,1],{metalness:.16,vertexColors:true}),shell:this.mat('#24434c',{metalness:.15,roughness:.3,side:T.DoubleSide}),rubber:this.mat('#13191c',{roughness:.94}),metal:this.mat('#9aadb5',{metalness:.85,roughness:.27,side:T.DoubleSide}),led:this.mat(neon?'#c27cdb':'#84e1ca',{emissive:neon?'#9c40c0':'#3bbd9c',emissiveIntensity:1.5}),fabric:this.pbr('fabric','#b6efdf',1,[2,2]),walnut:this.pbr('maple','#674333',1,[1,1]),warmLight:this.mat('#ffefcc',{emissive:'#ffe7b0',emissiveIntensity:2}),screen:this.mat('#fff',{roughness:.26})};
 const p=this.palette;this.wood=this.pbr('maple','#ffffff',1,[1,2],{envMapIntensity:.5});const floor=this.pbr('concrete','#9ca9b0',1,[10,16]);const wall=this.pbr('concrete','#b6bdc0',1,[7,2]);const dark=this.pbr('fabric','#54636a',1,[9,2]);const ice=this.pbr('resin','#9ce5ec',.5,[2,8],{metalness:.15});
 for(const o of physics.solids){let m;if(o.type==='bumper'){const profile=[new T.Vector2(0,-.65),new T.Vector2(.68,-.65),new T.Vector2(.8,-.5),new T.Vector2(.76,.4),new T.Vector2(.6,.65),new T.Vector2(0,.65)];m=this.mesh(new T.LatheGeometry(profile,48),p.shell);const ring=this.mesh(new T.TorusGeometry(.77,.04,8,48),p.led,m);ring.rotation.x=Math.PI/2;ring.position.y=.25;
 }else{let material=o.type==='wood'?this.wood:o.type==='ice'?ice:o.type==='rail'?p.metal:o.type==='ramp'?this.wood:o.type==='back'?p.rubber:o.type==='soft'?p.fabric:p.shell;m=this.box(o.w,o.h,o.d,material);}
 m.position.copy(o.body.position);m.quaternion.copy(o.body.quaternion);this.parts.push({body:o.body,mesh:m});}
 // Architecture is dimensioned separately from playable colliders.
 this.box(58,.3,70,floor,0,-.72,-13);this.box(58,.22,15,this.pbr('maple','#b5a18b',1,[7,1]),0,-.17,11.5);
 this.box(58,14,.45,wall,0,5,-35);this.box(.45,14,70,wall,-29,5,-13);this.box(.45,14,70,wall,29,5,-13);this.box(58,.2,70,dark,0,12.8,-13);
 // Acoustic fins and continuous ceiling lights.
 for(let x=-28;x<=28;x+=2.8)this.box(.14,.45,66,p.shell,x,12.4,-13);
 for(const x of [-20,-10,0,10,20])for(const z of [-26,-12,2,14]){this.box(4.8,.07,.25,p.warmLight,x,12.07,z);this.box(5,.1,.45,p.shell,x,12.2,z);}
 const mural=this.mat('#fff',{map:this.map('mural'),roughness:.8});this.box(53,5.2,.05,mural,0,6.1,-34.7);
 for(let x=-27;x<29;x+=1.4)this.box(.035,3,.1,p.walnut,x,1,-34.6);
 this.decor=new T.Group();this.scene.add(this.decor);
 // Five full lanes extend the hall beyond the central playing surface.
 const backgroundPins=[];
 for(const x of [-20,-10,0,10,20]){
 if(x!==0){this.box(7.6,.6,36,this.wood,x,-.3,-14);this.box(7.6,2.1,2,p.rubber,x,.7,-32.2);for(let row=0;row<4;row++)for(let col=0;col<=row;col++){backgroundPins.push([x+(col-row/2)*.86,.55,-26-row*.8]);}}
 for(const side of [-1,1]){const gutter=this.asset('gutter');gutter.position.set(x+side*4.5,-.05,-14);gutter.scale.z=36;this.box(.07,.08,36,p.led,x+side*4.83,.1,-14);}
 this.box(7.6,.018,.15,p.rubber,x,.015,.7);this.markings(x);
 const machine=this.box(8.5,1.8,2.8,p.shell,x,2.75,-32.7);this.box(8.4,.06,.08,p.led,x,1.84,-31.27);
 const screen=this.asset('monitor');screen.position.set(x,6.8,-28.5);this.monitors.push(screen);this.label(String((x+20)/10+1).padStart(2,'0'),1.1,.8,x-3.25,2.8,-31.25);
 const ret=this.asset('return');ret.position.set(x+4.9,0,6.0);for(let j=0;j<2;j++){const b=this.asset('ball',this.decor,{...p,resin:this.pbr('resin',j?'#eac085':'#65b9b6',.8,[1,1],{vertexColors:true,metalness:.13})});b.position.set(x+4.9,.94,7.6+j*.9);}
 for(const side of [-1,1]){const chair=this.asset('chair',this.decor);chair.position.set(x+side*2.4,0,12);chair.rotation.y=side*.2;this.contact(x+side*2.4,.01,12,1.3,.3);}const table=this.asset('table',this.decor);table.position.set(x,0,12.8);this.contact(x,.01,12.8,1,.28);
 for(const z of [6,14]){const lamp=this.asset('lamp',this.decor);lamp.position.set(x,9.6,z);}
 }
 const bgPin=this.models.get('pin');const pins=new T.InstancedMesh(bgPin.geometry,p.pin,backgroundPins.length);for(let i=0;i<backgroundPins.length;i++)pins.setMatrixAt(i,new T.Matrix4().makeTranslation(...backgroundPins[i]));pins.receiveShadow=true;pins.castShadow=true;this.scene.add(pins);
 this.sweep=this.asset('sweep');this.sweep.position.set(0,2.25,-29.9);
 this.ball=this.asset('ball');this.syncPins(false);this.ballContact=this.contact(0,.014,2,.6,.35);
 this.aim=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0,.04,1),new T.Vector3(0,.04,-7)]),new T.LineDashedMaterial({color:'#ffe6a5',dashSize:.23,gapSize:.22,transparent:true,opacity:.85}));this.geometries.add(this.aim.geometry);this.materials.add(this.aim.material);this.aim.computeLineDistances();this.scene.add(this.aim);
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;this.scoreCanvas=canvas;this.scoreTexture=new T.CanvasTexture(canvas);this.scoreTexture.colorSpace=T.SRGBColorSpace;this.textures.add(this.scoreTexture);this.screenMat=this.mat('#fff',{map:this.scoreTexture,emissiveMap:this.scoreTexture,emissive:'#fff',emissiveIntensity:.5,roughness:.22});for(const screen of this.monitors)screen.traverse(o=>{if(o.isMesh&&o.material===p.screen)o.material=this.screenMat;});this.score({frame:0,total:0,frames:[[]]});
 this.particleGeo=new T.PlaneGeometry(.08,.14);this.geometries.add(this.particleGeo);this.particleMats=['#ffce7e','#8cdec8','#f1abb7'].map(c=>this.mat(c,{emissive:c,emissiveIntensity:.4,side:T.DoubleSide}));
 if(!this.renderer.isSoftware){this.captureEnvironment();}this.setQuality(this.quality);this.host.dataset.assets='ready';
 }
 captureEnvironment(){const rt=new T.WebGLCubeRenderTarget(QUALITY[this.quality].probe,{type:T.UnsignedByteType});const probe=new T.CubeCamera(.1,100,rt);probe.position.set(0,3,-12);this.ball.visible=false;this.scene.add(probe);probe.update(this.renderer,this.scene);this.scene.remove(probe);const pmrem=new T.PMREMGenerator(this.renderer);this.environment=pmrem.fromCubemap(rt.texture);this.scene.environment=this.environment.texture;pmrem.dispose();rt.dispose();this.ball.visible=true;}
 label(text,w,h,x,y,z){const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#20363f';ctx.fillRect(0,0,256,128);ctx.fillStyle='#f6d8a3';ctx.font='bold 90px sans-serif';ctx.textAlign='center';ctx.fillText(text,128,98);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;this.textures.add(t);const m=this.mesh(new T.PlaneGeometry(w,h),this.mat('#fff',{map:t,emissiveMap:t,emissive:'#fff',emissiveIntensity:.25}));m.position.set(x,y,z);return m;}
 markings(cx){const mat=this.mat('#5d4934',{roughness:.55});const shape=new T.Shape();shape.moveTo(0,.19);shape.lineTo(.11,-.11);shape.lineTo(-.11,-.11);shape.closePath();const g=new T.ShapeGeometry(shape);for(let i=-3;i<=3;i++){const m=this.mesh(g,mat);m.rotation.x=-Math.PI/2;m.position.set(cx+i*.7,.012,-5-Math.abs(i)*.28);for(const z of [-1.5,-3]){const dot=this.mesh(new T.CircleGeometry(.045,12),mat);dot.rotation.x=-Math.PI/2;dot.position.set(cx+i*.7,.012,z);}}}
 contact(x,y,z,r,opacity){if(!this.shadowTexture){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(0,0,0,.8)');g.addColorStop(.4,'rgba(0,0,0,.35)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);this.shadowTexture=new T.CanvasTexture(c);}const m=this.mesh(new T.PlaneGeometry(r*2,r*2),this.mat('#000',{map:this.shadowTexture,transparent:true,opacity,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));m.castShadow=false;m.rotation.x=-Math.PI/2;m.position.set(x,y,z);return m;}
 syncPins(animate=true){const bodies=new Set(this.physics.pins.map(p=>p.body));for(const p of this.pinMeshes)if(!bodies.has(p.body)){this.scene.remove(p.mesh);this.scene.remove(p.shadow);}this.pinMeshes=this.pinMeshes.filter(p=>bodies.has(p.body));for(const p of this.physics.pins)if(!this.pinMeshes.some(m=>m.body===p.body)){this.pinMeshes.push({mesh:this.asset('pin'),body:p.body,shadow:this.contact(p.x,.012,p.z,.44,.3)});}this.resetAge=animate?0:2;}
 score(match){if(!this.scoreCanvas)return;const c=this.scoreCanvas.getContext('2d');c.fillStyle='#101e29';c.fillRect(0,0,1024,512);c.fillStyle='#7ed7c0';c.font='bold 40px sans-serif';c.fillText('FRITIDSPARKEN / SPELARE 1',48,64);c.fillStyle='#f5dab0';c.font='bold 100px sans-serif';c.fillText(String(match.total),50,190);c.fillStyle='#d6e6e6';c.font='30px sans-serif';c.fillText('POÄNG',235,173);c.fillText('RUTA '+Math.min(10,match.frame+1)+' / 10',670,173);for(let i=0;i<10;i++){c.fillStyle=i===match.frame?'#315b62':'#21343e';c.fillRect(35+i*96,260,90,175);c.fillStyle='#9ab9bb';c.font='24px sans-serif';c.fillText(String(i+1),65+i*96,295);c.fillStyle='#fff0d1';c.font='bold 30px sans-serif';c.fillText((match.frames[i]||[]).map((n,j)=>n===10?'X':j&&n+match.frames[i][0]===10?'/':String(n)).join(' '),42+i*96,370);}this.scoreTexture.needsUpdate=true;}
 burst(kind='strike'){if(this.reduced)return;const count=kind==='spare'?16:40;for(let i=0;i<count;i++){let mesh=this.mesh(this.particleGeo,this.particleMats[i%3]);mesh.castShadow=false;mesh.position.set((Math.random()-.5)*3,1.3,-27);this.particles.push({mesh,v:new T.Vector3((Math.random()-.5)*5,2+Math.random()*4,(Math.random()-.5)*3),life:1.5});}}
 update(dt,{home=false,aim=0,x=0,ready=false,shake=0,paused=false}={}){
 if(!paused){this.clock+=dt;this.resetAge+=dt;}for(const o of this.parts){o.mesh.position.copy(o.body.position);o.mesh.quaternion.copy(o.body.quaternion);}this.ball.position.copy(this.physics.ball.position);this.ball.quaternion.copy(this.physics.ball.quaternion);
 const resetting=this.resetAge<1.4&&!this.reduced,age=this.resetAge;this.sweep.position.y=resetting?2.25-Math.sin(Math.min(1,age/1.4)*Math.PI)*1.85:2.25;this.sweep.position.z=resetting?-29+Math.sin(age/1.4*Math.PI)*1.5:-29.9;
 for(const p of this.pinMeshes){p.mesh.position.copy(p.body.position);p.mesh.quaternion.copy(p.body.quaternion);p.mesh.visible=!resetting||age>.7;if(resetting&&age>.7)p.mesh.position.y+=Math.max(0,1-(age-.7)/.6)*1.4;p.shadow.position.x=p.body.position.x;p.shadow.position.z=p.body.position.z;p.shadow.visible=p.mesh.visible&&p.body.position.y>0&&p.body.position.y<1.2;}
 this.ballContact.position.x=this.ball.position.x;this.ballContact.position.z=this.ball.position.z;this.ballContact.visible=this.ball.position.y>0&&this.ball.position.y<1.5;this.ballContact.material.opacity=.35*Math.max(0,1-this.ball.position.y/2);
 this.aim.visible=ready;this.aim.position.x=x;this.aim.rotation.y=-aim;
 if(!paused)for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;p.v.y-=dt*5;p.mesh.position.addScaledVector(p.v,dt);p.mesh.rotation.x+=dt*3;p.mesh.rotation.y+=dt*2;p.mesh.scale.setScalar(Math.min(1,Math.max(0,p.life)*2));if(p.life<=0){this.scene.remove(p.mesh);this.particles.splice(i,1);}}
 let pos,look;const portrait=innerWidth<600;if(home){pos=new T.Vector3(portrait?7:11,portrait?10:8,portrait?13:12);look=new T.Vector3(0,1,-13);}else{const z=ready?2:Math.max(-28,Math.min(2,this.ball.position.z)),close=z<-21;pos=new T.Vector3(close?4:0,close?5.3:portrait?7.8:6.0,z+(close?9:portrait?13:11));look=new T.Vector3(0,.3,z-(close?4:innerHeight<650?7:10));}const t=1-Math.exp(-dt*3.5);this.camera.position.lerp(pos,t);this.look.lerp(look,t);if(shake&&!this.reduced)this.camera.position.x+=Math.sin(this.clock*40)*Math.min(.025,shake*.02);this.camera.lookAt(this.look);
 if(this.post)this.post.render(this.scene,this.camera);else this.renderer.render(this.scene,this.camera);
 if(this.auto&&!paused&&!document.hidden&&this.clock>5){this.samples.push(dt);if(this.samples.length>=240){const avg=this.samples.reduce((a,b)=>a+b)/this.samples.length;if(avg>.026&&this.quality!=='low')this.setQuality(this.quality==='high'?'medium':'low');this.samples=[];}}
 }
}
