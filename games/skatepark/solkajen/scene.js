import {GLTFLoader} from '../kaj/vendor/GLTFLoader.js';
const T=window.THREE;
function paving(low){
 const c=document.createElement('canvas');c.width=low?1024:2048;c.height=low?896:1792;
 const g=c.getContext('2d');let seed=971;
 function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
 const pixels=g.createImageData(c.width,c.height);
 for(let i=0;i<pixels.data.length;i+=4){
  const grain=rand()*16-8;pixels.data[i]=203+grain;pixels.data[i+1]=201+grain;pixels.data[i+2]=195+grain;pixels.data[i+3]=255;
 }
 g.putImageData(pixels,0,0);
 g.scale(c.width/112,c.height/104);g.translate(56,52);
 g.strokeStyle='#87878588';g.lineWidth=.045;
 for(let z=-52;z<=52;z+=6){g.beginPath();g.moveTo(-56,z);g.lineTo(56,z);g.stroke();for(let x=-56+(Math.round((z+52)/6)%2)*3;x<=56;x+=8){g.beginPath();g.moveTo(x,z);g.lineTo(x,z+6);g.stroke()}}
 for(let i=0;i<500;i++){const x=rand()*112-56,z=rand()*104-52;g.strokeStyle='rgba(80,78,75,.08)';g.lineWidth=.025+rand()*.08;g.beginPath();g.moveTo(x,z);g.bezierCurveTo(x+.6,z+.8,x+.7,z+1.2,x+2*rand(),z+2.5);g.stroke()}
 // Paint follows the lip of the kidney bowl, including its inward sweep.
 function rim(a,r){
  const u=Math.cos(a)*r;let v=Math.sin(a)*r;
  for(let i=0;i<7;i++)v=Math.sin(a)*r-.2*Math.cos(u*Math.PI*1.3)*(1-v*v);
  return [31+18*u,17+14*v];
 }
 const stripes=['#e75c96','#f2aa31','#653b9c','#29a4ad','#e85351'];
 for(let i=0;i<240;i++){
  const a=i*Math.PI/120,b=(i+1)*Math.PI/120;
  g.fillStyle=i%40<30?'#ce588d':'#eca6bf';
  g.beginPath();[rim(a,.992),rim(a,1.016),rim(b,1.016),rim(b,.992)].forEach(([x,y],k)=>k?g.lineTo(x,y):g.moveTo(x,y));g.fill();
  if(i%40<16){g.strokeStyle=stripes[Math.floor(i/4)%5];g.lineWidth=.2;g.beginPath();g.moveTo(...rim(a,.97));g.lineTo(...rim(b,.87-.045*Math.sin(i*.85)));g.stroke()}
 }
 // Original sun mural, painted onto the curved concrete at the eastern end.
 g.save();g.translate(46,16);g.scale(.73,1.2);g.rotate(Math.PI/2);
 for(let i=0;i<10;i++){g.rotate(Math.PI/5);g.fillStyle='#333451';g.fillRect(-.26,-2.75,.52,.8)}
 g.fillStyle='#ffbf39';g.strokeStyle='#37324c';g.lineWidth=.19;g.beginPath();g.arc(0,0,1.88,0,2*Math.PI);g.fill();g.stroke();
 g.fillStyle='#35384e';g.fillRect(-.85,-.5,.25,.52);g.fillRect(.58,-.5,.25,.52);g.beginPath();g.arc(0,.15,.74,.1,Math.PI-.1);g.stroke();g.restore();
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;return tex;
}
export async function buildSolkajen(scene,floor,low){
 const loader=new GLTFLoader(),asset=name=>new URL(name,import.meta.url).href;
 const [course,club,...trees]=await Promise.all([
  loader.loadAsync(asset('park.glb')),loader.loadAsync(asset('../riverside/pavilion.glb')),
  ...['maple','linden','elm'].map(n=>loader.loadAsync(asset('../../../assets/skatepark/shared/trees/'+n+(low?'-distance':'-lod')+'.glb')))
 ]);
 // The clubhouse was authored at its Riverside coordinates.
 club.scene.position.set(-16,0,7);
 for(const obj of [club.scene,course.scene]){obj.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});scene.add(obj)}
 floor.material.map.dispose();floor.material.map=paving(low);floor.material.vertexColors=false;floor.material.color.setHex(0xffffff);floor.material.needsUpdate=true;
 const pos=floor.geometry.attributes.position,uv=floor.geometry.attributes.uv;
 for(let i=0;i<pos.count;i++)uv.setXY(i,(pos.getX(i)+56)/112,1-(pos.getZ(i)+52)/104);
 uv.needsUpdate=true;
 const grass=new T.Mesh(new T.PlaneGeometry(310,290),new T.MeshStandardMaterial({color:0x91aa65,roughness:.96}));
 grass.rotation.x=-Math.PI/2;grass.position.y=-4.85;scene.add(grass);
 const lawnMaterial=new T.MeshStandardMaterial({color:0x839c59});
 for(const [x,z,w,d] of [[-71,0,30,132],[71,0,30,132],[0,66,112,28],[0,-66,112,28]]){
  const lawn=new T.Mesh(new T.BoxGeometry(w,.5,d),lawnMaterial);lawn.position.set(x,-.27,z);lawn.receiveShadow=true;scene.add(lawn);
 }
 const dummy=new T.Object3D();
 for(const [k,tree] of trees.entries()){
  tree.scene.updateMatrixWorld(true);const poses=[];
  for(let n=0;n<(low?16:27);n++){
   const side=n%4,j=Math.floor(n/4)*3+k,along=-56+j*112/(low?12:21);
   const x=side===0?-61-k:side===1?61+k:along,z=side===2?-59-k:side===3?59+k:along;
   dummy.position.set(x,0,z);dummy.rotation.y=n*2.39+k;dummy.scale.setScalar(.82+.35*(.5+.5*Math.sin(n*4+k)));dummy.updateMatrix();poses.push(dummy.matrix.clone());
  }
  tree.scene.traverse(m=>{if(!m.isMesh)return;const inst=new T.InstancedMesh(m.geometry,m.material,poses.length);poses.forEach((mx,i)=>inst.setMatrixAt(i,mx.clone().multiply(m.matrixWorld)));inst.castShadow=!low;scene.add(inst)});
 }
}
