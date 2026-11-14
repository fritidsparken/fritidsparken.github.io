// Geometry is sampled in metres along each route, including slope and branch orientation.
export function buildRails(THREE,scene,course,roofHeight=null){
 const warningSigns=[],warningTextures=[],group=new THREE.Group(),routes=new Map(),wood=new THREE.MeshStandardMaterial({color:0x43372a,roughness:.95}),iron=new THREE.MeshStandardMaterial({color:0x798287,metalness:.82,roughness:.31});scene.add(group);
 const gapAt=(route,s)=>route.gaps?.some(g=>s>=g.start&&s<=g.end);
 const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),forward=new THREE.Vector3(0,0,1);
 // Signs are fixed, physical objects in the cave, visible well before take-off.
 function jumpSignTexture(distance,side=0){
  if(typeof document==='undefined'){const t=new THREE.DataTexture(new Uint8Array([255,204,92,255]),1,1);t.needsUpdate=true;warningTextures.push(t);return t}
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#092b32';c.fillRect(0,0,1024,256);c.strokeStyle='#f5ca68';c.lineWidth=12;c.strokeRect(9,9,1006,238);c.fillStyle='#f8deb0';c.textAlign='center';c.font='bold 82px system-ui';c.fillText(side?(side<0?'← VÄNSTER':'HÖGER →'):'HOPP OM '+distance+' m',512,115);c.font='bold 48px system-ui';c.fillStyle='#a0f3ec';c.fillText(side?'KOM IHÅG VÄGEN':'VAR REDO ATT HOPPA ↑',512,192);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;warningTextures.push(t);return t;
 }
 function warning(route,gap,distance,side=0){const s=Math.max(0,gap.start-distance),actual=Math.round(gap.start-s),sample=route.sample(s),p=new THREE.Vector3(sample.position.x,sample.position.y,sample.position.z),t=new THREE.Vector3(sample.tangent.x,0,sample.tangent.z).normalize(),r=new THREE.Vector3().crossVectors(up,t).normalize();const sign=new THREE.Group();sign.name=(side?'Early track arrow ':'Jump warning ')+actual+' metres';sign.position.copy(p);sign.rotation.y=Math.atan2(t.x,t.z);group.add(sign);
  if (!side) {
   const rim=new THREE.Mesh(new THREE.BoxGeometry(5.9,1.52,.16),new THREE.MeshStandardMaterial({color:0x685431,metalness:.7,roughness:.43}));rim.position.y=4.7;sign.add(rim);
   const face=new THREE.Mesh(new THREE.PlaneGeometry(5.65,1.35),new THREE.MeshBasicMaterial({map:jumpSignTexture(actual),toneMapped:false}));face.rotation.y=Math.PI;face.position.set(0,4.7,-.09);sign.add(face);
   for(const edge of [-1,1]){const post=new THREE.Mesh(new THREE.CylinderGeometry(.085,.13,4.85,8),new THREE.MeshStandardMaterial({color:0x8d7958,metalness:.4,roughness:.75}));post.position.set(edge*3,2.4,0);sign.add(post)}
  } else {
   const ceiling=roofHeight?roofHeight(p.x,p.z)-p.y:9, width=3.6, height=.945, signY=ceiling-.85;
   const rim=new THREE.Mesh(new THREE.BoxGeometry(width,height,.10),new THREE.MeshStandardMaterial({color:0x51483a,metalness:.3,roughness:.85}));rim.position.set(0,signY,0);sign.add(rim);
   const face=new THREE.Mesh(new THREE.PlaneGeometry(width*.94,height*.85),new THREE.MeshBasicMaterial({map:jumpSignTexture(actual,side),toneMapped:false}));face.rotation.y=Math.PI;face.position.set(0,signY,-.06);sign.add(face);
   for(const offset of [-width*.36,width*.36]){const hanger=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.70,6),iron);hanger.position.set(offset,ceiling-.2,0);sign.add(hanger)}
  }
  warningSigns.push({routeId:route.id,s,gapStart:gap.start,distance:gap.start-s,object:sign});
 }
 for(const route of course.routes)if(route.fork)warning(route,{start:route.length},60,route.fork.safeSide);
 const lipMaterial=iron;
 for(const route of course.routes){
  const vertices=[],indices=[],ties=[];
  const basis=s=>{const a=route.sample(s),p=new THREE.Vector3(a.position.x,a.position.y,a.position.z),t=new THREE.Vector3(a.tangent.x,a.tangent.y,a.tangent.z).normalize(),r=new THREE.Vector3().crossVectors(up,t).normalize(),n=new THREE.Vector3().crossVectors(t,r).normalize();return {p,t,r,n}};
  const stops=[0,route.length,...(route.gaps||[]).flatMap(g=>[g.start,g.end])];for(let s=.6;s<route.length;s+=.6)stops.push(s);stops.sort((a,b)=>a-b);
  for(let i=1;i<stops.length;i++){const s=stops[i-1],e=stops[i];if(gapAt(route,(s+e)/2))continue;const a=basis(s),b=basis(e);
   for(const side of [-1,1]){const start=vertices.length/3;for(const c of [a,b])for(const [dx,dy] of [[-.045,.055],[.045,.055],[.045,.16],[-.045,.16]]){const v=c.p.clone().addScaledVector(c.r,side*.78+dx).addScaledVector(c.n,dy);vertices.push(v.x,v.y,v.z)}for(let k=0;k<4;k++){const n=(k+1)%4;indices.push(start+k,start+n,start+4+n,start+k,start+4+n,start+4+k)}}
  }
  const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geom.setIndex(indices);geom.computeVertexNormals();const mat=iron.clone(),mesh=new THREE.Mesh(geom,mat);mesh.name='Rail route '+route.id;mesh.userData.routeId=route.id;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);routes.set(route.id,mat);
  for(let s=.35;s<route.length;s+=1.25)if(!gapAt(route,s)&&!gapAt(route,s-.12)&&!gapAt(route,s+.12))ties.push(basis(s));
  const sleepers=new THREE.InstancedMesh(new THREE.BoxGeometry(2.16,.12,.23),wood,ties.length);ties.forEach((b,i)=>{dummy.position.copy(b.p).addScaledVector(b.n,.025);dummy.quaternion.setFromUnitVectors(forward,b.t);dummy.updateMatrix();sleepers.setMatrixAt(i,dummy.matrix)});sleepers.receiveShadow=true;group.add(sleepers);
  for(const gap of route.gaps||[]){warning(route,gap,32);
   // Torn rail tips protrude a little over the lip, leaving the centre of the gap open.
   for(const side of [-1,1]){const b=basis(gap.start-.35),path=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,-.4),new THREE.Vector3(0,.02,.1),new THREE.Vector3(side*.14,.08,.55),new THREE.Vector3(side*.30,-.13,1.05)]),shape=new THREE.Shape();shape.moveTo(-.045,-.055);shape.lineTo(.045,-.055);shape.lineTo(.045,.055);shape.lineTo(-.045,.055);shape.closePath();const tip=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{steps:12,bevelEnabled:false,extrudePath:path}),iron);tip.name='Bent broken rail tip';tip.position.copy(b.p).addScaledVector(b.r,side*.78).addScaledVector(b.n,.11);tip.quaternion.setFromUnitVectors(forward,b.t);group.add(tip)}

  }

 }
 return {group,warningSigns,highlight(routeId){for(const [id,mat]of routes){mat.emissive.setHex(id===routeId?0xbe8c28:0);mat.emissiveIntensity=id===routeId?.7:0}},dispose(){scene.remove(group);group.traverse(o=>{o.geometry?.dispose();if(o.material&&o.material!==wood)o.material.dispose()});wood.dispose();iron.dispose();lipMaterial.dispose();for(const t of warningTextures)t.dispose()}};
}


