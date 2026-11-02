// Marching-squares contour of the union of all playable capsules.
// Shared junctions have no internal walls; rounded ends are closed.
export function boundarySegments(c,step=.22){
 const seg=c.path.slice(1).flatMap((b,i)=>c.features.some(f=>f.gap&&f.node===i)?[]:[{a:c.path[i],b}]);
 const radius=c.width/2+.165;
 const sample=(x,z)=>{let d=Infinity,y=0;for(const {a,b}of seg){const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz))),v=Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz);if(v<d){d=v;y=a[1]+t*(b[1]-a[1]);}}return {d:d-radius,y};};
 const minX=Math.min(...c.path.map(p=>p[0]))-radius-step*2,minZ=Math.min(...c.path.map(p=>p[2]))-radius-step*2;
 const nx=Math.ceil((Math.max(...c.path.map(p=>p[0]))+radius+step*2-minX)/step),nz=Math.ceil((Math.max(...c.path.map(p=>p[2]))+radius+step*2-minZ)/step);
 const grid=Array.from({length:nz+1},(_,j)=>Array.from({length:nx+1},(_,i)=>sample(minX+i*step,minZ+j*step).d)),out=[];
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
 const pts=[[minX+i*step,minZ+j*step],[minX+(i+1)*step,minZ+j*step],[minX+(i+1)*step,minZ+(j+1)*step],[minX+i*step,minZ+(j+1)*step]];
 const ds=[grid[j][i],grid[j][i+1],grid[j+1][i+1],grid[j+1][i]],hits=[];
 for(let k=0;k<4;k++){const l=(k+1)%4;if((ds[k]<0)===(ds[l]<0))continue;const t=ds[k]/(ds[k]-ds[l]),x=pts[k][0]+(pts[l][0]-pts[k][0])*t,z=pts[k][1]+(pts[l][1]-pts[k][1])*t;hits.push([x,sample(x,z).y+.16,z]);}
 if(hits.length===2)out.push(hits);else if(hits.length===4){const inside=sample(minX+(i+.5)*step,minZ+(j+.5)*step).d<0;if(inside===(ds[0]<0))out.push([hits[0],hits[1]],[hits[2],hits[3]]);else out.push([hits[0],hits[3]],[hits[1],hits[2]]);}
 }return out.filter(([a,b])=>Math.hypot(a[0]-b[0],a[2]-b[2])>1e-7);
}

// Batch the rounded rail pieces into one draw call per course.
export function boundaryGeometry(T,segments){
 const positions=[],normals=[];
 for(const [a,b] of segments){
  const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av);
  const g=new T.CylinderGeometry(.16,.16,delta.length()+.025,8,1,false);
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));
  const mid=av.add(bv).multiplyScalar(.5);g.translate(mid.x,mid.y,mid.z);
  const flat=g.toNonIndexed();positions.push(...flat.attributes.position.array);normals.push(...flat.attributes.normal.array);g.dispose();flat.dispose();
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));return geometry;
}
