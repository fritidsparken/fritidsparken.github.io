import {endRamps,endRampHeight,road,loops,jumps,loopPoint,tau,laneHalf,lamps as originalLamps,riverside} from './layout.js?v=railends1';
const T=window.THREE;
function plankTexture(){
 const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');
 let seed=9;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let j=0;j<8;j++){const n=Math.floor(12*rand());g.fillStyle='rgb('+(175+n)+','+(120+n)+','+(75+n)+')';g.fillRect(0,j*32,512,32);
 for(let k=0;k<36;k++){g.strokeStyle=k%2?'#44271720':'#f4d2942b';const y=j*32+rand()*32;g.beginPath();g.moveTo(0,y);g.bezierCurveTo(160,y+rand()*5,340,y-rand()*5,512,y);g.stroke();}
 g.fillStyle='#493b32';g.fillRect(0,j*32,512,1);for(const x of [9,502]){g.fillRect(x,j*32+8,2,2);g.fillRect(x,j*32+24,2,2);}}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;
}
export function buildAvenue(scene,box,bar,low){
 const lamps=originalLamps.slice();
 // Add lighting at open areas and along the park boundary, clear of obstacles and rails.
 for(const z of [-50,-38,-25,-12,1,14,27,40,50])for(const x of [-53,-40,-27,-14,0,14,28,41,53]){
   if(lamps.some(([lx,lz])=>Math.hypot(lx-x,lz-z)<9))continue;
   if(riverside.shapes.some(([,cx,cz,w,d])=>Math.abs(x-cx)<w/2+1.5&&Math.abs(z-cz)<d/2+1.5))continue;
   if(riverside.rails.some(r=>{const dx=r[2]-r[0],dz=r[3]-r[1],t=Math.max(0,Math.min(1,((x-r[0])*dx+(z-r[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-r[0]-t*dx,z-r[1]-t*dz)<2;}))continue;
   lamps.push([x,z,6.1]);
 }
 const wood=new T.MeshStandardMaterial({map:plankTexture(),side:T.DoubleSide,roughness:.68});
 const edge=new T.MeshStandardMaterial({color:0x597373,side:T.DoubleSide,metalness:.48,roughness:.42});
 const glow=new T.MeshBasicMaterial({color:0xffc178,side:T.DoubleSide});
 function ribbon(n,point,material,repeat=1){
   const v=[],uv=[],ix=[];for(let j=0;j<=n;j++){for(const side of [-1,1]){const p=point(j/n,side);v.push(p.x,p.y,p.z);uv.push((side+1)/2,j/n*repeat);}if(j){const b=j*2;ix.push(b-2,b-1,b,b,b-1,b+1);}}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
   const mesh=new T.Mesh(g,material);mesh.receiveShadow=true;mesh.castShadow=material===wood;scene.add(mesh);
 }
 for(const l of loops){
   ribbon(160,(u,s)=>loopPoint(l,u*tau,s*laneHalf),wood,Math.round(l.r*5));
   ribbon(160,(u,s)=>loopPoint(l,u*tau,s*laneHalf,.24),wood,Math.round(l.r*5));
   for(const side of [-1,1]){
     ribbon(160,(u,s)=>loopPoint(l,u*tau,side*laneHalf,(s+1)*.12),edge);
     ribbon(160,(u,s)=>loopPoint(l,u*tau,side*(laneHalf+.008),.105+s*.025),glow);
   }

 }
 for(const [,cx,cz,w,d,h] of endRamps){
   const side=Math.sign(cx),length=w*.41,lip=cx+side*length;
   const point=(u,s)=>({x:cx+side*length*u,y:endRampHeight(u,h)+.004,z:cz+s*d/2});
   ribbon(48,point,wood,4);
   for(const edgeSide of [-1,1])ribbon(48,(u,s)=>({...point(u,edgeSide),y:s>0?endRampHeight(u,h):0}),edge);
   bar([lip,h,cz-d/2],[lip,h,cz+d/2],.10,0x586572);
   const deck=w/2-length;
   box(0x97714b,lip+side*deck/2,h/2,cz,deck,h,d);
 }
 for(const j of jumps)for(const dir of [-1,1]){
   ribbon(1,(t,s)=>({x:j.x+dir*(j.gap/2+(1-t)*5.5),y:j.h*t+.004,z:j.z+s*2.65}),wood,4);
   for(const side of [-1,1])ribbon(1,(t,s)=>({x:j.x+dir*(j.gap/2+(1-t)*5.5),y:s===1?j.h*t:0,z:j.z+side*2.65}),edge);
   ribbon(1,(t,s)=>({x:j.x+dir*j.gap/2,y:t*j.h,z:j.z+s*2.65}),edge);
 }
 const roadMap=document.createElement('canvas');roadMap.width=1536;roadMap.height=320;
 const g=roadMap.getContext('2d'),px=x=>(x-road.xMin)*1536/164,pz=z=>(z-52)*320/30;
 g.fillStyle='#484b59';g.fillRect(0,0,1536,320);let h=17;
 for(let i=0;i<42000;i++){h=(Math.imul(h,1664525)+1013904223)>>>0;g.fillStyle=i%2?'#ced0d71c':'#090e1922';g.fillRect(h%1536,(h>>>14)%320,1.5,1);}
 for(let x=-78;x<82;x+=8){g.fillStyle='#e1c591';g.fillRect(px(x),pz(67.5),26,2);}
 for(const z of [57.8,78.5]){g.fillStyle='#c6bdad';g.fillRect(0,pz(z),1536,2);}
 for(const [x,z] of lamps.filter(l=>l[1]>52)){
   const grad=g.createRadialGradient(px(x),pz(z),0,px(x),pz(z),78);grad.addColorStop(0,'#f7b66299');grad.addColorStop(.46,'#eda75b55');grad.addColorStop(1,'#deb97400');g.fillStyle=grad;g.fillRect(px(x)-78,pz(z)-78,156,156);
 }
 const t=new T.CanvasTexture(roadMap);t.colorSpace=T.SRGBColorSpace;t.anisotropy=6;
 const asphalt=new T.Mesh(new T.PlaneGeometry(164,30),new T.MeshStandardMaterial({map:t,roughness:.73}));asphalt.rotation.x=-Math.PI/2;asphalt.position.set(0,-.008,67);asphalt.receiveShadow=true;scene.add(asphalt);
 // Warm light also spills from the lookout pavilion.
 for(const x of [-43,-36,-29]){
   box(0xc1a577,x,7.05,-30,.07,1.8,.07);
   const pendant=new T.Mesh(new T.SphereGeometry(.24,12,8),new T.MeshBasicMaterial({color:0xffdb9c}));
   pendant.position.set(x,6.16,-30);scene.add(pendant);
 }
 const bulbs=new T.InstancedMesh(new T.SphereGeometry(1,10,8),new T.MeshBasicMaterial({color:0xffdb95}),lamps.length);
 const o=new T.Object3D();lamps.forEach(([x,z,y],i)=>{
   bar([x,0,z],[x,y,z],.14,0x465055);box(0x59616a,x,.25,z,.38,.5,.38);
   box(0x3a3b40,x,y+.12,z,.85,.12,.85);o.position.set(x,y-.12,z);o.scale.set(.33,.27,.33);o.updateMatrix();bulbs.setMatrixAt(i,o.matrix);
 });scene.add(bulbs);
 const near=Array.from({length:low?4:6},()=>{const l=new T.PointLight(0xffc784,32,26,1.45);scene.add(l);return l;});
 let lastX=Infinity,lastZ=Infinity;
 scene.userData.lightAvenue=(x,z)=>{if(Math.hypot(x-lastX,z-lastZ)<1)return;lastX=x;lastZ=z;
 const closest=lamps.slice().sort((a,b)=>Math.hypot(a[0]-x,a[1]-z)-Math.hypot(b[0]-x,b[1]-z));near.forEach((l,n)=>l.position.set(closest[n][0],closest[n][2]-.35,closest[n][1]));};
}
