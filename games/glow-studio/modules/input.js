const T=window.THREE;
export function bindInput(canvas,engine,getTargets,getSettings,history,brush,onPaint,onGesture,checkpoint=()=>()=>{}){
 const ray=new T.Raycaster(),pointer=new T.Vector2(),normal=new T.Vector3(),normalMatrix=new T.Matrix3(),brushAxis=new T.Vector3(0,0,1),local=new T.Vector3(),pointers=new Map();
 let active=false,previous=null,previousObject=null,seen=new Set(),pinch=0,pan=0,strokeUndo=null,restoreProgress=null;
 function hit(e){const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2);ray.setFromCamera(pointer,engine.camera);return ray.intersectObjects(getTargets(),false)[0];}
 function reset(){active=false;previous=null;previousObject=null;seen.clear();pointers.clear();pinch=0;brush.root.visible=false;}
 function record(restore,bytes=0){if(!strokeUndo){const progress=restoreProgress;strokeUndo={bytes:0,steps:[],restore(){for(let i=this.steps.length-1;i>=0;i--)this.steps[i]();progress?.();}};history.push(strokeUndo);}strokeUndo.bytes+=bytes;strokeUndo.steps.push(restore);}
 function move(e){
  if(pointers.has(e.pointerId))pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size>1){const[a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y),center=(a.x+b.x)/2;if(pinch)onGesture(d/pinch,(center-pan)*.004);pinch=d;pan=center;previous=null;return;}
  const h=hit(e);if(!h){previous=null;previousObject=null;brush.root.visible=false;return;}
  const s=getSettings(),obj=h.object,surface=obj.userData.paint;
  brush.root.visible=true;brush.root.position.copy(h.point);normalMatrix.getNormalMatrix(obj.matrixWorld);normal.copy(h.face.normal).applyMatrix3(normalMatrix).normalize();brush.root.quaternion.setFromUnitVectors(brushAxis,normal);brush.bristles.scale.z=active?.62:1;
  if(!active||!surface||!s.allowed.includes(obj.userData.kind))return;
  if(obj.userData.kind==='face'){
   local.copy(h.point);obj.worldToLocal(local);
   if(s.tool==='shadow'&&(local.y<.13||local.y>.42||Math.abs(local.x)<.09||Math.abs(local.x)>.51))return;
   if(s.tool==='liner'&&(local.y<.15||local.y>.29||Math.abs(local.x)<.1||Math.abs(local.x)>.5))return;
   if(s.tool==='mascara'&&(local.y<.18||local.y>.32||Math.abs(local.x)<.1||Math.abs(local.x)>.5))return;
  }
  if(s.tool==='file'){
   if(!seen.has(obj)){const original=obj.geometry.attributes.position.array.slice();record(()=>{obj.geometry.attributes.position.array.set(original);obj.geometry.attributes.position.needsUpdate=true;obj.geometry.computeVertexNormals();},original.byteLength);seen.add(obj);}
   const pos=obj.geometry.attributes.position,uv=obj.geometry.attributes.uv;for(let i=0;i<pos.count;i++){const d=Math.abs(uv.getX(i)-h.uv.x);if(d<.2&&uv.getY(i)>.35){const original=obj.userData.originalPositions[i*3];pos.setX(i,Math.sign(original)*Math.max(Math.abs(original)*.7,Math.abs(pos.getX(i))-.0007*(1-d/.2)));}}
   pos.needsUpdate=true;obj.geometry.computeVertexNormals();onPaint(obj,s);return;
  }
  if(s.tool==='gem'){
   if(previousObject===obj)return;
   const gem=new T.Mesh(new T.OctahedronGeometry(.017,0),new T.MeshPhysicalMaterial({color:s.color,roughness:.08,metalness:.35,clearcoat:1}));gem.position.copy(h.point);obj.worldToLocal(gem.position);gem.position.z+=.012;obj.add(gem);record(()=>{obj.remove(gem);gem.geometry.dispose();gem.material.dispose();});previousObject=obj;onPaint(obj,s);return;
  }
  if(!seen.has(surface)){const snap=surface.snapshot(s.tool);record(()=>surface.restore(snap),snap.data.data.byteLength+(snap.finish?.data.byteLength||0)+(snap.coat?.data.byteLength||0));seen.add(surface);}
  const prev=previousObject===obj?previous:null;
  if(s.tool==='sticker'){if(previousObject===obj)return;surface.sticker(h.uv,s.color);}else if(s.tool!=='top'){
   let pigment=s.color;
   if(s.tool==='gradient'&&s.color2){const a=new T.Color(s.color),b=new T.Color(s.color2);a.lerp(b,h.uv.y);pigment='#'+a.getHexString();}
   surface.paint(h.uv,s.tool,pigment,s.radius,s.alpha,prev);
  }
  if(obj.userData.kind==='nail')surface.paintFinish(h.uv,s.finish,s.radius,prev,s.tool==='top');
  if(s.tool==='mascara'&&obj.userData.lashes){for(const lash of obj.userData.lashes){const p=lash.getWorldPosition(new T.Vector3());if(p.distanceTo(h.point)<.13){if(!seen.has(lash)){const old=lash.scale.clone();record(()=>lash.scale.copy(old));seen.add(lash);}lash.scale.y=Math.min(1.5,lash.scale.y+.02);}}}
  previous=h.uv.clone();previousObject=obj;onPaint(obj,s);
 }
 function down(e){if(e.button>0)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){active=true;seen.clear();strokeUndo=null;restoreProgress=checkpoint();previous=null;previousObject=null;move(e);}else{active=false;previous=null;}}
 function up(e){history.trim();pointers.delete(e.pointerId);pinch=0;if(!pointers.size)reset();}
 function leave(){if(!active)brush.root.visible=false;}
 const events={pointerdown:down,pointermove:move,pointerup:up,pointercancel:up,lostpointercapture:up,pointerleave:leave};for(const[name,handler]of Object.entries(events))canvas.addEventListener(name,handler);
 return{reset,destroy(){reset();for(const[name,handler]of Object.entries(events))canvas.removeEventListener(name,handler);}};
}
