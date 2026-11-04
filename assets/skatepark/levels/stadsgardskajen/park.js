import {parkData} from './park-data.js';

// Metres, Three.js Y-up. Reusing a module only requires a placement in the layout.
export const bounds = Object.freeze({minX:-52,maxX:52,minZ:-56,maxZ:56});
export const spawn = Object.freeze([0,0,30]);
export const rails = [];
const cells = new Map();
const cellSize = 4;
const cellKey = (x,z) => x + 1000*z;

function transform([x,y,z],placement) {
  const a=placement.yaw*Math.PI/180, c=Math.cos(a), s=Math.sin(a), scale=placement.s;
  return [placement.x+scale*(c*x+s*z),placement.y+y*scale,placement.z+scale*(c*z-s*x)];
}

for (const [index,placement] of parkData.layout.entries()) {
  const model=parkData.models[placement.asset];
  const vertices=model.points.map(point=>transform(point,placement));
  for (let i=0;i<model.indices.length;i+=3) {
    const a=vertices[model.indices[i]], b=vertices[model.indices[i+1]], c=vertices[model.indices[i+2]];
    const dxB=b[0]-a[0], dzB=b[2]-a[2], dxC=c[0]-a[0], dzC=c[2]-a[2];
    const det=dxB*dzC-dzB*dxC;
    if(Math.abs(det)<1e-8) continue;
    const bx=Math.min(a[0],b[0],c[0]), bz=Math.min(a[2],b[2],c[2]);
    const ex=Math.max(a[0],b[0],c[0]), ez=Math.max(a[2],b[2],c[2]);
    const tri={a,deltaB:b[1]-a[1],deltaC:c[1]-a[1],uX:dzC/det,uZ:-dxC/det,vX:-dzB/det,vZ:dxB/det};
    for (let x=Math.floor(bx/cellSize);x<=Math.floor(ex/cellSize);x++) {
      for(let z=Math.floor(bz/cellSize);z<=Math.floor(ez/cellSize);z++) {
        const key=cellKey(x,z);
        if(!cells.has(key)) cells.set(key,[]);
        cells.get(key).push(tri);
      }
    }
  }
  model.tracks.forEach((points,i)=>rails.push({id:placement.asset+'-'+index+'-'+i,points:points.map(p=>transform(p,placement))}));
}

// The negative surfaces are evaluated in actual cutouts in the plaza, with no floor across the mouth.
export function sampleHeight(x,z) {
  const hole=parkData.holes.some(([cx,cz,w,d])=>Math.abs(x-cx)<=w+.0001 && Math.abs(z-cz)<=d+.0001);
  let h=hole?-Infinity:0;
  const features=cells.get(cellKey(Math.floor(x/cellSize),Math.floor(z/cellSize)));
  if(features) for(const tri of features) {
    const dx=x-tri.a[0], dz=z-tri.a[2], u=tri.uX*dx+tri.uZ*dz, v=tri.vX*dx+tri.vZ*dz;
    if(u>=-.00001 && v>=-.00001 && u+v<=1.00001) h=Math.max(h,tri.a[1]+tri.deltaB*u+tri.deltaC*v);
  }
  return Number.isFinite(h)?h:0;
}

export async function buildPark(THREE,loader,parent,quality='medium') {
  const group=new THREE.Group();
  group.name='Stadsgårdskajen · skateplaza';
  const items=Object.entries(parkData.models);
  const loaded=await Promise.all(items.map(([,model])=>loader.loadAsync(new URL('../../shared/'+model.file,import.meta.url).href)));
  const dummy=new THREE.Object3D(), local=new THREE.Matrix4(), result=new THREE.Matrix4();
  for (const [i,[name]] of items.entries()) {
    const scene=loaded[i].scene;
    scene.updateMatrixWorld(true);
    const places=parkData.layout.filter(p=>p.asset===name);
    scene.traverse(source=>{
      if(!source.isMesh)return;
      const mesh=places.length>1 ? new THREE.InstancedMesh(source.geometry,source.material,places.length) : new THREE.Mesh(source.geometry,source.material);
      local.copy(source.matrixWorld);
      for(const [n,p] of places.entries()){
        dummy.position.set(p.x,p.y,p.z);
        dummy.rotation.set(0,p.yaw*Math.PI/180,0);
        dummy.scale.setScalar(p.s);dummy.updateMatrix();
        result.multiplyMatrices(dummy.matrix,local);
        if(mesh.isInstancedMesh) mesh.setMatrixAt(n,result);
        else {mesh.matrix.copy(result);mesh.matrixAutoUpdate=false;}
      }
      mesh.name=name+'/'+source.name;
      mesh.castShadow=name!=='quay-plaza' && !name.includes('basin') && !name.includes('kidney');
      mesh.receiveShadow=true;
      if(mesh.isInstancedMesh) {mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere?.();}
      group.add(mesh);
    });
  }
  parent.add(group);
  return group;
}
