import {buildAvenue} from "./avenue.js?v=rampljus1";
import {GLTFLoader} from "../kaj/vendor/GLTFLoader.js";
import {riverside} from "./layout.js?v=amber2";
import {height, railPoint} from "../model.js?v=amber2";
const T=window.THREE;
function placard(scene,word,x,y,z,w,h,graffiti=false){
 const c=document.createElement('canvas');c.width=768;c.height=256;const g=c.getContext('2d');
 g.fillStyle=graffiti?'#9f9885':'#4a4b46';g.fillRect(0,0,768,256);
 if(graffiti){for(let i=0;i<27;i++){g.strokeStyle=['#454775','#56aaa6','#e4ad58','#ae6892'][i%4];g.lineWidth=8+i%8;g.beginPath();g.moveTo(i*33-40,230);g.bezierCurveTo(i*28+100,-90,i*29-80,200,i*30+30,40);g.stroke();}}
 g.textAlign='center';g.font='bold italic 82px sans-serif';g.strokeStyle='#242d37';g.lineWidth=12;g.strokeText(word,384,152,720);g.fillStyle=graffiti?'#ffca66':'#fff1d8';g.fillText(word,384,152,720);
 if(!graffiti){g.font='bold 24px sans-serif';g.fillText('♛    S K A T E P A R K    ♛',384,207);}
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tex,side:T.DoubleSide}));mesh.position.set(x,y,z);scene.add(mesh);return mesh;
}
export async function buildRiverside(scene,floor,low){
 const loader=new GLTFLoader(),tex=new T.TextureLoader();
 const shared=new URL('../../../assets/skatepark/shared/',import.meta.url);
 const [arch,map,grass,...trees]=await Promise.all([loader.loadAsync(new URL('pavilion.glb',import.meta.url).href),tex.loadAsync(new URL('evening-paving.webp',import.meta.url).href),tex.loadAsync(new URL('../../downhill/art/grass.webp',import.meta.url).href),...['maple','linden','elm'].map(name=>loader.loadAsync(new URL('trees/'+name+(low?'-distance':'-lod')+'.glb',shared).href))]);
 arch.scene.traverse(m=>{if(m.isMesh)m.castShadow=m.receiveShadow=true;});scene.add(arch.scene);
 map.colorSpace=T.SRGBColorSpace;map.repeat.set(5/112,-5/104);map.offset.set(.5,.5);map.anisotropy=low?2:8;floor.material.map.dispose();floor.material.map=map;floor.material.vertexColors=false;floor.material.needsUpdate=true;
 grass.wrapS=grass.wrapT=T.RepeatWrapping;grass.repeat.set(32,26);grass.colorSpace=T.SRGBColorSpace;
 const lawn=new T.Mesh(new T.PlaneGeometry(320,280),new T.MeshStandardMaterial({map:grass,color:0xabbc87}));lawn.rotation.x=-Math.PI/2;lawn.position.y=-5.2;scene.add(lawn);scene.fog.density=.005;
 const groups=new Map(),cube=new T.BoxGeometry(),pole=new T.CylinderGeometry(.5,.5,1,8),stone=new T.IcosahedronGeometry(1,1),dummy=new T.Object3D();
 let seed=884;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 function put(g,color,x,y,z,w,h,d,rx=0,ry=0,rz=0){dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(w,h,d);dummy.updateMatrix();if(!groups.has(g))groups.set(g,[]);groups.get(g).push([dummy.matrix.clone(),color]);}
 function bar(a,b,diam,c){const u=new T.Vector3(...a),v=new T.Vector3(...b),delta=v.clone().sub(u),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize()),e=new T.Euler().setFromQuaternion(q);put(pole,c,...u.lerp(v,.5).toArray(),diam,delta.length(),diam,e.x,e.y,e.z);}
 const box=(...a)=>put(cube,...a);
 // Meadow shoulders, river promenade and the marked road at the entrance.
 box(0x94a767,-75,-.37,-9.25,38,.65,121.5);box(0x9aa968,0,-.37,-72,160,.65,40);box(0x91a664,62,-.37,-.75,12,.65,105.5);
 box(0x488a9b,90,-1.28,-19,52,.5,140);box(0xbfb6a9,59,-.05,-1,3.5,.12,106);
 buildAvenue(scene,box,bar,low);
 for(let n=0;n<320;n++){const z=rand()*103-55,x=65+rand()*4+Math.sin(z*.11)*1.15,size=.35+rand()*.96;put(stone,[0xabaa95,0x8e9290,0xb8b29c][n%3],x,-.5+rand()*.16,z,size,size*.76,size*1.1,rand(),rand(),0);}
 for(let n=0;n<95;n++)box(0x86b5b5,70+rand()*31,-1.018,rand()*110-60,1+rand()*4,.014,.06);
 // Across the river: elevated bridge spans, piers, skyline and layered mountain ridges.
 for(let n=0;n<10;n++){
   const x=39+n*9,z=-65-n*.6;
   box(0x969999,x,3.35,z,9.2,.60,4.1);box(0xcac4b6,x,3.86,z+1.94,9.2,.44,.19);
   box(0x808983,x,-.88,z,1.12,8.4,2.4);
 }
 for(let n=0;n<34;n++){
   const x=-82+n*5.2,z=-105-rand()*11,h=4+rand()*11;
   box([0x9eafba,0xb1b9be,0xc8b6a1,0x819aa6][n%4],x,h*.5-1,z,3+rand()*2,h,4);
   for(let y=2;y<h-1;y+=1.25)for(let k=-1;k<=1;k++)
     box(rand()>.45?0xf0c384:0x5b7188,x+k*.92,y,z+2.02,.62,.36,.045);
 }
 for(let n=0;n<4;n++){
   const v=[],idx=[],colors=[];let peak=(t)=>12+6*Math.sin(t*.075+n)+3*Math.cos(t*.29)+1.6*Math.cos(t*1.17);
   for(let j=0;j<=110;j++)for(let row=0;row<=4;row++){
     const x=-162+j*3,r=row/4,y=-5+r*(peak(x)+n*4.2);
     v.push(x,y,-100-n*10-r*19);const c=new T.Color(row===4 && y>23?0xd9e0de:[0x789084,0x718983,0x82989d,0x93a9b2][n]);c.multiplyScalar(.85+rand()*.23);colors.push(c.r,c.g,c.b);
     if(j&&row){const k=j*5+row;idx.push(k-6,k-1,k,k-6,k,k-5);}
   }
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(idx);g.computeVertexNormals();scene.add(new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:1})));
 }
 for(let n=0;n<6;n++){const x=45+Math.sin(n*.9)*2,z=-39+n*14;
   box(0x3c594a,x,.67,z,.90,1.34,.85);box(0x294334,x,1.39,z,.94,.12,.9);
   box(0x394346,x+.05,1.15,z+.43,.56,.22,.04);
 }
 for(const r of riverside.rails){const a=railPoint(riverside,r,0),b=railPoint(riverside,r,1);bar(a,b,.13,0x4a5558);for(const t of Array.from({length:Math.max(3,Math.ceil(Math.hypot(r[2]-r[0],r[3]-r[1])/4))},(_,n)=>n/(Math.max(3,Math.ceil(Math.hypot(r[2]-r[0],r[3]-r[1])/4))-1))){const v=railPoint(riverside,r,t);bar([v[0],height(riverside,v[0],v[2])-.02,v[2]],v,.09,0x566165);}}
 for(const [x,z,w,d] of [[-28,26,11,2],[-34,6,8,2],[35,34,12,2],[42,17,2,13],[-18,-10,8,2],[12,-10,9,2],[9,46,12,3],[-43,32,5,3]]){
 box(0xafaaa0,x,.31,z,w,.62,d);box(0x6c654d,x,.64,z,w-.28,.08,d-.25);
 for(let n=0;n<Math.ceil(w*d*2);n++){const px=x+(rand()-.5)*(w-.65),pz=z+(rand()-.5)*(d-.5),h=.17+rand()*.43;put(stone,[0x688343,0x758840,0x50704a][n%3],px,.77,pz,h,h*.9,h);if(n%3===0)put(stone,[0xa779ab,0xe8c366][n%2],px,.85+h*.7,pz,.115,.13,.105);}
 }
 // Railings around the river walk and raised viewing pavilion.
 for(const [x,z,dx,dz,count,y] of [[53,-48,0,4,24,0],[-47,-38,3.7,0,6,3.3],[-47,-38,0,3.5,5,3.3],[-47,-21,3.7,0,6,3.3]]){
 for(let n=0;n<=count;n++){const a=x+dx*n,b=z+dz*n;bar([a,y,b],[a,y+1.2,b],.09,0x465354);if(n<count)for(const h of [.48,1.16])bar([a,y+h,b],[a+dx,y+h,b+dz],.068,0x465354);}
 }
 box(0xaaa395,13,.94,47,9,1.88,1.2);placard(scene,'RIVERSIDE',13,1.04,47.62,8.5,1.72);
 placard(scene,'RIVERSIDE',-36,1.76,-20.5,13,3.0);placard(scene,'RIDE',-24.8,1.5,-21,6,2.5,true);
 for(const [x,z,w,d] of [[-26,35,2,13],[-4,35,2,13]]){const m=placard(scene,'FLOW',x+w*.48,.65,z,8,1.05,true);m.rotation.y=Math.PI/2;}
 const baseMat=new T.MeshStandardMaterial({roughness:.82});for(const [g,items] of groups){const m=new T.InstancedMesh(g,baseMat,items.length);items.forEach(([mx,c],i)=>{m.setMatrixAt(i,mx);m.setColorAt(i,new T.Color(c));});m.castShadow=m.receiveShadow=true;scene.add(m);}
 trees.forEach(({scene:tree},k)=>{tree.updateMatrixWorld(true);const poses=[];
 for(let n=0;n<(low?10:18);n++){const side=n%3,t=(Math.floor(n/3)*3+k+.5)/Math.ceil((low?10:18)/3)/3;const x=side===0?-57-rand()*6:side===1?60+rand()*3:-54+109*t,z=side===2?-55-rand()*9:-48+100*t;
 dummy.position.set(x,0,z);dummy.rotation.set(0,rand()*6.28,0);dummy.scale.setScalar(.9+rand()*.54);dummy.updateMatrix();poses.push(dummy.matrix.clone());}
 tree.traverse(m=>{if(!m.isMesh)return;const inst=new T.InstancedMesh(m.geometry,m.material,poses.length);poses.forEach((p,n)=>inst.setMatrixAt(n,p.clone().multiply(m.matrixWorld)));inst.castShadow=!low;scene.add(inst);});});
}
