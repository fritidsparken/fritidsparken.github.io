/* Reduced-detail CPU renderer for devices without WebGL; same 3D world and physics. */
(() => {
  function create(T){
    const domElement=document.createElement('canvas'),ctx=domElement.getContext('2d');if(!ctx)return null;
    let width=1000,height=600,ratio=.4,pixels,depthBuffer;
    const frustum=new T.Frustum(),vp=new T.Matrix4(),bounds=new T.Sphere();
    const matrix=new T.Matrix4(),instance=new T.Matrix4(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),normal=new T.Vector3(),edge=new T.Vector3(),light=new T.Vector3(-.4,.85,.3).normalize(),sky=new T.Color(),shadeColor=new T.Color();
    function render(scene,camera){
      scene.updateMatrixWorld();camera.updateMatrixWorld();vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(vp);sky.copy(scene.background||new T.Color('#a8dceb'));ctx.setTransform(ratio,0,0,ratio,0,0);ctx.globalAlpha=1;ctx.fillStyle='#'+sky.getHexString();ctx.fillRect(0,0,width,height);const faces=[];
      function object(mesh,world){
        const geom=mesh.geometry,pos=geom?.attributes?.position,index=geom?.index;if(!pos)return;if(!geom.boundingSphere)geom.computeBoundingSphere();bounds.copy(geom.boundingSphere).applyMatrix4(world);if(!frustum.intersectsSphere(bounds))return;const material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;if(!material||material.visible===false)return;
        const count=index?index.count:pos.count,colors=geom.attributes.color;
        for(let i=0;i<count;i+=3){
          const ia=index?index.getX(i):i,ib=index?index.getX(i+1):i+1,ic=index?index.getX(i+2):i+2;
          a.fromBufferAttribute(pos,ia).applyMatrix4(world);b.fromBufferAttribute(pos,ib).applyMatrix4(world);c.fromBufferAttribute(pos,ic).applyMatrix4(world);
          normal.subVectors(b,a);edge.subVectors(c,a);normal.cross(edge).normalize();const brightness=material.isMeshBasicMaterial?1:material.userData.cloud?.95:.64+Math.max(0,normal.dot(light))*.4;
          let poly=[a.clone().applyMatrix4(camera.matrixWorldInverse),b.clone().applyMatrix4(camera.matrixWorldInverse),c.clone().applyMatrix4(camera.matrixWorldInverse)];
          // Clip against near plane instead of dropping terrain triangles at the camera.
          const clipped=[],near=-camera.near;
          for(let j=0;j<poly.length;j++){const p=poly[j],q=poly[(j+1)%poly.length],inside=p.z<=near,next=q.z<=near;if(inside)clipped.push(p);if(inside!==next){const t=(near-p.z)/(q.z-p.z);clipped.push(p.clone().lerp(q,t));}}
          poly=clipped;if(poly.length<3)continue;const depth=-poly.reduce((sum,p)=>sum+p.z,0)/poly.length;if(depth>camera.far)continue;
          poly.forEach(p=>p.applyMatrix4(camera.projectionMatrix));if(poly.every(p=>p.x< -1)||poly.every(p=>p.x>1)||poly.every(p=>p.y< -1)||poly.every(p=>p.y>1))continue;
          const cross=(poly[1].x-poly[0].x)*(poly[2].y-poly[0].y)-(poly[1].y-poly[0].y)*(poly[2].x-poly[0].x);if(material.side!==T.DoubleSide&&cross<0)continue;
          shadeColor.copy(material.color||sky);if(colors&&material.vertexColors)shadeColor.multiply(new T.Color().setRGB(colors.getX(ia),colors.getY(ia),colors.getZ(ia)));
          shadeColor.multiplyScalar(brightness);if(scene.fog)shadeColor.lerp(scene.fog.color,Math.max(0,Math.min(.97,(depth-scene.fog.near)/(scene.fog.far-scene.fog.near))));
          faces.push({depth,p:poly.map(v=>[(v.x+1)*width/2,(1-v.y)*height/2,v.z]),color:shadeColor.getHex(),alpha:material.opacity});
        }
      }
      scene.traverse(o=>{if(!o.isMesh||o.userData.softwareSkip)return;for(let p=o;p;p=p.parent)if(!p.visible)return;if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,instance);matrix.multiplyMatrices(o.matrixWorld,instance);object(o,matrix);}}else object(o,o.matrixWorld);});
      // A depth buffer keeps runway and terrain surfaces correctly ordered.
      const W=domElement.width,H=domElement.height,n=W*H,skyHex=sky.getHex();
      if(!pixels||pixels.width!==W||pixels.height!==H){pixels=ctx.createImageData(W,H);depthBuffer=new Float32Array(n);}
      const bytes=pixels.data;depthBuffer.fill(Infinity);
      for(let i=0;i<n;i++){bytes[i*4]=skyHex>>16;bytes[i*4+1]=(skyHex>>8)&255;bytes[i*4+2]=skyHex&255;bytes[i*4+3]=255;}
      const edge2=(a,b,x,y)=>(x-a[0])*(b[1]-a[1])-(y-a[1])*(b[0]-a[0]);
      for(const f of faces)for(let j=1;j<f.p.length-1;j++){
        const tri=[f.p[0],f.p[j],f.p[j+1]].map(p=>[p[0]*ratio,p[1]*ratio,p[2]]),[a,b,c]=tri,area=edge2(a,b,c[0],c[1]);if(Math.abs(area)<.001)continue;
        const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(W-1,Math.ceil(Math.max(a[0],b[0],c[0]))),minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(H-1,Math.ceil(Math.max(a[1],b[1],c[1])));
        for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
          const wa=edge2(b,c,x+.5,y+.5)/area,wb=edge2(c,a,x+.5,y+.5)/area,wc=1-wa-wb;if(wa<0||wb<0||wc<0)continue;
          const z=wa*a[2]+wb*b[2]+wc*c[2],i=y*W+x;if(z>=depthBuffer[i])continue;depthBuffer[i]=z;const k=i*4;bytes[k]=f.color>>16;bytes[k+1]=(f.color>>8)&255;bytes[k+2]=f.color&255;
        }
      }
      ctx.putImageData(pixels,0,0);
    }
    return{domElement,shadowMap:{},isSoftware:true,setPixelRatio(v){ratio=Math.min(v,.4);},setSize(w,h){width=w;height=h;domElement.width=Math.round(w*ratio);domElement.height=Math.round(h*ratio);},render,dispose(){}};
  }
  window.FPSoftware3D={create};
})();
