// Marching-squares contour of the union of all playable capsules.
// Shared junctions have no internal walls; rounded ends are closed.
export function boundarySegments(c,step=.22,bridgeOffset=0){
 const seg=c.path.slice(1).flatMap((b,i)=>c.features.some(f=>f.gap&&f.node===i)?[]:[{a:c.path[i],b,i}]);
 const radius=c.width/2+.165;
 const sample=(x,z)=>{let d=Infinity,y=0;
 for(const {a,b,i} of seg){const moving=c.features.some(f=>f.type==='movingBridge'&&f.node===i),dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),xx=x-a[0]-(moving?bridgeOffset:0),zz=z-a[2],u=(xx*dx+zz*dz)/(length*length),t=Math.max(0,Math.min(1,u));let v;
 if(moving){const across=Math.abs((xx*dz-zz*dx)/length)-1.05,along=Math.abs((u-.5)*length)-length/2;v=Math.hypot(Math.max(0,across),Math.max(0,along))+Math.min(Math.max(across,along),0)-.165;}
 else v=Math.hypot(xx-t*dx,zz-t*dz)-radius;
 if(v<d){d=v;y=a[1]+t*(b[1]-a[1]);}}
 for(const p of c.path){const v=Math.hypot(x-p[0],z-p[2])-radius;if(v<d){d=v;y=p[1];}}
 return {d,y};};
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
 const positions=[],normals=[],uvs=[];
 for(const [a,b] of segments){
  const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av);
  const g=new T.CylinderGeometry(.16,.16,delta.length()+.025,8,1,true);
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));
  const mid=av.add(bv).multiplyScalar(.5);g.translate(mid.x,mid.y,mid.z);
  const flat=g.toNonIndexed();positions.push(...flat.attributes.position.array);normals.push(...flat.attributes.normal.array);for(let i=0;i<flat.attributes.position.count;i++)uvs.push(flat.attributes.position.getX(i)*.3,flat.attributes.position.getZ(i)*.3);g.dispose();flat.dispose();
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));return geometry;
}
