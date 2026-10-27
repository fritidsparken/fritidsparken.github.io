/* Crisp Canvas 2D rendering of the same scene when a device cannot create WebGL. */
(function(root){'use strict';
root.WaterparkSoftware={create(T){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return null;
 let width=900,height=600,ratio=1;const vp=new T.Matrix4(),world=new T.Matrix4(),instance=new T.Matrix4(),frustum=new T.Frustum(),sphere=new T.Sphere(),light=new T.Vector3(-.3,.8,.5).normalize();
 const v=new T.Vector3(),n=new T.Vector3(),normalMatrix=new T.Matrix3(),shade=new T.Color(),base=new T.Color();
 const cache=new WeakMap();
 function render(scene,camera){
  scene.updateMatrixWorld();camera.updateMatrixWorld();vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(vp);
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.globalAlpha=1;
  const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,'#72c8e7');sky.addColorStop(1,'#d5f4ee');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
  const faces=[];
  function collect(mesh,matrix,tint){
   const g=mesh.geometry,m=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;if(!m||!g?.attributes?.position||m.visible===false)return;
   if(!g.boundingSphere)g.computeBoundingSphere();sphere.copy(g.boundingSphere).applyMatrix4(matrix);if(!frustum.intersectsSphere(sphere))return;
   const pos=g.attributes.position,idx=g.index,count=pos.count;let data=cache.get(g);if(!data){data={projected:new Float32Array(count*4),normal:new Float32Array(count)};cache.set(g,data)}
   const out=data.projected;normalMatrix.getNormalMatrix(matrix);
   for(let j=0;j<count;j++){v.fromBufferAttribute(pos,j).applyMatrix4(matrix).applyMatrix4(camera.matrixWorldInverse);const depth=-v.z;v.applyMatrix4(camera.projectionMatrix);const k=j*4;out[k]=(v.x*.5+.5)*width;out[k+1]=(-v.y*.5+.5)*height;out[k+2]=depth;out[k+3]=v.z;
    if(g.attributes.normal){n.fromBufferAttribute(g.attributes.normal,j).applyMatrix3(normalMatrix).normalize();data.normal[j]=.68+.32*Math.max(0,n.dot(light))}else data.normal[j]=.85;
   }
   base.copy(m.color||new T.Color(0xffffff));if(tint)base.multiply(tint);const total=idx?idx.count:count;
   for(let j=0;j<total;j+=3){const a=idx?idx.getX(j):j,b=idx?idx.getX(j+1):j+1,c=idx?idx.getX(j+2):j+2,ia=a*4,ib=b*4,ic=c*4;
    if(out[ia+2]<camera.near||out[ib+2]<camera.near||out[ic+2]<camera.near)continue;
    const ax=out[ia],ay=out[ia+1],bx=out[ib],by=out[ib+1],cx=out[ic],cy=out[ic+1];
    if(Math.max(ax,bx,cx)<0||Math.min(ax,bx,cx)>width||Math.max(ay,by,cy)<0||Math.min(ay,by,cy)>height)continue;
    const cross=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);if(m.side===T.FrontSide&&cross>=0||m.side===T.BackSide&&cross<0)continue;
    if(Math.abs(cross)<.4)continue;
    const depth=(out[ia+2]+out[ib+2]+out[ic+2])/3;if(depth>camera.far)continue;
    shade.copy(base).multiplyScalar(m.isMeshBasicMaterial?1:(data.normal[a]+data.normal[b]+data.normal[c])/3);
    if(m.emissive)shade.add(m.emissive.clone().multiplyScalar(Math.min(.5,m.emissiveIntensity||0)));
    const fog=scene.fog?Math.max(0,Math.min(.88,(depth-scene.fog.near)/(scene.fog.far-scene.fog.near))):0;if(fog)shade.lerp(scene.fog.color,fog);
    faces.push([depth,ax,ay,bx,by,cx,cy,'#'+shade.getHexString(),m.opacity===undefined?1:m.opacity,mesh.userData.softwareLayer||0]);
   }
  }
  scene.traverseVisible(o=>{if(!o.isMesh||o.userData.skipSoftware)return;if(o.isInstancedMesh){const tint=new T.Color();for(let i=0;i<o.count;i++){o.getMatrixAt(i,instance);world.multiplyMatrices(o.matrixWorld,instance);if(o.instanceColor)o.getColorAt(i,tint);else tint.set(0xffffff);collect(o,world,tint)}}else collect(o,o.matrixWorld)});
  faces.sort((a,b)=>a[9]-b[9]||b[0]-a[0]);for(const f of faces){ctx.globalAlpha=f[8];ctx.fillStyle=f[7];ctx.beginPath();ctx.moveTo(f[1],f[2]);ctx.lineTo(f[3],f[4]);ctx.lineTo(f[5],f[6]);ctx.closePath();ctx.fill();if(f[8]===1){ctx.strokeStyle=f[7];ctx.lineWidth=.45;ctx.stroke();}}ctx.globalAlpha=1;
 }
 return{domElement:canvas,isSoftware:true,shadowMap:{},setPixelRatio(r){ratio=Math.min(r,1)},setSize(w,h){width=w;height=h;canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)},render,dispose(){cache.clear?.()}};
}};})(window);
