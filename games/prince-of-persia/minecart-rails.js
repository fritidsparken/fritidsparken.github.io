// Geometry is sampled in metres along each route, including slope and branch orientation.
export function buildRails(THREE,scene,course){
 const group=new THREE.Group(),routes=new Map(),wood=new THREE.MeshStandardMaterial({color:0x43372a,roughness:.95}),iron=new THREE.MeshStandardMaterial({color:0x798287,metalness:.82,roughness:.31});scene.add(group);
 const gapAt=(route,s)=>route.gaps?.some(g=>s>=g.start&&s<=g.end);
 const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),forward=new THREE.Vector3(0,0,1);
 for(const route of course.routes){
  const vertices=[],indices=[],ties=[];
  const basis=s=>{const a=route.sample(s),p=new THREE.Vector3(a.position.x,a.position.y,a.position.z),t=new THREE.Vector3(a.tangent.x,a.tangent.y,a.tangent.z).normalize(),r=new THREE.Vector3().crossVectors(up,t).normalize(),n=new THREE.Vector3().crossVectors(t,r).normalize();return {p,t,r,n}};
  const stops=[0,route.length,...(route.gaps||[]).flatMap(g=>[g.start,g.end])];for(let s=.6;s<route.length;s+=.6)stops.push(s);stops.sort((a,b)=>a-b);
  for(let i=1;i<stops.length;i++){const s=stops[i-1],e=stops[i];if(gapAt(route,(s+e)/2))continue;const a=basis(s),b=basis(e);
   for(const side of [-1,1]){const start=vertices.length/3;for(const c of [a,b])for(const [dx,dy] of [[-.045,.055],[.045,.055],[.045,.16],[-.045,.16]]){const v=c.p.clone().addScaledVector(c.r,side*.78+dx).addScaledVector(c.n,dy);vertices.push(v.x,v.y,v.z)}for(let k=0;k<4;k++){const n=(k+1)%4;indices.push(start+k,start+n,start+4+n,start+k,start+4+n,start+4+k)}}
  }
  const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geom.setIndex(indices);geom.computeVertexNormals();const mat=iron.clone(),mesh=new THREE.Mesh(geom,mat);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);routes.set(route.id,mat);
  for(let s=.35;s<route.length;s+=1.25)if(!gapAt(route,s)&&!gapAt(route,s-.12)&&!gapAt(route,s+.12))ties.push(basis(s));
  const sleepers=new THREE.InstancedMesh(new THREE.BoxGeometry(2.16,.12,.23),wood,ties.length);ties.forEach((b,i)=>{dummy.position.copy(b.p).addScaledVector(b.n,.025);dummy.quaternion.setFromUnitVectors(forward,b.t);dummy.updateMatrix();sleepers.setMatrixAt(i,dummy.matrix)});sleepers.receiveShadow=true;group.add(sleepers);
 }
 return {highlight(routeId){for(const [id,mat]of routes){mat.emissive.setHex(id===routeId?0xbe8c28:0);mat.emissiveIntensity=id===routeId?.7:0}},dispose(){scene.remove(group);group.traverse(o=>{o.geometry?.dispose();if(o.material&&o.material!==wood)o.material.dispose()});wood.dispose();iron.dispose()}};
}
