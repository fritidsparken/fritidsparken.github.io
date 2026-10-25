import{mat,mesh,ellipsoid,tube,surface,mergeMeshes,seeded}from'./geometry.js';
import{PaintSurface}from'./paint.js';
const T=window.THREE,G=(x,y,cx,cy,sx,sy)=>Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));
export const clients=[{name:'Mira',skin:'#c98f70',hair:0x302019,iris:0x658d77,cloth:0x456d66,wish:'Jag ska på kalas! Jag vill prova rosa och glittriga naglar.',color:'#dc688f'}];
export const requests=['Jag ska på kalas! Jag vill prova rosa och glittriga naglar.','Jag gillar blått. Kan du göra en look med stjärnor?','Idag vill jag ha en färgglad look. Överraska mig!'];
export function createCharacter(scene,client){
 const root=new T.Group();root.position.set(0,1.15,0);scene.add(root);const head=new T.Group();head.position.y=1.65;root.add(head);const paint=new PaintSurface(client.skin,1024);const skin=mat(0xffffff,.57);skin.map=paint.texture;skin.roughness=.53;skin.clearcoat=.08;const plain=mat(client.skin,.56);const hairMat=mat(client.hair,.34);hairMat.sheen=.65;hairMat.sheenColor=new T.Color(0x7d5340);hairMat.sheenRoughness=.5;
 // Original continuous sculpted head, cylindrical UVs, with cheeks, nose bridge,
 // nostrils, brow ridge, chin and sockets in the actual mesh.
 const face=mesh(surface((u,v)=>{const lat=(v-.5)*Math.PI,theta=(u-.5)*Math.PI*2;const sy=Math.sin(lat),co=Math.cos(lat);let y=sy*1.12;let width=.74*(1-.18*Math.max(0,-sy));let x=Math.sin(theta)*co*width,z=Math.cos(theta)*co*.67;const front=Math.max(0,Math.cos(theta))**8;
 z+=front*(.24*G(x,y,0,-.06,.115,.37)+.22*G(x,y,0,-.16,.14,.13)+.055*G(x,y,.13,-.2,.065,.075)+.055*G(x,y,-.13,-.2,.065,.075)+.08*G(x,y,.39,-.15,.24,.25)+.08*G(x,y,-.39,-.15,.24,.25)-.075*G(x,y,.29,.18,.18,.14)-.075*G(x,y,-.29,.18,.18,.14)+.045*G(x,y,0,-.65,.29,.22)+.025*G(x,y,0,-.39,.28,.16));return[x,y,z];},192,144),skin,head);face.userData.paint=paint;face.userData.kind='face';
 ellipsoid(root,plain,[0,.88,-.03],[.24,.47,.25]);ellipsoid(root,mat(client.cloth,.8),[0,.12,-.1],[.94,.8,.45]);
 const gold=mat(0xd6ad76,.24,.8);for(const side of[-1,1]){ellipsoid(head,plain,[side*.68,-.05,-.02],[.12,.22,.11]);const ring=mesh(new T.TorusGeometry(.07,.014,12,32),gold,head,[side*.72,-.24,.07]);}
 const eyes=[];for(const side of[-1,1]){
 const x=side*.282,y=.18,z=.597;const eye=new T.Group();eye.position.set(x,y,z);head.add(eye);
 // An almond-shaped corneal patch preserves the eyelid silhouette.
 const white=mat(0xf1e9dc,.24);white.clearcoat=1;
 mesh(surface((u,v)=>{const a=(u-.5)*2,b=(v-.5)*2;return[a*.19,b*Math.sqrt(Math.max(0,1-a*a))*.083,.066*(1-a*a)*(1-b*b)];},48,24),white,eye);
 const irisMat=mat(client.iris,.28);irisMat.clearcoat=1;
 const iris=ellipsoid(eye,irisMat,[0,0,.066],[.068,.072,.016]);ellipsoid(eye,mat(0x11131a,.18),[0,0,.081],[.029,.033,.007]);
 const rays=[];for(let i=0;i<32;i++){const a=i*Math.PI/16;const rr=.034;const q=tube(eye,[[Math.cos(a)*rr,Math.sin(a)*rr,.082],[Math.cos(a)*.06,Math.sin(a)*.064,.075]],.0015,mat(i%2?0x927d4e:0x35443c,.5),2,3);rays.push(q);} // fine iris fibres
 for(const k of[-1,1]){const pts=[];for(let i=0;i<=28;i++){const a=-1+2*i/28;pts.push([a*.193,k*Math.sqrt(Math.max(0,1-a*a))*(k===1?.087:.074),.005+.015*(1-a*a)]);}tube(eye,pts,.017,plain,40,8);if(k===1)tube(eye,pts,.005,hairMat,40,6);}
 const lid=ellipsoid(eye,plain,[0,0,.008],[.195,.004,.043]);eyes.push(lid);
 const brow=[];for(let i=0;i<24;i++){const a=i/23;const bx=side*(.12+a*.35),by=.37+.038*Math.sin(a*Math.PI),bz=.594-.075*a;const q=tube(head,[[bx,by,bz],[bx+side*.016,by+.02,bz+.002]],.0038,hairMat,3,4);brow.push(q);}mergeMeshes(head,brow,hairMat);
 }
 // Separate convex upper and lower lip meshes carry their own paint UVs.
 const lips=[];for(const upper of[true,false]){const lp=new PaintSurface('#ae7068',512,'lip');const lm=mat(0xffffff,.36);lm.map=lp.texture;lm.clearcoat=.55;const l=mesh(surface((u,v)=>{const a=(u-.5)*2,w=Math.sqrt(Math.max(0,1-a*a));const edge=upper?(.046+.023*Math.exp(-(((Math.abs(a)-.28)/.2)**2))):-.075;return[a*.245,-.405+w*edge*v+.013*a*a,.655+.06*w*Math.sin(v*Math.PI*.8)+.008*w];},72,24),lm,head);if(!upper){l.geometry.setIndex(Array.from(l.geometry.index.array).reduce((out,x,i,a)=>{if(i%3===0)out.push(a[i],a[i+2],a[i+1]);return out;},[]));l.geometry.computeVertexNormals();}l.material.side=T.DoubleSide;l.userData.paint=lp;l.userData.kind='lip';lips.push(l);}
 tube(head,[[-.23,-.394,.671],[0,-.409,.681],[.23,-.394,.671]],.004,mat(0x794d48,.75),36,6);
 for(const s of[-1,1])ellipsoid(head,mat(0x794d41,.9),[s*.084,-.24,.799],[.03,.013,.009]);
 // Scalp and many long swept locks; merged batches keep draw calls bounded.
 mesh(surface((u,v)=>{const theta=u*Math.PI*2;const edge=.91+Math.max(0,Math.cos(theta))*.4;const a=v*edge;return[Math.sin(theta)*Math.sin(a)*.77,Math.cos(a)*1.15,Math.cos(theta)*Math.sin(a)*.7-.03];},96,40),hairMat,head).material.side=T.DoubleSide;
 const rand=seeded(213),locks=[],fine=[];for(let i=0;i<116;i++){const side=i%2?1:-1,a=(i>>1)/58;const x=side*(.04+a*.68);const y=1.1-.35*a;const z=.16+.42*Math.sin(a*Math.PI*.8);const end=-.9-rand()*.48;const pts=[[x,y,z],[side*(.36+a*.36),.8,.46-a*.3],[side*(.72+a*.08),.12,-.04-a*.2],[side*(.66+a*.18),end,-.08-a*.25]];locks.push(tube(head,pts,.015+rand()*.018,hairMat,40,6));for(let j=0;j<2;j++){fine.push(tube(head,pts.map((p,k)=>[p[0]+.008*j,p[1]+.002*j,p[2]+.025]),.002, hairMat,36,3));}}
 mergeMeshes(head,locks,hairMat);const highlight=mat(new T.Color(client.hair).multiplyScalar(1.65),.39);mergeMeshes(head,fine,highlight);
 const targets=[face,...lips];return{root,head,eyes,targets,paints:[paint,...lips.map(l=>l.userData.paint)],update(t,active){head.rotation.y=active?0:Math.sin(t*.7)*.035;head.rotation.z=active?0:Math.sin(t*.55)*.012;root.position.y=1.15+Math.sin(t*1.5)*.007;const b=t%4.8;const blink=b<.17?Math.sin(b/.17*Math.PI):0;eyes.forEach(e=>e.scale.y=1+blink*22);},dispose(){this.paints.forEach(p=>p.dispose());}};
}
export function createHand(scene,client){const group=new T.Group();group.position.set(3,1.25,1);group.rotation.z=-.1;scene.add(group);const skin=mat(client.skin,.49);skin.clearcoat=.15;ellipsoid(group,skin,[0,-.15,0],[.46,.62,.15]);ellipsoid(group,skin,[0,-.79,-.02],[.26,.4,.13]);const targets=[],paints=[];
 const fingers=[[-.32,.25,.72,.105,-.1],[-.105,.31,.86,.11,-.025],[.12,.28,.78,.105,.03],[.33,.16,.61,.087,.13],[-.43,-.27,.48,.12,-.68]];
 for(let i=0;i<5;i++){const[x,y,len,r,rot]=fingers[i];const f=new T.Group();f.position.set(x,y,0);f.rotation.z=-rot;group.add(f);mesh(surface((u,v)=>{const a=-u*Math.PI*2;const cap=Math.pow(Math.sin(Math.PI*v),.22);const rr=r*cap*(1-.16*v+.06*Math.cos(v*6*Math.PI));return[Math.cos(a)*rr,v*len-.07,Math.sin(a)*rr*.84+.015*Math.sin(v*Math.PI)];},40,64),skin,f).material.side=T.DoubleSide;
 for(const h of[.28,.57])tube(f,[[-r*.6,len*h,.078],[0,len*h-.012,.088],[r*.6,len*h,.078]],.0018,mat(new T.Color(client.skin).multiplyScalar(.85),.7),14,4);
 const p=new PaintSurface('#d7afa0',512,'nail'),m=mat(0xffffff,.24);m.map=p.texture;m.clearcoat=1;m.clearcoatRoughness=.12;m.ior=1.48;
 const nail=mesh(surface((u,v)=>{const a=(u-.5)*2;const w=.78+.22*Math.sin(v*Math.PI);return[a*r*.79*w,len-.22+v*.225,.08+.033*(1-a*a)+.008*Math.sin(v*Math.PI)];},40,48),m,f);nail.userData.paint=p;nail.userData.kind='nail';nail.userData.index=i;targets.push(nail);paints.push(p);
 }
 const bracelet=mesh(new T.TorusGeometry(.26,.018,10,48),mat(0xd6af76,.22,.85),group,[0,-.74,0]);bracelet.rotation.x=Math.PI/2;return{group,targets,paints,dispose(){paints.forEach(p=>p.dispose());}};
}
