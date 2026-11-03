import {createSoftwareActors} from './software-players.mjs';
import {createSoftwareStadium} from './software-stadium.mjs';

// The fallback projects the same rig, ball and goal as WebGL.
export function softwareRenderer(T){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{alpha:false});
 const stadium=createSoftwareStadium(T),actors=createSoftwareActors(T);
 const vp=new T.Matrix4(),vector=new T.Vector3();
 let width=800,height=600,ratio=1,state;
 function project(x,y,z){
   vector.set(x,y,z).applyMatrix4(vp);
   return [(vector.x+1)*width/2,(1-vector.y)*height/2,vector.z];
 }
 function line(a,b,color,thickness){
   if(a[2]<-1||a[2]>1||b[2]<-1||b[2]>1)return;
   ctx.strokeStyle=color;ctx.lineWidth=thickness;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
 }
 const pos=new T.Vector3();
 function groundShadow(x,z,scale){
   const p=project(x,.025,z),q=project(x+scale,.025,z);
   if(p[2]<-1||p[2]>1)return;
   const r=Math.max(2,Math.abs(q[0]-p[0]));
   ctx.save();ctx.translate(p[0],p[1]);ctx.scale(1,.29);
   const shade=ctx.createRadialGradient(0,0,0,0,0,r);shade.addColorStop(0,'#17240ac4');shade.addColorStop(1,'#13220f00');
   ctx.fillStyle=shade;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 function castShadows(scene){
   // Project animated joints onto the turf along the direction of the stadium light.
   const night=(scene.userData.penaltyArena||0)>1;
   const slant=night?[-.38,.25]:[-.85,.52];
   const projectShadow=(x,y,z)=>project(x+slant[0]*y,.018,z+slant[1]*y);
   ctx.save();ctx.globalAlpha=night?.14:.24;ctx.lineCap='round';ctx.lineJoin='round';
   const shadowCanvas=shadowLayer.getContext('2d');
   if(shadowLayer.width!==canvas.width||shadowLayer.height!==canvas.height){shadowLayer.width=canvas.width;shadowLayer.height=canvas.height;}
   shadowCanvas.setTransform(ratio,0,0,ratio,0,0);shadowCanvas.clearRect(0,0,width,height);
   shadowCanvas.strokeStyle='#152016';shadowCanvas.lineCap='round';
   const edge=(a,b,w)=>{shadowCanvas.lineWidth=w;shadowCanvas.beginPath();shadowCanvas.moveTo(a[0],a[1]);shadowCanvas.lineTo(b[0],b[1]);shadowCanvas.stroke();};
   for(const x of [-3.66,3.66])edge(projectShadow(x,0,0),projectShadow(x,2.44,0),2);
   edge(projectShadow(-3.66,2.44,0),projectShadow(3.66,2.44,0),2);
   scene.traverse(bone=>{
     if(!bone.isBone||!bone.parent?.isBone)return;
     const a=bone.parent.matrixWorld.elements,b=bone.matrixWorld.elements;
     const from=projectShadow(a[12],a[13],a[14]),to=projectShadow(b[12],b[13],b[14]);
     const size=/spine|neck|head/i.test(bone.name)?.28:.115;
     const radius=Math.abs(project(b[12]+size,0,b[14])[0]-project(b[12],0,b[14])[0]);
     edge(from,to,Math.max(1,radius));
   });
   ctx.drawImage(shadowLayer,0,0,width,height);ctx.restore();
 }
 const shadowLayer=document.createElement('canvas');
 let goalFrame,net;
 function drawGoal(scene){
   if(!goalFrame){goalFrame=scene.getObjectByName('Penalty goal');net=goalFrame?.children.find(o=>o.isLineSegments);}
   if(!net)return;
   const p=net.geometry.attributes.position;
   // Project the deformed lattice directly, including side and roof panels.
   ctx.strokeStyle=state.role==='save'?'rgba(243,243,225,.32)':'rgba(246,247,232,.62)';
   ctx.lineWidth=.72;ctx.beginPath();
   for(let i=0;i<p.count;i+=2){
     const a=project(p.getX(i),p.getY(i),p.getZ(i)),b=project(p.getX(i+1),p.getY(i+1),p.getZ(i+1));
     ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);
   }
   ctx.stroke();ctx.lineCap='round';
   for(const part of goalFrame.children){
     if(part.geometry?.type!=='CylinderGeometry')continue;
     const half=part.geometry.parameters.height*.5;
     pos.set(0,-half,0).applyMatrix4(part.matrixWorld);const a=project(pos.x,pos.y,pos.z);
     pos.set(0,half,0).applyMatrix4(part.matrixWorld);const b=project(pos.x,pos.y,pos.z);
     const w=Math.max(1,Math.abs(project(part.position.x+.1,part.position.y,part.position.z)[0]-project(part.position.x,part.position.y,part.position.z)[0])*(part.geometry.parameters.radiusTop/.055));
     line(a,b,'#686e6b',w);line(a,b,'#f2f2e8',w*.68);
   }
   ctx.lineCap='butt';
 }
 function render(scene,camera){
   if(!state)return;
   scene.updateMatrixWorld();camera.updateMatrixWorld();vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
   ctx.setTransform(ratio,0,0,ratio,0,0);
   stadium.draw(ctx,scene,camera,state,width,height);
   castShadows(scene);
   groundShadow(state.pose.x,.48,.54);
   const run=state.ball?1:state.phase==='run'?Math.min(1,state.clock/.65):0;
   groundShadow(-.64+.45*run,12.72-1.72*run,.37);
   const b=state.ball||{x:0,y:.11,z:11};groundShadow(b.x,b.z,.22+b.y*.05);
   if(state.role!=='save')drawGoal(scene);
   actors.draw(ctx,scene,camera,width,height);
   if(state.role==='save')drawGoal(scene);
   const target=scene.getObjectByName('Penalty aim');
   if(target?.visible){
     const a=project(target.position.x,target.position.y,.09);
     ctx.beginPath();ctx.arc(a[0],a[1],6,0,Math.PI*2);ctx.lineWidth=2;ctx.strokeStyle='#eeffb7';ctx.stroke();
   }
 }
 return {domElement:canvas,shadowMap:{},isSoftware:true,setState(s,pose){state={...s,pose};},
   setSize(w,h){width=w;height=h;canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);},
   setPixelRatio(r){ratio=Math.min(r,1.25);},render};
}
